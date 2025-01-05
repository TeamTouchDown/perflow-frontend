<script setup>
import {ref, defineProps, defineEmits, watch, onMounted} from "vue";
import ButtonBasic from "@/components/common/ButtonBasic.vue";
import ModalBasic from "@/components/common/ModalBasic.vue";
import SearchGroupBar from "@/components/common/SearchGroupBar.vue";
import ButtonDropDown from "@/components/common/ButtonDropDown.vue";
import api from "@/config/axios.js";
import { useStore } from "@/store/store.js";
import dayjs from "dayjs";
import {useAuthStore} from "@/store/authStore.js";
import HRButtonDropDown from "@/components/hr/HRButtonDropDown.vue";
import SearchButtonDropDown from "@/components/common/SearchButtonDropDown.vue";

// ----------------------------
// [1] 부모 컴포넌트에서 전달받는 props
// ----------------------------
const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
});

// ----------------------------
// [2] 부모로 이벤트 전달
// ----------------------------
const emit = defineEmits(["close", "overtime-success"]);

// ----------------------------
// [3] 폼 상태 관리
// ----------------------------
const store = useStore();
const authStore = useAuthStore();
const overtimeStart = ref("");
const overtimeEnd = ref("");
const overtimeType = ref("");
const overtimeReason = ref("");
const approverId = ref("");
const errorMessage = ref("");
const empList = ref([]);

const fetchEmpList = async () => {

  const response = (await api.get("/employees/lists", {
    params: {
      page: 1,
      size: 10000
    }
  })).data;
  empList.value = response.employeeList.map(emp => ({ label: emp.name, id: emp.empId }));
}

// ----------------------------
// [4] 초과근무 유형 옵션
// ----------------------------
const overtimeTypeOptions = [
  { label: "연장 근무", value: "EXTENDED" },
  { label: "야간 근무", value: "NIGHT" },
  { label: "휴일 근무", value: "HOLIDAY" },
];

// ----------------------------
// [5] 폼 초기화
// ----------------------------
watch(
    () => props.isOpen,
    (newVal) => {
      if (newVal) {
        // 폼 초기화
        overtimeStart.value = "";
        overtimeEnd.value = "";
        overtimeType.value = "";
        overtimeReason.value = "";
        approverId.value = "";
        errorMessage.value = "";
      }
    }
);

// ----------------------------
// [6] 초과근무 유형 선택 핸들러
// ----------------------------
const handleOvertimeTypeSelect = (selectedLabel) => {
  const option = overtimeTypeOptions.find(opt => opt.label === selectedLabel);
  overtimeType.value = option ? option.value : "";
};

const updateApproverId = (value) => {
  approverId.value = value
}

// ----------------------------
// [7] 초과근무 신청 처리 함수
// ----------------------------
const convertToLocalDateTime = (inputValue) => {
  try{
    // 입력값이 12자리(YYYYMMDDHHMM) 형식일 경우
    const datetimeRegex = /^\d{10}$/;

    console.log("Received input:", inputValue); // 디버깅: 입력값 확인

    if (datetimeRegex.test(inputValue)) {
      // 입력값이 유효하면 년, 월, 일, 시, 분을 추출
      const year = inputValue.slice(0, 2); // 첫 두 자리는 연도 (25 -> 2025)
      const month = inputValue.slice(2, 4);
      const day = inputValue.slice(4, 6);
      const hour = inputValue.slice(6, 8);
      const minute = inputValue.slice(8, 10);

      // 디버깅: 추출한 값 확인
      console.log("Year:", year, "Month:", month, "Day:", day, "Hour:", hour, "Minute:", minute);

      // 자동으로 초를 00으로 설정하여 LocalDateTime 형식으로 변환
      const formattedDate = `20${year}-${month}-${day}T${hour}:${minute}:00`;

      // 변환된 날짜 확인
      console.log("Formatted Date:", formattedDate); // 디버깅: 변환된 날짜

      // dayjs를 사용하여 날짜 변환
      const date = dayjs(formattedDate);
      console.log("DayJS Date Object:", date); // 디버깅: dayjs 객체 확인

      // 날짜가 유효한지 확인
      if (!date.isValid()) {
        console.error("Invalid date:", formattedDate); // 변환된 날짜가 유효하지 않음
        return null;
      }

      return date.toISOString();
    }
  }
  catch (error){
    console.error("Invalid date format:", inputValue); // 잘못된 입력에 대한 로그
    return null;
  }
}



const handleApply = async () => {
  try {
    // 필수 필드 검증 및 날짜 변환
    const startDate = convertToLocalDateTime(overtimeStart.value);
    const endDate = convertToLocalDateTime(overtimeEnd.value);

    if (!startDate) {
      errorMessage.value = "초과근무 시작일 형식이 올바르지 않습니다.";
      return;
    }
    if (!endDate) {
      errorMessage.value = "초과근무 종료일 형식이 올바르지 않습니다.";
      return;
    }

    // 시작일이 종료일보다 앞서는지 확인
    if (new Date(startDate) >= new Date(endDate)) {
      errorMessage.value = "초과근무 시작일이 종료일보다 앞서야 합니다.";
      return;
    }

    // 요청 데이터 구성
    const requestData = {
      empId: authStore.empId,  // 현재 사용자 ID
      approverId: approverId.value,
      overtimeType: overtimeType.value,
      enrollOvertime: dayjs().toISOString(), // 신청일 (현재 날짜)
      overtimeStart: startDate,
      overtimeEnd: endDate,
      isOvertimeRetroactive: false,  // 기본값으로 설정 (Retroactive 여부)
      overtimeRetroactiveReason: ""  // 기본값으로 설정
    };

    // 서버 요청 (API 호출)
    store.showLoading();
    const response = await api.post('/emp/overtimes', requestData);
    store.hideLoading();

    // 성공 처리
    alert('초과근무 신청이 완료되었습니다!');
    emit('overtime-success');
    emit('close');
  } catch (error) {
    store.hideLoading();
    errorMessage.value = error.response?.data?.message || "초과근무 신청에 실패했습니다.";
  }
};



// ----------------------------
// [8] 모달 닫기 함수
// ----------------------------
const closeModal = () => {
  emit("close");
};

onMounted(async () => {
  await fetchEmpList();
})
</script>
<template>
  <div v-if="isOpen" class="modal-wrapper">
    <ModalBasic
        :isOpen="isOpen"
        title="초과근무 신청"
        width="600px"
        height="auto"
        @close="closeModal"
    >
      <!-- 전체 컨테이너 -->
      <div class="modal-container">
        <!-- 초과근무 신청 폼 -->
        <div class="modal-body">
          <div class="form-container">
            <!-- 초과근무 시작일 -->
            <div class="form-group">
              <label for="overtimeStart">초과근무 시작일 (2501031500 형식으로 작성, 예: 2501031500)</label>
              <SearchGroupBar
                  id="overtimeStart"
                  v-model="overtimeStart"
                  placeholder="예: 2501031500"
                  type="text"
                  width="100%"
                  height="40px"
              />
            </div>

            <!-- 초과근무 종료일 -->
            <div class="form-group">
              <label for="overtimeEnd">초과근무 종료일 (2501031500 형식으로 작성, 예: 2501031500)</label>
              <SearchGroupBar
                  id="overtimeEnd"
                  v-model="overtimeEnd"
                  placeholder="예: 2501031500"
                  type="text"
                  width="100%"
                  height="40px"
              />
            </div>

            <!-- 초과근무 유형 -->
            <div class="form-group">
              <label for="overtimeType">초과근무 유형</label>
              <ButtonDropDown
                  id="overtimeType"
                  :options="overtimeTypeOptions"
                  default-option="초과근무 유형을 선택하세요"
                  v-model="overtimeType"
                  width="100%"
                  height="40px"
                  @select="handleOvertimeTypeSelect"
              />
            </div>

            <!-- 초과근무 사유 -->
            <div class="form-group">
              <label for="overtimeReason">초과근무 사유</label>
              <SearchGroupBar
                  id="overtimeReason"
                  v-model="overtimeReason"
                  placeholder="초과근무 사유를 입력해주세요"
                  type="text"
                  width="100%"
                  height="40px"
              />
            </div>

            <SearchButtonDropDown
                default-option="결재자 사번을 입력해주세요"
                width="300px"
                :options="empList"
                @select-id="updateApproverId" />
            <!-- 에러 메시지 -->
            <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
          </div>
        </div>

        <!-- 푸터 버튼 -->
        <div class="modal-footer">
          <ButtonBasic
              label="취소"
              size="medium"
              color="gray"
              @click="closeModal"
          />
          <ButtonBasic
              label="신청"
              size="medium"
              color="orange"
              @click="handleApply"
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
  height: 100vh; /* 전체 화면 높이로 수정 */
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
  width: 100%; /* 모달 내부 너비를 부모에 맞춤 */
}

/* 모달 본문 */
.modal-body {
  flex: 1;
  overflow-y: auto; /* 내용이 많을 경우 스크롤 */
  padding: 20px;
}

/* 폼 컨테이너 */
.form-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

/* 폼 그룹 */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

/* 푸터 버튼 */
.modal-footer {
  display: flex;
  justify-content: flex-end; /* 버튼을 오른쪽 정렬 */
  padding: 10px 20px;
  gap: 10px; /* 버튼 사이 간격 */
  background: white;
}

/* 에러 메시지 */
.error-message {
  color: red;
  font-size: 14px;
  margin-top: 10px;
}
</style>
