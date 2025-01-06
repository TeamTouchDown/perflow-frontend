<template>
  <div id="header-div">
    <div class="dropdown-container">
      <ButtonDropDown
          :options="periodOptions"
          :width="'90px'"
          :height="'40px'"
          :fontSize="'16px'"
          :imgSize="'20px'"
          :marginLeft="'7px'"
          v-model="selectedPeriod"
      />
    </div>
    <div id="header-top" class="flex-between">
      <p id="title">
        {{ selectedYear }}년
        <span v-if="selectedPeriod === 'QUARTER'">{{ selectedQuarter }}분기</span>
        <span v-if="selectedPeriod === 'MONTH'">{{ selectedMonth }}월</span>
         팀 KPI 제출
      </p>
      <p id="expiredays">팀 KPI 제출 기한이 {{ day.expiredays }}일 남았습니다.</p>
    </div>
  </div>

  <!-- KPI 리스트 표시 -->
  <div id="empList-div">
    <p id="kpiswarn">반드시 {{ KPILists.minKpis }}개 이상의 KPI를 작성해야 합니다.</p>
    <p id="total">{{ KPILists.totalKpis }}/{{ KPILists.maxKpis }}개</p>
    <!-- 자식 컴포넌트 (PersonalKpiTable) -->
    <KpiTable
        :rows="KPIs"
        :selected="selected"
        :emp-id="authStore.empId"
        @rejectKpi="handleRejectKpi"
        @updateKpi="handleUpdateKpi"
        @deleteKpi="handleDeleteKpi"
        @addKpi="handleAddKpi"
    />
  </div>
</template>

<script setup>
import {ref, computed, watch, onMounted} from "vue";
import {useAuthStore} from "@/store/authStore.js";
import api from "@/config/axios.js";
import ButtonDropDown from "@/components/common/ButtonDropDown.vue";
import KpiTable from "@/components/common/KpiTable.vue";

const authStore = useAuthStore();

// KPI 목록
const KPIs = ref([]);
const KPILists = ref({
  minKpis: 0,
  totalKpis: 0,
  maxKpis: 0,
});

// 드롭다운 옵션
const periodOptions = [
  {label: "년", value: "YEAR"},
  {label: "분기", value: "QUARTER"},
  {label: "월", value: "MONTH"},
];

// 선택된 기간
const selectedPeriod = ref(periodOptions[0].value); // "YEAR"

// 날짜 계산
function getNextPeriod(periodType) {
  const today = new Date();
  let year = today.getFullYear();
  let quarter = Math.ceil((today.getMonth() + 1) / 3) + 1;
  let month = today.getMonth() + 2;

  if(quarter>4 && month >12){
    year--;
  }

  if (quarter > 4) {
    quarter = 1;
    year++;
  }
  if (month > 12) {
    month = 1;
    year++;
  }
  return {year, quarter, month};
}

const nextPeriod = getNextPeriod(selectedPeriod.value);
const selectedYear = ref(nextPeriod.year);
const selectedQuarter = ref(nextPeriod.quarter);
const selectedMonth = ref(nextPeriod.month);

// KPI 제출까지 남은 일자
const day = ref({expiredays: 0});

// 남은 일수 계산 함수
function calculateDaysLeft(value) {
  const today = new Date();
  let lastDay;
  switch (value) {
    case "YEAR":
      lastDay = new Date(today.getFullYear(), 11, 31);
      break;
    case "QUARTER":
      let nextQuarter = Math.ceil((today.getMonth() + 1) / 3);
      let year = today.getFullYear();
      const nextQuarterEndMonth = nextQuarter * 3;
      lastDay = new Date(year, nextQuarterEndMonth, 0);
      break;
    case "MONTH":
      let nextMonth = today.getMonth() + 1;
      let monthYear = today.getFullYear();
      lastDay = new Date(monthYear, nextMonth, 0);
      break;
    default:
      throw new Error("Invalid target");
  }
  const timeDifference = lastDay - today;
  return Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
}

// 반응형으로 computed
const selected = computed(() => ({
  period: selectedPeriod.value,
  year: selectedYear.value,
  quarter: selectedQuarter.value,
  month: selectedMonth.value,
}));

// 선택된 기간 watch
watch(selectedPeriod, (newVal) => {
  const {year, quarter, month} = getNextPeriod(newVal);
  selectedYear.value = year;
  selectedQuarter.value = quarter;
  selectedMonth.value = month;
  day.value.expiredays = calculateDaysLeft(newVal);
}, {immediate: true});

// watch selected => fetch KPI list
watch(selected, (newVal) => {
  console.log("selected changed => fetch KPI list:", newVal);
  fetchKpiList();
}, {deep: true});

// KPI 데이터 가져오기
async function fetchKpiList() {
  try {
    console.log("fetchKpiList with selected:", selected.value);
    const requestData = {
      quarter: selected.value.period === "QUARTER" ? selected.value.quarter : null,
      month: selected.value.period === "MONTH" ? selected.value.month : null,
    };
    const response = await api.get(
        `/perfomances/kpi/team/period/new/${authStore.empId}/${selected.value.year}`,
        {params: requestData}
    );
    console.log("KPI List Response:", response);
    KPIs.value = response.data.kpiLists;
    KPILists.value = response.data;
  } catch (error) {
    console.error("Failed to fetch KPI data:", error);
  }
}

onMounted(() => {
  fetchKpiList();
});

// 이벤트 핸들러
function handleRejectKpi(kpiId) {
  console.log("Reject KPI:", kpiId);
  // ... 반려 사유 로직
}

async function handleAddKpi(kpiData) {
  console.log("Add KPI:", kpiData);
  // 모달에서 emit('addKpi', KPIForm.value) => 여기서 받음
  // -> 실제 API post -> 성공 시 다시 fetchKpiList()
  try {
    const response = await api.post(`/leader/perfomances/kpi/team/${authStore.empId}`, kpiData);
    console.log("KPI 추가 성공:", response.data);
    fetchKpiList(); // 추가 후 다시 목록 갱신
  } catch (error) {
    console.error("KPI 추가 실패:", error);
  }
}

async function handleUpdateKpi(kpi) {
  console.log("Update KPI:", kpi);
  // 수정 로직
  // ... API put -> 성공 시 fetchKpiList()
  try {
    const response = await api.put(`/leader/perfomances/kpi/team/${kpi.kpiId}`, kpi);
    console.log("KPI 수정 성공:", response.data);
    fetchKpiList();
  } catch (error) {
    console.error("KPI 수정 실패:", error);
  }
}

async function handleDeleteKpi(kpiId) {
  console.log("Delete KPI:", kpiId);
  // 삭제 로직
  // ... API delete -> 성공 시 fetchKpiList()
  try {
    const response = await api.delete(`/leader/perfomances/kpi/team/${kpiId}/${authStore.empId}`);
    console.log("KPI 삭제 성공:", response.data);
    fetchKpiList();
  } catch (error) {
    console.error("KPI 삭제 실패:", error);
  }
}
</script>

<style scoped>
#empList-div {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin: 0 auto;
}

#title {
  font-size: 35px;
  font-weight: bold;
  color: #3c4651;
}

#expiredays {
  font-size: 20px;
  color: #afa9a9;
}

#header-div {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin-top: 50px;
}

#header-top {
  margin-top: 20px;
  width: 900px;
}

#total {
  margin: 0;
  padding: 0;
  font-weight: bold;
  color: #3c4651;
  width: 800px;
  text-align: right;
}

#kpiswarn {
  margin: 0;
  padding: 0;
  color: #3c4651;
  width: 900px;
  text-align: right;
}

.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dropdown-container {
  width: 900px;
}
</style>
