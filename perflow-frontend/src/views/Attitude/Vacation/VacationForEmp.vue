<script setup>
import SearchGroupBar from "@/components/common/SearchGroupBar.vue";
import ButtonBasic from "@/components/common/ButtonBasic.vue";
import { computed, onMounted, ref, watch } from "vue";
import api from "@/config/axios.js";
import PagingBar from "@/components/common/PagingBar.vue";
import ButtonDropDown from "@/components/common/ButtonDropDown.vue";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter"; // 플러그인 추가
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import VacationModal from "@/views/Attitude/Vacation/VacationModal.vue";
import VacationUpdateModal from "@/views/Attitude/Vacation/VacationUpdateModal.vue";
import TableCheck from "@/components/common/TableCheck.vue";
import { useStore } from "@/store/store.js";

const store = useStore();


dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const today = dayjs(); // 현재 날짜와 시간
console.log(today.format("YYYY-MM-DD"));

/* ----------------------------
 * 휴가 데이터 수정 모달 관련
 * ---------------------------- */
const showModal = ref(false);  // 기본 모달
const showUpdateModal = ref(false);  // 수정용 모달
const selectedVacation = ref(null);  // 선택된 휴가 데이터

const closeUpdateModal = () => {
  showUpdateModal.value = false;
};

const resetSelection = () => {
  selectedVacation.value = null;
};

showUpdateModal.value = false;
resetSelection();

const handleUpdateSuccess = () => {
  showUpdateModal.value = false; // 모달 닫기
  fetchVacationData();             // 휴가 데이터 재조회
};

/* ----------------------------
 * 테이블 컬럼 정의
 * ---------------------------- */
const columns = [
  { label: "휴가 종류", field: "vacationTypeLabel" }, // 한글 휴가 종류
  { label: "신청일", field: "enrollVacation" },       // 신청일
  { label: "시작일", field: "vacationStart" },        // 시작일
  { label: "종료일", field: "vacationEnd" },          // 종료일
  { label: "상태", field: "vacationStatusLabel" },    // 상태
];

// 열 너비 설정
const columnWidths = ["150px", "120px", "120px", "120px", "100px"];

// 매핑 테이블 (영문 -> 한글 변환)
const vacationTypeMap = {
  MATERNITY: "출산 휴가",
  SPOUSEMATERNITY: "배우자 출산 휴가",
  MENSTRUAL: "생리 휴가",
  FAMILYCARE: "가족 돌봄 휴가",
};

const vacationStatusMap = {
  CONFIRMED: "승인",
  REJECTED: "반려",
  PENDING: "대기",
};

// 상태 변수
const allDocs = ref([]);         // 전체 데이터
const filteredDocs = ref([]);    // 필터링된 데이터
const totalPages = ref(1);
const totalItems = ref(0);
const currentPage = ref(1);
const pageSize = 10;

// 검색 조건
const searchCriteria = ref({
  vacationType: "",
  fromDate: "",  // 시작일 기본값: 오늘 날짜
  toDate: "",    // 종료일 기본값: 오늘 날짜
  status: ""
});


const statusOptions = [
  { label: "전체", id: "" },         // 기본값: 전체 (필터 해제)
  { label: "대기", id: "PENDING" },  // 대기
  { label: "승인", id: "CONFIRMED" }, // 승인
  { label: "반려", id: "REJECTED" }  // 반려
];

// API 데이터 호출 (전체 조회)
const fetchVacationData = async () => {
  try {
    store.showLoading();
    const response = await api.get("emp/vacation/details");
    store.hideLoading();

    console.log("API 응답 데이터:", response.data);

    // 데이터 변환 및 저장
    allDocs.value = response.data.map((item) => ({
      vacationId: item.vacationId,
      vacationTypeLabel: vacationTypeMap[item.vacationType], // 한글 휴가 종류
      enrollVacation: item.enrollVacation.split("T")[0],     // 신청일
      vacationStart: item.vacationStart.split("T")[0],       // 시작일
      vacationEnd: item.vacationEnd.split("T")[0],           // 종료일
      vacationStatusLabel: vacationStatusMap[item.vacationStatus], // 상태
      vacationType: item.vacationType,  // 원본 값 (필터링 용도)
      vacationStatus: item.vacationStatus // 원본 상태
    }));
    console.log("변환된 데이터:", allDocs.value);
    // 필터 초기화 및 페이징 적용
    applyFilter(true);

  } catch (error) {
    console.error("휴가 데이터 조회 실패:", error);
    allDocs.value = [];
  }
};

// 필터 적용 및 데이터 갱신
const applyFilter = (resetPage = true) => {
  console.log("현재 검색 조건:", searchCriteria.value);

  let filtered = [...allDocs.value];

  // 휴가 유형 필터(예: MATERNITY, SPOUSEMATERNITY...)
  if (searchCriteria.value.vacationType) {
    filtered = filtered.filter(
        (item) => item.vacationType === searchCriteria.value.vacationType
    );
  }
  if (searchCriteria.value.fromDate && searchCriteria.value.toDate) {
    filtered = filtered.filter(
        (item) =>
            dayjs(item.vacationStart).isSameOrAfter(dayjs(searchCriteria.value.fromDate)) &&
            dayjs(item.vacationEnd).isSameOrBefore(dayjs(searchCriteria.value.toDate))
    );
  }
  else if (searchCriteria.value.fromDate) {
    filtered = filtered.filter(
        (item) => dayjs(item.vacationStart).isSameOrAfter(dayjs(searchCriteria.value.fromDate))
    );
  }
  else if (searchCriteria.value.toDate) {
    filtered = filtered.filter(
        (item) => new Date(item.vacationEnd) <= new Date(searchCriteria.value.toDate)
    );
  }
  if (searchCriteria.value.status) {
    filtered = filtered.filter(
        (item) => item.vacationStatus === searchCriteria.value.status
    );
  }
  console.log("필터 적용 후 데이터:", filtered);

  // 필터링된 결과 저장 및 페이징 적용
  filteredDocs.value = filtered;
  totalItems.value = filtered.length;
  totalPages.value = Math.ceil(totalItems.value / pageSize);
  // 필터 적용 시 첫 페이지로 초기화
  if (resetPage) {
    currentPage.value = 1;
  }
};
watch(
    () => searchCriteria.value.status,
    (newVal, oldVal) => {
      console.log("휴가 상태 변경:", oldVal, "→", newVal);
      applyFilter(true);
    }
);
// 페이징 처리
const paginatedDocs = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  const end = start + pageSize;
  return filteredDocs.value.slice(start, end);
});

// 검색 처리
const handleSearch = () => {
  applyFilter(); // 필터 적용
};

// 페이지 변경 시 호출
const handlePageChange = (page) => {
  currentPage.value = page;
  applyFilter(false);
};

const handleStatusSelect = (selectedLabel) => {
  // 선택된 상태 라벨을 영문(enum) 값으로 변환
  const selectedStatus = statusOptions.find(option => option.label === selectedLabel)?.id || "";
  searchCriteria.value.status = selectedStatus; // 영문(enum) 값 저장

  console.log("선택된 상태:", selectedStatus);

  // 상태 변경 즉시 필터 적용 (첫 페이지로 리셋)
  applyFilter(true); // 첫 페이지로 리셋

};
// 행 선택 함수
const onRowSelected = (selectedRows) => {
  if (selectedRows.length > 1) {
    alert("수정할 하나의 휴가만 골라주세요.");
    const updatedSelection = [selectedRows[0]];
    selectedVacation.value = updatedSelection[0];

    setTimeout(() => {
      selectedRows.splice(1);
    }, 0);
  } else if (selectedRows.length === 1) {
    selectedVacation.value = selectedRows[0];
  } else {
    selectedVacation.value = null;
  }
};

const openModal = () => {
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
};
const openUpdateModal = () => {
  if (!selectedVacation.value) {
    alert("수정할 휴가를 체크박스로 선택해 주세요.");
    return;
  }
  showUpdateModal.value = true;
};


// 초기 로드
onMounted(() => {
  fetchVacationData();
});
</script>

<template>
  <div id="header-div">
    <div id="header-top" class="flex-between">
      <p id="title">휴가 관리</p>
    </div>
    <div id="header-bottom" class="flex-between">
      <div id="search-container">
        <!-- 검색 필드 -->
        <div class="conditions">
          <SearchGroupBar
              v-model="searchCriteria.fromDate"
              placeholder="휴가 시작일"
              type="date"
          />
          <SearchGroupBar
              v-model="searchCriteria.toDate"
              placeholder="휴가 종료일"
              type="date"
          />
          <ButtonDropDown
              :options="statusOptions"
              v-model="searchCriteria.status"
              default-option="전체"
              width="150px"
              height="40px"
          />
        </div>
        <div class="button">
          <ButtonBasic
              color="orange"
              size="medium"
              label="검색하기"
              @click="handleSearch"
          />
        </div>
      </div>
    </div>

    <div class="table-container">
      <TableCheck
          :row-key="'vacationId'"
          :rows="paginatedDocs"
          :columns="columns"
          :column-widths="columnWidths"
          :showCheckbox="true"
          :single-select="true"
          :max-selection="1"
          @row-selected="onRowSelected"
      />
    </div>

    <div class="paging-bar-and-button flex-between"
         style="width:900px; display: flex; justify-content: center; margin-top:20px;">
      <!-- 페이징 바 -->
      <div class="paging-bar-wrapper">
        <PagingBar
            :page-size="pageSize"
            :total-items="totalItems"
            :total-pages="totalPages"
            :current-page="currentPage"
            @page-changed="handlePageChange"
        />
      </div>
      <!-- 연차 신청 버튼 -->
      <div class="button-wrapper">
        <ButtonBasic
            color="gray"
            size="medium"
            label="휴가 수정"
            @click="openUpdateModal"
        />
        <ButtonBasic
            color="orange"
            size="medium"
            label="휴가 신청"
            @click="openModal"
        />

      </div>

    </div>
  </div>

  <!-- 모달 컴포넌트 -->
  <VacationModal
      :isOpen="showModal"
      @close="closeModal"
  />
  <VacationUpdateModal
      :isOpen="showUpdateModal"
      :vacationData="selectedVacation"
      @close="closeUpdateModal"
      @update-success="handleUpdateSuccess"
  />
</template>

<style scoped>
.button-wrapper {
  display: flex;
  justify-content: flex-end;
  width: auto;
  gap:20px;
}
.paging-bar-wrapper {
  flex: 1;
  display: flex;
  justify-content: center;
}

#title {
  font-size: 35px;
  font-weight: bold;
  color: #3C4651;
}

#header-div {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin-top: 50px;
}

#header-top, #header-bottom {
  margin-bottom: 10px;
  width: 900px;
}

#processed-doc-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 900px;
  margin: 0 auto;
}

#processed-doc-list {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin: 0 auto;
}

.clickable-title {
  color: #3C4651;
  cursor: pointer;
}

.clickable-title:hover {
  color: #f37321;
  text-decoration: underline;
}

#search-container {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  border: 1px solid #AFA9A9;
  border-radius: 10px;
  gap: 0px;
}

.conditions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.button {
  display: flex;
  justify-content: flex-end;
  width: 100%;
}

.table-container {
  width: 900px;
  margin-top: 20px;
}

.paging-bar {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
}

th, td {
  padding: 10px;
  border: 1px solid #ccc;
  text-align: center;
}

th {
  background-color: #f5f5f5;
  font-weight: bold;
}

tr:nth-child(even) {
  background-color: #f9f9f9;
}

tr:hover {
  background-color: #f1f1f1;
}
</style>
