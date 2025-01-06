<template>
  <div class="question-management">
    <h2 class="main-title">평가 문항 관리</h2>

    <div class="filters">
      <div class="filter-item">
        <!-- 드롭다운에 부서를 동적으로 로드 (전체 옵션 제거) -->
        <select class="select-box" v-model="selectedDepartment">
          <option
              v-for="department in dept"
              :key="department.departmentId"
              :value="department.departmentId"
          >
            {{ department.name }}
          </option>
        </select>
      </div>

      <div class="filter-tags">
        <div class="tag-group">
          <span class="tag-label">평가 특성</span>
          <button
              class="tag"
              :class="{ active: evaluationType === 'COL' }"
              @click="setEvaluationType('COL')"
          >
            동료
          </button>
          <button
              class="tag"
              :class="{ active: evaluationType === 'DOWN' }"
              @click="setEvaluationType('DOWN')"
          >
            하향
          </button>
        </div>

        <div class="tag-group">
          <span class="tag-label">문항 특성</span>
          <button
              class="tag"
              :class="{ active: questionType === 'MULTIPLE' }"
              @click="setQuestionType('MULTIPLE')"
          >
            객관식
          </button>
          <button
              class="tag"
              :class="{ active: questionType === 'SUBJECTIVE' }"
              @click="setQuestionType('SUBJECTIVE')"
          >
            주관식
          </button>
        </div>

      </div>
    </div>

    <div class="question-list">
      <div
          v-for="question in evaQuestions"
          :key="question.questionId"
          class="question-item"
      >
        <div class="question-header">
          <span class="question-text">{{ question.questionContent }}</span>
        </div>
        <div class="button-group">
          <ButtonBasic class="modify-btn" @click="modifyQuestion(question)">
            수정하기
          </ButtonBasic>
          <ButtonBasic class="delete-btn" @click="deleteQuestion(question)">
            삭제하기
          </ButtonBasic>
        </div>
      </div>

      <!-- 로딩 및 에러 상태 표시 -->
      <div v-if="loading" class="loading">
        문항을 불러오는 중...
      </div>
      <div v-else-if="error" class="error">
        {{ error }}
      </div>
      <div v-else-if="evaQuestions.length === 0" class="no-questions">
        해당 조건에 맞는 문항이 없습니다.
      </div>
    </div>

    <div class="bottom-actions">
      <ButtonBasic class="add-btn" @click="openAddModal">
        추가하기
      </ButtonBasic>
    </div>

    <!-- 모달 -->
    <div class="modal-overlay" v-if="isModalOpen">
      <div class="modal-content">
        <h2 class="modal-title">{{ isEditing ? '평가 문항 수정' : '평가 문항 추가' }}</h2>

        <!-- 평가 특성과 부서 필드를 추가 모드에서만 표시 -->
        <div class="form-section" v-if="!isEditing">
          <label class="section-label">평가 특성</label>
          <select v-model="modalEvaluationType" class="select-box">
            <option value="COL">동료</option>
            <option value="DOWN">하향</option>
          </select>
        </div>

        <div class="form-section">
          <label class="section-label">문항 특성</label>
          <select v-model="modalQuestionType" class="select-box">
            <option value="MULTIPLE">객관식</option>
            <option value="SUBJECTIVE">주관식</option>
          </select>
        </div>

        <div class="form-section" v-if="!isEditing">
          <label class="section-label">부서</label>
          <select v-model="modalDepartmentId" class="select-box">
            <option
                v-for="department in dept"
                :key="department.departmentId"
                :value="department.departmentId"
            >
              {{ department.name }}
            </option>
          </select>
        </div>

        <div class="form-section">
          <label class="section-label">문항</label>
          <textarea
              v-model="modalQuestionText"
              class="question-textarea"
              placeholder="평가 문항을 입력하세요."
          ></textarea>
        </div>

        <div class="button-group">
          <button class="btn-cancel" @click="closeModal">취소</button>
          <button class="btn-submit" @click="onSubmit">
            {{ isEditing ? '저장하기' : '추가하기' }}
          </button>
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
import { useAuthStore } from "@/store/authStore.js";

// 사용자 정보에서 empId 가져오기
const authStore = useAuthStore();
const empId = authStore.empId;

// 부서 목록을 저장할 반응형 변수
const dept = ref([]);

// 선택된 부서를 저장할 변수 (기본값: 첫 번째 부서 또는 null)
const selectedDepartment = ref(null);

// 평가 특성 및 문항 특성을 저장할 변수
const evaluationType = ref('COL'); // 'COL' 또는 'DOWN'
const questionType = ref('MULTIPLE'); // 'MULTIPLE' 또는 'SUBJECTIVE'

// 평가 문항 데이터를 저장할 반응형 변수
const evaQuestions = ref([]);

// 로딩 및 에러 상태 관리
const loading = ref(false);
const error = ref(null);

// 모달 상태 관리
const isModalOpen = ref(false);
const isEditing = ref(false);
const currentQuestion = ref(null);

// 모달 내 폼 데이터
const modalEvaluationType = ref('COL'); // 'COL' 또는 'DOWN' (추가 모드에서만 사용)
const modalQuestionType = ref('MULTIPLE'); // 'MULTIPLE' 또는 'SUBJECTIVE'
const modalQuestionText = ref('');
const modalDepartmentId = ref(null); // 'deptId' (추가 모드에서만 사용)

// 알림(Alert) 컴포넌트용 상태
const alertVisible = ref(false);
const alertMsg = ref('');
const showAlert = (msg) => {
  alertMsg.value = msg;
  alertVisible.value = true;
};

// 부서를 불러오는 함수
async function loadDept() {
  try {
    const resp = await api.get("/departments");
    const data = resp.data;
    const departmentList = [];

    // 재귀 함수로 모든 하위 부서 포함
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

    // 부서가 하나 이상일 경우 첫 번째 부서를 선택
    if (departmentList.length > 0) {
      selectedDepartment.value = departmentList[0].departmentId;
    }

    // 모달 부서 선택 초기화
    modalDepartmentId.value = departmentList.length > 0 ? departmentList[0].departmentId : null;
  } catch (error) {
    console.error(`부서 로드 오류: ${error}`);
    showAlert("부서를 불러오는 중 오류가 발생했습니다.");
  }
}

// 동료 평가 문항 리스트 불러오기 함수
const loadEvaQuestions = async () => {
  loading.value = true;
  error.value = null;

  // 필요한 쿼리 매개변수 설정
  const deptId = selectedDepartment.value;
  const perfoType = evaluationType.value; // 'COL' 또는 'DOWN'
  const qType = questionType.value; // 'MULTIPLE' 또는 'SUBJECTIVE'

  try {
    const resp = await api.get(`/perfomances/col/perfo/question/${empId}`, {
      params: {
        deptId: deptId,
        questionType: qType,
        perfoType: perfoType,
      },
    });
    evaQuestions.value = resp.data;
    console.log('동료 평가 문항 리스트:', evaQuestions.value);
  } catch (err) {
    console.error('동료 평가 문항 리스트 조회 중 오류:', err);
    error.value = "동료 평가 문항을 불러오는 데 실패했습니다.";
  } finally {
    loading.value = false;
  }
};

// 컴포넌트가 마운트될 때 부서 목록과 동료 평가 문항 불러오기
onMounted(async () => {
  await loadDept();
  await loadEvaQuestions();
});

// 필터가 변경될 때마다 동료 평가 문항을 다시 불러오기
watch([selectedDepartment, evaluationType, questionType], () => {
  loadEvaQuestions();
});

// 평가 특성 설정 함수
function setEvaluationType(type) {
  evaluationType.value = type;
}

// 문항 특성 설정 함수
function setQuestionType(type) {
  questionType.value = type;
}

// 질문 수정 함수
function modifyQuestion(question) {
  isEditing.value = true;
  currentQuestion.value = question;
  // 평가 특성과 부서는 수정할 수 없으므로 설정하지 않음
  modalQuestionType.value = question.questionType;
  modalQuestionText.value = question.questionContent;
  isModalOpen.value = true;
}

// 질문 삭제 함수
async function deleteQuestion(question) {
  if (confirm(`정말로 질문 "${question.questionContent}"을(를) 삭제하시겠습니까?`)) {
    try {
      // DELETE /hr/perfomances/col/perfo/question/{empId}/{perfoQuestionId}
      await api.delete(`/hr/perfomances/col/perfo/question/${empId}/${question.questionId}`);

      // 삭제 성공 시 리스트 최신화
      await loadEvaQuestions();
      showAlert(`질문 "${question.questionContent}"이(가) 삭제되었습니다.`);
    } catch (error) {
      console.error(`질문 삭제 오류: ${error}`);
      showAlert("질문 삭제에 실패했습니다.");
    }
  }
}

// 질문 추가 함수 (추가하기 버튼 클릭 시)
function openAddModal() {
  isEditing.value = false;
  currentQuestion.value = null;
  modalEvaluationType.value = 'COL';
  modalQuestionType.value = 'MULTIPLE';
  modalQuestionText.value = '';
  modalDepartmentId.value = selectedDepartment.value; // 현재 선택된 부서로 설정
  isModalOpen.value = true;
}

// 모달 닫기 함수
function closeModal() {
  isModalOpen.value = false;
}

// 모달 제출 함수
async function onSubmit() {
  const text = modalQuestionText.value.trim();
  if (!text) {
    alert("문항을 입력해주세요.");
    return;
  }

  if (!isEditing.value) {
    // 추가 모드에서만 부서와 평가 특성을 선택해야 함
    if (modalDepartmentId.value === null) {
      alert("부서를 선택해주세요.");
      return;
    }

    if (modalEvaluationType.value === null) {
      alert("평가 특성을 선택해주세요.");
      return;
    }
  }

  if (isEditing.value) {
    // 수정 로직 (UpdateQuestionRequestDTO)
    const payload = {
      questionContext: text, // 'questionContext'로 필드 이름 변경
      questionType: modalQuestionType.value,
    };

    try {
      // PUT /hr/perfomances/col/perfo/question/{empId}/{perfoQuestionId}
      await api.put(`/hr/perfomances/col/perfo/question/${empId}/${currentQuestion.value.questionId}`, payload);

      // 수정 성공 시 리스트 최신화
      await loadEvaQuestions();
      showAlert("문항이 수정되었습니다.");
    } catch (error) {
      console.error(`문항 수정 오류: ${error}`);
      showAlert("문항 수정에 실패했습니다.");
    }
  } else {
    // 추가 로직 (CreateQuestionRequestDTO)
    const payload = {
      deptId: modalDepartmentId.value,
      questionType: modalQuestionType.value,
      questionContent: text, // 'questionContent'로 필드 이름 변경
      perfoType: modalEvaluationType.value,
    };

    try {
      // POST /hr/perfomances/col/perfo/question/{empId}
      const resp = await api.post(`/hr/perfomances/col/perfo/question/${empId}`, payload);

      // 추가 성공 시 리스트 최신화
      await loadEvaQuestions();
      showAlert("문항이 추가되었습니다.");
    } catch (error) {
      console.error(`문항 추가 오류: ${error}`);
      showAlert("문항 추가에 실패했습니다.");
    }
  }

  // 모달 닫기
  isModalOpen.value = false;
}
</script>

<style scoped>
.question-management {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.main-title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 24px;
}

.filters {
  margin-bottom: 24px;
}

.filter-item {
  margin-bottom: 16px;
}

.select-box {
  width: 200px;
  padding: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
}

.filter-tags {
  display: flex;
  gap: 32px;
}

.tag-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tag-label {
  color: #666;
  font-size: 14px;
}

.tag {
  padding: 4px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background: none;
  cursor: pointer;
  font-size: 14px;
}

.tag.active {
  background-color: #f3f4f6;
  border-color: #d1d5db;
}

.question-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.question-item {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.question-header {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.question-text {
  font-size: 16px;
}

.button-group {
  display: flex;
  gap: 8px;
}

.modify-btn,
.delete-btn {
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  border: none;
}

.modify-btn {
  background-color: #f97316;
  color: white;
}

.delete-btn {
  background-color: #e53e3e; /* 빨간색 배경 */
  color: white; /* 흰색 텍스트 */
}

.bottom-actions {
  display: flex;
  justify-content: flex-end;
}

.add-btn {
  padding: 8px 16px;
  background-color: #f97316;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.modify-btn:hover,
.add-btn:hover {
  background-color: #ea580c;
}

.delete-btn:hover {
  background-color: #c53030; /* 좀 더 어두운 빨간색 */
}

/* 모달 스타일 */
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
  z-index: 1000;
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

.section-label {
  display: block;
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
}

.question-textarea {
  width: 100%;
  height: 120px;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: none;
  font-size: 14px;
  line-height: 1.5;
}

.question-textarea:focus {
  outline: none;
  border-color: #FF6B2C;
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

/* 로딩 및 에러 메시지 스타일 */
.loading,
.error,
.no-questions {
  text-align: center;
  font-size: 16px;
  color: #666;
}
</style>
