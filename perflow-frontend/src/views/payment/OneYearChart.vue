<script setup>
import { ref, onMounted } from 'vue';
import api from "@/config/axios.js";
import { Line } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale } from 'chart.js';
import Up from '../../assets/image/up.png';
import Down from '../../assets/image/down.png';
import Flat from '../../assets/image/flat.png';

// Chart.js 구성 요소 등록
ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale);

// 3개월 급여 데이터 및 상태 관리
const threeMonths = ref({ labels: [], values: [] });
const growthRate = ref(0); // 증가율
const recentYear = ref(''); // 최근 년

// 3개월 간 급여 데이터 정보를 가져오는 함수
const fetchThreeMonth = async () => {
  try {
    const response = await api.get(`/hr/payrolls/chart/last-months`);
    console.log(response.data); // API 응답 확인

    const payrollChart = response.data;

    if (payrollChart && Array.isArray(payrollChart)) {
      // labels (월별 라벨)과 values (급여 금액) 설정
      threeMonths.value.labels = payrollChart.map(item => {
        // createDatetime에서 'MM'만 추출 (월)
        return item.createDatetime.substring(5, 7);  // 'MM' 형식
      });

      // console.log("labels : ", threeMonths.value.labels);

      // 급여 금액을 values에 저장
      threeMonths.value.values = payrollChart.map(item => item.totalAmount);

      // console.log("values : ",threeMonths.value.values);

      // 최근 년도 업데이트 (createDatetime에서 'YYYY' 추출)
      recentYear.value = payrollChart[payrollChart.length - 1].createDatetime.substring(0, 4);

      // 증가율 계산 (전달 대비)
      const [lastMonth, currentMonth] = threeMonths.value.values.slice(-2);
      if (lastMonth && currentMonth) {
        growthRate.value = ((currentMonth - lastMonth) / lastMonth) * 100;
        growthRate.value = parseFloat(growthRate.value.toFixed(1));

      } else {
        growthRate.value = 0; // 값이 없으면 0으로 설정
      }

      // console.log("currentMonth: " ,currentMonth, ", lastMonth: ", lastMonth);
      // console.log("growthRate : ", growthRate.value);
      // console.log("test : ", ((currentMonth - lastMonth) / lastMonth) * 100);

      // 차트 데이터 업데이트
      chartData.value = {
        labels: threeMonths.value.labels,
        datasets: [
          {
            label: '총 급여',
            data: threeMonths.value.values,
            fill: false,
            borderColor: '#F97B3D',
            tension: 0.1
          }
        ]
      };
    } else {
      console.error('API 응답 데이터 형식이 예상과 다릅니다.');
    }
  } catch (error) {
    console.error('3개월 간 급여 데이터 정보를 불러오는 중 에러가 발생했습니다. : ', error);
  }
};

// 컴포넌트가 마운트될 때 데이터 불러오기
onMounted(() => fetchThreeMonth());

// 차트 데이터 및 옵션 설정
const chartData = ref({
  labels: [],
  datasets: [
    {
      label: '총 급여',
      data: [],
      fill: false,
      borderColor: '#F97B3D',
      tension: 0.1
    }
  ]
});

const chartOptions = ref({
  responsive: true,
  scales: {
    x: {
      grid: {
        display: false // x축의 그리드 라인 제거
      },
    },
    y: {
      grid: {
        display: false // y축의 그리드 라인 제거
      },
      ticks: {
        display: false // y축의 값 제거
      }
    }
  }
});

</script>

<template>
  <div>
    <!-- 차트 제목 -->
    <h3>최근 1년간 총 급여</h3>
    <!-- 총 급여 변화율 -->
    <div v-if="threeMonths.values.length" class="growth-container">
      <span class="salary-label">{{ recentYear }}년 총 급여</span>
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
        <span class="comparison-text">전달대비</span>
      </div>
    </div>

    <!-- 차트 -->
    <Line
        v-if="threeMonths.values.length"
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
