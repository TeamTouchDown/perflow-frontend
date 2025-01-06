<template>
  <div class="kpi-container">
    <!-- KPI 항목 리스트 -->
    <div v-for="(kpi, index) in rows" :key="kpi.kpiId || index" class="kpi-item">
      <!-- 목표, 목표치, 상태 표시 -->
      <div class="kpi-info">
        <div class="kpi-goal">{{ kpi.goal }}</div>
        <div class="kpi-value">{{ kpi.goalValue }}{{ kpi.goalValueUnit }}</div>
        <div class="kpi-status">{{ getStatusText(kpi.kpiCurrentStatus) }}</div>
      </div>
      <!-- 버튼들 -->
      <div class="kpi-buttons">
        <!-- 반려 사유 보기 -->
        <ButtonBasic
            class="btn edit-btn"
            color="gray"
            size="medium"
            :disabled="kpi.kpiCurrentStatus === 'WAIT' || kpi.kpiCurrentStatus === 'APPROVAL'"
            @click="openRejectModal(kpi.kpiId)"
        >
          반려사유보기
        </ButtonBasic>

        <!-- 수정하기 -->
        <ButtonBasic
            class="btn delete-btn"
            :disabled="kpi.kpiCurrentStatus === 'APPROVAL'"
            @click="openUpdateModal(kpi)"
        >
          수정하기
        </ButtonBasic>

        <!-- 삭제하기 -->
        <ButtonBasic
            class="btn view-btn"
            :disabled="kpi.kpiCurrentStatus === 'APPROVAL'"
            @click="openDeleteModal(kpi.kpiId)"
        >
          삭제하기
        </ButtonBasic>
      </div>
    </div>

    <!-- KPI 추가 버튼 -->
    <div class="add-kpi-container">
      <ButtonBasic class="add-kpi-btn" @click="openAddModal">작성하기</ButtonBasic>
    </div>

    <!-- 반려 사유 모달 -->
    <div v-if="isRejectModalOpen" class="modal-overlay">
      <div class="modal-reject">
        <h3>반려사유</h3>
        <p>{{ rejectReason }}</p>
        <ButtonBasic class="btn close-btn" @click="closeRejectModal">닫기</ButtonBasic>
      </div>
    </div>

    <!-- KPI 수정 모달 -->
    <div v-if="isUpdateModalOpen" class="modal-overlay">
      <div class="modal-container">
        <h2 class="modal-title">KPI 수정하기</h2>

        <div class="form-group">
          <label for="period">기간</label>
          <div class="period-dropdown">
            <ButtonDropDown
                id="period"
                :width="'360px'"
                :height="'40px'"
                :fontSize="'16px'"
                :imgSize="'20px'"
                :marginLeft="'7px'"
                :options="periodOptions"
                v-model="KPIForm.period"
            />
          </div>
        </div>

        <!-- 목표, 목표치, 목표치 단위, 목표 설명 -->
        <div class="form-group">
          <label for="goal">목표</label>
          <input id="goal" type="text" v-model="KPIForm.goal" />
        </div>

        <div class="form-group">
          <label for="goalValue">목표치</label>
          <input id="goalValue" type="number" v-model="KPIForm.goalValue" />
        </div>

        <div class="form-group">
          <label for="goalUnit">목표치 단위</label>
          <input id="goalUnit" v-model="KPIForm.goalValueUnit" />
        </div>

        <div class="form-group">
          <label for="goalDescription">목표 세부설명</label>
          <textarea id="goalDescription" v-model="KPIForm.goalDetail"></textarea>
        </div>

        <div class="modal-actions">
          <ButtonBasic class="btn cancel-btn" @click="closeUpdateModal">취소</ButtonBasic>
          <ButtonBasic
              class="btn save-btn"
              :disabled="!KPIForm.goal || !KPIForm.goalValue || !KPIForm.goalValueUnit || !KPIForm.goalDetail || !KPIForm.period"
              @click="updateKPI"
          >
            저장
          </ButtonBasic>
        </div>
      </div>
    </div>

    <!-- 삭제 확인 모달 -->
    <div v-if="isDeleteModalOpen" class="modal-overlay">
      <div class="modal-container">
        <h2 class="modal-title">정말 삭제하시겠습니까?</h2>
        <div class="modal-actions">
          <ButtonBasic class="btn cancel-btn" @click="closeDeleteModal">취소</ButtonBasic>
          <ButtonBasic class="btn delete-btn" @click="confirmDelete">삭제하기</ButtonBasic>
        </div>
      </div>
    </div>

    <!-- KPI 추가 모달 -->
    <div v-if="isAddModalOpen" class="modal-overlay">
      <div class="modal-container">
        <h2 class="modal-title">KPI 작성하기</h2>

        <div class="form-group">
          <label for="period">기간</label>
          <div class="period-dropdown">
            <ButtonDropDown
                id="period"
                :width="'360px'"
                :height="'40px'"
                :fontSize="'16px'"
                :imgSize="'20px'"
                :marginLeft="'7px'"
                :options="periodOptions"
                v-model="KPIForm.period"
            />
          </div>
        </div>

        <div class="form-group">
          <label for="goal">목표</label>
          <input id="goal" type="text" v-model="KPIForm.goal" />
        </div>

        <div class="form-group">
          <label for="goalValue">목표치</label>
          <input id="goalValue" type="number" v-model="KPIForm.goalValue" />
        </div>

        <div class="form-group">
          <label for="goalUnit">목표치 단위</label>
          <input id="goalUnit" v-model="KPIForm.goalValueUnit" />
        </div>

        <div class="form-group">
          <label for="goalDescription">목표 세부설명</label>
          <textarea id="goalDescription" v-model="KPIForm.goalDetail"></textarea>
        </div>

        <div class="modal-actions">
          <ButtonBasic class="btn cancel-btn" @click="closeAddModal">취소</ButtonBasic>
          <ButtonBasic
              class="btn save-btn"
              :disabled="!KPIForm.goal || !KPIForm.goalValue || !KPIForm.goalValueUnit || !KPIForm.goalDetail || !KPIForm.period"
              @click="addKPI"
          >
            저장
          </ButtonBasic>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref, defineProps, defineEmits} from "vue";
import ButtonBasic from "@/components/common/ButtonBasic.vue";
import {useAuthStore} from "@/store/authStore.js";
import ButtonDropDown from "@/components/common/ButtonDropDown.vue";

// Props
const props = defineProps({
  rows: {
    type: Array,
    required: true,
  },
  selected: {
    type: Object,
    required: true,
  },
  empId: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["rejectKpi", "updateKpi", "deleteKpi", "addKpi"]);

// 반응형 데이터
const authStore = useAuthStore();
const isRejectModalOpen = ref(false);
const isUpdateModalOpen = ref(false);
const isDeleteModalOpen = ref(false);
const isAddModalOpen = ref(false);
const rejectReason = ref("");

// KPIForm
const KPIForm = ref({
  kpiId: "",
  goal: "",
  goalValue: "",
  goalValueUnit: "",
  goalDetail: "",
  period: ""
});

// 삭제 처리
const kpiIdToDelete = ref(null);

// 드롭다운 옵션
const periodOptions = [
  {label: `${props.selected.year}년`, value: `${props.selected.year}_YEAR`},
  {
    label: `${props.selected.year}년 ${props.selected.quarter}분기`,
    value: `${props.selected.year}_QUARTER${props.selected.quarter}`
  },
  {
    label: `${props.selected.year}년 ${props.selected.month}월`,
    value: `${props.selected.year}_MONTH${props.selected.month}`
  }
];

// 반려 사유 모달
async function openRejectModal(kpiId) {
  try {
    const response = await fetchRejectReason(kpiId);
    rejectReason.value = response.reason || "반려 사유를 불러올 수 없습니다.";
    emit("rejectKpi", kpiId);
  } catch (error) {
    console.error("반려 사유 불러오기 실패:", error);
  }
  isRejectModalOpen.value = true;
}

function closeRejectModal() {
  isRejectModalOpen.value = false;
  rejectReason.value = "";
}

// 수정 모달
function openUpdateModal(kpi) {
  KPIForm.value = {...kpi};  // 현재 KPI 데이터를 폼에 할당
  isUpdateModalOpen.value = true;
}

function closeUpdateModal() {
  isUpdateModalOpen.value = false;
}

function updateKPI() {
  console.log("updateKPI():", KPIForm.value);
  emit("updateKpi", {...KPIForm.value});
  closeUpdateModal();
}

// 삭제 모달
function openDeleteModal(kpiId) {
  kpiIdToDelete.value = kpiId;
  isDeleteModalOpen.value = true;
}

function closeDeleteModal() {
  isDeleteModalOpen.value = false;
  kpiIdToDelete.value = null;
}

function confirmDelete() {
  console.log("confirmDelete => kpiIdToDelete:", kpiIdToDelete.value);
  emit("deleteKpi", kpiIdToDelete.value);
  closeDeleteModal();
}

// 추가 모달
function openAddModal() {
  resetKPIForm();
  isAddModalOpen.value = true;
}

function closeAddModal() {
  isAddModalOpen.value = false;
}

function addKPI() {
  console.log("addKPI():", KPIForm.value);
  emit("addKpi", {...KPIForm.value});
  closeAddModal();
}

// KPIForm 초기화
function resetKPIForm() {
  KPIForm.value = {
    kpiId: "",
    goal: "",
    goalValue: "",
    goalValueUnit: "",
    goalDetail: "",
    period: ""
  };
}

// 반려 사유 조회
async function fetchRejectReason(kpiId) {
  // 필요 시 API 호출
  // 예) const response = await api.get(`/perfomances/kpi/reject/${empId}/${kpiId}`);
  // return response.data;
  return {reason: "반려 사유 예시"};
}

// 상태 변환 함수
function getStatusText(status) {
  switch (status) {
    case "WAIT":
      return "대기";
    case "APPROVAL":
      return "승인";
    case "REJECT":
      return "반려";
    default:
      return "알 수 없음";
  }
}
</script>

<style scoped>
.kpi-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 10px;
}

.kpi-item {
  width: 900px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px 20px;
  background-color: #f9f9f9;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.kpi-info {
  display: flex;
  flex-direction: row;
  gap: 50px;
  justify-content: space-between;
}

.kpi-goal,
.kpi-value,
.kpi-status {
  flex: 0 0 150px;
  text-align: left;
}

.kpi-goal {
  font-weight: bold;
  font-size: 16px;
  color: #333;
}

.kpi-value,
.kpi-status {
  font-size: 14px;
  color: #666;
}

.kpi-buttons {
  display: flex;
  gap: 10px;
}

.add-kpi-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.add-kpi-btn {
  background: linear-gradient(to right, #ff9900, #ffcc33);
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
}

.add-kpi-btn:hover {
  opacity: 0.8;
}

.btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  background: linear-gradient(to right, #ff9900, #ffcc33);
  color: white;
}

.btn:disabled {
  background-color: #ccc !important;
  cursor: not-allowed;
  opacity: 0.6;
  background-image: none !important;
}

.btn:hover {
  opacity: 0.8;
}

/* 모달 스타일 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-reject,
.modal-container {
  background: white;
  padding: 20px;
  border-radius: 10px;
  width: 400px;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal-title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 15px;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  font-size: 14px;
  margin-bottom: 5px;
  font-weight: bold;
}

input,
textarea,
select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
}

textarea {
  resize: none;
  height: 80px;
}

.modal-actions {
  display: flex;
  justify-content: space-between;
}

.cancel-btn {
  background: linear-gradient(to right, #ff9900, #ffcc33);
  color: white;
}

.period-dropdown {
  border: #333 !important;
}
</style>
