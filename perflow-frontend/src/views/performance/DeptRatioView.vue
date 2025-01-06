<template>
  <div class="weight-settings">
    <h2 class="title">가중치 설정</h2>

    <div class="section">
      <div class="select-area">
        <!-- 드롭다운에 v-model 바인딩 추가 -->
        <select class="select-box" v-model="selectedDepartmentId">
          <option
              v-for="department in dept"
              :key="department.departmentId"
              :value="department.departmentId">
            {{ department.name }}
          </option>
        </select>
      </div>

      <div class="score-grid">
        <div class="score-header">개인 KPI 갯수</div>
        <div class="score-inputs">
          <label>최소</label>
          <input type="number" v-model.number="scores.personal.min" />
          <label>최대</label>
          <input type="number" v-model.number="scores.personal.max" />
        </div>

        <div class="score-header">팀 KPI 갯수</div>
        <div class="score-inputs">
          <label>최소</label>
          <input type="number" v-model.number="scores.team.min" />
          <label>최대</label>
          <input type="number" v-model.number="scores.team.max" />
        </div>
      </div>
    </div>

    <div class="weight-section">
      <h3 class="subtitle">가중치 비율 설정</h3>
      <p class="description">비율의 합은 100%로 맞춰 입력해주세요.</p>

      <div class="weight-form">
        <div class="weight-row">
          <label>개인 KPI</label>
          <div class="input-wrapper">
            <input type="number" v-model.number="weights.personal" />
            <span class="unit">%</span>
          </div>
        </div>

        <div class="weight-row">
          <label>팀 KPI</label>
          <div class="input-wrapper">
            <input type="number" v-model.number="weights.team" />
            <span class="unit">%</span>
          </div>
        </div>

        <div class="weight-row">
          <label>동료 평가</label>
          <div class="input-wrapper">
            <input type="number" v-model.number="weights.peer" />
            <span class="unit">%</span>
          </div>
        </div>

        <div class="weight-row">
          <label>하향 평가</label>
          <div class="input-wrapper">
            <input type="number" v-model.number="weights.down" />
            <span class="unit">%</span>
          </div>
        </div>

        <div class="weight-row">
          <label>근태</label>
          <div class="input-wrapper">
            <input type="number" v-model.number="weights.attendance" />
            <span class="unit">%</span>
          </div>
        </div>

        <!-- 이유(reason) 입력 필드 추가 -->
        <div class="weight-row">
          <label>이유</label>
          <div class="input-wrapper">
            <input type="text" v-model="reason" placeholder="가중치 변경 이유를 입력하세요." />
          </div>
        </div>
      </div>

      <div class="warning" v-if="!isValidTotal">
        비율의 합이 100%가 되지 않습니다.
      </div>

      <div class="button-group">
        <ButtonBasic class="cancel-btn">취소</ButtonBasic>
        <!-- @click으로 handleSave 실행 -->
        <ButtonBasic class="submit-btn" :disabled="!isValidTotal" @click="handleSave">저장</ButtonBasic>
      </div>
    </div>
    <Alert
        v-model="alertVisible"
        :message="alertMsg"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import ButtonBasic from "@/components/common/ButtonBasic.vue";
import api from "@/config/axios.js";
import Alert from "@/components/common/Alert.vue";
import { useAuthStore } from "@/store/authStore.js";

// 인증 스토어에서 empId 가져오기
const authStore = useAuthStore();
const empId = authStore.empId;

// 알림 관련
const alertVisible = ref(false);
const alertMsg = ref('');
const showAlert = (msg) => {
  alertMsg.value = msg;
  alertVisible.value = true;
};

// 부서 목록
const dept = ref([]);

// 선택된 부서 ID
const selectedDepartmentId = ref(null);

// KPI 갯수 초기화
const scores = ref({
  personal: { min: 0, max: 0 },
  team: { min: 0, max: 0 }
})

// 가중치 입력값 초기화
const weights = ref({
  personal: 20,
  team: 30,
  peer: 10,
  down: 20,
  attendance: 10
})

// 이유(reason) 초기화
const reason = ref('');

// 비율의 합이 100%인지 확인
const isValidTotal = computed(() => {
  const total = weights.value.personal
      + weights.value.team
      + weights.value.peer
      + weights.value.down
      + weights.value.attendance;
  return total === 100;
});

// 비율 관련 데이터 (추가적인 사용 시)
const ratio = ref();

// KPI limit 로드 함수
const loadLimit = async (departmentId) => {
  if (!departmentId) return;
  try {
    const resp = await api.get(`/perfomances/kpi/limit/${departmentId}`);
    const data = resp.data;

    console.log('KPI Limit Data:', data); // 데이터 구조 확인

    if (data) {
      scores.value.personal.min = data.personalminKpis || 0;
      scores.value.personal.max = data.personalmaxKpis || 0;
      scores.value.team.min = data.teamminKpis || 0;
      scores.value.team.max = data.teammaxKpis || 0;
    }
  } catch (error) {
    console.error(`KPI Limit 조회 중 오류: ${error}`);
    showAlert("KPI Limit 조회 중 오류가 발생했습니다.");
  }
}

// uploadKpiLimit 함수
const uploadKpiLimit = async (departmentId) => {
  // KPILimitDTO 형식에 맞게 requestBody 생성
  const requestBody = {
    personalminKpis: scores.value.personal.min,
    personalmaxKpis: scores.value.personal.max,
    teamminKpis: scores.value.team.min,
    teammaxKpis: scores.value.team.max
  };

  try {
    const resp = await api.post(`/perfomances/kpi/limit/${departmentId}/${empId}`, requestBody);
    console.log("KPI 제한 저장 응답:", resp.data);
    showAlert("KPI 제한이 저장되었습니다!");
  } catch (error) {
    console.error(`KPI 제한 저장 오류: ${error}`);
    const errorMessage = error.response?.data?.message || "KPI 제한 저장에 실패했습니다.";
    showAlert(errorMessage);
    throw error; // 상위 catch로 전달
  }
}

// uploadRatio 함수
const uploadRatio = async (departmentId) => {
  // KPIRatioDTO 형식에 맞게 requestBody 생성
  const requestBody = {
    personalKpiWeight: weights.value.personal,
    teamKpiWeight: weights.value.team,
    colWeight: weights.value.peer,
    downWeight: weights.value.down,
    attendanceWeight: weights.value.attendance,
    reason: reason.value
  };

  try {
    const resp = await api.post(`/hr/perfomances/ratio/perfo/${empId}/${departmentId}`, requestBody);
    console.log("가중치 비율 저장 응답:", resp.data);
    showAlert("가중치 비율이 저장되었습니다!");
  } catch (error) {
    console.error(`가중치 비율 저장 오류: ${error}`);
    const errorMessage = error.response?.data?.message || "가중치 비율 저장에 실패했습니다.";
    showAlert(errorMessage);
    throw error; // 상위 catch로 전달
  }
}

// 세부 사항 로드 함수 (가중치 데이터를 받아와 weights에 반영)
const loadRatio = async (departmentId) => {
  if (!departmentId) return;
  try {
    const resp = await api.get(`/hr/perfomances/ratio/perfo/${departmentId}`);
    const data = resp.data;
    console.log('Ratio Data:', data);
    ratio.value = data;
    console.log('Ratio:', ratio.value);

    // API 응답 데이터를 가중치에 반영
    weights.value.personal = data.personalKpiWeight || 0;
    weights.value.team = data.teamKpiWeight || 0;
    weights.value.peer = data.colWeight || 0;
    weights.value.down = data.downWeight || 0;
    weights.value.attendance = data.attendanceWeight || 0;
  } catch (error) {
    console.error(`비율 데이터 조회 중 오류: ${error}`);
    showAlert("비율 데이터 조회 중 오류가 발생했습니다.");
  }
}

const loadGrade = async () => {
  try {
    const resp = await api.get(`/hr/perfomances/ratio/grade/${empId}`);
    const data = resp.data;

    console.log('불러온 등급 비율 데이터:', data);

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

// 부서 목록 로드 함수
const loadDept = async () => {
  try {
    const resp = await api.get('/departments');
    const data = resp.data;
    const departmentList = [];

    // 재귀 함수 정의
    const extractDepartments = (departments) => {
      departments.forEach((d) => {
        departmentList.push({
          departmentId: d.departmentId,
          name: d.name,
        });

        if (d.subDepartments && d.subDepartments.length > 0) {
          extractDepartments(d.subDepartments);
        }
      });
    };

    extractDepartments(data);

    // 평탄화된 리스트를 dept.value에 할당
    dept.value = departmentList;
    console.log('Departments:', dept.value);

    // 기본 선택 부서 설정 (첫 번째 부서로 설정)
    if (dept.value.length > 0) {
      selectedDepartmentId.value = dept.value[0].departmentId;
      await loadLimit(selectedDepartmentId.value);
      await loadRatio(selectedDepartmentId.value);
    }
  } catch (error) {
    console.error(`부서 로드 오류: ${error}`);
    showAlert("부서 로드 중 오류가 발생했습니다.");
  }
}

// 드롭다운 선택이 변경될 때마다 loadLimit와 loadRatio 호출
watch(selectedDepartmentId, async (newVal, oldVal) => {
  if (newVal !== oldVal) {
    await loadLimit(newVal);
    await loadRatio(newVal);
  }
});

// 페이지 로드 시 필요한 데이터 불러오기
onMounted(async () => {
  await loadDept()
})

// 버튼 클릭 시 실행할 함수
const handleSave = async () => {
  if (!isValidTotal.value) {
    showAlert("비율의 합이 100%가 되지 않습니다.");
    return;
  }

  if (!reason.value.trim()) {
    showAlert("가중치 비율 변경 이유를 입력해주세요.");
    return;
  }

  try {
    await Promise.all([
      uploadKpiLimit(selectedDepartmentId.value),
      uploadRatio(selectedDepartmentId.value)
    ]);
    // 두 작업이 모두 성공하면 추가로 처리할 사항이 있으면 여기서 수행
  } catch (error) {
    // 이미 uploadKpiLimit 및 uploadRatio에서 에러를 처리하고 있으므로 별도 처리는 필요하지 않습니다.
  }
}
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

.section {
  margin-bottom: 32px;
}

.select-box {
  width: 200px;
  padding: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  margin-bottom: 20px;
}

.score-grid {
  display: grid;
  gap: 16px;
}

.score-header {
  font-weight: bold;
}

.score-inputs {
  display: grid;
  grid-template-columns: auto 100px auto 100px;
  gap: 12px;
  align-items: center;
}

.score-inputs input {
  padding: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  width: 100%;
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

.cancel-btn, .submit-btn {
  padding: 8px 24px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
}

.cancel-btn {
  background-color: #f3f4f6;
  border: none;
}

.submit-btn {
  background-color: #f97316;
  color: white;
  border: none;
}

.submit-btn:disabled {
  background-color: #e5e7eb;
  cursor: not-allowed;
}
</style>
