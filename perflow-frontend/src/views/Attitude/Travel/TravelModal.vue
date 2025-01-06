<script setup>
import {ref, defineProps, defineEmits, watch, onMounted} from "vue";
import ButtonBasic from "@/components/common/ButtonBasic.vue";
import ModalBasic from "@/components/common/ModalBasic.vue";
import SearchGroupBar from "@/components/common/SearchGroupBar.vue";
import ButtonDropDown from "@/components/common/ButtonDropDown.vue";
import api from "@/config/axios.js";
import { useStore } from "@/store/store.js";
import SearchButtonDropDown from "@/components/common/SearchButtonDropDown.vue";
import {useAuthStore} from "@/store/authStore.js";

const store = useStore();

// 부모에서 전달된 props 정의
defineProps({
  isOpen: Boolean // 모달 열림 여부
});

// 부모로 이벤트 전달 설정
const emit = defineEmits(["close", "travel-success"]);

// 상태 관리
const travelDivision = ref(""); // 출장 구분
const travelReason = ref("");   // 출장 사유
const approver = ref("");       // 결재자
const startDate = ref("");      // 기간 시작일
const endDate = ref("");        // 기간 종료일
const errorMessage = ref("");   // 에러 메시지
const authStore = useAuthStore();
const empList = ref([]);


// 출장 구분 옵션
const travelDivisionOptions = [
  { label: "국내 출장", value: "DOMESTIC" },
  { label: "해외 출장", value: "OVERSEAS" },
];

// 날짜 포맷 함수
const formatDate = (date, time) => {
  // 날짜 포맷을 'YYYY-MM-DDTHH:mm:ss' 형식으로 변환
  if (!date) return "";
  const isoDate = new Date(date).toISOString().split('T')[0];
  const timeStr = time.split(':')[0] + ':' + time.split(':')[1];
  return `${isoDate}T${timeStr}:00`;
};

const handleApply = async () => {
  if (!travelDivision.value) { // 출장 유형 미선택 시 에러 처리
    alert("출장 구분을 선택해 주세요.");
    return;
  }
  if (!startDate.value || !endDate.value) {
    alert("시작일과 종료일을 입력해 주세요.");
    return;
  }
  if (new Date(startDate.value) > new Date(endDate.value)) {
    alert("종료일은 시작일보다 뒤이어야 합니다.");
    return;
  }
  if (!approver.value) {
    alert("결재자 사번을 입력해 주세요.");
    return;
  }
  if (!travelReason.value) {
    alert("출장 사유를 입력해 주세요.");
    return;
  }
  try {
    // 1. 입력값 가져오기
    const requestData = {
      empId: authStore.empId,
      approverId: approver.value, // 결재자 사번
      enrollTravel: formatDate(new Date(), "09:00:00"), // 신청일 (현재 날짜)
      travelStart: formatDate(startDate.value, "09:00:00"), // 시작 시간 반영
      travelEnd: formatDate(endDate.value, "18:00:00"),     // 종료 시간 반영
      travelDivision: travelDivision.value,                 // 출장 유형
      travelReason: travelReason.value,                     // 출장 사유
    };

    // 요청 데이터 확인
    console.log("Request Data:", requestData);

    // 2. 서버 요청 (API 호출)
    store.showLoading();
    const response = await api.post('/emp/approval/travels', requestData);
    store.hideLoading();

    // 3. 성공 처리
    console.log('출장 신청 성공:', response);
    alert('출장 신청이 완료되었습니다!');
    emit('close');
    emit('travel-success');
  } catch (error) {
    // 4. 에러 처리
    console.error('출장 신청 실패:', error);
    store.hideLoading();

    if (error.response) {
      console.error('서버 응답 데이터:', error.response.data); // 서버 에러 메시지 출력
      alert(`출장 신청 실패: ${error.response.data.message || '알 수 없는 오류'}`);
    } else {
      alert('올바르지 않은 값이 입력되었습니다.');
    }
  }
};

const resetForm = () => {
  travelDivision.value = "";
  travelReason.value = "";
  approver.value = "";
  startDate.value = "";
  endDate.value = "";
  errorMessage.value = "";
};


// ButtonDropDown에서 선택된 값을 travelDivision에 반영
const handleTravelDivisionSelect = (selectedLabel) => {
  const option = travelDivisionOptions.find(opt => opt.label === selectedLabel);
  travelDivision.value = option ? option.value : "";
};

const updateApproverId = (value) => {
  approver.value = value
}
const fetchEmpList = async () => {

  const response = (await api.get("/employees/lists", {
    params: {
      page: 1,
      size: 10000
    }
  })).data;
  empList.value = response.employeeList.map(emp => ({ label: emp.name, id: emp.empId }));
}
onMounted(async () => {
  await fetchEmpList();
})
</script>

<template>
  <div v-if="isOpen" class="modal-wrapper">
    <ModalBasic
        :isOpen="isOpen"
        title="출장 신청하기"
        width="800px"
        height="550px"
        @close="emit('close')"
    >
      <!-- 전체 컨테이너 -->
      <div class="modal-container">
        <!-- 출장 신청 폼 -->
        <div class="modal-body">
          <div class="form-container">
            <div class="form-group date-range">
              <SearchGroupBar
                  id="travelstart"
                  v-model="startDate"
                  placeholder="출장 시작일"
                  type="date"/>
              ~
              <SearchGroupBar v-model="endDate" placeholder="출장 종료일" type="date"/>
            </div>

            <div class="form-group">
              <SearchButtonDropDown
                  default-option="결재자 사번을 입력해주세요"
                  width="300px"
                  :options="empList"
                  @select-id="updateApproverId" />
            </div>

            <div class="form-group">
              <SearchGroupBar
                  v-model="travelReason"
                  placeholder="출장 사유를 입력해주세요"
                  type="text"
              />
            </div>

            <div class="form-group">
              <ButtonDropDown
                  :options="travelDivisionOptions"
                  default-option="출장 구분"
                  v-model="travelDivision"
                  width="200px"
                  height="40px"
                  @select="handleTravelDivisionSelect"
              />
            </div>

            <!-- 에러 메시지 -->
            <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
          </div>
        </div>

        <!-- 푸터 버튼 -->
        <div class="modal-footer">
          <ButtonBasic label="취소" size="medium" color="gray" @click="emit('close')"/>
          <ButtonBasic label="신청" size="medium" color="orange" @click="handleApply"/>
        </div>
      </div>
    </ModalBasic>
  </div>
</template>

<style scoped>
.label-description {
  font-size: 14px;
  color: rgba(0, 0, 0, 1);
  width: 150px; /* 또는 원하는 너비로 조정 */
  text-align: right; /* 레이블을 오른쪽 정렬 */
}
.modal-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 150vh;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 모달 전체 컨테이너 */
.modal-container {
  display: flex;
  flex-direction: column;
  height: 100%; /* 모달 높이를 100%로 유지 */
}

.error-message {
  color: red;
  font-size: 14px;
  margin-top: 10px;
}

.form-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  padding: 20px;
}

.form-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.modal-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 20px;
  height: calc(100% - 60px); /* 버튼 높이를 뺀 나머지 영역 사용 */
  overflow-y: auto; /* 스크롤 필요 시 추가 */
}

/* 모달 본문 */
.modal-body {
  flex: 2; /* 남은 공간 모두 차지 */
  overflow-y: visible; /* 내부 스크롤 활성화 */
  padding: 5px;
  height: 400px; /* 내용 여백 */
}

.modal-header {
  padding: 10px 20px; /* 헤더 패딩 최소화 */
  font-size: 18px; /* 글자 크기 조정 */
  border-bottom: none; /* 헤더 구분선 제거 */
}

/* 푸터 버튼 */
.modal-footer {
  display: flex;
  justify-content: flex-end; /* 버튼을 오른쪽 정렬 */
  padding: 8px 10px; /* 내부 여백 줄임 */
  gap: 8px; /* 버튼 사이 간격 */
  height: 40px; /* 푸터 높이 설정 */
  background: white;
  border: none; /* 테두리 제거 */
}

/* 달력 스타일 수정 (우선 순위 조정) */
.date-picker-dropdown {
  position: absolute;
  z-index: 10; /* 달력이 푸터보다 위에 오도록 설정 */
}
</style>
