<template>
  <div v-if="isOpen" class="modal-wrapper">
    <ModalBasic
        :isOpen="isOpen"
        title="초과근무 수정하기"
        width="800px"
        height="auto"
        @close="closeModal"
    >
      <!-- 모달 내용 -->
      <div class="modal-container">
        <p class="info-text">
          수정 내용을 작성 후 <strong>"수정"</strong> 버튼을 눌러주세요.
        </p>
        <div class="modal-body">
          <div class="form-container">
            <!-- 초과근무 기간 -->
            <div class="form-group date-range">
              <label for="overtimeStart">초과근무 시작시간</label>
              <SearchGroupBar
                  id="overtimeStart"
                  v-model="overtimeStart"
                  placeholder="수정할 초과근무 시작일 (YYYY-MM-DDTHH:MM)"
                  width = "500px"
                  type="text"
              />

              <label for="overtimeEnd">초과근무 종료시간 </label>
              <SearchGroupBar
                  id="overtimeEnd"
                  v-model="overtimeEnd"
                  placeholder="수정할 초과근무 종료일 (YYYY-MM-DDTHH:MM)"
                  width = "500px"
                  type="text"
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
                  width="200px"
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
                  width = "500px"
                  type="text"
              />
            </div>

            <!-- 결재자 지정 -->
            <div class="form-group">
              <label for="approverId">결재자 사번</label>
              <SearchButtonDropDown
                  default-option="결재자 사번을 입력해주세요"
                  width="300px"
                  :options="empList"
                  @select-id="updateApproverId"
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
import { ref, defineProps, defineEmits, watch, onMounted } from "vue";
import ButtonBasic from "@/components/common/ButtonBasic.vue";
import ModalBasic from "@/components/common/ModalBasic.vue";
import SearchGroupBar from "@/components/common/SearchGroupBar.vue";
import ButtonDropDown from "@/components/common/ButtonDropDown.vue";
import SearchButtonDropDown from "@/components/common/SearchButtonDropDown.vue";
import api from "@/config/axios.js";
import { useStore } from "@/store/store.js";
import dayjs from "dayjs";
import { useAuthStore } from "@/store/authStore.js";

// ----------------------------
// [1] 부모 컴포넌트에서 전달받는 props
// ----------------------------
const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  overtimeData: {
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
const store = useStore();
const authStore = useAuthStore();

const overtimeStart = ref("");
const overtimeEnd = ref("");
const overtimeType = ref("");
const overtimeReason = ref("");
const approverId = ref("");
const errorMessage = ref("");
const empList = ref([]);

// ----------------------------
// [4] 초과근무 유형 옵션
// ----------------------------
const overtimeTypeOptions = [
  { label: "연장 근무", value: "EXTENDED" },
  { label: "야간 근무", value: "NIGHT" },
  { label: "휴일 근무", value: "HOLIDAY" },
];

// ----------------------------
// [5] 결재자 목록 불러오기
// ----------------------------
const fetchEmpList = async () => {
  try {
    const response = await api.get("/employees/lists", {
      params: {
        page: 1,
        size: 10000,
      },
    });
    empList.value = response.data.employeeList.map((emp) => ({
      label: emp.name,
      id: emp.empId,
    }));
  } catch (error) {
    console.error("결재자 목록 조회 실패:", error);
    // 에러 처리 로직 추가 가능
  }
};

// ----------------------------
// [6] props로부터 데이터 세팅
// ----------------------------
watch(
    () => props.isOpen,
    (newVal) => {
      if (newVal && props.overtimeData) {
        overtimeStart.value = dayjs(props.overtimeData.overtimeStart).format(
            "YYYY-MM-DDTHH:mm"
        ) || "";
        overtimeEnd.value = dayjs(props.overtimeData.overtimeEnd).format(
            "YYYY-MM-DDTHH:mm"
        ) || "";
        overtimeType.value = props.overtimeData.overtimeType || "";
        overtimeReason.value = props.overtimeData.overtimeReason || "";
        approverId.value = props.overtimeData.approverId || "";
        errorMessage.value = "";
      }
    }
);

// ----------------------------
// [7] 초과근무 유형 선택 핸들러
// ----------------------------
const handleOvertimeTypeSelect = (selectedLabel) => {
  const option = overtimeTypeOptions.find(
      (opt) => opt.label === selectedLabel
  );
  overtimeType.value = option ? option.value : "";
};

// ----------------------------
// [8] 결재자 ID 업데이트 핸들러
// ----------------------------
const updateApproverId = (value) => {
  approverId.value = value;
};

// ----------------------------
// [9] 초과근무 수정 처리 함수
// ----------------------------
const handleUpdate = async () => {
  try {
    // 현재 사용자 ID 가져오기
    const empId = authStore.empId; // authStore에서 empId 가져오기
    if (!empId) {
      errorMessage.value = "사용자 정보가 없습니다. 로그인 상태를 확인해주세요.";
      return;
    }

    // 필수 필드 검증
    if (
        !overtimeStart.value ||
        !overtimeEnd.value ||
        !overtimeType.value ||
        !overtimeReason.value ||
        !approverId.value
    ) {
      errorMessage.value = "모든 필드를 채워주세요.";
      return;
    }

    // 시간 형식 검증 (YYYY-MM-DDTHH:MM)
    const datetimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
    if (!datetimeRegex.test(overtimeStart.value)) {
      errorMessage.value = "초과근무 시작일 형식이 올바르지 않습니다.";
      return;
    }
    if (!datetimeRegex.test(overtimeEnd.value)) {
      errorMessage.value = "초과근무 종료일 형식이 올바르지 않습니다.";
      return;
    }

    // 시작일이 종료일보다 앞서는지 확인
    if (new Date(overtimeStart.value) >= new Date(overtimeEnd.value)) {
      errorMessage.value = "초과근무 시작일이 종료일보다 앞서야 합니다.";
      return;
    }

    // 요청 데이터 구성
    const requestData = {
      empId: empId, // 현재 사용자 ID
      approverId: approverId.value,
      overtimeType: overtimeType.value,
      overtimeStart: dayjs(overtimeStart.value).toISOString(),
      overtimeEnd: dayjs(overtimeEnd.value).toISOString(),
      overtimeReason: overtimeReason.value,
      // 필요 시 추가 필드
    };

    // 요청 데이터 확인 (디버깅용)
    console.log("Request Data:", requestData);

    // 서버 요청 (API 호출)
    store.showLoading();
    const url = `/emp/overtimes/${props.overtimeData.overtimeId}`;
    const response = await api.put(url, requestData);
    store.hideLoading();

    // 성공 처리
    console.log("초과근무 수정 성공:", response.data);
    alert("초과근무 정보가 수정되었습니다.");
    emit("update-success");
    emit("close");
  } catch (error) {
    // 에러 처리
    console.error("초과근무 수정 실패:", error);
    store.hideLoading();

    if (error.response && error.response.data && error.response.data.message) {
      errorMessage.value = error.response.data.message;
    } else {
      errorMessage.value = "초과근무 수정에 실패했습니다.";
    }
  }
};

// ----------------------------
// [10] 모달 닫기 함수
// ----------------------------
const closeModal = () => {
  emit("close");
};

// ----------------------------
// [11] 초기 로드
// ----------------------------
onMounted(async () => {
  await fetchEmpList();
});
</script>

<style scoped>
.modal-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh; /* 전체 화면 높이로 설정 */
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
  width: 100%;
}

/* 모달 본문 */
.modal-body {
  flex: 1;
  overflow-y: auto;
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

/* 초과근무 기간 그룹 */
.date-range {
  display: flex;
  gap: 10px;
}

/* 푸터 버튼 */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding: 10px 20px;
  gap: 10px;
  background: white;
}

/* 에러 메시지 */
.error-message {
  color: red;
  font-size: 14px;
  margin-top: 10px;
}

/* 정보 텍스트 */
.info-text {
  margin-bottom: 10px;
  color: #555;
  font-size: 14px;
  text-align: left;
  margin-left: 20px;
}
.form-group.date-range {
  text-align: left;
}

.form-group.date-range label {
  margin-right: 10px;
  font-weight: bold;
}

.form-group.date-range span {
  margin: 0 5px;
}
.form-group.date-range input {
  margin-left: 5px; /* 입력창 간격 조정 */
}

</style>
