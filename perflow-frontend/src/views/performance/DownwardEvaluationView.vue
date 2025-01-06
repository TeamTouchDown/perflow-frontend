<template>
  <div class="review-container">
    <div class="review-header">
      <h2 class="title">하향 평가</h2>
      <span class="deadline">평가 제출 기한이 {{ remainingDays }}일 남았습니다.</span>
    </div>

    <div class="review-list">
      <div
          v-for="(peer, index) in PeerList"
          :key="peer.empId"
          class="review-item"
      >
        <div class="review-content">
          <div class="user-info">
            <div class="user-details">
              <p class="username">{{ peer.name }}</p>
              <p class="service-type">{{ peer.job }}</p>
            </div>
          </div>

          <div class="action-buttons">
            <span class="status-message">
              <span v-if="evaluationsExist[peer.empId]">이미 평가 작성을 완료한 평가자입니다.</span>
              <span v-else>아직 평가를 작성하지 않았어요!</span>
            </span>
            <ButtonBasic
                class="write-button"
                @click="openCreateModal(peer.empId)"
                :disabled="evaluationsExist[peer.empId]"
                :class="{ 'disabled-btn': isSaveDisabled }"
            >
              작성하기
            </ButtonBasic>
            <ButtonBasic
                class="edit-button"
                @click="openEditModal(peer.empId)"
                :disabled="!evaluationsExist[peer.empId]"
                :class="{ 'disabled-btn': isSaveDisabled }"
            >
              수정하기
            </ButtonBasic>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 모달 -->
  <div v-if="isCreateModalOpen" class="modal-overlay">
    <div class="modal-content">
      <h2 class="modal-title">하향 평가 작성</h2>

      <div class="survey-container">
        <div class="question-box">
          <p class="question-text">
            <span class="question-number">{{ currentQuestionNumber }}. </span>
            {{ currentQuestion.questionContent }}
          </p>

          <!-- 다중 선택 질문 -->
          <div v-if="currentQuestion.type === 'MULTIPLE'" class="options-list">
            <label v-for="option in 5" :key="option" class="option-item">
              <input
                  type="radio"
                  :name="'answer_' + currentQuestion.id"
                  :value="option"
                  v-model="currentAnswer"
                  @input="saveCurrentAnswer"
              />
              <span class="option-text">
                {{ option }}.
                {{ option === 1
                  ? "매우 그렇다"
                  : option === 2
                      ? "그렇다"
                      : option === 3
                          ? "보통이다"
                          : option === 4
                              ? "그렇지 않다"
                              : "매우 그렇지 않다" }}
              </span>
            </label>
          </div>

          <!-- 주관식 질문 -->
          <div v-else-if="currentQuestion.type === 'SUBJECTIVE'" class="subjective-input">
            <textarea
                v-model="currentAnswer"
                placeholder="답변을 입력하세요."
                rows="4"
                @input="saveCurrentAnswer"
            ></textarea>
          </div>
        </div>

        <!-- 페이징 -->
        <div class="pagination">
          <button
              class="page-btn prev"
              @click="prevQuestion"
              :disabled="currentQuestionIndex === 0"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                  d="M15 18l-6-6 6-6"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
              />
            </svg>
          </button>
          <span class="page-info">
            {{ currentQuestionNumber }}/{{ totalQuestions }}
          </span>
          <button
              class="page-btn next"
              @click="nextQuestion"
              :disabled="currentQuestionIndex === totalQuestions - 1"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                  d="M9 18l6-6-6-6"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      <div class="button-group">
        <span v-if="isSaveDisabled" class="save-warning">모든 문항에 답변하여야 저장할 수 있습니다.</span>
        <button class="cancel-btn" @click="closeCreateModal">취소</button>
        <button
            class="save-btn"
            @click="saveAnswers"
            :disabled="isSaveDisabled"
            :class="{ 'disabled-btn': isSaveDisabled }"
        >
          저장
        </button>
      </div>
    </div>
  </div>
</template>



<script setup>
import { onMounted, ref, computed } from "vue";
import api from "@/config/axios.js";
import ButtonBasic from "@/components/common/ButtonBasic.vue";

// 사용자 정보 및 동료 목록
const MyInfo = ref(null);
const PeerList = ref([]);

// 다중/주관식 질문 리스트
const multiQuestionList = ref([]);
const subQuestionList = ref([]);
const savetype = ref();
// 모든 질문을 담는 배열
const allQuestions = ref([]);

// 현재 보고 있는 문제의 인덱스
const currentQuestionIndex = ref(0);

// 사용자가 입력한 답변을 저장할 배열
// 예: [{ questionId: 1, answer: "1" }, { questionId: 2, answer: "어쩌구" }, ...]
const userAnswers = ref([]);

// 현재 문제의 답변 (객관식/주관식)
const currentAnswer = ref("");

// 남은 일수
const remainingDays = ref(0);

// 모달 관련 상태
const isCreateModalOpen = ref(false);
const currentPeerId = ref(null); // 현재 평가 대상자(empId)

// 평가가 이미 작성되었는지 여부를 저장하는 객체
const evaluationsExist = ref({});

// 현재 문제 번호(1부터 시작)
const currentQuestionNumber = computed(() => currentQuestionIndex.value + 1);

// 전체 문제 수
const totalQuestions = computed(() => allQuestions.value.length);

// 현재 문제
const currentQuestion = computed(() => {
  return allQuestions.value[currentQuestionIndex.value] || {};
});

// 모든 문항에 답변이 완료되었는지 확인하는 계산된 속성
const isSaveDisabled = computed(() => {
  // 답변의 갯수와 문제의 갯수를 비교하고, 모든 답변이 유효한지 확인
  if (
      userAnswers.value.length !== allQuestions.value.length ||
      userAnswers.value.some(ans => ans.answer === null || typeof ans.answer !== 'string' || ans.answer.trim() === "")
  ) {
    // console.log("답변 갯수와 문제 갯수가 일치하지 않거나, 유효하지 않은 답변이 존재함");
    return true; // 저장 비활성화
  }
  // console.log("모든 답변이 유효하고, 갯수가 일치함");
  return false; // 저장 가능
});

// 문제 이동 전에 현재 문제의 답안을 저장
function saveCurrentAnswer() {
  const qid = currentQuestionNumber.value;
  if (!qid) return; // 현재 문제가 없으면 중단

  // userAnswers 배열에서 기존 답변 탐색
  const existing = userAnswers.value.find((ans) => ans.questionId === qid);

  if (!existing) {
    // 기존 답변이 없으면 새로 추가
    userAnswers.value.push({
      questionId: qid,
      answer: currentAnswer.value ? String(currentAnswer.value).trim() : "",
    });
  } else {
    // 기존 답변이 있으면 수정
    existing.answer = currentAnswer.value ? String(currentAnswer.value).trim() : "";
  }
  // console.log("Updated userAnswers:", userAnswers.value); // 디버깅용 로그
}

// 문제 이동 후 해당 문제의 답을 불러옴
function loadCurrentAnswer() {
  const qid =  currentQuestionNumber.value;
  if (!qid) {
    currentAnswer.value = "";
    return;
  }

  const existing = userAnswers.value.find((ans) => ans.questionId === qid);
  currentAnswer.value = existing ? existing.answer : "";
}

// 다음 문제로 이동
function nextQuestion() {
  saveCurrentAnswer(); // 이동 전 현재 답변 저장
  if (currentQuestionIndex.value < allQuestions.value.length - 1) {
    currentQuestionIndex.value++;
    loadCurrentAnswer(); // 이동 후 저장된 답변 로드
  }
}

// 이전 문제로 이동
function prevQuestion() {
  saveCurrentAnswer(); // 이동 전 현재 답변 저장
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--;
    loadCurrentAnswer(); // 이동 후 저장된 답변 로드
  }
}

// 평가 존재 여부 체크
async function checkAnswerExist(peerId) {
  try {
    const resp = await api.get(
        `/perfomances/col/perfo/${MyInfo.value.empId}/${peerId}`
    );
    // 서버 응답에 따라 존재 여부 반환
    // 예: { exists: true } 또는 { exists: false }
    if (Array.isArray(resp.data) && resp.data.length > 0) {
      return true;
    }
    return false;
  } catch (error) {
    // console.error(`평가 존재 여부 확인 중 오류: ${error}`);
    return false;
  }
}


// 모달 열기
async function openCreateModal(peerId) {
  savetype.value = "post"
  userAnswers.value = [];
  currentPeerId.value = peerId;
  isCreateModalOpen.value = true;
  currentQuestionIndex.value = 0; // 첫 번째 문제부터 시작

  // 평가 존재 여부 확인
  const exists = await checkAnswerExist(peerId);
  evaluationsExist.value[peerId] = exists;

  if (exists) {
    // 이미 평가가 존재하면 기존 답변을 불러오기
    loadCurrentAnswer(); // 수정 모드로 전환할 수 있도록 추가 로직 필요
  } else {
    // 새로운 평가 시작
    loadCurrentAnswer();
  }
}

async function loadAnswer(peerId) {
  try {
    const resp = await api.get(
        `leader/perfomances/downward/perfo/${MyInfo.value.empId}/${peerId}`
    );
    if (resp.data && Array.isArray(resp.data)) {
      userAnswers.value = resp.data;
    }
  } catch (error) {
    // console.error(`평가 존재 여부 확인 중 오류: ${error}`);
  }
}

// 평가 수정 모달 열기 (수정하기 버튼 클릭 시)
async function openEditModal(peerId) {
  savetype.value = "put"
  await loadAnswer(peerId);
  // console.log(userAnswers.value);
  currentPeerId.value = peerId;
  isCreateModalOpen.value = true;
  currentQuestionIndex.value = 0; // 첫 번째 문제부터 시작

  // 평가 존재 여부 확인
  const exists = await checkAnswerExist(peerId);
  evaluationsExist.value[peerId] = exists;

  if (exists) {
    // 이미 평가가 존재하면 기존 답변을 불러오기
    loadCurrentAnswer();
  } else {
    // 작성하지 않은 상태에서는 수정 불가능
    alert("작성된 평가가 없습니다.");
    closeCreateModal();
  }
}

async function closeCreateModal() {
  isCreateModalOpen.value = false;
  const peerId = currentPeerId.value;
  currentPeerId.value = null;
  currentAnswer.value = "";
  currentQuestionIndex.value = 0;

  if (peerId) {
    // 모달을 닫을 때 평가 작성 여부 재확인
    const exists = await checkAnswerExist(peerId);
    evaluationsExist.value[peerId] = exists;
  }
}


// 답변 최종 저장
async function saveAnswers() {
  // 마지막으로 보고 있는 문제의 답변도 저장
  saveCurrentAnswer();

  try {
    // 서버에 전송할 requestBody 형식
    const payload = {
      perfoedEmpId: currentPeerId.value,
      answers: userAnswers.value.map((item) => ({
        questionId: item.questionId,
        answer: String(item.answer),
      })),
    };
    // 서버 API 호출
    // console.log(payload);
    if (savetype.value === "post"){
      await api.post(`leader/perfomances/downward/perfo/${MyInfo.value.empId}`, payload);

    } else {
      await api.put(`leader/perfomances/downward/perfo/${MyInfo.value.empId}`, payload);

    }

    alert("평가가 성공적으로 저장되었습니다!");
    evaluationsExist.value[currentPeerId.value] = true;
    closeCreateModal();
  } catch (error) {
    // console.error("답변 저장 중 오류:", error);
    alert("평가 저장에 실패했습니다. 다시 시도해주세요.");
  }
}

// 데이터 불러오기 & 초기화 로직
async function fetchMyEmployeeData() {
  try {
    const myinfoResponse = await api.get(`/employees`);
    MyInfo.value = myinfoResponse.data;
  } catch (error) {
    // console.error("MyInfo 데이터 로드 오류:", error);
  }
}

async function fetchPeerData() {
  if (!MyInfo.value || !MyInfo.value.deptId) return;
  try {
    const requestData = { departmentId: MyInfo.value.deptId };
    const myPeerResponse = await api.get(`/employees/depts`, { params: requestData });
    const filteredPeers = (myPeerResponse.data || []).filter(
        (peer) => peer.empId !== MyInfo.value.empId && !peer.job.includes("팀장")
    );
    PeerList.value = filteredPeers;

    // 평가 존재 여부 확인
    await Promise.all(
        filteredPeers.map(async (peer) => {
          const exists = await checkAnswerExist(peer.empId);
          evaluationsExist.value[peer.empId] = exists;
        })
    );
    // console.log(evaluationsExist.value);

  } catch (error) {
    // console.error("Peer 데이터 로드 오류:", error);
  }
}


async function fetchQuestionData() {
  if (!MyInfo.value.deptId) return;
  try {
    const body1 = { deptId: MyInfo.value.deptId, questionType: "MULTIPLE", perfoType: "DOWN" };
    const resp1 = await api.get(`/perfomances/col/perfo/question/${MyInfo.value.empId}`, {
      params: body1,
    });
    const multiData = resp1.data.map((q) => ({ ...q, type: "MULTIPLE" }));

    const body2 = { deptId: MyInfo.value.deptId, questionType: "SUBJECTIVE", perfoType: "DOWN" };
    const resp2 = await api.get(`/perfomances/col/perfo/question/${MyInfo.value.empId}`, {
      params: body2,
    });
    const subjData = resp2.data.map((q) => ({ ...q, type: "SUBJECTIVE" }));

    allQuestions.value = [...multiData, ...subjData];
  } catch (error) {
    // console.error("질문 데이터 로드 오류:", error);
  }
}

// 남은 일수 계산
function calculateRemainingDays() {
  const today = new Date();
  const endOfYear = new Date(today.getFullYear(), 11, 31);
  remainingDays.value = Math.ceil((endOfYear - today) / (1000 * 60 * 60 * 24));
}

// 마운트 시점에 데이터 불러오기
onMounted(async () => {
  calculateRemainingDays();
  await fetchMyEmployeeData();
  await fetchPeerData();
  await fetchQuestionData();
});
</script>







<style scoped>
.review-container {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding: 32px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.title {
  font-size: 20px;
  font-weight: bold;
}

.deadline {
  font-size: 14px;
  color: #666;
}

.review-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.review-item {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.2s ease;
}

.review-item:hover {
  border-color: #d1d5db;
}

.review-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 48px;
  height: 48px;
  background-color: #f3f4f6;
  border-radius: 50%;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.username {
  font-weight: 500;
}

.service-type {
  font-size: 14px;
  color: #666;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-message {
  font-size: 14px;
  color: #666;
}

.write-button {
  padding: 8px 16px;
  background-color: #f97316;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.write-button:hover {
  background-color: #ea580c;
}

.write-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
  opacity: 0.7;
}

.edit-button {
  padding: 8px 16px;
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.edit-button:hover {
  background-color: #f9fafb;
}

.edit-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
  opacity: 0.7;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  padding: 24px;
  width: 90%;
  max-width: 600px;
}

.modal-title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 24px;
}

.survey-container {
  /* 필요에 따라 스타일 추가 */
}

.question-box {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 24px;
}

.question-text {
  font-size: 16px;
  margin-bottom: 24px;
  line-height: 1.5;
}

.question-number {
  font-weight: 500;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.option-item input[type="radio"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.option-text {
  font-size: 15px;
}

.subjective-input textarea {
  width: 100%;
  padding: 8px;
  font-size: 14px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  resize: vertical;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 24px;
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

.button-group {
  display: flex;
  align-items: center; /* 버튼과 메시지가 수평으로 정렬되도록 */
  justify-content: flex-end;
  gap: 12px;
}

.cancel-btn, .save-btn {
  padding: 8px 24px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
}

.cancel-btn {
  background-color: #f3f4f6;
  border: none;
}

.save-btn {
  background-color: #f97316;
  color: white;
  border: none;
  transition: background-color 0.2s ease, opacity 0.2s ease;
}

.save-btn:hover {
  background-color: #ea580c;
}

.save-btn.disabled-btn {
  background-color: #ccc;
  cursor: not-allowed;
  opacity: 0.7;
}

.save-warning {
  font-size: 12px;
  color: #999;
  margin-right: auto; /* 메시지를 오른쪽으로 정렬 */
}
</style>



