<script setup>
import {ref, defineProps, defineEmits, watch, onMounted} from "vue";
import ButtonBasic from "@/components/common/ButtonBasic.vue";
import ModalBasic from "@/components/common/ModalBasic.vue";
import SearchGroupBar from "@/components/common/SearchGroupBar.vue";
import ButtonDropDown from "@/components/common/ButtonDropDown.vue";
import api from "@/config/axios.js";

// ----------------------------
// [1] 부모 컴포넌트에서 전달받는 props
// ----------------------------
const props = defineProps({
  isOpen: Boolean,      // 모달 열림 여부
  vacationData: {         // 수정할 연차 데이터 (체크박스로 선택된 것)
    type: Object,
    default: () => null,
  },
});

// ----------------------------
// [2] 부모로 이벤트 전달
// ----------------------------
const emit = defineEmits(["close"]);

// ----------------------------
// [3] 폼 상태 관리
// ----------------------------
const vacationType = ref("");
const approver = ref("");
const startDate = ref("");
const endDate = ref("");
const errorMessage = ref("");

// (선택) 백엔드에서 '결재자'를 어떻게 관리하는지에 따라
//  - approver가 사람 이름인지, 사번인지, 이메일인지 맞춰야 함.
// 예시: 사번이라 가정.

// 연차 구분 옵션
const vacationTypeOptions = [
  {label: "출산 휴가", value: "MATERNITY"},
  {label: "배우자 출산 휴가", value: "SPOUSEMATERNITY"},
  {label: "생리 휴가", value: "MENSTRUAL"},
  {label: "가족 돌봄 휴가", value: "FAMILYCARE"},
];

// ----------------------------
// [4] props로부터 데이터 세팅
// ----------------------------
// 모달이 열릴 때 (isOpen이 true가 될 때) annualData를 폼에 세팅
watch(
    () => props.isOpen,
    (newVal) => {
      if (newVal) { // 모달이 열릴 때
        vacationType.value = props.vacationData?.vacationType || "";  // 연차 구분 초기화
        approver.value = props.vacationData?.approver || "";      // 결재자 초기화

        // 날짜 초기화: 빈 문자열 유지
        startDate.value = "";
        endDate.value = "";

        errorMessage.value = "";
      }
    }
);


// Dropdown에서 연차 유형을 변경 시 반영
const handleVacationTypeSelect = (selectedLabel) => {
  const option = vacationTypeOptions.find(opt => opt.label === selectedLabel);
  vacationType.value = option ? option.value : "";
};

// 날짜 포맷 (예: "YYYY-MM-DDT09:00:00" 형태)
const formatDate = (date, time = "09:00:00") => {
  if (!date) return "";
  const isoDate = new Date(date).toISOString().split("T")[0];
  return `${isoDate}T${time}`;
};

const handleUpdate = async () => {
  try {
    if (!props.vacationData) {
      alert("수정할 연차 정보가 없습니다.");
      return;
    }

    const vacationId = props.vacationData.vacationId; // 백엔드 스펙에 맞춰 key 이름 확인
    if (!vacationId) {
      alert("휴가 ID가 없습니다.");
      return;
    }

    // 예시로 오전/오후 반차일 때 시간을 다르게 할 수도 있고,
    // 여기서는 편의상 09:00 ~ 18:00 로 고정
    const requestData = {
      // 백엔드가 요구하는 필드명에 맞게 세팅
      vacationType: vacationType.value, // 예: "FULLDAY"
      vacationStart: formatDate(startDate.value, "09:00:00"),
      vacationEnd: formatDate(endDate.value, "18:00:00"),
      approver: approver.value,
    };


    const url = `/emp/vacation/${vacationId}`;

    const response = await api.put(url, requestData);
    console.log("휴가 수정 성공:", response.data);

    // 수정 완료 후 모달 닫기
    alert("휴가 정보가 수정되었습니다.");
    emit("update-success");
    emit("close");
  } catch (error) {
    console.error("휴가 수정 실패:", error);
    if (error.response) {
      alert(`휴가 수정 실패: ${error.response.data.message || "알 수 없는 오류"}`);
    } else {
      alert("휴가 수정 실패: 올바르지 않은 값이 입력되었습니다.");
    }
  }
};

// ----------------------------
// [6] 모달 닫을 때 폼 초기화 (선택)
// ----------------------------
const closeModal = () => {
  emit("close");
};
</script>

<template>
  <div v-if="isOpen" class="modal-wrapper">
    <ModalBasic
        :isOpen="isOpen"
        title="휴가 수정하기 "
        width="800px"
        height="450px"
        @close="closeModal"
    >
      <!-- --------------------------
           모달 내용
           -------------------------- -->

      <div class="modal-container">
        <!-- 폼 영역 -->
        <p class="info-text">
          수정 작성 후 <strong>"수정"</strong> 버튼을 눌러주세요.
        </p>
        <div class="modal-body">
          <div class="form-container">


            <!-- 시작/종료일 -->
            <div class="form-group date-range">

              <SearchGroupBar
                  v-model="startDate"
                  placeholder="수정할 휴가 시작일"
                  type="date"
              />
              ~
              <SearchGroupBar
                  v-model="endDate"
                  placeholder="수정할 휴가 종료일"
                  type="date"
              />
            </div>

            <!-- 결재자 -->
            <div class="form-group search-box">
              <SearchGroupBar
                  v-model="approver"
                  placeholder="결재자 사번을 입력해주세요"
                  type="text"
              />
            </div>

            <!-- 연차 유형 -->
            <div class="form-group">
              <ButtonDropDown
                  :options="vacationTypeOptions"
                  default-option="휴가 구분"
                  width="200px"
                  height="40px"
                  @select="handleVacationTypeSelect"
              />
            </div>

            <!-- 에러 메시지 표시 -->
            <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
          </div>
        </div>

        <!-- 모달 푸터(버튼들) -->
        <div class="modal-footer">
          <ButtonBasic
              label="취소"
              size="medium"
              color="gray"
              @click="closeModal"
          />
          <ButtonBasic
              label="수정"
              size="medium"
              color="orange"
              @click="handleUpdate"
          />
        </div>
      </div>
    </ModalBasic>
  </div>
</template>

<style scoped>
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

.modal-container {
  display: flex;
  flex-direction: column;
  height: 350px;
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

.modal-body {
  flex: 2;
  overflow-y: visible;
  padding: 5px;
  height: 400px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding: 8px 10px;
  gap: 8px;
  height: 40px;
  background: white;
  border: none;
}

.info-text {
  margin-bottom: 10px; /* 아래 여백 추가 */
  color: #555; /* 색상 지정 */
  font-size: 14px; /* 글자 크기 */
  text-align: left; /* 정렬 */
  margin-left: 40px;
}

</style>
