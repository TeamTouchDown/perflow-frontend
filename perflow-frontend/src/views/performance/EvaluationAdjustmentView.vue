<template>
  <div class="evaluation-container">
    <h2 class="page-title">평가 관리</h2>

    <div class="filter-section">
      <div class="select-wrapper">
        <select class="status-select" @change="handleDepartmentChange">
          <option
              v-for="department in dept"
              :key="department.departmentId"
              :value="department.departmentId"
          >
            {{ department.name }}
          </option>
        </select>
      </div>

      <div class="search-wrapper">
        <!-- 검색 로직이 필요하다면 여기에 추가 -->
      </div>
    </div>

    <div class="evaluation-list">
      <div
          v-for="(item, index) in filteredEmployees"
          :key="index"
          class="evaluation-item"
      >
        <div class="user-info">
          <div class="details">
            <div class="name">{{ item.name }}</div>
            <div class="sub-info">{{ item.position }}</div>
          </div>
          <div class="chat-number">{{ item.adjustmentDegree }}차</div>
          <div class="status">{{ item.status }}</div>
        </div>
        <div class="action-section">
          <p class="message">
            {{ item.adjustmentDegree + 1 }}차 검수가 가능합니다.
          </p>
          <ButtonBasic
              class="review-button"
              @click="openModal(item)"
          >
            조정하기
          </ButtonBasic>
        </div>
      </div>
    </div>

    <!-- 모달 -->
    <div class="modal-overlay" v-if="modalopen">
      <div class="modal-content">
        <div class="modal-title">인사 평가 조정</div>

        <!-- 조정 차수 -->
        <div class="form-row">
          <label>조정 차수</label>
          <input
              type="number"
              v-model="adjustmentNumber"
              class="input-small"
              readonly
          />
        </div>

        <!-- 동료 평가 섹션 -->
        <div class="form-section">
          <div class="form-row">
            <label>동료 평가 객관식 점수</label>
            <input type="number" v-model="peerScore" class="input-small" />
          </div>

          <div class="form-row vertical">
            <label>동료 평가 주관식 요약</label>
            <textarea
                v-model="peerSummary"
                class="textarea-large"
                placeholder="동료들로부터 좋은 평가를 받고 있습니다. 업무에 몰입하며 성과가 우수합니다."
            ></textarea>
          </div>
        </div>

        <!-- 하향 평가 섹션 -->
        <div class="form-section">
          <div class="form-row">
            <label>하향 평가 객관식 점수</label>
            <input type="number" v-model="downwardScore" class="input-small" />
          </div>

          <div class="form-row vertical">
            <label>하향 평가 주관식 요약</label>
            <textarea
                v-model="downwardSummary"
                class="textarea-large"
                placeholder="동료들로부터 좋은 평가를 받고 있습니다. 업무에 몰입하며 성과가 우수합니다."
            ></textarea>
          </div>
        </div>

        <!-- 이전/이번 조정자 섹션 -->
        <div class="form-section last">
          <div class="score-grid">
            <div class="score-row">
              <label>이전 차수 조정 동료 평가 점수</label>
              <input
                  type="number"
                  v-model="prevPeerScore"
                  class="input-small"
                  disabled
              />
            </div>
            <div class="score-row">
              <label>이번 차수 조정 동료 평가 점수</label>
              <input
                  type="number"
                  v-model="currentPeerScore"
                  class="input-small"
              />
            </div>
            <div class="score-row">
              <label>이전 차수 조정 하향 평가 점수</label>
              <input
                  type="number"
                  v-model="prevDownwardScore"
                  class="input-small"
                  disabled
              />
            </div>
            <div class="score-row">
              <label>이번 차수 조정 하향 평가 점수</label>
              <input
                  type="number"
                  v-model="currentDownwardScore"
                  class="input-small"
              />
            </div>
          </div>
        </div>

        <!-- 버튼 영역 -->
        <div class="button-group">
          <ButtonBasic class="btn-cancel" @click="handleCancel">
            취소
          </ButtonBasic>
          <ButtonBasic class="btn-submit" @click="handleAdjust">
            조정하기
          </ButtonBasic>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import ButtonBasic from "@/components/common/ButtonBasic.vue";
import api from "@/config/axios.js";

// ---------------------------
// 1) AI 요약 불러오기 함수들
// ---------------------------
/**
 * 단일 평가 유형(COL or DOWN)에 대한 AI 요약 불러오기
 */
async function loadAiSummary(empId, type) {
  try {
    const resp = await api.get(`/perfomances/ai/summary/${empId}`, {
      params: { type } // 예: ?type=COL or ?type=DOWN
    });
    // resp.data = { summary: "...", perfoType: "COL" }
    return resp.data.summary;
  } catch (error) {
    console.error(`AI 요약(${type}) 조회 오류(empId=${empId}):`, error);
    return ""; // 오류 시 빈 문자열 반환 (또는 예외 던지기)
  }
}

/**
 * 동료 평가(COL) & 하향 평가(DOWN) 요약을 모두 불러와서 peerSummary, downwardSummary에 설정
 */
async function loadAllAiSummaries(empId) {
  try {
    // 동료 평가 요약
    const colSummary = await loadAiSummary(empId, "COL");
    peerSummary.value = colSummary;

    // 하향 평가 요약
    const downSummary = await loadAiSummary(empId, "DOWN");
    downwardSummary.value = downSummary;
  } catch (error) {
    console.error("동료/하향 평가 요약 로드 중 오류:", error);
  }
}

// ---------------------------
// 2) 주요 데이터
// ---------------------------
const dept = ref([]);
const employee = ref([]);
const hrperfo = ref([]);

const modalopen = ref(false);

// 모달 폼
const adjustmentNumber = ref(1);
const peerScore = ref(0);
const downwardScore = ref(0);
const peerComment = ref("");
const downwardComment = ref("");
const peerSummary = ref("");     // AI 요약 (동료)
const downwardSummary = ref(""); // AI 요약 (하향)

// 이전/이번 조정자 점수
const prevPeerScore = ref(0);
const currentPeerScore = ref(0);
const prevDownwardScore = ref(0);
const currentDownwardScore = ref(0);

const selectedEmployeeForModal = ref(null);

// 페이지네이션용 (현재는 사용 X, 필요 시 활성화)
const peerCurrentPage = ref(1);
const downwardCurrentPage = ref(1);

// ---------------------------
// 3) 데이터 예시
// ---------------------------
const peerEvaluations = ref([
  { question: "2023", questionAnswer: "동료 평가 코멘트 1" },
  { question: "2022", questionAnswer: "동료 평가 코멘트 2" },
  { question: "2021", questionAnswer: "동료 평가 코멘트 3" },
]);

const downwardEvaluations = ref([
  { question: "2023", questionAnswer: "하향 평가 코멘트 1" },
  { question: "2022", questionAnswer: "하향 평가 코멘트 2" },
  { question: "2021", questionAnswer: "하향 평가 코멘트 3" },
]);

// ---------------------------
// 4) 페이지네이션 (필요 시)
// ---------------------------
const totalPeerQuestions = computed(() => peerEvaluations.value.length);
const currentPeerEvaluations = computed(() => {
  const itemsPerPage = 1;
  const startIndex = (peerCurrentPage.value - 1) * itemsPerPage;
  return peerEvaluations.value.slice(startIndex, startIndex + itemsPerPage);
});

function nextPeerQuestion() {
  if (peerCurrentPage.value < totalPeerQuestions.value) {
    peerCurrentPage.value++;
  }
}
function prevPeerQuestion() {
  if (peerCurrentPage.value > 1) {
    peerCurrentPage.value--;
  }
}

const totalDownwardQuestions = computed(() => downwardEvaluations.value.length);
const currentDownwardEvaluations = computed(() => {
  const itemsPerPage = 1;
  const startIndex = (downwardCurrentPage.value - 1) * itemsPerPage;
  return downwardEvaluations.value.slice(startIndex, startIndex + itemsPerPage);
});

function nextDownwardQuestion() {
  if (downwardCurrentPage.value < totalDownwardQuestions.value) {
    downwardCurrentPage.value++;
  }
}
function prevDownwardQuestion() {
  if (downwardCurrentPage.value > 1) {
    downwardCurrentPage.value--;
  }
}

// ---------------------------
// 5) 이벤트 핸들러
// ---------------------------
function handleCancel() {
  modalopen.value = false;
  resetModalData();
}

function handleAdjust() {
  alert("조정이 완료되었습니다!");
  modalopen.value = false;
  resetModalData();
}

// ---------------------------
// 6) 부서/직원 불러오기
// ---------------------------
async function loadDept() {
  try {
    const resp = await api.get("/departments");
    const data = resp.data;
    const departmentList = [];

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
  } catch (error) {
    console.error("부서 목록 로드 오류:", error);
  }
}

async function loadEmployee(departmentId) {
  try {
    const requestData = { departmentId: departmentId };
    const myPeerResponse = await api.get(`/employees/depts`, {
      params: requestData,
    });
    employee.value = myPeerResponse.data;

    // 직원별 HR 성과 가져오기
    await Promise.all(
        employee.value.map((emp) => loadadjustmentList(emp.empId))
    );

    // 병합
    employee.value = mergeEmployeeWithHrperfo();
  } catch (error) {
    console.error("직원 데이터 로드 오류:", error);
  }
}

// ---------------------------
// 7) 조정내역 불러오기
// ---------------------------
async function loadadjustmentList(empId) {
  try {
    // 중복 데이터 제거
    const existingIndex = hrperfo.value.findIndex(item => item.empId === empId);
    if (existingIndex !== -1) {
      hrperfo.value.splice(existingIndex, 1);
    }

    // 조정내역
    const response = await api.get(`/hr/perfomances/perfo/adjustment/${empId}`);
    const data = response.data;

    // col/down 점수 (객관식)
    const [colscoreResponse, downscoreResponse] = await Promise.all([
      api.get(`/perfomances/col/perfo/score/${empId}`),
      api.get(`/leader/perfomances/downward/perfo/score/${empId}`)
    ]);
    const colscore = colscoreResponse.data;   // 예: { score: 80 }
    const downscore = downscoreResponse.data; // 예: { score: 70 }

    if (!Array.isArray(data)) {
      throw new Error("data가 배열이 아님");
    }

    if (data.length === 0) {
      // 조정 기록 없음
      hrperfo.value.push({
        empId: empId,
        adjustmentDegree: 0,
        perfoEmpId: null,
        perfoedEmpId: empId,
        hrPerfoHistoryId: null,
        adjustmentColScore: null,
        adjustmentDownScore: null,
        adjustmentReason: null,
        colScore: colscore,
        downScore: downscore,
      });
    } else {
      // adjustmentDegree가 가장 큰 항목
      const maxAdjustmentItem = data.reduce((maxItem, currentItem) => {
        return currentItem.adjustmentDegree > maxItem.adjustmentDegree
            ? currentItem
            : maxItem;
      }, data[0]);

      if (maxAdjustmentItem.adjustmentDegree === 0) {
        // 조정 차수 0
        hrperfo.value.push({
          empId: empId,
          adjustmentDegree: 0,
          perfoEmpId: null,
          perfoedEmpId: empId,
          hrPerfoHistoryId: null,
          adjustmentColScore: null,
          adjustmentDownScore: null,
          adjustmentReason: null,
          colScore: colscore,
          downScore: downscore,
        });
      } else {
        hrperfo.value.push({
          empId: empId,
          adjustmentDegree: maxAdjustmentItem.adjustmentDegree,
          perfoEmpId: empId,
          perfoedEmpId: maxAdjustmentItem.perfoedEmpId,
          hrPerfoHistoryId: maxAdjustmentItem.hrPerfoHistoryId,
          adjustmentColScore: maxAdjustmentItem.adjustmentColScore,
          adjustmentDownScore: maxAdjustmentItem.adjustmentDownScore,
          adjustmentReason: maxAdjustmentItem.adjustmentReason,
          colScore: colscore.value,
          downScore: downscore.value,
        });
      }
    }

    console.log("hrperfo =>", hrperfo.value);
    return hrperfo.value;
  } catch (error) {
    console.error("조정내역 로드 오류:", error);
    throw error;
  }
}

function mergeEmployeeWithHrperfo() {
  return employee.value.map((emp) => {
    const matchingPerfo = hrperfo.value.find((p) => p.empId === emp.empId);

    return {
      ...emp,
      adjustmentDegree: matchingPerfo ? matchingPerfo.adjustmentDegree : null,
      perfoEmpId: matchingPerfo?.perfoEmpId,
      perfoedEmpId: matchingPerfo?.perfoedEmpId,
      hrPerfoHistoryId: matchingPerfo?.hrPerfoHistoryId,
      adjustmentColScore: matchingPerfo?.adjustmentColScore,
      adjustmentDownScore: matchingPerfo?.adjustmentDownScore,
      adjustmentReason: matchingPerfo?.adjustmentReason,
      colScore: matchingPerfo?.colScore,
      downScore: matchingPerfo?.downScore,
    };
  });
}

// ---------------------------
// 8) 부서 선택
// ---------------------------
function handleDepartmentChange(event) {
  const selectedDepartmentId = event.target.value;
  loadEmployee(selectedDepartmentId);
}

// ---------------------------
// 9) 목록 필터링 예시
// ---------------------------
const filteredEmployees = computed(() => {
  return employee.value.filter((item) => item.adjustmentDegree !== 3);
});

// ---------------------------
// 10) 모달 열기
// ---------------------------
function openModal(employeeItem) {
  selectedEmployeeForModal.value = employeeItem;
  adjustmentNumber.value = employeeItem.adjustmentDegree + 1;

  // 객관식 점수
  peerScore.value = employeeItem.colScore || 0;
  downwardScore.value = employeeItem.downScore || 0;

  // 기존 사유
  peerComment.value = employeeItem.adjustmentReason || "";
  downwardComment.value = employeeItem.adjustmentReason || "";

  // AI 요약
  peerSummary.value = "";
  downwardSummary.value = "";

  // 이전/이번 조정 점수
  prevPeerScore.value = employeeItem.adjustmentColScore || 0;
  currentPeerScore.value = employeeItem.adjustmentColScore || 0;
  prevDownwardScore.value = employeeItem.adjustmentDownScore || 0;
  currentDownwardScore.value = employeeItem.adjustmentDownScore || 0;

  // 여기서 AI 요약 불러오기
  // loadAllAiSummaries(employeeItem.empId)
  // (원한다면 사용: 동료평가(COL), 하향평가(DOWN) 요약)

  modalopen.value = true;
}

// ---------------------------
// 11) 모달 초기화
// ---------------------------
function resetModalData() {
  selectedEmployeeForModal.value = null;
  adjustmentNumber.value = 1;
  peerScore.value = 0;
  downwardScore.value = 0;
  peerComment.value = "";
  downwardComment.value = "";
  peerSummary.value = "";
  downwardSummary.value = "";

  prevPeerScore.value = 0;
  currentPeerScore.value = 0;
  prevDownwardScore.value = 0;
  currentDownwardScore.value = 0;

  peerCurrentPage.value = 1;
  downwardCurrentPage.value = 1;
}

// ---------------------------
// 12) 페이지 마운트 시
// ---------------------------
onMounted(async () => {
  await loadDept();
});
</script>

<style scoped>
.evaluation-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 20px;
}

.filter-section {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.select-wrapper {
  width: 200px;
}

.status-select {
  width: 100%;
  padding: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background-color: white;
}

.search-wrapper {
  display: flex;
  align-items: center;
  width: 300px;
}

/* 검색 영역 */
.search-input {
  flex: 1;
  padding: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  margin-right: -1px;
}
.search-button {
  padding: 8px;
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 0 4px 4px 0;
  cursor: pointer;
}

.evaluation-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.evaluation-item {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  background-color: white;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}

.details {
  flex: 1;
}

.name {
  font-weight: 500;
  margin-bottom: 4px;
}

.sub-info {
  font-size: 14px;
  color: #666;
}

.chat-number {
  color: #666;
}

.status {
  color: #666;
  margin-right: 16px;
}

.action-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.message {
  color: #666;
  font-size: 14px;
}

.review-button {
  padding: 8px 16px;
  background-color: #f97316;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}
.review-button:hover {
  background-color: #ea580c;
}
.review-button.disabled {
  background-color: #e5e7eb;
  cursor: not-allowed;
}

/* 모달 */
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
}
.modal-content {
  background: white;
  border-radius: 8px;
  padding: 24px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}
.modal-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
}

/* 폼 영역 */
.form-section {
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid #eee;
}
.form-section.last {
  border-bottom: none;
}
.form-row {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  gap: 12px;
}
.form-row.vertical {
  flex-direction: column;
  align-items: flex-start;
}
label {
  font-size: 14px;
  color: #333;
  min-width: 140px;
}
.input-guide {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}
.input-small {
  width: 60px;
  height: 32px;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 0 8px;
  text-align: center;
}
.textarea-large {
  width: 100%;
  height: 100px;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 12px;
  resize: none;
  font-size: 14px;
}

/* 페이지네이션 */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin: 12px 0;
}
.page-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background: none;
  cursor: pointer;
}
.page-btn:hover {
  background-color: #f3f4f6;
}
.page-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
.page-info {
  font-size: 14px;
  color: #666;
}

/* 점수/조정 영역 */
.score-grid {
  display: grid;
  gap: 12px;
}

/* 모달 버튼 */
.button-group {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 24px;
}
.btn-cancel {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #f5f5f5;
  color: #333;
  cursor: pointer;
}
.btn-submit {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background-color: #f97316;
  color: white;
  cursor: pointer;
}
input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}
.evaluation-card {
  margin: 12px 0;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
}
.year-label {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 8px;
}
.comment-section .comment {
  font-size: 14px;
  color: #666;
}
</style>
