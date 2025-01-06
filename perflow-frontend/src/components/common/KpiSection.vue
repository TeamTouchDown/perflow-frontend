<template>
  <div class="kpi-section">
    <div v-for="kpi in kpiData" :key="kpi.id" class="kpi-item">
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
      <ButtonBasic
          class="update-button"
          color="gray"
          size="medium"
          @click="openUpdateModal(kpi)"
      >
        진척도 업데이트
      </ButtonBasic>
    </div>

    <!-- 모달 -->
    <div v-if="isModalOpen && selectedKpi" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <h2 class="modal-title">진척도 최신화</h2>
        <div class="modal-body">
          <div class="modal-row">
            <label class="modal-label">목표</label>
            <input type="text" v-model="selectedKpi.goal" disabled />
          </div>
          <div class="modal-row">
            <label class="modal-label">현재진척도</label>
            <div class="progress-input">
              <input
                  type="number"
                  v-model.number="progressValue"
                  min="0"
                  :max="selectedKpi.goalValue"
              />
              <span class="progress-unit">{{selectedKpi.goalValueUnit}}</span>
            </div>
          </div>
          <div class="modal-row">
            <label class="modal-label">진척도 최신화 근거</label>
            <textarea
                v-model="updateReason"
                placeholder="진척도 변경 사유를 입력하세요"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <ButtonBasic @click="closeModal" class="cancel-button">취소</ButtonBasic>
          <ButtonBasic
              @click="update(selectedKpi.kpiId)"
              :disabled="!isFormValid"
              class="submit-button"
          >
            진척도 입력
          </ButtonBasic>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, defineEmits } from "vue";
import ButtonBasic from "./ButtonBasic.vue";
import api from "@/config/axios.js";
import { useAuthStore } from "@/store/authStore.js"; // API 요청을 위한 axios 인스턴스

const props = defineProps({
  kpiData: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(["update-kpi"]); // 부모에게 이벤트를 emit

const isModalOpen = ref(false); // 모달 상태
const selectedKpi = ref(null); // 선택된 KPI 데이터
const progressValue = ref(0); // 입력된 진척도 값
const updateReason = ref(""); // 입력된 업데이트 근거

const authStore = useAuthStore();
const empId = authStore.empId;

// 모달 열기
const openUpdateModal = (kpi) => {
  console.log("모달을 엽니다. 선택된 KPI:", kpi); // 디버그 로그
  selectedKpi.value = { ...kpi };
  progressValue.value = kpi.currentValue || 0; // 현재 진척도 초기화
  updateReason.value = ""; // 업데이트 근거 초기화
  isModalOpen.value = true;
};

// 모달 닫기
const closeModal = () => {
  isModalOpen.value = false;
};

// 폼 유효성 검사
const isFormValid = computed(() => {
  return (
      progressValue.value !== "" &&
      !isNaN(progressValue.value) &&
      progressValue.value >= 0 &&
      updateReason.value.trim() !== ""
  );
});

const update = (kpiId) => {
  submitUpdate(empId, kpiId);
  closeModal();
};

// 업데이트 제출
const submitUpdate = async (empId, kpiId) => {
  try {
    const requestData = {
      progress: progressValue.value,
      reason: updateReason.value,
    };

    await api.post(`/perfomances/kpi/pass/${empId}/${kpiId}`, requestData);

    // 상위 컴포넌트에 데이터 업데이트 요청 이벤트 전달
    emit("refresh-kpi-data");

    // 모달 닫기
    closeModal();
  } catch (error) {
    console.error("진척도 업데이트에 실패했습니다.", error);
    alert("진척도 업데이트 중 오류가 발생했습니다. 다시 시도해주세요.");
  }
};




// Helper 함수: 프로그레스 바의 너비 계산
const getProgressWidth = (currentValue, goalValue) => {
  if (!goalValue || goalValue === 0) return "0%"; // goalValue가 0인 경우 0%
  const percentage = (currentValue / goalValue) * 100;
  return `${percentage.toFixed(1)}%`; // 제한 없이 계산된 비율 반환
};

// Helper 함수: 프로그레스 퍼센트 텍스트 계산
const getProgressPercentage = (currentValue, goalValue) => {
  if (!goalValue || goalValue === 0) return "0%"; // goalValue가 0인 경우 0%
  const percentage = (currentValue / goalValue) * 100;
  return `${percentage.toFixed(1)}%`; // 제한 없이 계산된 비율 반환
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
  grid-template-columns: 200px 400px 150px;
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
  width: 0%; /* 초기값 */
}

.progress-value {
  width: 80px;
  font-size: 14px;
  color: #666;
  text-align: center;
}

.update-button {
  width: 150px;
  padding: 8px 12px;
  background-color: #ffa500;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.update-button:hover {
  background-color: #ff8700;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  padding: 20px;
  max-width: 600px;
  max-height: 700px;
  width: 100%;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.modal-title {
  font-size: 18px;
  font-weight: bold;
  text-align: center;
}

.modal-row {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-bottom: 10px;
}

.progress-input {
  display: flex;
  align-items: center;
  gap: 5px;
}

.progress-unit {
  font-size: 14px;
  font-weight: bold;
  color: #666;
}

textarea,
input {
  padding: 10px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 5px;
  width: 100%;
}

.modal-footer {
  display: flex;
  justify-content: space-between; /* 왼쪽에 취소 버튼, 오른쪽에 입력 버튼 */
  gap: 10px;
}

.cancel-button {
  background-color: #ccc;
  color: white;
  padding: 10px;
  border-radius: 5px;
  cursor: pointer;
}

.submit-button {
  background-color: #ffa500;
  color: white;
  padding: 10px;
  border-radius: 5px;
  cursor: pointer;
}

.submit-button:disabled {
  background-color: #ccc !important; /* 회색 비활성화 색상 */
  cursor: not-allowed;
  opacity: 0.6; /* 약간의 투명도 추가 */
  background-image: none !important; /* 그라데이션 제거 */
}
</style>
