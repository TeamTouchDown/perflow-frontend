<script setup>
import { ref, onMounted } from 'vue';
import { Bar } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';
import api from "@/config/axios.js";
import Up from "@/assets/image/up.png";
import Down from "@/assets/image/down.png";
import Flat from "@/assets/image/flat.png";

// Chart.js 구성 요소 등록
ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

// 3년 간 급여 데이터
const threeYears = ref([]);
const growthRate = ref(0); // 증가율
const recentYear = ref(''); // 최근 년도

// 차트 데이터 설정
const chartData = ref({
  labels: [], // 월별 라벨
  datasets: [
    {
      label: '총 급여',
      data: [], // 급여 데이터
      backgroundColor: '#FFDD00', // 막대 색상
    }
  ]
});

// 3년 간 급여 데이터 가져오는 함수
const fetchThreeYears = async () => {
  try {
    const response = await api.get('/hr/payrolls/chart/last-three-years');
    threeYears.value = response.data;

    // 차트 데이터 업데이트
    chartData.value.labels = threeYears.value.map(item => {
      return item.year
    });

    // 급여 데이터
    chartData.value.datasets[0].data = threeYears.value.map(item => item.totalAmount); // 급여

    // 최근 년도 업데이트
    recentYear.value = chartData.value.labels[chartData.value.labels.length - 1];

    // 증가율 계산 (전년도 대비)
    const [lastYear, currentYear] = chartData.value.datasets[0].data.slice(-2);
    if (lastYear && currentYear) {
      growthRate.value = ((currentYear - lastYear) / lastYear) * 100;
      growthRate.value = parseFloat(growthRate.value.toFixed(1));
    } else {
      growthRate.value = 0; // 값이 없으면 0으로 설정
    }

  } catch (error) {
    console.error('3년 간 급여 데이터 정보를 불러오는 중 에러가 발생했습니다. : ', error);
  }
};

// 컴포넌트가 마운트될 때 데이터 불러오기
onMounted(() => {
  fetchThreeYears();
});

// 차트 옵션 설정
const chartOptions = ref({
  responsive: true,
  scales: {
    x: {
      title: {
        display: true,
      }
    },
    y: {
      display: false, // Y축 숨기기
    }
  }
});
</script>

<template>
  <div>
    <h3>최근 3년간 총 급여</h3>
    <div class="growth-container">
      <div class="salary-label">{{ recentYear }}년 총 급여 </div>
      <div
          class="growth-rate"
          :class="{
          'growth-up': growthRate > 0,
          'growth-down': growthRate < 0,
          'growth-equal': growthRate === 0
        }"
      >
        <!-- 증가율 이미지 조건부 표시 -->
        <img
            :src="growthRate > 0 ? Up : growthRate < 0 ? Down : Flat"
            :alt="growthRate > 0 ? '증가' : growthRate < 0 ? '감소' : '변화 없음'"
        />
        <span>{{ growthRate }}%</span>
        <span class="comparison-text">전년도대비</span>
      </div>
    </div>
    <!-- 바 차트 -->
    <Bar
        v-if="threeYears.length"
        :data="chartData"
        :options="chartOptions"
        style="width: 100%; height: 300px;"
    />
    <p v-else>데이터를 불러오는 중...</p>
  </div>
</template>

<style scoped>
h3 {
  margin-top: 30px;
  font-weight: bold;
  color: #3c4651;
}

.growth-container {
  display: flex;
  flex-direction: row;
  gap: 30px;
  margin: 10px 0;
}

.salary-label {
  font-size: 18px;
  color: #3c4651;
}

.growth-rate {
  display: flex;
  align-items: center;
  font-size: 18px;
}

.growth-rate img {
  width: 20px;
  height: 20px;
  margin-right: 7px;
}

/* 증가율 색상 조건 */
.growth-up {
  color: #05A730; /* 초록색 */
}

.growth-down {
  color: #FC0303; /* 빨간색 */
}

.growth-equal {
  color: #afa9a9; /* 회색 */
}

.comparison-text {
  margin-left: 7px;
  color: inherit; /* 부모 색상 상속 */
  font-size: 13px;
}
</style>
