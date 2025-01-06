<template>
  <div class="kpi-container">
    <!-- 제목 -->
    <div id="header-div" class="header-container">
      <!-- 드롭다운 컴포넌트 -->
      <ButtonDropDown
          :options="dropdownOptions"
          :width="'90px'"
          :height="'40px'"
          :fontSize="'16px'"
          :imgSize="'20px'"
          :marginLeft="'7px'"
          v-model="selectedOption"
      />
    </div>
    <!-- 선택된 KPI 정보 표시 -->
    <div id="header-div" class="header-container">
      <h1 v-if="isYearSelected" class="header-title">{{ selectedYear }}년</h1>
      <h1 v-if="isQuarterSelected" class="header-title">{{ selectedQuarter }}분기</h1>
      <h1 v-if="isMonthSelected" class="header-title">{{ selectedMonth }}월</h1>
      <h1 class="header-title"> 나의 KPI</h1>
    </div>

    <!-- 개인 KPI 섹션 -->
    <section>
      <h2 class="kpi-personal">개인</h2>
      <KpiSection :kpiData="personalKPIs" @update-kpi="handleUpdateKpi" @refresh-kpi-data="refreshKpiData" />
    </section>

    <!-- 팀 KPI 섹션 -->
    <section>
      <h2 class="kpi-team">팀</h2>
      <KpiSection :kpiData="teamKPIs" @update-kpi="handleUpdateKpi" @refresh-kpi-data="refreshKpiData" />
    </section>
  </div>
</template>

<script setup>
import { onMounted, ref, computed, watch } from "vue";
import KpiSection from "@/components/common/KpiSection.vue";
import ButtonDropDown from "@/components/common/ButtonDropDown.vue";
import api from "@/config/axios.js";
import { useAuthStore } from "@/store/authStore.js";

const authStore = useAuthStore();
const empId = authStore.empId;

// 드롭다운 옵션 데이터
const dropdownOptions = [
  { label: "년", value: "YEAR" },
  { label: "분기", value: "QUARTER" },
  { label: "월", value: "MONTH" },
];

// 선택된 값들
const selectedOption = ref(""); // "YEAR", "QUARTER", "MONTH"
const selectedYear = ref(null);
const selectedQuarter = ref(null);
const selectedMonth = ref(null);

// 선택된 항목 여부
const isYearSelected = computed(() => selectedYear.value !== null);
const isQuarterSelected = computed(() => selectedQuarter.value !== null);
const isMonthSelected = computed(() => selectedMonth.value !== null);

// KPI 데이터
const personalKPIs = ref([]);
const teamKPIs = ref([]);

// 드롭다운 선택 시 값 설정 및 KPI 데이터 가져오기
const handleDropdownChange = (selected) => {
  const now = new Date(); // 현재 시각
  selectedYear.value = now.getFullYear(); // 현재 년도

  if (selected === "YEAR") {
    selectedQuarter.value = null; // 분기 초기화
    selectedMonth.value = null; // 월 초기화
  } else if (selected === "QUARTER") {
    const month = now.getMonth() + 1; // 현재 월 (0부터 시작하므로 +1)
    selectedQuarter.value = Math.ceil(month / 3); // 현재 분기 계산
    selectedMonth.value = null; // 월 초기화
  } else if (selected === "MONTH") {
    selectedMonth.value = now.getMonth() + 1; // 현재 월
    selectedQuarter.value = null; // 분기 초기화
  }

  // KPI 데이터 새로 가져오기
  fetchKpiData();
};

// Watch selectedOption and call handleDropdownChange
watch(selectedOption, (newValue) => {
  handleDropdownChange(newValue);
});

// KPI 데이터 가져오기
const fetchKpiData = async () => {
  if (!selectedYear.value) return; // Ensure year is selected

  const requestData = {
    quarter: selectedQuarter.value,
    month: selectedMonth.value,
  };

  try {
    const [personalResponse, teamResponse] = await Promise.all([
      api.get(`/perfomances/kpi/personal/period/current/${empId}/${selectedYear.value}`, { params: requestData }),
      api.get(`/perfomances/kpi/team/period/current/${empId}/${selectedYear.value}`, { params: requestData }),
    ]);

    personalKPIs.value = personalResponse.data.kpiLists || [];
    teamKPIs.value = teamResponse.data.kpiLists || [];
  } catch (error) {
    console.error("KPI 데이터를 가져오는 중 오류 발생:", error);
  }
};

// 드롭다운 값 변경 시 API 호출
watch(
    [selectedYear, selectedQuarter, selectedMonth],
    () => {
      if (isYearSelected.value || isQuarterSelected.value || isMonthSelected.value) {
        fetchKpiData();
      }
    },
    { deep: true }
);

// 페이지 로드 시 데이터 가져오기
onMounted(() => {
  // 초기 선택이 없는 상태이므로 데이터를 가져오지 않음
  // 필요 시 기본 값을 설정하고 데이터를 가져올 수 있음
  // 예:
  // selectedOption.value = "YEAR";
  // handleDropdownChange("YEAR");
});

// KPI 업데이트 처리
const handleUpdateKpi = (updatedKpi) => {
  // KPI 리스트 업데이트 함수
  const updateKpiList = (kpiList) => {
    const index = kpiList.findIndex((kpi) => kpi.kpiId === updatedKpi.kpiId);
    if (index !== -1) {
      kpiList[index] = { ...kpiList[index], ...updatedKpi };
    }
  };

  updateKpiList(personalKPIs.value);
  updateKpiList(teamKPIs.value);
};

// KPI 데이터를 다시 가져오는 함수
const refreshKpiData = () => {
  fetchKpiData();
};
</script>

<style scoped>
.kpi-container {
  max-width: 800px;
  margin: 0 auto;
  font-family: Arial, sans-serif;
}

h1 {
  text-align: center;
  font-size: 24px;
  margin-bottom: 20px;
}

section {
  margin-bottom: 40px;
}

.header-container {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 30px;
}

.header-title {
  font-size: 20px;
  font-weight: bold;
  color: #3c4651;
}

.kpi-personal {
  margin-bottom: 20px;
  font-size: 20px;
  font-weight: bold;
}

.kpi-team {
  margin-bottom: 20px;
  font-size: 20px;
  font-weight: bold;
}
</style>
