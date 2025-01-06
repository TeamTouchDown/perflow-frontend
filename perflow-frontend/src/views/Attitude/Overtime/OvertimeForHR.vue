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
import TableBasic from "@/components/common/TableBasic.vue";
import { useStore } from "@/store/store.js";

const store = useStore();
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const today = dayjs(); // 현재 날짜와 시간

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
  fromDate: "",
  toDate: "",
  status: ""
});

// 테이블 컬럼 정의
const columns = [
  { label: "사원 이름", field: "empName" },            // 사원 이름
  { label: "결재자 이름", field: "approverName" },     // 승인자 이름
  { label: "초과근무 유형", field: "overtimeType" },   // 초과근무 유형
  { label: "신청일", field: "enrollOvertime" },        // 신청일
  { label: "초과 시작시간", field: "overtimeStart" }, // 초과근무 시작일
  { label: "초과 종료시간", field: "overtimeEnd" },   // 초과근무 종료일
  { label: "초과근무 상태", field: "overtimeStatus" },  // 초과근무 상태// 상태
];

// 열 너비 설정
const columnWidths = ["150px", "120px", "120px", "120px", "100px", "120px", "150px", "150px", "150px", "150px", "150px"];

// (참고) 상태(필터) 옵션
const statusOptions = [
  { label: "전체", value: "" },
  { label: "대기", value: "PENDING" },
  { label: "승인", value: "CONFIRMED" },
  { label: "반려", value: "REJECTED" },
];
const overtimeStatusMap = {
  PENDING: "대기",
  CONFIRMED: "승인",
  REJECTED: "반려",
};
const overtimeTypeMap = {
  NIGHT: "야간 근무",
  EXTENDED: "연장 근무",
  HOLIDAY: "휴일 근무"
}

/* ----------------------------
 * API로 초과근무 데이터 가져오기
 * ---------------------------- */
const fetchOvertimeData = async () => {
  try {
    store.showLoading();
    const response = await api.get("hr/overtimes/all");  // 초과근무 데이터 API 호출
    console.log("API 응답 데이터:", response.data);
    store.hideLoading();

    // 데이터 변환 및 저장
    allDocs.value = response.data.map(item => ({
      overtimeId: item.overtimeId,                         // 고유 ID
      empId: item.empId,                                   // empId
      empName: item.empName,                               // empName
      approverId: item.approverId,                         // approverId
      approverName: item.approverName,                     // approverName
      overtimeType: overtimeTypeMap[item.overtimeType],                     // 초과근무 유형
      enrollOvertime: dayjs(item.enrollOvertime).format("YYYY-MM-DD"), // 신청일
      overtimeStart: dayjs(item.overtimeStart).format("YYYY-MM-DD"),   // 초과근무 시작일
      overtimeEnd: dayjs(item.overtimeEnd).format("YYYY-MM-DD"),       // 초과근무 종료일
      overtimeStatus: overtimeStatusMap[item.overtimeStatus],                 // 초과근무 상태
      overtimeRejectReason: item.overtimeRejectReason,     // 반려 사유
      updateDatetime: dayjs(item.updateDatetime).format("YYYY-MM-DD HH:mm:ss"), // 수정일
      status: item.status,                                 // 상태
    }));

    // 필터 초기화 및 페이징 적용
    applyFilter(true);
  } catch (error) {
    console.error("초과근무 데이터 조회 실패:", error);
    allDocs.value = [];
  }
};

/* ----------------------------
 * 필터 로직
 * ---------------------------- */
const applyFilter = (resetPage = true) => {
  let filtered = [...allDocs.value];

  // 날짜 범위 필터
  if (searchCriteria.value.fromDate && searchCriteria.value.toDate) {
    filtered = filtered.filter(
        item =>
            dayjs(item.overtimeStart).isSameOrAfter(dayjs(searchCriteria.value.fromDate)) &&
            dayjs(item.overtimeEnd).isSameOrBefore(dayjs(searchCriteria.value.toDate))
    );
  } else if (searchCriteria.value.fromDate) {
    filtered = filtered.filter(
        item => dayjs(item.overtimeStart).isSameOrAfter(dayjs(searchCriteria.value.fromDate))
    );
  } else if (searchCriteria.value.toDate) {
    filtered = filtered.filter(
        item => dayjs(item.overtimeEnd).isSameOrBefore(dayjs(searchCriteria.value.toDate))
    );
  }

  // 상태 필터
  if (searchCriteria.value.status) {
    filtered = filtered.filter(item => item.status === searchCriteria.value.status);
  }

  filteredDocs.value = filtered;
  totalItems.value = filtered.length;
  totalPages.value = Math.ceil(totalItems.value / pageSize);

  if (resetPage) {
    currentPage.value = 1;
  }
};

// 페이징 처리
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
 * 컴포넌트 마운트 시 데이터 로딩
 * ---------------------------- */
onMounted(() => {
  fetchOvertimeData();
});
</script>
<template>
  <div id="header-div">
    <div id="header-top" class="flex-between">

      <p id="title">인사팀 초과근무 내역 조회</p>
    </div>


    <div id="header-bottom" class="flex-between">
      <div id="search-container">
        <!-- 검색 필드 -->
        <div class="conditions">
          <SearchGroupBar
              v-model="searchCriteria.fromDate"
              placeholder="초과근무 시작일"
              type="date"
          />
          <SearchGroupBar
              v-model="searchCriteria.toDate"
              placeholder="초과근무 종료일"
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
          :row-key="'overtimeId'"
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
  gap:20px;
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

