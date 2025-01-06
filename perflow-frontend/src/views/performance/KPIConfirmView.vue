<template>
  <div class="kpi-container">
    <!-- 헤더 -->
    <div class="header">
      <h2 class="title">KPI 승인</h2>
    </div>

    <!-- 필터: 부서 선택 및 탭 메뉴 -->
    <div class="filters">
      <!-- 드롭다운 컨테이너 -->
      <div class="dropdowns">
        <!-- 부서 선택 드롭다운 -->
        <div class="filter-item">
          <label for="department-select" class="filter-label">부서 선택:</label>
          <select
              id="department-select"
              class="select-box"
              v-model="selectedDepartment"
              @change="onDepartmentChange"
          >
            <option
                v-for="department in dept"
                :key="department.departmentId"
                :value="department.departmentId"
            >
              {{ department.name }}
            </option>
          </select>
        </div>

        <!-- 직원 선택 드롭다운 -->
        <div class="filter-item">
          <label for="employee-select" class="filter-label">직원 선택:</label>
          <select
              id="employee-select"
              class="select-box"
              v-model="selectedEmployee"
              @change="onEmployeeChange"
              :disabled="!employeesInDepartment.length"
          >
            <option
                v-for="emp in employeesInDepartment"
                :key="emp.empId"
                :value="emp.empId"
            >
              {{ emp.name }}
            </option>
          </select>
        </div>
      </div>

      <!-- 탭 메뉴 -->
      <div class="tab-menu">
        <button
            v-for="tab in tabs"
            :key="tab.id"
            :class="['tab-button', { active: currentTab === tab.id }]"
            @click="currentTab = tab.id"
        >
          {{ tab.name }}
        </button>
      </div>
    </div>

    <!-- KPI 리스트 -->
    <div class="kpi-list">
      <!-- 개인 KPI 섹션 -->
      <div v-if="currentTab === 'personal'">
        <h3 class="kpi-section-title">개인 KPI</h3>
        <div
            v-for="(item, index) in personalKPIs"
            :key="item.kpiId || index"
            class="kpi-item"
        >
          <div class="user-section">
            <div class="user-info">
              <div class="name">{{ item.goal }}</div> <!-- 목표 표시 -->
              <div class="position">{{ item.position }}</div> <!-- 직책 표시 -->
            </div>
          </div>
          <div class="approval-status">
            {{ getStatusText(item.kpiCurrentStatus) }}
          </div>
          <div class="system-status">
            {{ getPeriodText(item.period) }}
          </div>
          <div class="button-group">
            <ButtonBasic
                class="approve-button"
                @click="openDetailModal(item)"
                :disabled="item.kpiCurrentStatus !== 'WAIT'"
            >
              세부 내용 확인
            </ButtonBasic>
          </div>
        </div>
      </div>

      <!-- 팀 KPI 섹션 -->
      <div v-if="currentTab === 'team'">
        <h3 class="kpi-section-title">팀 KPI</h3>
        <div
            v-for="(item, index) in teamKPIs"
            :key="item.kpiId || index"
            class="kpi-item"
        >
          <div class="user-section">
            <div class="user-info">
              <div class="name">{{ item.goal }}</div> <!-- 목표 표시 -->
              <div class="position">{{ item.position }}</div> <!-- 직책 표시 -->
            </div>
          </div>
          <div class="approval-status">
            {{ getStatusText(item.kpiCurrentStatus) }}
          </div>
          <div class="system-status">
            {{ getPeriodText(item.period) }}
          </div>
          <div class="button-group">
            <ButtonBasic
                class="approve-button"
                @click="openDetailModal(item)"
                :disabled="item.kpiCurrentStatus !== 'WAIT'"
            >
              세부 내용 확인
            </ButtonBasic>
          </div>
        </div>
      </div>

      <!-- 로딩 및 에러 상태 표시 -->
      <div v-if="loading" class="loading">
        KPI를 불러오는 중...
      </div>
      <div v-else-if="error" class="error">
        {{ error }}
      </div>
      <div v-else-if="currentTab === 'personal' && personalKPIs.length === 0" class="no-questions">
        해당 조건에 맞는 개인 KPI가 없습니다.
      </div>
      <div v-else-if="currentTab === 'team' && teamKPIs.length === 0" class="no-questions">
        해당 조건에 맞는 팀 KPI가 없습니다.
      </div>
    </div>

    <!-- 세부 내용 모달 -->
    <div class="modal-overlay" v-if="isDetailModalOpen">
      <div class="modal-content">
        <h2 class="modal-title">KPI 세부 내용</h2>

        <div class="form-section">
          <div class="form-group">
            <label class="form-label">목표</label>
            <input
                type="text"
                class="form-input"
                :value="selectedKpi.goal"
                readonly
            />
          </div>

          <div class="form-group metrics-group">
            <div class="metrics-input-group">
              <label class="form-label">목표치</label>
              <div class="input-with-unit">
                <input
                    type="text"
                    class="form-input"
                    :value="selectedKpi.goalValue"
                    readonly
                />
              </div>
            </div>
            <div class="metrics-unit">
              <label class="form-label">목표치 단위</label>
              <input
                  type="text"
                  class="form-input unit-input"
                  :value="selectedKpi.goalValueUnit"
                  readonly
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">목표 세부설명</label>
            <textarea
                class="form-textarea"
                readonly
            >{{ selectedKpi.goalDetail }}</textarea>
          </div>

        </div>

        <div class="button-group">
          <!-- 승인 버튼 클릭 시 => openPassModal('APPROVAL') -->
          <ButtonBasic class="btn-cancel" @click="closeDetailModal">
            취소
          </ButtonBasic>
          <ButtonBasic class="btn-approve" @click="openPassModal('APPROVAL')">
            승인
          </ButtonBasic>
          <!-- 반려 버튼 클릭 시 => openPassModal('REJECT') -->
          <ButtonBasic class="btn-reject" @click="openPassModal('REJECT')">
            반려
          </ButtonBasic>
        </div>
      </div>
    </div>

    <!-- 승인/반려 사유 모달 (단일 모달) -->
    <div class="modal-overlay" v-if="isPassModalOpen">
      <div class="modal-content">
        <h2 class="modal-title">
          <!-- 상태에 따라 모달 타이틀 표시 -->
          {{ passStatus === 'APPROVAL' ? '승인 사유 작성' : '반려 사유 작성' }}
        </h2>

        <div class="form-section">
          <div class="form-group">
            <!-- 사유 입력 -->
            <label class="form-label">
              {{ passStatus === 'APPROVAL' ? '승인 사유' : '반려 사유' }}
            </label>
            <textarea
                v-model="passReason"
                class="reason-textarea"
                :placeholder="passStatus === 'APPROVAL' ? '승인 사유를 입력해주세요.' : '반려 사유를 입력해주세요.'"
            ></textarea>
          </div>
        </div>

        <div class="button-group">
          <ButtonBasic class="btn-cancel" @click="closePassModal">취소</ButtonBasic>
          <ButtonBasic class="btn-submit" @click="submitPass">확인</ButtonBasic>
        </div>
      </div>
    </div>

    <!-- 알림(Alert) 컴포넌트 -->
    <Alert
        v-model="alertVisible"
        :message="alertMsg"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import ButtonBasic from "@/components/common/ButtonBasic.vue";
import api from "@/config/axios.js";
import Alert from "@/components/common/Alert.vue";
import { useAuthStore } from "@/store/authStore.js"; // Auth Store import

// 사용자 정보 (로그인한 empId)
const authStore = useAuthStore();
const empId = authStore.empId;

// 탭 목록 및 현재 탭
const currentTab = ref('personal');
const tabs = [
  { id: 'personal', name: '개인' },
  { id: 'team', name: '팀' }
];

// KPI 목록
const personalKPIs = ref([]);
const teamKPIs = ref([]);

// 부서 목록 & 선택된 부서
const dept = ref([]);
const selectedDepartment = ref(null); // 부서 ID

// 직원 목록 & 선택된 직원
const employeesInDepartment = ref([]);  // 부서별 직원 목록
const selectedEmployee = ref(null);     // 선택된 직원 ID

// 로딩/에러 상태
const loading = ref(false);
const error = ref(null);

// 모달 관련
const isDetailModalOpen = ref(false);
const selectedKpi = ref(null);

// 승인/반려 사유 모달 (단일 모달)
const isPassModalOpen = ref(false);   // 모달 열림 여부
const passReason = ref('');           // 입력된 사유
const passStatus = ref('');           // APPROVAL / REJECT

// Alert 관련
const alertVisible = ref(false);
const alertMsg = ref('');
const showAlert = (msg) => {
  alertMsg.value = msg;
  alertVisible.value = true;
};

// 날짜(연도, 분기, 월)
const currentYear = new Date().getFullYear();
const nextYear = currentYear + 1;
const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);
const currentMonth = new Date().getMonth() + 1;

/** 1) 부서 목록 불러오기 */
async function loadDepartments() {
  try {
    const resp = await api.get("/departments"); // 백엔드 엔드포인트 확인
    const data = resp.data;
    const departmentList = [];

    // 재귀로 하위 부서 처리 (필요 시)
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
    dept.value = departmentList;

    // 부서가 하나 이상이면 첫 번째 부서를 선택
    if (departmentList.length > 0) {
      selectedDepartment.value = departmentList[0].departmentId;
    }
  } catch (err) {
    // console.error(`부서 로드 오류: ${err}`);
    showAlert("부서를 불러오는 중 오류가 발생했습니다.");
  }
}

/** 2) 선택된 부서의 직원 목록 불러오기 */
async function fetchEmployeesInDepartment() {
  if (!selectedDepartment.value) return;

  try {
    // 예: GET /api/v1/employees/depts?departmentId=xxx
    const response = await api.get(`/employees/depts`, {
      params: { departmentId: selectedDepartment.value }
    });
    employeesInDepartment.value = response.data || [];

    // 부서가 바뀔 때마다, 직원 선택 초기화
    if (employeesInDepartment.value.length > 0) {
      selectedEmployee.value = employeesInDepartment.value[0].empId; // 첫 직원 자동 선택 ★ 변경 가능
    } else {
      selectedEmployee.value = null;
      personalKPIs.value = [];
      teamKPIs.value = [];
    }
  } catch (err) {
    // console.error("사원 데이터를 가져오는 중 오류 발생:", err);
    showAlert("사원 데이터를 불러오는 중 오류가 발생했습니다.");
  }
}

/** 3) 선택된 직원의 KPI 데이터 불러오기 */
async function fetchKpiData() {
  if (!selectedDepartment.value || !selectedEmployee.value) {
    // 부서 & 직원이 모두 선택되어야 조회
    personalKPIs.value = [];
    teamKPIs.value = [];
    return;
  }

  loading.value = true;
  error.value = null;

  const requestData1 = {
    quarter: null,
    month: null,
  };
  const requestData2 = {
    quarter: currentQuarter,
    month: null,
  };
  const requestData3 = {
    quarter: null,
    month: currentMonth,
  };

  try {
    // 모든 API 호출을 병렬로 실행
    const [
      personalResponse1,
      personalResponse2,
      personalResponse3,
      teamResponse1,
      teamResponse2,
      teamResponse3
    ] = await Promise.all([
      api.get(`/perfomances/kpi/personal/period/new/${selectedEmployee.value}/${nextYear}`, {params: requestData1}),
      api.get(`/perfomances/kpi/personal/period/new/${selectedEmployee.value}/${currentYear}`, {params: requestData2}),
      api.get(`/perfomances/kpi/personal/period/new/${selectedEmployee.value}/${currentYear}`, {params: requestData3}),

      api.get(`/perfomances/kpi/team/period/new/${selectedEmployee.value}/${nextYear}`, {params: requestData1}),
      api.get(`/perfomances/kpi/team/period/new/${selectedEmployee.value}/${currentYear}`, {params: requestData2}),
      api.get(`/perfomances/kpi/team/period/new/${selectedEmployee.value}/${currentYear}`, {params: requestData3}),
    ]);

    // 데이터 합치기
    personalKPIs.value = [
      ...(personalResponse1.data.kpiLists || []),
      ...(personalResponse2.data.kpiLists || []),
      ...(personalResponse3.data.kpiLists || [])
    ];
    teamKPIs.value = [
      ...(teamResponse1.data.kpiLists || []),
      ...(teamResponse2.data.kpiLists || []),
      ...(teamResponse3.data.kpiLists || [])
    ];

  } catch (err) {
    // console.error("KPI 데이터를 가져오는 중 오류 발생:", err);
    error.value = "KPI 목록을 불러오는 데 실패했습니다.";
    showAlert("KPI 목록을 불러오는 중 오류가 발생했습니다.");
  } finally {
    loading.value = false;
  }
}

/** 4) 페이지 마운트 시 부서 목록 불러오기 */
onMounted(async () => {
  await loadDepartments();
  await fetchEmployeesInDepartment(); // 선택된 부서의 직원 목록 불러오기
  await fetchKpiData(); // 선택된 직원의 KPI 불러오기
});

/** 5) Watchers 설정 */
// 부서 변경 시 직원 목록 업데이트 및 KPI 초기화
watch(selectedDepartment, async () => {
  await fetchEmployeesInDepartment();
  await fetchKpiData();
});

// 직원 변경 시 KPI 업데이트
watch(selectedEmployee, async () => {
  await fetchKpiData();
});

// 탭 변경 시 KPI 업데이트 (이미 직원이 선택된 상태라면)
watch(currentTab, async () => {
  if (selectedEmployee.value) {
    await fetchKpiData();
  }
});

/** 6) 이벤트 핸들러 */
function onDepartmentChange() {
  // 선택된 부서가 변경되면 watch가 자동으로 fetchEmployeesInDepartment()와 fetchKpiData()를 호출
}

function onEmployeeChange() {
  // 선택된 직원이 변경되면 watch가 자동으로 fetchKpiData()를 호출
}

/** 7) 모달 열기/닫기, 승인/반려 */
function openDetailModal(kpi) {
  selectedKpi.value = kpi;
  isDetailModalOpen.value = true;
}

function closeDetailModal() {
  isDetailModalOpen.value = false;
}

/** 7-1) 승인/반려 사유 모달 열기 */
function openPassModal(status) {
  passStatus.value = status;   // 'APPROVAL' 또는 'REJECT'
  passReason.value = '';       // 사유 초기화
  isPassModalOpen.value = true;
}

function closePassModal() {
  isPassModalOpen.value = false;
  passReason.value = '';
  passStatus.value = '';
}

/** 7-2) 승인/반려 사유 제출 -> POST 호출 */
async function submitPass() {
  if (!selectedKpi.value) return;

  if (!passReason.value.trim()) {
    showAlert(passStatus.value === 'APPROVAL' ? "승인 사유를 입력해주세요." : "반려 사유를 입력해주세요.");
    return;
  }

  try {
    // 백엔드 엔드포인트: POST /hr/perfomances/kpi/pass/{empId}/{kpiId}
    // Body: { reason, status } (CreateKpiPassDTO)
    await api.post(
        `/hr/perfomances/kpi/pass/${selectedEmployee.value}/${selectedKpi.value.kpiId}`,
        {
          reason: passReason.value,
          status: passStatus.value
        }
    );

    showAlert(passStatus.value === 'APPROVAL' ? "KPI가 승인되었습니다." : "KPI가 반려되었습니다.");
    await fetchKpiData(); // 승인/반려 후 KPI 데이터 갱신
  } catch (err) {
    // console.error(`KPI ${passStatus.value} 오류:`, err);
    showAlert(`KPI ${passStatus.value === 'APPROVAL' ? '승인' : '반려'}에 실패했습니다.`);
  } finally {
    closePassModal();
    closeDetailModal();
  }
}

/**
 * KPI 상태를 한글로 변환하는 함수
 * @param {String} status - KPI 상태 (WAIT, REJECT, APPROVAL)
 * @returns {String} - 한글 상태 문자열
 */
function getStatusText(status) {
  switch (status) {
    case 'WAIT':
      return '승인 대기중';
    case 'REJECT':
      return '반려';
    case 'APPROVAL':
      return '승인 완료';
    default:
      return status;
  }
}

/**
 * KPI 기간을 한글로 변환하는 함수
 * @param {String} period - KPI 기간 (Year, QUARTER, MONTH)
 * @returns {String} - 한글 기간 문자열
 */
function getPeriodText(period) {
  if (!period) return '';
  if (period.includes('Year')) {
    return '연간 KPI';
  } else if (period.includes('QUARTER')) {
    return '분기 KPI';
  } else if (period.includes('MONTH')) {
    return '월별 KPI';
  } else {
    return period;
  }
}
</script>

<style scoped>
.kpi-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.title {
  font-size: 24px;
  font-weight: bold;
}

.filters {
  display: flex;
  justify-content: space-between;
  align-items: flex-start; /* 상단 정렬 */
  margin-bottom: 20px;
}

.dropdowns {
  display: flex;
  gap: 20px; /* 드롭다운 간격 */
  flex-wrap: wrap; /* 반응형 */
}

.filter-item {
  display: flex;
  flex-direction: column;
}

.filter-label {
  margin-bottom: 4px;
  font-size: 14px;
  color: #333;
}

.select-box {
  width: 200px;
  padding: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
}

.tab-menu {
  display: flex;
  gap: 16px;
  margin-top: 10px; /* 드롭다운 아래에 위치 */
}

.tab-button {
  padding: 8px 16px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 16px;
  color: #666;
  position: relative;
}

.tab-button.active {
  color: #000;
  font-weight: bold;
  border-bottom: 2px solid #000;
}

.kpi-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.kpi-section-title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 10px;
}

.kpi-item {
  display: flex;
  align-items: center;
  padding: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background-color: white;
}

.user-section {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.user-info .name {
  font-weight: 500;
  margin-bottom: 4px;
}

.user-info .position {
  font-size: 14px;
  color: #666;
}

.approval-status {
  flex: 1;
}

.system-status {
  flex: 1;
}

.button-group {
  display: flex;
  gap: 8px;
}

.approve-button {
  padding: 8px 16px;
  background-color: #4CAF50; /* 초록색 배경 */
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.approve-button:hover {
  background-color: #45a049;
}

/* 버튼이 비활성화 되었을 때 스타일 (기존 디자인을 변경하지 않으려면 필요 없음) */
/*
.approve-button:disabled {
  background-color: #a5d6a7;
  cursor: not-allowed;
}
*/

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000; /* 모달이 다른 요소들 위에 표시되도록 함 */
}

.modal-content {
  background: white;
  border-radius: 8px;
  padding: 24px;
  width: 90%;
  max-width: 500px;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 24px;
}

/* 폼 영역 */
.form-section {
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  height: 36px;
  padding: 0 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #f8f9fa;
  color: #495057;
  font-size: 14px;
}

.form-input:read-only {
  cursor: default;
}

.form-textarea {
  width: 100%;
  height: 120px;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #f8f9fa;
  color: #495057;
  font-size: 14px;
  line-height: 1.5;
  resize: none;
}

.form-textarea:read-only {
  cursor: default;
}

.metrics-group {
  display: flex;
  gap: 16px;
}

.metrics-input-group {
  flex: 1;
}

.metrics-unit {
  width: 100px;
}

.unit-input {
  width: 100%;
  text-align: center;
}

.reason-textarea {
  width: 100%;
  height: 120px;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: none;
  font-size: 14px;
  line-height: 1.5;
  color: #333;
  background-color: #f8f9fa;
}

/* 모달 버튼 */
.button-group {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.btn-cancel {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #f5f5f5;
  color: #333;
  font-size: 14px;
  cursor: pointer;
}

.btn-cancel:hover {
  background: #ebebeb;
}

.btn-submit {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background: #FF6B2C;
  color: white;
  font-size: 14px;
  cursor: pointer;
}

.btn-submit:hover {
  background: #e85f20;
}

.btn-approve {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
}


.btn-reject {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
}

/* 로딩 및 에러 메시지 스타일 */
.loading,
.error,
.no-questions {
  text-align: center;
  font-size: 16px;
  color: #666;
}
</style>
