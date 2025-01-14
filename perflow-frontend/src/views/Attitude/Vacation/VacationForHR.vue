<script setup>
import SearchGroupBar from "@/components/common/SearchGroupBar.vue";
import ButtonBasic from "@/components/common/ButtonBasic.vue";
import {computed, onMounted, ref, watch} from "vue";
import api from "@/config/axios.js";
import PagingBar from "@/components/common/PagingBar.vue";
import ButtonDropDown from "@/components/common/ButtonDropDown.vue";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter"; // 플러그인 추가
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import AnnualModal from "@/views/Attitude/Annual/AnnualModal.vue";
import AnnualUpdateModal from "@/views/Attitude/Annual/AnnualUpdateModal.vue";
import TableCheck from "@/components/common/TableCheck.vue";
import {useStore} from "@/store/store.js";
import TableBasic from "@/components/common/TableBasic.vue";

const store = useStore();
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const today = dayjs(); // 현재 날짜와 시간
// console.log(today.format("YYYY-MM-DD"));

/* ----------------------------
 * 연차 데이터 수정 모달 관련
 * ---------------------------- */
const showUpdateModal = ref(false);
const selectedAnnual = ref(null);


const resetSelection = () => {
  selectedAnnual.value = null;
};

showUpdateModal.value = false;
resetSelection();

const handleUpdateSuccess = () => {
  showUpdateModal.value = false; // 모달 닫기
  fetchAnnualData();             // 연차 데이터 재조회
};

/* ----------------------------
 * 테이블 컬럼 정의
 * ---------------------------- */
const columns = [
  {label: "휴가 종류", field: "vacationType"}, // 한글 연차 종류
  {label: "신청자", field: "empName"},
  { label: "결재자 이름", field: "approverName" },
  {label: "신청일", field: "enrollVacation"},       // 신청일
  {label: "시작일", field: "vacationStart"},        // 시작일
  {label: "종료일", field: "vacationEnd"},          // 종료일
  {label: "상태", field: "vacationStatus"},    // 상태
];

// 열 너비 설정
const columnWidths = ["150px", "120px", "120px", "120px", "100px"];

// 매핑 테이블 (영문 -> 한글 변환)
const annualTypeMap = {
  MATERNITY: "출산 휴가",
  SPOUSEMATERNITY: "배우자 출산 휴가",
  FAMILYCARE: "가족 돌봄 휴가",
  MENSTRUAL: "생리 휴가",
};
const annualStatusMap = {
  CONFIRMED: "승인",
  REJECTED: "반려",
  PENDING: "대기",
};

// (참고) 상태(필터) 옵션
const statusOptions = [
  {label: "전체", value: ""},
  {label: "대기", value: "PENDING"},
  {label: "승인", value: "CONFIRMED"},
  {label: "반려", value: "REJECTED"},
];

/* ----------------------------
 * 데이터 상태 및 검색/필터 로직
 * ---------------------------- */
const allDocs = ref([]);      // 전체 데이터
const filteredDocs = ref([]); // 필터링된 데이터

const totalPages = ref(1);
const totalItems = ref(0);
const currentPage = ref(1);
const pageSize = 10;

// 검색 조건
const searchCriteria = ref({
  annualType: "",
  fromDate: "",
  toDate: "",
  status: ""
});

// API로 연차 데이터 가져오기
const fetchAnnualData = async () => {
  try {
    store.showLoading();
    const response = await api.get("hr/vacation/all");
    // console.log("API 응답 데이터:", response.data);
    store.hideLoading();

    // 데이터 변환 및 저장
    // 데이터 변환 및 저장
    allDocs.value = response.data
        .filter(item => ["CONFIRMED", "REJECTED", "PENDING"].includes(item.vacationStatus)) // 필요 상태만 포함
        .map(item => ({
          vacationId: item.vacationId,                         // 고유 ID (vacationId로 변경)
          empId: item.empId,                                   // empId 추가
          empName: item.empName,                               // empName 추가
          approveSbjId: item.approveSbjId,                     // approveSbjId 추가
          approverName: item.approverName,                     // approverName 추가
          enrollVacation: item.enrollVacation.split("T")[0],   // 신청일
          vacationStart: item.vacationStart.split("T")[0],     // 시작일
          vacationEnd: item.vacationEnd.split("T")[0],         // 종료일
          vacationType: annualTypeMap[item.vacationType],                     // 휴가 종류 (vacationType으로 변경)
          vacationStatus: annualStatusMap[item.vacationStatus],                 // 상태 (vacationStatus로 변경)
          vacationRejectReason: item.vacationRejectReason,     // 반려 사유 (vacationRejectReason으로 변경)
          status: item.status,                                 // 상태 (status로 변경)
          startDate: item.startDate.split("T")[0],             // 시작일 (startDate로 변경)
        }));


    // 필터 초기화 및 페이징 적용
    applyFilter(true);
  } catch (error) {
    // console.error("휴가 데이터 조회 실패:", error);
    allDocs.value = [];
  }
};

// 필터 로직
const applyFilter = (resetPage = true) => {
  // console.log("현재 검색 조건:", searchCriteria.value);

  let filtered = [...allDocs.value];

  // 연차 유형 필터(예: FULLDAY, MORNINGHALF...) -> 필요하다면 사용
  if (searchCriteria.value.annualType) {
    filtered = filtered.filter(
        item => item.annualType === searchCriteria.value.annualType
    );
  }

  // 날짜 범위 필터
  if (searchCriteria.value.fromDate && searchCriteria.value.toDate) {
    filtered = filtered.filter(
        item =>
            dayjs(item.annualStart).isSameOrAfter(dayjs(searchCriteria.value.fromDate)) &&
            dayjs(item.annualEnd).isSameOrBefore(dayjs(searchCriteria.value.toDate))
    );
  } else if (searchCriteria.value.fromDate) {
    filtered = filtered.filter(
        item =>
            dayjs(item.annualStart).isSameOrAfter(dayjs(searchCriteria.value.fromDate))
    );
  } else if (searchCriteria.value.toDate) {
    filtered = filtered.filter(
        item =>
            dayjs(item.annualEnd).isSameOrBefore(dayjs(searchCriteria.value.toDate))
    );
  }

  // 상태 필터(빈 문자열("") 제외)
  if (searchCriteria.value.status) {
    // console.log("상태 필터 조건:", searchCriteria.value.status);
    filtered = filtered.filter(item => {
      const actualStatus = String(item.annualStatus).toUpperCase().trim();
      const selectedStatus = String(searchCriteria.value.status).toUpperCase().trim();
      return actualStatus === selectedStatus;
    });
  }

  // console.log("상태 필터 적용 후 데이터:", filtered);

  // 필터링 결과 적용
  filteredDocs.value = filtered;
  totalItems.value = filtered.length;
  totalPages.value = Math.ceil(totalItems.value / pageSize);

  // 페이지 리셋
  if (resetPage) {
    currentPage.value = 1;
  }
};

// searchCriteria.status가 변경될 때마다 필터 재적용
watch(
    () => searchCriteria.value.status,
    (newVal, oldVal) => {
      // console.log("휴가 상태 변경:", oldVal, "→", newVal);
      applyFilter(true);
    }
);

/* ----------------------------
 * 페이징 처리
 * ---------------------------- */
const paginatedDocs = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  const end = start + pageSize;
  return filteredDocs.value.slice(start, end);
});

const handleSearch = () => {
  applyFilter();
};

const handlePageChange = (page) => {
  currentPage.value = page;
  applyFilter(false);
};

/* ----------------------------
 * 신규 연차 신청 모달 관련
 * ---------------------------- */
const showModal = ref(false);

const openModal = () => {
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
};

/* ----------------------------
 * 컴포넌트 마운트 시 데이터 로딩
 * ---------------------------- */
onMounted(() => {
  fetchAnnualData();
});
</script>
<template>
  <div id="header-div">
    <div id="header-top" class="flex-between">

      <p id="title">인사팀 휴가 내역 조회</p>
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
      <TableBasic
          :row-key="'annualId'"
          :rows="paginatedDocs"
          :columns="columns"
          :column-widths="columnWidths"
      />

    </div>

    <!-- 페이징 바 + 연차 신청 버튼을 같은 라인에 배치 -->
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


    </div>
  </div>

  <!-- 모달 컴포넌트 -->


</template>

<style scoped>

.button-wrapper {
  /* 버튼은 오른쪽에 위치 */
  display: flex;
  justify-content: flex-end;
  width: auto;
  gap: 20px;
}

.paging-bar-wrapper {
  /* 페이징 바를 감싸는 요소 안에서 가운데 정렬 */
  flex: 1; /* 버튼과 공간을 나눠 갖기 위해 */
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
  flex-direction: column; /* 세로 방향으로 정렬 */
  justify-content: center; /* 세로 중앙 정렬 */
  align-items: center; /* 가로 중앙 정렬 */
  margin-top: 50px;
}

#header-top, #header-bottom {
  margin-bottom: 10px;
  width: 900px;
}

#processed-doc-container {
  display: flex;
  flex-direction: column; /* 테이블과 버튼을 세로로 배치 */
  gap: 10px; /* 테이블과 버튼 간 간격 */
  width: 900px; /* 테이블과 버튼이 같은 폭 */
  margin: 0 auto; /* 중앙 정렬 */
}

#processed-doc-list {
  display: flex;
  flex-direction: column; /* 세로 방향으로 정렬 */
  justify-content: center; /* 세로 중앙 정렬 */
  align-items: center; /* 가로 중앙 정렬 */
  gap: 10px; /* 각 요소 간의 간격 */
  margin: 0 auto; /* 수평 중앙 정렬 */
}

/* 테이블 내 제목 컬럼 */
.clickable-title {
  color: #3C4651;
  cursor: pointer;
}

.clickable-title:hover {
  color: #f37321;
  text-decoration: underline;
}


/* 검색 컨테이너 */
#search-container {
  display: flex;
  flex-wrap: wrap; /* 줄바꿈 허용 */
  align-items: center;
  justify-content: space-between;
  padding: 10px; /* 내부 여백 */

  border: 1px solid #AFA9A9;
  border-radius: 10px;
  gap: 0px;
}

.conditions {
  display: flex;
  flex-wrap: wrap;

  gap: 10px; /* 필드 간 간격 */

}

.button {
  display: flex;
  justify-content: flex-end;
  width: 100%; /* 오른쪽 끝에 검색*/
}

.table-container {
  width: 900px;
  margin-top: 20px;
}

/* 페이징 바 + 버튼을 같은 줄에 배치하기 위해 새 클래스 추가 */
.paging-bar-and-button {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.paging-bar {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

/* 테이블 관련 스타일 */
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

