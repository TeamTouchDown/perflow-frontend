<script setup>
import SearchGroupBar from "@/components/common/SearchGroupBar.vue";
import ButtonBasic from "@/components/common/ButtonBasic.vue";
import {computed, onMounted, ref} from "vue";
import api from "@/config/axios.js";
import PagingBar from "@/components/common/PagingBar.vue";
import ButtonDropDown from "@/components/common/ButtonDropDown.vue";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter"; // 플러그인 추가
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";

import TableCheck from "@/components/common/TableCheck.vue";
import {useStore} from "@/store/store.js";

const store = useStore();
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
const today = dayjs(); // 현재 날짜와 시간
console.log(today.format("YYYY-MM-DD"));


const showUpdateModal = ref(false);
const selectedAnnual = ref([]);

const approveAnnualLeave = async () => {
  if (!selectedAnnual.value) {
    alert("승인할 연차를 선택해주세요.");
    return;
  }

  try {
    const annualId = selectedAnnual.value.annualId;
    const response = await api.put(`/leader/annual/${annualId}/approve`);
    alert("연차가 승인되었습니다.");
    await fetchAnnualData();  // 승인 후 연차 데이터 새로고침
  } catch (error) {
    console.error("연차 승인 실패:", error);
    alert("연차 승인에 실패했습니다.");
  }
};
const rejectAnnualLeave = async () => {
  if (!selectedAnnual.value) {
    alert("반려할 연차를 선택해주세요.");
    return;
  }

  try {
    const annualId = selectedAnnual.value.annualId;
    const reason = "";
    const response = await api.put(`/leader/annual/${annualId}/reject`,{reason});
    alert("연차가 반려되었습니다.");
    await fetchAnnualData();  // 반려 후 연차 데이터 새로고침
  } catch (error) {
    console.error("연차 반려 실패:", error);
    alert("연차 반려에 실패했습니다.");
  }
};

const onRowSelected = (selectedRows) => {
  selectedAnnual.value = selectedRows;  // 선택된 모든 항목을 배열로 저장
};

const openUpdateModal = () => {
  // 체크된 항목이 없다면 경고 처리
  if (!selectedAnnual.value) {
    alert("수정할 연차를 체크박스로 선택해 주세요.");
    return;
  }
  showUpdateModal.value = true;
};

const closeUpdateModal = () => {
  showUpdateModal.value = false;
};

const resetSelection = () => {
  selectedAnnual.value = null;
};

showUpdateModal.value = false;
resetSelection(); // 모달 닫을 때 선택 초기화

const handleUpdateSuccess = () => {
  showUpdateModal.value = false; // 모달 닫기
  fetchAnnualData();             // 연차 데이터 재조회
};


// 테이블 컬럼 설정
const columns = [
  {label: "연차 종류", field: "annualTypeLabel"}, // 한글 연차 종류
  {label: "신청자",field:"empName"},
  {label: "신청일", field: "enrollAnnual"},       // 신청일
  {label: "시작일", field: "annualStart"},        // 시작일
  {label: "종료일", field: "annualEnd"},          // 종료일
  {label: "상태", field: "annualStatusLabel"},    // 상태
];

// 열 너비 설정
const columnWidths = ["150px", "120px", "120px", "120px", "100px"];

// 매핑 테이블 (영문 -> 한글 변환)
const annualTypeMap = {
  FULLDAY: "종일 연차",
  MORNINGHALF: "오전 반차",
  AFTERNOONHALF: "오후 반차",
};

const annualStatusMap = {
  CONFIRMED: "승인",
  REJECTED: "반려",
  PENDING: "대기",
};

// 상태 변수
const allDocs = ref([]); // 전체 데이터
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
/*  status: ""*/
});

const statusOptions = [
  {label: "전체", id: ""}, // 기본값: 전체 (필터 해제)
  {label: "대기", id: "PENDING"},
  {label: "승인", id: "CONFIRMED"},
  {label: "반려", id: "REJECTED"}
];

// API 데이터 호출 (전체 조회)
const fetchAnnualData = async () => {
  try {
    store.showLoading();
    const response = await api.get("leader/annual/team");
    console.log("API 응답 데이터:", response.data);
    store.hideLoading();

    // 데이터 변환 및 저장
    allDocs.value = response.data
        .filter(item => item.status === "PENDING") // 필요 상태만 포함
        .map(item => ({
          annualId: item.annualId,                        // 고유 ID
          annualTypeLabel: annualTypeMap[item.annualType], // 한글 연차 종류
          enrollAnnual: item.enrollAnnual.split("T")[0],   // 신청일
          annualStart: item.annualStart.split("T")[0],     // 시작일
          annualEnd: item.annualEnd.split("T")[0],         // 종료일
          annualStatusLabel: annualStatusMap[item.status], // 상태 (한글 매핑)
          annualType: item.annualType,                     // 필터링 용도
          annualStatus: item.status,                        // 필터링 용도
          empName: item.empName
        }));

    // 필터 초기화 및 페이징 적용
    applyFilter(true);
  } catch (error) {
    console.error("연차 데이터 조회 실패:", error);
    allDocs.value = [];
  }
};

// 필터 적용 및 데이터 갱신
const applyFilter = (resetPage = true) => {
  console.log("현재 검색 조건:", searchCriteria.value);

  let filtered = [...allDocs.value];

  // 날짜 필터링 추가
  if (searchCriteria.value.fromDate) {
    filtered = filtered.filter(item =>
        dayjs(item.annualStart).isSameOrAfter(dayjs(searchCriteria.value.fromDate))
    );
  }
  if (searchCriteria.value.toDate) {
    filtered = filtered.filter(item =>
        dayjs(item.annualEnd).isSameOrBefore(dayjs(searchCriteria.value.toDate))
    );
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

// 검색 처리
const handleSearch = () => {
  applyFilter();
};

// 페이지 변경 시 호출
const handlePageChange = (page) => {
  currentPage.value = page;
  applyFilter(false);
};

// 상태 드롭다운 변경 시
/*const handleStatusSelect = (selectedLabel) => {
  console.log("선택된 상태:", selectedLabel);
  const selectedStatus = statusOptions.find(
      option => option.label === selectedLabel)?.id || "";
  console.log("적용된 상태 ID:", searchCriteria.value.status);
  searchCriteria.value.status = selectedStatus;
  applyFilter(true);
};*/

// ------------------------------------
// 모달 제어용 상태 및 함수
// ------------------------------------
const showModal = ref(false); // 모달 열림 여부

const openModal = () => {
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
};

// 초기 로드
onMounted(() => {
  fetchAnnualData();
});

const approveSelectedAnnualLeaves = async () => {
  if (selectedAnnual.value.length === 0) {
    alert("승인할 연차를 선택해주세요.");
    return;
  }

  try {
    const annualIds = selectedAnnual.value.map(item => item.annualId);  // 선택된 연차들의 ID 가져오기

    // 전체 승인 처리
    await Promise.all(annualIds.map(annualId =>
        api.put(`/leader/annual/${annualId}/approve`)
    ));

    alert("선택된 연차가 모두 승인되었습니다.");
    await fetchAnnualData();  // 승인 후 연차 데이터 새로고침
  } catch (error) {
    console.error("연차 승인 실패:", error);
    alert("연차 승인에 실패했습니다.");
  }
};
const rejectSelectedAnnualLeaves = async () => {
  if (selectedAnnual.value.length === 0) {
    alert("반려할 연차를 선택해주세요.");
    return;
  }

  try {
    const annualIds = selectedAnnual.value.map(item => item.annualId);  // 선택된 연차들의 ID 가져오기
    const reason = "";  // 기본 반려 사유

    // 전체 반려 처리
    await Promise.all(annualIds.map(annualId =>
        api.put(`/leader/annual/${annualId}/reject`, { reason })
    ));

    alert("선택된 연차가 모두 반려되었습니다.");
    await fetchAnnualData();  // 반려 후 연차 데이터 새로고침
  } catch (error) {
    console.error("연차 반려 실패:", error);
    alert("연차 반려에 실패했습니다.");
  }
};



</script>

<template>
  <div id="header-div">
    <div id="header-top" class="flex-between">

      <p id="title">연차 승인 반려 관리</p>
    </div>


    <div id="header-bottom" class="flex-between">
      <div id="search-container">
        <!-- 검색 필드 -->
        <div class="conditions">
          <SearchGroupBar
              v-model="searchCriteria.fromDate"
              placeholder="연차 시작일"
              type="date"
          />
          <SearchGroupBar
              v-model="searchCriteria.toDate"
              placeholder="연차 종료일"
              type="date"
          />
<!--          <ButtonDropDown
              :options="statusOptions"
              default-option="전체"
              width="150px"
              height="40px"
              @select="handleStatusSelect"
          />-->
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
          :row-key="'annualId'"
          :rows="paginatedDocs"
          :columns="columns"
          :column-widths="columnWidths"
          :showCheckbox="true"
          :single-select="true"
          :max-selection = "0"
          @row-selected="onRowSelected"
      />


      <!-- 수정 모달 -->

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
      <!-- 연차 신청 버튼 -->
      <div class="button-wrapper">
        <ButtonBasic
            color="gray"
            size="medium"
            label="연차 반려"
            @click="rejectSelectedAnnualLeaves"
        />
        <ButtonBasic
            color="orange"
            size="medium"
            label="연차 승인"
            @click="approveSelectedAnnualLeaves"
        />

      </div>

    </div>
  </div>

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