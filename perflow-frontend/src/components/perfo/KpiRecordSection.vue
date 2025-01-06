<template>
  <div class="kpi-section">
    <div v-for="kpi in kpiData" :key="kpi.kpiId" class="kpi-item">
      <div class="kpi-title">{{ kpi.goal }}</div>
      <div class="kpi-progress">
        <div class="progress-bar">
          <div
              class="progress-fill"
              :style="{ width: getProgressWidth(kpi.currentValue, kpi.goalValue) }"
          ></div>
        </div>
        <div class="progress-value">
          {{ getProgressPercentage(kpi.currentValue, kpi.goalValue) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  // 부모로부터 KPI 배열을 전달받습니다.
  kpiData: {
    type: Array,
    required: true,
  },
});

// progress bar width 계산
const getProgressWidth = (current, goal) => {
  if (!goal || goal === 0) return "0%";
  const percentage = (current / goal) * 100;
  return `${percentage.toFixed(1)}%`;
};

// progress bar 퍼센트 숫자
const getProgressPercentage = (current, goal) => {
  if (!goal || goal === 0) return "0%";
  const percentage = (current / goal) * 100;
  return `${percentage.toFixed(1)}%`;
};
</script>

<style scoped>
.kpi-section {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.kpi-item {
  display: grid;
  grid-template-columns: 200px 400px;
  align-items: center;
  padding: 15px;
  border: 1px solid #ccc;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.kpi-title {
  font-weight: bold;
  font-size: 16px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.kpi-progress {
  display: flex;
  align-items: center;
  gap: 15px;
}

.progress-bar {
  width: 300px;
  height: 15px;
  background-color: #f0f0f0;
  border-radius: 7px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(to right, #ff9900, #ffcc33);
  transition: width 0.3s ease;
  width: 0%;
}

.progress-value {
  width: 80px;
  font-size: 14px;
  color: #666;
  text-align: center;
}
</style>
