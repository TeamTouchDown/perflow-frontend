<template>
  <div class="weight-settings">
    <h2 class="title">회사 등급 비율 조정</h2>

    <div class="weight-section">
      <h3 class="subtitle">회사 등급 비율 설정</h3>
      <p class="description">비율의 합은 100%로 맞춰 입력해주세요.</p>

      <div class="weight-form">
        <!-- S등급 -->
        <div class="weight-row">
          <label>S등급</label>
          <div class="input-wrapper">
            <input type="number" v-model="grades.S" />
            <span class="unit">%</span>
          </div>
        </div>

        <!-- A등급 -->
        <div class="weight-row">
          <label>A등급</label>
          <div class="input-wrapper">
            <input type="number" v-model="grades.A" />
            <span class="unit">%</span>
          </div>
        </div>

        <!-- B등급 -->
        <div class="weight-row">
          <label>B등급</label>
          <div class="input-wrapper">
            <input type="number" v-model="grades.B" />
            <span class="unit">%</span>
          </div>
        </div>

        <!-- C등급 -->
        <div class="weight-row">
          <label>C등급</label>
          <div class="input-wrapper">
            <input type="number" v-model="grades.C" />
            <span class="unit">%</span>
          </div>
        </div>

        <!-- D등급 -->
        <div class="weight-row">
          <label>D등급</label>
          <div class="input-wrapper">
            <input type="number" v-model="grades.D" />
            <span class="unit">%</span>
          </div>
        </div>

        <!-- 변경 이유 입력 -->
        <div class="weight-row">
          <label>변경 이유</label>
          <div class="input-wrapper">
            <input type="text" v-model="reason" placeholder="변경 사유를 입력해 주세요." />
          </div>
        </div>
      </div>

      <!-- 100%가 아닐 경우 경고 문구 표시 -->
      <div class="warning" v-if="!isValidTotal">
        비율의 합이 100%가 되지 않습니다.
      </div>

      <div class="button-group">
        <!-- 취소 버튼 제거 -->
        <ButtonBasic
            class="submit-btn"
            :disabled="!isValidTotal"
            @click="handleSave"
        >
          저장
        </ButtonBasic>
      </div>
    </div>
  </div>

  <!-- 알림(Alert) 컴포넌트 -->
  <Alert
      v-model="alertVisible"
      :message="alertMsg"
  />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import ButtonBasic from "@/components/common/ButtonBasic.vue";
import { useAuthStore } from "@/store/authStore.js";
import api from "@/config/axios.js";
import Alert from "@/components/common/Alert.vue";

// 사용자 정보에서 empId 가져오기
const authStore = useAuthStore();
const empId = authStore.empId;

// 각 등급별 비율(초기값)
const grades = ref({
  S: 20,
  A: 30,
  B: 10,
  C: 20,
  D: 10
});

// 변경 이유
const reason = ref('');

// 알림 관련 상태
const alertVisible = ref(false);
const alertMsg = ref('');
const showAlert = (msg) => {
  alertMsg.value = msg;
  alertVisible.value = true;
};

// 비율의 합이 100인지 체크
const isValidTotal = computed(() => {
  const total =
      grades.value.S +
      grades.value.A +
      grades.value.B +
      grades.value.C +
      grades.value.D;
  return total === 100;
});

// 기존에 저장된 등급 비율 불러오기
const loadGrade = async () => {
  try {
    const resp = await api.get(`/hr/perfomances/ratio/grade/${empId}`);
    const data = resp.data;

    // console.log('불러온 등급 비율 데이터:', data);

    if (data) {
      // 백엔드에서 받아온 값들을 각 등급 입력값에 할당
      grades.value.S = data.sratio || 0;
      grades.value.A = data.aratio || 0;
      grades.value.B = data.bratio || 0;
      grades.value.C = data.cratio || 0;
      grades.value.D = data.dratio || 0;
    }
  } catch (error) {
    console.error(`등급 비율 조회 중 오류: ${error}`);
    showAlert("등급 비율 조회 중 오류가 발생했습니다.");
  }
};

// 등급 비율 업로드(저장) 함수
const uploadGradeRatio = async () => {
  const requestBody = {
    sRatio: grades.value.S,
    aRatio: grades.value.A,
    bRatio: grades.value.B,
    cRatio: grades.value.C,
    dRatio: grades.value.D,
    reason: reason.value
  };

  try {
    // 백엔드 엔드포인트에 POST 요청
    const resp = await api.post(`/hr/perfomances/ratio/grade/${empId}`, requestBody);
    // console.log("등급 비율 저장 응답:", resp.data);
    showAlert("등급 비율이 저장되었습니다!");
  } catch (error) {
    console.error(`등급 비율 저장 오류: ${error}`);
    const errorMessage = error.response?.data?.message || "등급 비율 저장에 실패했습니다.";
    showAlert(errorMessage);
    throw error;
  }
};

// 저장 버튼 클릭 시 실행될 함수
const handleSave = () => {
  uploadGradeRatio();
};

// 컴포넌트가 마운트될 때(페이지 로딩 시) 등급 비율 불러오기
onMounted(async () => {
  await loadGrade();
});
</script>

<style scoped>
.weight-settings {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 24px;
}

.weight-section {
  margin-bottom: 32px;
}

.subtitle {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 8px;
}

.description {
  color: #666;
  font-size: 14px;
  margin-bottom: 20px;
}

.weight-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.weight-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.weight-row label {
  font-weight: 500;
  width: 100px;
}

.input-wrapper {
  position: relative;
  width: 300px;
}

.input-wrapper input {
  width: 100%;
  padding: 8px;
  padding-right: 30px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
}

.unit {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
}

.warning {
  color: #ef4444;
  font-size: 14px;
  margin-top: 16px;
}

.button-group {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.submit-btn {
  padding: 8px 24px;
  background-color: #f97316;
  color: white;
  border-radius: 4px;
  border: none;
  font-size: 14px;
  cursor: pointer;
}

.submit-btn:disabled {
  background-color: #e5e7eb;
  cursor: not-allowed;
}
</style>
