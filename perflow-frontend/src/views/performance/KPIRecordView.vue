<template>
  <div class="kpi-container">
    <!-- 상단 드롭다운 영역 -->
    <div class="header-container">
      <!-- 1) '년/분기/월' 선택 드롭다운 -->
      <ButtonDropDown
          :options="periodOptions"
          :width="'90px'"
          :height="'40px'"
          :fontSize="'16px'"
          :imgSize="'20px'"
          :marginLeft="'7px'"
          v-model="selectedPeriod"
      />

      <ButtonDropDown
          v-if="showYearDropdown"
          :options="yearDropdownOptions"
          :width="'110px'"
          :height="'40px'"
          :fontSize="'16px'"
          :imgSize="'20px'"
          :marginLeft="'7px'"
          v-model="selectedYear"
      />

      <ButtonDropDown
          v-if="selectedPeriod === 'QUARTER' && selectedYear"
          :options="quarterOptions"
          :width="'110px'"
          :height="'40px'"
          :fontSize="'16px'"
          :imgSize="'20px'"
          :marginLeft="'7px'"
          v-model="selectedQuarter"
      />

      <ButtonDropDown
          v-if="selectedPeriod === 'MONTH' && selectedYear"
          :options="monthOptions"
          :width="'110px'"
          :height="'40px'"
          :fontSize="'16px'"
          :imgSize="'20px'"
          :marginLeft="'7px'"
          v-model="selectedMonth"
      />


    </div>

    <!-- 선택된 기간 표시 -->
    <div class="header-container">
      <h1 v-if="selectedYear" class="header-title">
        {{ selectedYear }}년
        <span v-if="selectedPeriod === 'QUARTER' && selectedQuarter">
          {{ selectedQuarter }}분기
        </span>
        <span v-if="selectedPeriod === 'MONTH' && selectedMonth">
          {{ selectedMonth }}월
        </span>
      </h1>
      <h1 class="header-title">KPI 이력 조회</h1>
    </div>

    <!-- 개인 KPI 섹션 -->
    <section>
      <h2 class="kpi-personal">개인 KPI</h2>
      <!-- KPI가 없을 때 메시지 표시 -->
      <p v-if="!personalKPIs.length" class="no-kpi-message">조회 가능한 개인 KPI가 없습니다.</p>
      <!-- KPI가 있을 때 데이터 표시 -->
      <KpiRecordSection v-else :kpiData="personalKPIs" />
    </section>

    <!-- 팀 KPI 섹션 -->
    <section>
      <h2 class="kpi-team">팀 KPI</h2>
      <!-- KPI가 없을 때 메시지 표시 -->
      <p v-if="!teamKPIs.length" class="no-kpi-message">조회 가능한 팀 KPI가 없습니다.</p>
      <!-- KPI가 있을 때 데이터 표시 -->
      <KpiRecordSection v-else :kpiData="teamKPIs" />
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import ButtonDropDown from "@/components/common/ButtonDropDown.vue";
import api from "@/config/axios.js";
import { useAuthStore } from "@/store/authStore.js";
import KpiRecordSection from "@/components/common/KpiRecordSection.vue";

/* ---------------------------------------
   예시) 로그인한 직원 정보에서 가져온다 가정
   실제로는 아래 변수를 store나 API로부터
   받아오도록 구현하면 됩니다.
----------------------------------------- */
const authStore = useAuthStore();
const empId = authStore.empId;

/* ---------------------------------------
   1) 드롭다운 옵션 데이터들
----------------------------------------- */
const periodOptions = [
  { label: "년", value: "YEAR" },
  { label: "분기", value: "QUARTER" },
  { label: "월", value: "MONTH" },
];


const quarterOptions = [
  { label: "1분기", value: 1 },
  { label: "2분기", value: 2 },
  { label: "3분기", value: 3 },
  { label: "4분기", value: 4 },
];

const monthOptions = Array.from({ length: 12 }, (_, i) => ({
  label: `${i + 1}월`,
  value: i + 1,
}));
/* ---------------------------------------
   2) 선택한 드롭다운 값들
----------------------------------------- */
const selectedPeriod = ref(""); // "년", "분기", "월" 중 하나
const selectedYear = ref(null);
const selectedQuarter = ref(null);
const selectedMonth = ref(null);

/* ---------------------------------------
   3) 조회할 수 있는 년도 리스트
   - creationYear ~ 현재연도 전년도
   예) 2021 ~ 2023 (현재연도가 2024라면)
----------------------------------------- */
const currentYear = new Date().getFullYear();
// 직원이 처음 KPI를 생성한 연도 (예: 2021년)
const creationYear = new Date().getFullYear() - 3;
const yearDropdownOptions = computed(() => {
  const options = [];
  for (let y = creationYear; y <= currentYear - 1; y++) {
    options.push({ label: y.toString(), value: y }); // value를 숫자로 설정
  }
  return options;
});


/* ---------------------------------------
   4) 드롭다운 핸들러
----------------------------------------- */
// '년/분기/월' 옵션을 바꿀 때
const handlePeriodChange = (value) => {
  console.log(value);
  selectedPeriod.value = value;
  // 이전 선택값들 리셋
  selectedYear.value = null;
  selectedQuarter.value = null;
  selectedMonth.value = null;
};

// '년도'가 바뀔 때
const handleYearChange = (value) => {
  selectedYear.value = value;
  // 분기/월 선택 초기화
  selectedQuarter.value = null;
  selectedMonth.value = null;
};

// '분기'가 바뀔 때
const handleQuarterChange = (value) => {
  selectedQuarter.value = value;
};

// '월'이 바뀔 때
const handleMonthChange = (value) => {
  selectedMonth.value = value;
};

/* ---------------------------------------
   5) KPI 데이터 불러오기
----------------------------------------- */
const personalKPIs = ref([]);
const teamKPIs = ref([]);

// 특정 기간 KPI 불러오기 함수
const fetchKpiData = async () => {
  try {
    // 공통 파라미터 (년)
    const requestData = {
      quarter: selectedPeriod.value === "QUARTER" ? selectedQuarter.value : null,
      month: selectedPeriod.value === "MONTH" ? selectedMonth.value : null,
    };

    // 개인 KPI
    const personalResponse = await api.get(
        `/perfomances/kpi/personal/period/past/${empId}/${selectedYear.value}`,
        { params: requestData }
    );
    personalKPIs.value = personalResponse.data.kpiLists || [];

    // 팀 KPI
    const teamResponse = await api.get(
        `/perfomances/kpi/team/period/past/${empId}/${selectedYear.value}`,
        { params: requestData }
    );
    teamKPIs.value = teamResponse.data.kpiLists || [];
  } catch (error) {
    console.error("KPI 데이터를 가져오는 중 오류가 발생했습니다.", error);
  }
};

/* ---------------------------------------
   6) 드롭다운 값이 변경될 때마다 조회
----------------------------------------- */
watch(
    () => ({
      period: selectedPeriod.value,
      year: selectedYear.value,
      quarter: selectedQuarter.value,
      month: selectedMonth.value,
    }),
    (newValues) => {
      if (!newValues.year) return;

      if (newValues.period === "YEAR") {
        fetchKpiData();
      } else if (newValues.period === "QUARTER" && newValues.quarter) {
        fetchKpiData();
      } else if (newValues.period === "MONTH" && newValues.month) {
        fetchKpiData();
      }
    },
    { deep: true }
);


/* ---------------------------------------
   7) 페이지 로드시 기본 로직
   - 최초에는 아무 기간도 선택안된 상태
----------------------------------------- */
onMounted(() => {
  // 필요 시 기본 값 세팅을 원하면 아래와 같은 식으로 해줄 수도 있음.
  // selectedPeriod.value = "년";
  // selectedYear.value = currentYear - 1;
  // fetchKpiData();
});

/* ---------------------------------------
   8) v-if/v-show 조건
----------------------------------------- */
const showYearDropdown = computed(() => {
  // '년/분기/월' 중 아무것도 선택안한 경우 숨김
  return ["YEAR", "QUARTER", "MONTH"].includes(selectedPeriod.value);
});
</script>

<style scoped>
.kpi-container {
  max-width: 800px;
  margin: 0 auto;
  font-family: Arial, sans-serif;
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
  margin: 0;
}

section {
  margin-bottom: 40px;
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

.no-kpi-message {
  color: #999;
  text-align: center;
  margin-top: 20px;
  font-size: 16px;
}
</style>
