<script setup>
import { computed, onMounted, ref } from "vue";
import SearchGroupBar from "@/components/common/SearchGroupBar.vue";
import ButtonBasic from "@/components/common/ButtonBasic.vue";
import ButtonDropDown from "@/components/common/ButtonDropDown.vue";
import TableCheck from "@/components/common/TableCheck.vue";
import PagingBar from "@/components/common/PagingBar.vue";
import ModalBasic from "@/components/common/ModalBasic.vue";
import api from "@/config/axios.js";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { useStore } from "@/store/store.js";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const store = useStore();

// 상태 변수
const showRejectModal = ref(false);
const selectedVacations = ref([]);
const rejectReason = ref("");
const errorMessage = ref("");

// 테이블 컬럼 설정
const columns = [
  { label: "휴가 종류", field: "vacationTypeLabel" }, // 한글 휴가 종류
  { label: "신청자", field: "empName" },
  { label: "신청일", field: "enrollVacation" },       // 신청일
  { label: "시작일", field: "vacationStart" },        // 시작일
  { label: "종료일", field: "vacationEnd" },          // 종료일
  { label: "상태", field: "vacationStatusLabel" },    // 상태
];

// 열 너비 설정
const columnWidths = ["150px", "120px", "120px", "120px", "100px", "100px"];

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
  fromDate: "",
  toDate: "",
});

// 상태 드롭다운 옵션 (필요 시 활성화)
const statusOptions = [
  { label: "전체", id: "" }, // 기본값: 전체 (필터 해제)
  { label: "대기", id: "PENDING" },
  { label: "승인", id: "CONFIRMED" },
  { label: "반려", id: "REJECTED" }
];

// API 데이터 호출 (전체 조회)
const fetchVacationData = async () => {
  try {
    store.showLoading();
    const response = await api.get("/leader/vacation/team"); // 백엔드 API URL에 맞게 수정
    console.log("API 응답 데이터:", response.data);
    store.hideLoading();

    // 데이터 변환 및 저장
    allDocs.value = response.data
        .filter(item => item.vacationStatus === "PENDING") // 필요 상태만 포함
        .map(item => ({
          vacationId: item.vacationId,                            // 고유 ID
          empId: item.empId,                                      // empId
          approver: item.approver,                                // approver
          enrollVacation: dayjs(item.enrollVacation).format("YYYY-MM-DD"), // 신청일
          vacationType: item.vacationType,                        // 휴가 유형
          vacationStart: dayjs(item.vacationStart).format("YYYY-MM-DD"),  // 시작일
          vacationEnd: dayjs(item.vacationEnd).format("YYYY-MM-DD"),      // 종료일
          vacationStatus: item.vacationStatus,                    // 상태
          vacationRejectReason: item.vacationRejectReason,        // 반려 사유
          status: item.status,                                    // 상태 유지
          empName: item.empName,                                  // empName 유지
          vacationTypeLabel: vacationTypeMap[item.vacationType],  // 한글 휴가 종류
          vacationStatusLabel: vacationStatusMap[item.vacationStatus] // 상태 (한글 매핑)
        }));

    // 필터 초기화 및 페이징 적용
    applyFilter(true);
  } catch (error) {
    console.error("휴가 데이터 조회 실패:", error);
    allDocs.value = [];
    store.hideLoading();
  }
};

// 필터 적용 및 데이터 갱신
const applyFilter = (resetPage = true) => {
  console.log("현재 검색 조건:", searchCriteria.value);

  let filtered = [...allDocs.value];

  // 휴가 유형 필터
  if (searchCriteria.value.vacationType) {
    filtered = filtered.filter(
        (item) => item.vacationType === searchCriteria.value.vacationType
    );
  }

  // 날짜 필터링
  if (searchCriteria.value.fromDate) {
    filtered = filtered.filter(item =>
        dayjs(item.vacationStart).isSameOrAfter(dayjs(searchCriteria.value.fromDate))
    );
  }
  if (searchCriteria.value.toDate) {
    filtered = filtered.filter(item =>
        dayjs(item.vacationEnd).isSameOrBefore(dayjs(searchCriteria.value.toDate))
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

// 행 선택 함수
const onRowSelected = (selectedRows) => {
  selectedVacations.value = selectedRows;  // 선택된 모든 항목을 배열로 저장
  console.log("선택된 휴가 데이터:", selectedVacations.value);
};

// 승인 함수
const approveSelectedVacations = async () => {
  if (selectedVacations.value.length === 0) {
    alert("승인할 휴가를 선택해주세요.");
    return;
  }

  try {
    const vacationIds = selectedVacations.value.map(item => item.vacationId);  // 선택된 휴가들의 ID 가져오기

    // 전체 승인 처리
    await Promise.all(vacationIds.map(vacationId => {
      const vacation = selectedVacations.value.find(item => item.vacationId === vacationId);
      const requestData = {
        empId: vacation.empId,
        approver: vacation.approver,
        enrollVacation: vacation.enrollVacation,
        vacationType: vacation.vacationType,
        vacationStart: dayjs(vacation.vacationStart).format("YYYY-MM-DD"),
        vacationEnd: dayjs(vacation.vacationEnd).format("YYYY-MM-DD"),
        vacationStatus: "CONFIRMED",          // 승인 상태로 설정
        vacationRejectReason: vacation.vacationRejectReason, // 기존 반려 사유 유지
        status: vacation.status
      };
      return api.put(`/leader/vacation/${vacationId}/approve`, requestData); // 백엔드 URL에 맞게 수정
    }));

    alert("선택된 휴가가 모두 승인되었습니다.");
    await fetchVacationData();  // 승인 후 휴가 데이터 새로고침
    resetSelection(); // 선택 초기화
  } catch (error) {
    console.error("휴가 승인 실패:", error);
    alert("휴가 승인에 실패했습니다.");
  }
};

// 반려 함수
const rejectSelectedVacations = async () => {
  if (selectedVacations.value.length === 0) {
    alert("반려할 휴가를 선택해주세요.");
    return;
  }

  // 반려 사유를 사용자로부터 입력받는 로직 추가 (모달 사용 추천)
  showRejectModal.value = true;
};

// 반려 사유 제출 함수
const submitReject = async () => {
  if (!rejectReason.value.trim()) {
    alert("반려 사유를 입력해주세요.");
    return;
  }

  try {
    const vacationIds = selectedVacations.value.map(item => item.vacationId);  // 선택된 휴가들의 ID 가져오기

    // 전체 반려 처리
    await Promise.all(vacationIds.map(vacationId => {
      const vacation = selectedVacations.value.find(item => item.vacationId === vacationId);
      const requestData = {
        empId: vacation.empId,
        approver: vacation.approver,
        enrollVacation: vacation.enrollVacation,
        vacationType: vacation.vacationType,
        vacationStart: dayjs(vacation.vacationStart).format("YYYY-MM-DD"),
        vacationEnd: dayjs(vacation.vacationEnd).format("YYYY-MM-DD"),
        vacationStatus: "REJECTED",             // 반려 상태로 설정
        vacationRejectReason: rejectReason.value, // 반려 사유 설정
        status: vacation.status
      };
      return api.put(`/leader/vacation/${vacationId}/reject`, requestData); // 백엔드 URL에 맞게 수정
    }));

    alert("선택된 휴가가 모두 반려되었습니다.");
    await fetchVacationData();  // 반려 후 휴가 데이터 새로고침
    resetSelection(); // 선택 초기화
    rejectReason.value = ""; // 반려 사유 초기화
    showRejectModal.value = false; // 반려 모달 닫기
  } catch (error) {
    console.error("휴가 반려 실패:", error);
    alert("휴가 반려에 실패했습니다.");
  }
};

// 반려 모달 닫기
const closeRejectModal = () => {
  showRejectModal.value = false;
  rejectReason.value = "";
};

// 선택 초기화
const resetSelection = () => {
  selectedVacations.value = [];
};

// 초기 로드
onMounted(() => {
  fetchVacationData();
});
</script>

<template>
  <div id="header-div">
    <div id="header-top" class="flex-between">
      <p id="title">휴가 승인 반려 관리</p>
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
<!--          <ButtonDropDown
              :options="[
              { label: '전체', value: '' },
              { label: '출산 휴가', value: 'MATERNITY' },
              { label: '배우자 출산 휴가', value: 'SPOUSEMATERNITY' },
              { label: '생리 휴가', value: 'MENSTRUAL' },
              { label: '가족 돌봄 휴가', value: 'FAMILYCARE' }
            ]"
              default-option="휴가 유형"
              v-model="searchCriteria.vacationType"
              width="200px"
              height="40px"
              @select="handleVacationTypeSelect"
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
          :row-key="'vacationId'"
      :rows="paginatedDocs"
      :columns="columns"
      :column-widths="columnWidths"
      :showCheckbox="true"
      :single-select="false"
      :max-selection="10"
      @row-selected="onRowSelected"
      />
    </div>

    <!-- 페이징 바 + 승인/반려 버튼을 같은 라인에 배치 -->
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
      <!-- 승인/반려 버튼 -->
      <div class="button-wrapper">
        <ButtonBasic
            color="gray"
            size="medium"
            label="휴가 반려"
            @click="rejectSelectedVacations"
        />
        <ButtonBasic
            color="orange"
            size="medium"
            label="휴가 승인"
            @click="approveSelectedVacations"
        />
      </div>
    </div>

    <!-- 반려 사유 입력 모달 -->
    <div v-if="showRejectModal" class="modal-wrapper">
      <ModalBasic
          :isOpen="showRejectModal"
          title="휴가 반려 사유 입력"
          width="500px"
          height="300px"
          @close="closeRejectModal"
      >
        <div class="modal-container">
          <p class="info-text">
            반려 사유를 입력해주세요.
          </p>
          <div class="modal-body">
            <textarea
                v-model="rejectReason"
                placeholder="반려 사유를 입력하세요."
                rows="5"
                style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 5px;"
            ></textarea>
          </div>
          <div class="modal-footer">
            <ButtonBasic
                label="취소"
                size="medium"
                color="gray"
                @click="closeRejectModal"
            />
            <ButtonBasic
                label="반려"
                size="medium"
                color="orange"
                @click="submitReject"
            />
          </div>
        </div>
      </ModalBasic>
    </div>
  </div>
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

/* 모달 관련 스타일 */
.modal-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 반려 사유 입력 모달 스타일 */
.modal-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.modal-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding: 8px 10px;
  gap: 8px;
  height: 40px;
  background: white;
  border: none;
}

.info-text {
  margin-bottom: 10px; /* 아래 여백 추가 */
  color: #555; /* 색상 지정 */
  font-size: 14px; /* 글자 크기 */
  text-align: left; /* 정렬 */
  margin-left: 40px;
}
</style>
