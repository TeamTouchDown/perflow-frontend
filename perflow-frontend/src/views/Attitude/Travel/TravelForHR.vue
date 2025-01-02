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
import TravelModal from "@/views/Attitude/Travel/TravelModal.vue";
import TravelUpdateModal from "@/views/Attitude/Travel/TravelUpdateModal.vue";
import TableBasic from "@/components/common/TableBasic.vue";
import {useStore} from "@/store/store.js";

const store = useStore();
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

/* ----------------------------
 * 출장 데이터 수정 모달 관련
 * ---------------------------- */
const showModal = ref(false);           // 기본 모달
const showUpdateModal = ref(false);     // 수정용 모달
const selectedTravel = ref(null);       // 선택된 출장 데이터

const closeUpdateModal = () => {
  showUpdateModal.value = false;
};

const resetSelection = () => {
  selectedTravel.value = null;
};

showUpdateModal.value = false;
resetSelection();

const handleUpdateSuccess = () => {
  showUpdateModal.value = false; // 모달 닫기
  fetchTravelData();             // 출장 데이터 재조회
};

/* ----------------------------
 * 테이블 컬럼 정의
 * ---------------------------- */
const columns = [
  {label: "출장 지역", field: "travelDivision"},    // 출장 지역
  {label: "신청자 사번", field: "empId"},            // 신청자 ID
  {label: "결재자 이름", field: "approverName"},       // 결재자 ID
  {label: "시작일", field: "travelStart"},          // 시작일
  {label: "종료일", field: "travelEnd"},            // 종료일
  {label: "상태", field: "travelStatusLabel"},      // 상태
];

// 열 너비 설정
const columnWidths = ["150px", "100px", "100px", "120px", "120px", "100px"];

// 상태 맵핑 테이블 (영문 -> 한글 변환)
const travelStatusMap = {
  CONFIRMED: "승인",
  REJECTED: "반려",
  PENDING: "대기",
};
const travelDivisionMap ={
  DOMESTIC: "국내 출장",
  OVERSEAS: "해외 출장"
}

// 상태(필터) 옵션
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
  travelDivision: "",
  fromDate: "",
  toDate: "",
  status: ""
});

// API 데이터 호출 (전체 조회)
const fetchTravelData = async () => {
  try {
    store.showLoading();
    const response = await api.get("hr/travels");
    store.hideLoading();

    console.log("API 응답 데이터:", response.data);

    // 데이터 변환 및 저장 with defensive checks
    allDocs.value = response.data.map((item, index) => {
      // 필드 존재 여부 확인 및 기본값 할당
      const enrollTravel = item.createDatetime ? dayjs(item.createDatetime).format("YYYY-MM-DD") : '';
      const travelStart = item.travelStart ? dayjs(item.travelStart).format("YYYY-MM-DD") : '';
      const travelEnd = item.travelEnd ? dayjs(item.travelEnd).format("YYYY-MM-DD") : '';
      const travelStatusLabel = travelStatusMap[item.travelStatus] || 'Unknown';

      // 필드 누락 시 경고 로그 출력
      if (!item.createDatetime || !item.travelStart || !item.travelEnd) {
        console.warn(`Item at index ${index} is missing date fields:`, item);
      }

      return {
        travelId: item.travelId || '',
        travelDivision: travelDivisionMap[item.travelDivision] || '',
        empId: item.empId || '',
        approverName: item.approverName || '',
        travelStart: travelStart,   // 시작일
        travelEnd: travelEnd,       // 종료일
        travelStatusLabel: travelStatusLabel, // 상태
        travelStatus: item.travelStatus || 'Unknown'
      };
    });

    console.log("변환된 데이터:", allDocs.value);
    // 필터 초기화 및 페이징 적용
    applyFilter(true);

  } catch (error) {
    console.error("출장 데이터 조회 실패:", error);
    allDocs.value = [];
  }
};

// 필터 적용 및 데이터 갱신
const applyFilter = (resetPage = true) => {
  console.log("현재 검색 조건:", searchCriteria.value);

  let filtered = [...allDocs.value];

  // 출장 지역 필터
  if (searchCriteria.value.travelDivision) {
    filtered = filtered.filter(
        (item) => item.travelDivision === searchCriteria.value.travelDivision
    );
  }

  // 날짜 범위 필터
  if (searchCriteria.value.fromDate && searchCriteria.value.toDate) {
    filtered = filtered.filter(
        (item) =>
            dayjs(item.travelStart).isSameOrAfter(dayjs(searchCriteria.value.fromDate)) &&
            dayjs(item.travelEnd).isSameOrBefore(dayjs(searchCriteria.value.toDate))
    );
  } else if (searchCriteria.value.fromDate) {
    filtered = filtered.filter(
        (item) => dayjs(item.travelStart).isSameOrAfter(dayjs(searchCriteria.value.fromDate))
    );
  } else if (searchCriteria.value.toDate) {
    filtered = filtered.filter(
        (item) => dayjs(item.travelEnd).isSameOrBefore(dayjs(searchCriteria.value.toDate))
    );
  }

  // 상태 필터(빈 문자열("") 제외)
  if (searchCriteria.value.status) {
    console.log("상태 필터 조건:", searchCriteria.value.status);
    filtered = filtered.filter(item => item.travelStatus === searchCriteria.value.status);
  }

  console.log("필터 적용 후 데이터:", filtered);

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
      console.log("출장 상태 변경:", oldVal, "→", newVal);
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
 * 신규 출장 신청 모달 관련
 * ---------------------------- */
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
  fetchTravelData();
});
</script>

<template>
  <div id="header-div">
    <div id="header-top" class="flex-between">
      <p id="title">인사팀 출장 내역 조회</p>
    </div>

    <div id="header-bottom" class="flex-between">
      <div id="search-container">
        <!-- 검색 필드 -->
        <div class="conditions">
          <SearchGroupBar
              v-model="searchCriteria.fromDate"
              placeholder="출장 시작일"
              type="date"
          />
          <SearchGroupBar
              v-model="searchCriteria.toDate"
              placeholder="출장 종료일"
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
          :row-key="'travelId'"
          :rows="paginatedDocs"
          :columns="columns"
          :column-widths="columnWidths"
      />
    </div>

    <!-- 페이징 바을 중앙에 배치 -->
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

  <!-- 출장 신청 모달 컴포넌트 (추가 시 주석 해제) -->
  <TravelModal
      :isOpen="showModal"
      @close="closeModal"
      @travel-success="fetchTravelData"
  />
  <TravelUpdateModal
      :isOpen="showUpdateModal"
      :travelData="selectedTravel"
      @close="closeUpdateModal"
      @update-success="handleUpdateSuccess"
  />
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

#search-container {
  display: flex;
  flex-wrap: wrap; /* 줄바꿈 허용 */
  align-items: center;
  justify-content: space-between;
  padding: 10px; /* 내부 여백 */

  border: 1px solid #AFA9A9;
  border-radius: 10px;
  gap: 10px;
}

.conditions {
  display: flex;
  flex-wrap: wrap;

  gap: 10px; /* 필드 간 간격 */
}

.button {
  display: flex;
  justify-content: flex-end;
  width: 100%; /* 오른쪽 끝에 검색 */
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

.error-message {
  color: red;
  font-size: 14px;
  margin-top: 10px;
}
</style>
