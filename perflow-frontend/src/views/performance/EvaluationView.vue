<!-- PerformanceReview.vue -->
<template>
  <div class="performance-review">
    <h2 class="title">{{empName}}님의 인사 평가</h2>

    <!-- Recent Evaluations -->
    <section class="recent-evaluations">
      <h3 class="section-title">최근 인사평가</h3>

      <!-- (1) 작년 평가가 있다면 맨 위에 표시 -->
      <div
          v-if="lastYearEvaluation"
          class="evaluation-card"
      >
        <div class="year-label">{{ lastYearEvaluation.year }}년</div>
        <div class="card-content">
          <div class="grade-section">
            <div class="grade">
              {{ lastYearEvaluation.grade }}
            </div>
          </div>
          <div class="comment-section">
            <p class="comment">
              {{ lastYearEvaluation.review }}
            </p>
          </div>
        </div>
      </div>
      <h3 class="section-title">이전 인사평가</h3>
      <!-- (2) 나머지 평가들을 페이지네이션으로 표시 -->
      <div
          v-for="(evaluation, index) in currentEvaluations"
          :key="evaluation.year"
          class="evaluation-card"
      >
        <div class="year-label">{{ evaluation.year }}년</div>
        <div class="card-content">
          <div class="grade-section">
            <div class="grade">
              {{ evaluation.grade }}
            </div>
          </div>
          <div class="comment-section">
            <p class="comment">
              {{ evaluation.review }}
            </p>
          </div>
        </div>
      </div>

      <!-- (3) 페이지네이션 버튼 -->
      <div class="pagination" v-if="hrperfo.length > 0">
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
    </section>
  </div>
</template>


<script setup>
import { onMounted, ref, computed } from "vue";
import api from "@/config/axios.js";
import { useAuthStore } from "@/store/authStore.js";


// 평가 리스트
const hrperfo = ref([]);

// 맨 위에 표시할 "작년 평가"
const lastYearEvaluation = ref(null);

// 페이지네이션용 상태
const currentQuestionIndex = ref(0); // 현재 페이지(또는 평가) 인덱스
const itemsPerPage = 1; // 페이지당 몇 개의 평가를 보여줄지 결정 (여기서는 1개씩)

// 페이지네이션을 위한 계산
const totalQuestions = computed(() => hrperfo.value.length);
const currentQuestionNumber = computed(() => currentQuestionIndex.value + 1);

// 페이지네이션에 따라 보여줄 평가
const currentEvaluations = computed(() => {
  // 한 번에 1개씩 보여준다고 가정
  const startIndex = currentQuestionIndex.value;
  const endIndex = startIndex + itemsPerPage;
  return hrperfo.value.slice(startIndex, endIndex);
});

// 페이지 이동 함수
function nextQuestion() {
  if (currentQuestionIndex.value < totalQuestions.value - 1) {
    currentQuestionIndex.value++;
  }
}
function prevQuestion() {
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--;
  }
}

// 인증 스토어 (empId)
const authStore = useAuthStore();
const empId = authStore.empId;
const empName = authStore.empName;

// API 호출 함수
async function loadPerfo() {
  try {
    const resp = await api.get(`/perfomances/hrperfo/${empId}`);
    const data = resp.data; // [{ year: 2022, grade: 'A', review: '...' }, ...]

    // 1) 우선 전체 리스트를 hrperfo.value 에 저장
    hrperfo.value = data;

    // 2) 작년 평가 찾기
    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;

    // 3) hrperfo 중에서 year === (올해-1) 항목을 찾아서 lastYearEvaluation에 할당
    //    그리고 그 항목은 hrperfo에서 제거(페이지네이션 대상에서 제외)
    const index = hrperfo.value.findIndex(e => e.year === lastYear);
    if (index !== -1) {
      lastYearEvaluation.value = hrperfo.value[index];
      hrperfo.value.splice(index, 1);
    }

    // console.log("Last year eval:", lastYearEvaluation.value);
    // console.log("Other evals:", hrperfo.value);
  } catch (error) {
    // console.error(`평가 존재 여부 확인 중 오류: ${error}`);
  }
}

// 컴포넌트 마운트 시 API 호출
onMounted(() => {
  loadPerfo();
});

// 이하 export는 생략 (단일 파일 컴포넌트이므로 필요 없다면 제거)
</script>


<style scoped>
.performance-review {
max-width: 800px;
margin: 0 auto;
padding: 20px;
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
background-color: #f8f9fa;
}

.title {
font-size: 1.25rem;
font-weight: 600;
margin-bottom: 1.5rem;
color: #333;
}

.section-title {
font-size: 1rem;
margin-bottom: 1rem;
color: #444;
}

.evaluation-card {
margin-bottom: 1rem;
background-color: #ffffff;
border: 1px solid #e9ecef;
border-radius: 0.5rem;
padding: 1.5rem;
transition: all 0.2s ease;
}

.evaluation-card:hover {
border-color: #dee2e6;
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.year-label {
font-size: 0.875rem;
color: #6c757d;
margin-bottom: 0.25rem;
}

.card-content {
display: flex;
align-items: flex-start;
gap: 2rem;
}

.grade-section {
flex-shrink: 0;
}

.grade {
font-size: 5rem;
font-weight: 700;
color: #f97316;
line-height: 1;
}

.comment-section {
flex: 1;
}

.comment {
font-size: 0.875rem;
color: #495057;
white-space: pre-line;
word-break: keep-all;
line-height: 1.5;
}

.pagination {
display: flex;
justify-content: center;
margin-top: 1.5rem;
}

.pagination-container {
display: flex;
align-items: center;
}

.page-number {
font-size: 0.75rem;
color: #6c757d;
}

.pagination-buttons {
display: flex;
gap: 0.25rem;
margin-left: 0.5rem;
}

.page-button {
width: 1.5rem;
height: 1.5rem;
border-radius: 9999px;
border: 1px solid #dee2e6;
display: flex;
align-items: center;
justify-content: center;
color: #6c757d;
background-color: #ffffff;
cursor: pointer;
transition: all 0.2s ease;
}

.page-button:disabled {
opacity: 0.5;
cursor: not-allowed;
}

.page-button:not(:disabled):hover {
background-color: #f8f9fa;
border-color: #ced4da;
}

.prev-icon {
transform: rotate(180deg);
}

.next-icon {
display: inline-block;
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
</style>