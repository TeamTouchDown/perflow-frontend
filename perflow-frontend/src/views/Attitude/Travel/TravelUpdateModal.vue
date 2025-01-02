<template>
  <div v-if="isOpen" class="modal-wrapper">
    <ModalBasic
        :isOpen="isOpen"
        title="출장 수정하기"
        width="800px"
        height="450px"
        @close="closeModal"
    >
      <!-- 모달 내용 -->
      <div class="modal-container">
        <p class="info-text">
          수정 내용을 작성 후 <strong>"수정"</strong> 버튼을 눌러주세요.
        </p>
        <div class="modal-body">
          <div class="form-container">
            <!-- 출장 기간 -->
            <div class="form-group date-range">
              <SearchGroupBar
                  v-model="travelStart"
                  placeholder="수정할 출장 시작일"
                  type="date"
              />
              ~
              <SearchGroupBar
                  v-model="travelEnd"
                  placeholder="수정할 출장 종료일"
                  type="date"
              />
            </div>

            <!-- 결재자 ID -->
            <div class="form-group">
              <SearchGroupBar
                  v-model="approverId"
                  placeholder="결재자 사번을 입력해주세요"
                  type="text"
              />
            </div>

            <!-- 출장 구분 -->
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

            <!-- 출장 사유 -->
            <div class="form-group">
              <SearchGroupBar
                  v-model="travelReason"
                  placeholder="출장 사유를 입력해주세요"
                  type="text"
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

<script setup>
import { ref, defineProps, defineEmits, watch } from "vue";
import ButtonBasic from "@/components/common/ButtonBasic.vue";
import ModalBasic from "@/components/common/ModalBasic.vue";
import SearchGroupBar from "@/components/common/SearchGroupBar.vue";
import ButtonDropDown from "@/components/common/ButtonDropDown.vue";
import api from "@/config/axios.js";

// ----------------------------
// [1] 부모 컴포넌트에서 전달받는 props
// ----------------------------
const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  travelData: {
    type: Object,
    default: () => null,
  },
});

// ----------------------------
// [2] 부모로 이벤트 전달
// ----------------------------
const emit = defineEmits(["close", "update-success"]);

// ----------------------------
// [3] 폼 상태 관리
// ----------------------------
const travelDivision = ref("");
const approverId = ref("");
const travelStart = ref("");
const travelEnd = ref("");
const travelReason = ref("");
const errorMessage = ref("");

// 출장 구분 옵션
const travelDivisionOptions = [
  { label: "국내 출장", value: "DOMESTIC" },
  { label: "해외 출장", value: "OVERSEAS" },
];

// ----------------------------
// [4] props로부터 데이터 세팅
// ----------------------------
// 모달이 열릴 때 (isOpen이 true가 될 때) travelData를 폼에 세팅
watch(
    () => props.isOpen,
    (newVal) => {
      if (newVal && props.travelData) {
        travelDivision.value = props.travelData.travelDivision || "";
        approverId.value = props.travelData.approverId || "";
        travelStart.value = "";
        travelEnd.value = "";
        travelReason.value = props.travelData.travelReason || "";
        errorMessage.value = "";
      }
    }
);

// Dropdown에서 출장 구분을 변경 시 반영
const handleTravelDivisionSelect = (selectedLabel) => {
  const option = travelDivisionOptions.find(
      (opt) => opt.label === selectedLabel
  );
  travelDivision.value = option ? option.value : "";
};

// 날짜 포맷 (예: "YYYY-MM-DDTHH:mm:ss" 형태)
const formatDate = (date, time = "09:00:00") => {
  if (!date) return "";
  const isoDate = new Date(date).toISOString().split("T")[0];
  return `${isoDate}T${time}`;
};

// 출장 수정 처리 함수
const handleUpdate = async () => {
  try {
    if (!props.travelData) {
      alert("수정할 출장 정보가 없습니다.");
      return;
    }

    const travelId = props.travelData.travelId; // 백엔드 스펙에 맞춰 key 이름 확인
    if (!travelId) {
      alert("출장 ID가 없습니다.");
      return;
    }

    // 요청 데이터 구성
    const requestData = {
      travelDivision: travelDivision.value, // 출장 구분
      approverId: approverId.value,         // 결재자 ID
      travelStart: formatDate(travelStart.value, "09:00:00"), // 시작일
      travelEnd: formatDate(travelEnd.value, "18:00:00"),     // 종료일
      travelReason: travelReason.value,     // 출장 사유
    };

    // 요청 데이터 확인
    console.log("Request Data:", requestData);

    // 서버 요청 (API 호출)
    const url = `/emp/approval/travel/${travelId}`;
    const response = await api.put(url, requestData);
    console.log("출장 수정 성공:", response.data);

    // 수정 완료 후 모달 닫기 및 부모에게 성공 이벤트 전달
    alert("출장 정보가 수정되었습니다.");
    emit("update-success");
    emit("close");
  } catch (error) {
    console.error("출장 수정 실패:", error);
    if (error.response) {
      alert(
          `출장 수정 실패: ${error.response.data.message || "알 수 없는 오류"}`
      );
    } else {
      alert("출장 수정 실패: 올바르지 않은 값이 입력되었습니다.");
    }
  }
};

// ----------------------------
// [5] 모달 닫기 함수
// ----------------------------
const closeModal = () => {
  emit("close");
};
</script>

<style scoped>
.modal-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh; /* 150vh → 100vh로 수정 */
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
