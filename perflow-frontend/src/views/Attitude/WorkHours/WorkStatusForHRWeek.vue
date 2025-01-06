<script setup>
import { ref, onMounted } from "vue";
import TableBasic from "@/components/common/TableBasic.vue";
import PagingBar from "@/components/common/PagingBar.vue";
import api from "@/config/axios.js";

// 상태 관리
const weeklyData = ref([]); // 주차별 데이터
const monthlyData = ref([]); // 월별 데이터
const filteredData = ref([]); // 현재 필터링된 데이터
const paginatedData = ref([]); // 현재 페이지 데이터
const formattedData = ref([]); // 포맷된 데이터

// 필터와 페이징 상태 관리
const weeks = ref([]);
const months = ref([]);
const selectedWeek = ref(null);
const selectedMonth = ref(null);
const viewMode = ref("weekly"); // "weekly" 또는 "monthly"
const pages = ref({
  pageSize: 10,
  totalItems: 0,
  totalPages: 1,
  currentPage: 1,
});

// 월 이름과 숫자 매핑
const monthMap = {
  JANUARY: 1,
  FEBRUARY: 2,
  MARCH: 3,
  APRIL: 4,
  MAY: 5,
  JUNE: 6,
  JULY: 7,
  AUGUST: 8,
  SEPTEMBER: 9,
  OCTOBER: 10,
  NOVEMBER: 11,
  DECEMBER: 12,
};

// 주차별 데이터 호출
const fetchWeeklyAttendance = async (page = 1) => {
  try {
    const response = await api.get("/hr/attendance/summaries/weekly");
    weeklyData.value = response.data;

    // 주차 리스트 추출
    weeks.value = [...new Set(weeklyData.value.map((item) => parseInt(item.period)))].sort((a, b) => b - a);

    // 초기값 설정 및 필터링
    selectedWeek.value = selectedWeek.value || weeks.value[0];
    if (viewMode.value === "weekly") {
      updateFilteredData();
    }
  } catch (error) {
    console.error("주차별 데이터 호출 실패:", error.response?.data || error.message);
  }
};

// 월별 데이터 호출
const fetchMonthlyAttendance = async (page = 1) => {
  try {
    const response = await api.get("/hr/attendance/summaries/monthly");
    monthlyData.value = response.data;

    // 월 리스트 추출
    months.value = [...new Set(monthlyData.value.map((item) => monthMap[item.period]))].sort((a, b) => b - a);

    // 초기값 설정 및 필터링
    selectedMonth.value = selectedMonth.value || months.value[0];
    if (viewMode.value === "monthly") {
      updateFilteredData();
    }
  } catch (error) {
    console.error("월별 데이터 호출 실패:", error.response?.data || error.message);
  }
};

// 필터링된 데이터를 갱신
const updateFilteredData = () => {
  if (viewMode.value === "weekly") {
    filteredData.value = weeklyData.value.filter((item) => parseInt(item.period) === selectedWeek.value);
  } else {
    filteredData.value = monthlyData.value.filter((item) => monthMap[item.period] === selectedMonth.value);
  }
  updatePaginatedData();
};

// 현재 페이지 데이터를 갱신
const updatePaginatedData = () => {
  const start = (pages.value.currentPage - 1) * pages.value.pageSize;
  const end = start + pages.value.pageSize;
  paginatedData.value = filteredData.value.slice(start, end);

  // 포맷 데이터 업데이트
  formattedData.value = paginatedData.value.map((item) => ({
    empName: item.empName,
    workTime: formatWorkTime(item.totalHours, item.totalMinutes),
  }));

  // 총 항목 및 페이지 수 갱신
  pages.value.totalItems = filteredData.value.length;
  pages.value.totalPages = Math.ceil(pages.value.totalItems / pages.value.pageSize);
};

// 페이지 변경 핸들러
const onPageChanged = (page) => {
  pages.value.currentPage = page;
  updatePaginatedData();
};
const columns = [
  {field: "empName", label: "이름"},
  {field: "workTime", label: "근무 시간"},
];

// 근무 시간 포맷
const formatWorkTime = (hours, minutes) => {
  if (hours === undefined || minutes === undefined) return "미등록";
  if (hours < 0) return "미등록";
  return `${hours}시간 ${minutes}분`;
};

// 초기 데이터 로드
onMounted(() => {
  console.log("마운트 완")
  fetchWeeklyAttendance();
  fetchMonthlyAttendance();
});
</script>

<template>
  <div class="table-container">
    <div class="header">
      <h1>근무 현황</h1>
      <div class="filter-section">
        <!-- 보기 전환 버튼 -->
        <button
            :class="{ active: viewMode === 'weekly' }"
            @click="viewMode = 'weekly'; updateFilteredData()"
        >
          주차별 보기
        </button>
        <button
            :class="{ active: viewMode === 'monthly' }"
            @click="viewMode = 'monthly'; updateFilteredData()"
        >
          월별 보기
        </button>

        <!-- 주차 필터 -->
        <div v-if="viewMode === 'weekly'" class="filter-section">
          <label>주차</label>
          <select v-model="selectedWeek" @change="updateFilteredData">
            <option v-for="week in weeks" :key="week" :value="week">
              {{ week }}주차
            </option>
          </select>
        </div>

        <!-- 월별 필터 -->
        <div v-if="viewMode === 'monthly'" class="filter-section">
          <label>월</label>
          <select v-model="selectedMonth" @change="updateFilteredData">
            <option v-for="month in months" :key="month" :value="month">
              {{ month }}월
            </option>
          </select>
        </div>
      </div>
    </div>

    <div class="table-wrapper">
      <TableBasic :row-key="'empName'" :rows="formattedData" :columns="columns" />
    </div>

    <div class="paging-bar">
      <PagingBar
          :page-size="pages.pageSize"
          :total-items="pages.totalItems"
          :total-pages="pages.totalPages"
          :current-page="pages.currentPage"
          @page-changed="onPageChanged"
      />
    </div>
  </div>
</template>



<style scoped>
table{
  width: 100%;
  table-layout: auto;
  border-collapse: collapse;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  width: 80%;
}

.filter-section {
  display: flex;
  align-items: center;
  gap: 10px;
}

button {
  padding: 8px 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: white;
  cursor: pointer;
  font-size: 14px;
}

button.active {
  background-color: #D9D9D9;
  color: white;
  border-color: #D9D9D9;
}

h1 {
  margin: 0;
  font-size: 24px;
  font-weight: bold;
}

.table-container {
  width: 80%;
  margin: 0 auto;
  text-align: center;
  overflow-x: auto;
  display: flex;
  flex-direction: column; /* 세로 방향으로 정렬 */
  align-items: center; /* 가로 중앙 정렬 */
  gap: 10px; /* 각 요소 간의 간격 */

}

th, td {
  text-align: center;
  vertical-align: middle;
  font-size: 15px;
}

.table-wrapper {
  display: flex;
  justify-content: center;
  text-align: center;

}
</style>
