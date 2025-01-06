<!-- src/views/OvertimeManagePage.vue -->
<template>
  <div id="header-div">
    <div id="header-top" class="flex-between">
      <p id="title">초과근무 관리</p>
    </div>
    <div id="header-bottom" class="flex-between">
      <div id="search-container">
        <!-- 검색 필드 -->
        <div class="conditions">
          <SearchGroupBar
              v-model="searchCriteria.fromDate"
              placeholder="작성일(시작)"
              type="date"
          />
          <SearchGroupBar
              v-model="searchCriteria.toDate"
              placeholder="작성일(끝)"
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

    <div class="table-container">
      <TableCheck
          :row-key="'overtimeId'"
          :rows="paginatedDocs"
          :columns="columns"
          :column-widths="columnWidths"
          :showCheckbox="true"
          :single-select="true"
          :max-selection="1"
          @row-selected="onRowSelected"
      />
    </div>

    <!-- 페이징 바 + 초과근무 신청/수정 버튼을 같은 라인에 배치 -->
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
      <!-- 초과근무 신청/수정 버튼 -->
      <div class="button-wrapper">
        <ButtonBasic
            color="gray"
            size="medium"
            label="초과근무 수정"
            @click="openUpdateModal"
        />
        <ButtonBasic
            color="orange"
            size="medium"
            label="초과근무 신청"
            @click="openApplyModal"
        />
      </div>
    </div>

    <!-- 초과근무 신청 모달 -->
    <OvertimeModal
        :isOpen="showApplyModal"
        @close="closeApplyModal"
        @apply-success="handleApplySuccess"
    />

    <!-- 초과근무 수정 모달 -->
    <OvertimeUpdateModal
        :isOpen="showUpdateModal"
        :overtimeData="selectedOvertime"
        @close="closeUpdateModal"
        @update-success="handleUpdateSuccess"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import SearchGroupBar from "@/components/common/SearchGroupBar.vue";
import ButtonBasic from "@/components/common/ButtonBasic.vue";
import ButtonDropDown from "@/components/common/ButtonDropDown.vue";
import TableCheck from "@/components/common/TableCheck.vue";
import PagingBar from "@/components/common/PagingBar.vue";
import ModalBasic from "@/components/common/ModalBasic.vue";
import OvertimeModal from "@/views/Attitude/Overtime/OvertimeModal.vue";
import OvertimeUpdateModal from "@/views/Attitude/Overtime/OvertimeUpdateModal.vue"
import api from "@/config/axios.js";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { useStore } from "@/store/store.js";
import {useAuthStore} from "@/store/authStore.js";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const store = useStore();
const authStore = useAuthStore();
// ----------------------------
// [1] 테이블 컬럼 정의
// ----------------------------
const columns = [
  { label: "신청일", field: "createDatetime" },
  { label: "초과근무 종류", field: "overtimeType" },
  { label: "시작일", field: "overtimeStart" },
  { label: "종료일", field: "overtimeEnd" },
  { label: "상태", field: "overtimeStatusLabel" },
];

// 열 너비 설정
const columnWidths = ["150px", "200px", "150px", "150px", "100px"];

// 상태 맵핑 테이블 (영문 -> 한글 변환)
const overtimeStatusMap = {
  PENDING: "대기",
  CONFIRMED: "승인",
  REJECTED: "반려",
};

// 상태 옵션
const statusOptions = [
  { label: "전체", id: "" },
  { label: "대기", id: "PENDING" },
  { label: "승인", id: "CONFIRMED" },
  { label: "반려", id: "REJECTED" },
];

// ----------------------------
// [2] 상태 변수 정의
// ----------------------------
const allDocs = ref([]);         // 전체 데이터
const filteredDocs = ref([]);    // 필터링된 데이터
const totalPages = ref(1);
const totalItems = ref(0);
const currentPage = ref(1);
const pageSize = 10;

// 검색 조건
const searchCriteria = ref({
  title: "",
  createUser: "",
  fromDate: null,
  toDate: null,
});

// 선택된 초과근무 데이터
const selectedOvertime = ref(null);

// 모달 제어 변수
const showApplyModal = ref(false);
const showUpdateModal = ref(false);

// 에러 메시지 (선택)
const errorMessage = ref("");

const overtimeTypeMap = {
  NIGHT: "야간 근무",
  EXTENDED: "연장 근무",
  HOLIDAY: "휴일 근무"

}
// ----------------------------
// [3] API 데이터 호출 (전체 조회)
// ----------------------------
const fetchOvertimeData = async () => {
  try {
    store.showLoading();
    const response = await api.get("emp/overtimes", {
      params: {
        page: 0, // 클라이언트 측 페이징으로 대체
        size: 1000, // 큰 사이즈로 모든 데이터를 가져옴
      },
    });
    store.hideLoading();

    console.log("초과근무 조회 전체 응답 데이터: ", response.data); // 전체 데이터 로그

    // 데이터 변환 및 저장
    const content = response.data; // API 응답이 배열임

    if (Array.isArray(content)) {
      allDocs.value = content.map((item, index) => {
        const createDatetime = item.enrollOvertime
            ? dayjs(item.enrollOvertime).format("YYYY-MM-DD HH:mm")
            : "";
        const overtimeStart = item.overtimeStart
            ? dayjs(item.overtimeStart).format("YYYY-MM-DD HH:mm")
            : "";
        const overtimeEnd = item.overtimeEnd
            ? dayjs(item.overtimeEnd).format("YYYY-MM-DD HH:mm")
            : "";
        const overtimeStatusLabel =
            overtimeStatusMap[item.overtimeStatus] || "Unknown";

        // 필드 누락 시 경고 로그 출력
        if (!item.enrollOvertime || !item.overtimeStart || !item.overtimeEnd) {
          console.warn(`Item at index ${index} is missing date fields:`, item);
        }

        return {
          overtimeId: item.overtimeId || "",
          overtimeType: overtimeTypeMap[item.overtimeType] || "",
          createUser: item.empName || "",
          createDatetime: createDatetime,
          overtimeStart: overtimeStart,
          overtimeEnd: overtimeEnd,
          overtimeStatusLabel: overtimeStatusLabel,
          overtimeStatus: item.overtimeStatus || "Unknown",
          overtimeReason: item.overtimeReason || "",
          approverId: item.approverId || "",
        };
      });

      console.log("변환된 데이터:", allDocs.value);

      // 필터 초기화 및 페이징 적용
      applyFilter(true);
    } else {
      console.error("필터링 가능한 데이터가 아닙니다:", response.data);
      allDocs.value = [];
    }
  } catch (error) {
    console.error("초과근무 데이터 조회 실패:", error);
    allDocs.value = [];
    store.hideLoading();
  }
};

// ----------------------------
// [4] 필터 적용 및 데이터 갱신
// ----------------------------
const applyFilter = (resetPage = true) => {
  console.log("현재 검색 조건:", searchCriteria.value);

  let filtered = [...allDocs.value];

  // 제목 필터
  if (searchCriteria.value.title) {
    filtered = filtered.filter((item) =>
        item.overtimeType.toLowerCase().includes(searchCriteria.value.title.toLowerCase())
    );
  }

  // 작성자 필터
  if (searchCriteria.value.createUser) {
    filtered = filtered.filter((item) =>
        item.createUser.toLowerCase().includes(searchCriteria.value.createUser.toLowerCase())
    );
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

  // 상태 필터
  if (searchCriteria.value.status) {
    filtered = filtered.filter(
        (item) => item.overtimeStatus === searchCriteria.value.status
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

// ----------------------------
// [5] 페이징 처리
// ----------------------------
const paginatedDocs = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  const end = start + pageSize;
  return filteredDocs.value.slice(start, end);
});

// ----------------------------
// [6] 검색 처리
// ----------------------------
const handleSearch = () => {
  console.log("검색 조건: ", searchCriteria.value);
  currentPage.value = 1;  // 검색 시 페이지를 처음으로 초기화
  applyFilter(true);
};

// ----------------------------
// [7] 페이지 변경 시 호출
// ----------------------------
const handlePageChange = (page) => {
  currentPage.value = page;
};

// ----------------------------
// [8] 행 선택 함수
// ----------------------------
const onRowSelected = (selectedRows) => {
  if (selectedRows.length > 1) {
    alert("수정할 초과근무는 하나만 선택해주세요.");
    const updatedSelection = [selectedRows[0]];
    selectedOvertime.value = updatedSelection[0];

    setTimeout(() => {
      selectedRows.splice(1);
    }, 0);
  } else if (selectedRows.length === 1) {
    selectedOvertime.value = selectedRows[0];
  } else {
    selectedOvertime.value = null;
  }
};

// ----------------------------
// [9] 초과근무 신청 모달 제어
// ----------------------------
const openApplyModal = () => {
  showApplyModal.value = true;
};

const closeApplyModal = () => {
  showApplyModal.value = false;
};

const handleApplySuccess = () => {
  showApplyModal.value = false;
  fetchOvertimeData();
};

// ----------------------------
// [10] 초과근무 수정 모달 제어
// ----------------------------
const openUpdateModal = () => {
  if (!selectedOvertime.value) {
    alert("수정할 초과근무를 선택해주세요.");
    return;
  }
  showUpdateModal.value = true;
};

const closeUpdateModal = () => {
  showUpdateModal.value = false;
};

const handleUpdateSuccess = () => {
  showUpdateModal.value = false;
  fetchOvertimeData();
};

// ----------------------------
// [11] 초기 로드
// ----------------------------
onMounted(() => {
  fetchOvertimeData();
});
</script>

<style scoped>
.button-wrapper {
  display: flex;
  justify-content: flex-end;
  width: auto;
  gap: 20px;
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
