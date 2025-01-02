<!-- src/views/OvertimeManagePage.vue -->
<template>
  <div id="header-div">
    <!-- 헤더 섹션 -->
    <div id="header-top" class="flex-between">
      <p id="title">팀장 초과근무 승인/반려 관리</p>
    </div>

    <!-- 검색 필드 섹션 -->
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
              :options="[
              { label: '전체', id: '' },
              { label: '연장 근무', id: 'EXTENDED' },
              { label: '야간 근무', id: 'NIGHT' },
              { label: '휴일 근무', id: 'HOLIDAY' }
            ]"
              v-model="searchCriteria.overtimeType"
              default-option="초과근무 유형"
              width="150px"
              height="40px"
          />
        </div>

        <!-- 검색 버튼 -->
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

    <!-- 테이블 섹션 -->
    <div class="table-container">
      <TableCheck
          :row-key="'overtimeId'"
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
    <div class="paging-bar-and-button flex-between" style="width:900px; display: flex; justify-content: center; margin-top:20px;">
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
            label="초과근무 반려"
            @click="rejectSelectedOvertimes"
        />
        <ButtonBasic
            color="orange"
            size="medium"
            label="초과근무 승인"
            @click="approveSelectedOvertimes"
        />
      </div>
    </div>

    <!-- 반려 사유 입력 모달 -->
    <div v-if="showRejectModal" class="modal-wrapper">
      <ModalBasic
          :isOpen="showRejectModal"
          title="초과근무 반려 사유 입력"
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

<script setup>
import { computed, onMounted, ref, watch } from "vue";
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
const selectedOvertimes = ref([]);
const rejectReason = ref("");
const errorMessage = ref("");

// 테이블 컬럼 설정
const columns = [
  { label: "초과근무 유형", field: "overtimeType" },      // 초과근무 유형
  { label: "신청자 이름", field: "empName" },              // 신청자 ID
  { label: "결재자 이름", field: "approverName" },              // 신청자 ID
  { label: "신청일", field: "enrollOvertime" },          // 신청일
  { label: "시작일", field: "overtimeStart" },            // 시작일
  { label: "종료일", field: "overtimeEnd" },              // 종료일
];

// 열 너비 설정
const columnWidths = ["150px", "100px", "150px", "150px", "150px", "100px"];

// 매핑 테이블 (영문 -> 한글 변환)
const overtimeStatusMap = {
  PENDING: "대기",
  CONFIRMED: "승인",
  REJECTED: "반려",
};

// 상태(필터) 옵션
const statusOptions = [
  { label: "전체", id: "" },
  { label: "대기", id: "PENDING" },
  { label: "승인", id: "CONFIRMED" },
  { label: "반려", id: "REJECTED" },
];

// 초과근무 유형 옵션
const overtimeTypeOptions = [
  { label: "연장 근무", id: "EXTENDED" },
  { label: "야간 근무", id: "NIGHT" },
  { label: "휴일 근무", id: "HOLIDAY" },
];

// 데이터 상태 및 검색/필터 로직
const allDocs = ref([]);         // 전체 데이터
const filteredDocs = ref([]);    // 필터링된 데이터
const totalPages = ref(1);
const totalItems = ref(0);
const currentPage = ref(1);
const pageSize = 10;

// 검색 조건
const searchCriteria = ref({
  fromDate: "",
  toDate: "",
  status: "",            // 전체 기본값
  overtimeType: "",     // 전체 기본값
});

// API 데이터 호출 (전체 조회)
const fetchOvertimeData = async () => {
  try {
    store.showLoading();
    const response = await api.get("leader/overtimes/team");
    store.hideLoading();

    console.log("API 응답 데이터:", response.data);

    // 데이터 변환 및 저장
    allDocs.value = response.data
        .filter(item => item.overtimeStatus === "PENDING") // 대기 상태만 필터링
        .map((item, index) => {
          // 필드 존재 여부 확인 및 기본값 할당
          const enrollOvertime = item.enrollOvertime ? dayjs(item.enrollOvertime).format("YYYY-MM-DD") : '';
          const overtimeStart = item.overtimeStart ? dayjs(item.overtimeStart).format("YYYY-MM-DD") : '';
          const overtimeEnd = item.overtimeEnd ? dayjs(item.overtimeEnd).format("YYYY-MM-DD") : '';
          const overtimeStatusLabel = overtimeStatusMap[item.overtimeStatus] || 'Unknown';

          // 필드 누락 시 경고 로그 출력
          if (!item.enrollOvertime || !item.overtimeStart || !item.overtimeEnd) {
            console.warn(`Item at index ${index} is missing date fields:`, item);
          }

          return {
            overtimeId: item.overtimeId || '',
            overtimeType: overtimeTypeOptions.find(opt => opt.id === item.overtimeType)?.label || '',
            empName: item.empName || '',
            approverName: item.approverName || '',
            enrollOvertime: enrollOvertime, // enrollOvertime 사용
            overtimeStart: overtimeStart,
            overtimeEnd: overtimeEnd,
            overtimeStatus: item.overtimeStatus || 'Unknown'
          };
        });

    console.log("변환된 데이터:", allDocs.value);
    // 필터 초기화 및 페이징 적용
    applyFilter(true);

  } catch (error) {
    console.error("초과근무 데이터 조회 실패:", error);
    allDocs.value = [];
    store.hideLoading();
  }
};

// 필터 적용 및 데이터 갱신
const applyFilter = (resetPage = true) => {
  console.log("현재 검색 조건:", searchCriteria.value);

  let filtered = [...allDocs.value];

  // 초과근무 유형 필터
  if (searchCriteria.value.overtimeType) {
    filtered = filtered.filter(
        (item) => item.overtimeType === searchCriteria.value.overtimeType
    );
  }

  // 상태 필터
  if (searchCriteria.value.status) {
    console.log("상태 필터 조건:", searchCriteria.value.status);
    filtered = filtered.filter(item => item.overtimeStatus === searchCriteria.value.status);
  }

  // 날짜 범위 필터
  if (searchCriteria.value.fromDate && searchCriteria.value.toDate) {
    filtered = filtered.filter(
        (item) =>
            dayjs(item.overtimeStart).isSameOrAfter(dayjs(searchCriteria.value.fromDate)) &&
            dayjs(item.overtimeEnd).isSameOrBefore(dayjs(searchCriteria.value.toDate))
    );
  } else if (searchCriteria.value.fromDate) {
    filtered = filtered.filter(
        (item) => dayjs(item.overtimeStart).isSameOrAfter(dayjs(searchCriteria.value.fromDate))
    );
  } else if (searchCriteria.value.toDate) {
    filtered = filtered.filter(
        (item) => dayjs(item.overtimeEnd).isSameOrBefore(dayjs(searchCriteria.value.toDate))
    );
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
  selectedOvertimes.value = selectedRows;  // 선택된 모든 항목을 배열로 저장
  console.log("선택된 초과근무 데이터:", selectedOvertimes.value);
};

// 승인 함수
const approveSelectedOvertimes = async () => {
  if (selectedOvertimes.value.length === 0) {
    alert("승인할 초과근무를 선택해주세요.");
    return;
  }

  try {
    const overtimeIds = selectedOvertimes.value.map(item => item.overtimeId);  // 선택된 초과근무들의 ID 가져오기

    // 전체 승인 처리
    await Promise.all(overtimeIds.map(overtimeId => {
      const overtime = selectedOvertimes.value.find(item => item.overtimeId === overtimeId);
      const requestData = {
        empId: overtime.empId,
        approverId: overtime.approverId,
        enrollOvertime: dayjs(overtime.enrollOvertime).toISOString(),
        overtimeType: overtime.overtimeType,
        overtimeStart: dayjs(overtime.overtimeStart).toISOString(),
        overtimeEnd: dayjs(overtime.overtimeEnd).toISOString(),
        overtimeStatus: "CONFIRMED",          // 승인 상태로 설정
      };
      return api.put(`/leader/overtimes/${overtimeId}/approve`, requestData); // 백엔드 URL에 맞게 수정
    }));

    alert("선택된 초과근무가 모두 승인되었습니다.");
    await fetchOvertimeData();  // 승인 후 데이터 새로고침
    resetSelection(); // 선택 초기화
  } catch (error) {
    console.error("초과근무 승인 실패:", error);
    alert("초과근무 승인에 실패했습니다.");
  }
};

// 반려 함수
const rejectSelectedOvertimes = async () => {
  if (selectedOvertimes.value.length === 0) {
    alert("반려할 초과근무를 선택해주세요.");
    return;
  }

  // 반려 사유를 사용자로부터 입력받는 로직 (모달 사용)
  showRejectModal.value = true;
};

// 반려 사유 제출 함수
const submitReject = async () => {
  if (!rejectReason.value.trim()) {
    alert("반려 사유를 입력해주세요.");
    return;
  }

  try {
    const overtimeIds = selectedOvertimes.value.map(item => item.overtimeId);  // 선택된 초과근무들의 ID 가져오기

    // 전체 반려 처리
    await Promise.all(overtimeIds.map(overtimeId => {
      const overtime = selectedOvertimes.value.find(item => item.overtimeId === overtimeId);
      const requestData = {
        empId: overtime.empId,
        approverId: overtime.approverId,
        enrollOvertime: dayjs(overtime.enrollOvertime).toISOString(),
        overtimeType: overtime.overtimeType,
        overtimeStart: dayjs(overtime.overtimeStart).toISOString(),
        overtimeEnd: dayjs(overtime.overtimeEnd).toISOString(),
        overtimeStatus: "REJECTED",             // 반려 상태로 설정
        overtimeRejectReason: rejectReason.value, // 반려 사유 설정
      };
      return api.put(`/leader/overtimes/${overtimeId}/reject`, requestData); // 백엔드 URL에 맞게 수정
    }));

    alert("선택된 초과근무가 모두 반려되었습니다.");
    await fetchOvertimeData();  // 반려 후 데이터 새로고침
    resetSelection(); // 선택 초기화
    rejectReason.value = ""; // 반려 사유 초기화
    showRejectModal.value = false; // 반려 모달 닫기
  } catch (error) {
    console.error("초과근무 반려 실패:", error);
    alert("초과근무 반려에 실패했습니다.");
  }
};

// 반려 모달 닫기
const closeRejectModal = () => {
  showRejectModal.value = false;
  rejectReason.value = "";
};

// 선택 초기화
const resetSelection = () => {
  selectedOvertimes.value = [];
};

// 초기 로드
onMounted(() => {
  fetchOvertimeData();
});
</script>

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

/* 모달 관련 스타일 */
.modal-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  z-index: 2000; /* 다른 요소들보다 높게 설정 */
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
