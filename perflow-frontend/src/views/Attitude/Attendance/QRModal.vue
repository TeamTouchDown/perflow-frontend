<script setup>
import {ref, onMounted, watch, onUnmounted} from 'vue';
import api from "@/config/axios.js";

let timerInterval = null;
let isTimerActive = false;
/*let isFirstLoad = true;*/
let lastUpdateTime = Date.now();
const qrCodeImage = ref('');
const inputCode = ref('');
const generatedCode = ref('');
const timer = ref(30);
const timerDisplay = ref('0:30');
const isAllowed = ref(true); // 버튼 클릭 허용 여부
const isCheckIn = ref(false);
const isExpired = ref(false);


const props = defineProps({
  isOpen: { type: Boolean, default: false },
  title: { type: String, default: "제목" },
  type: { type: String, default: 'on' },
  width: { type: String, default: "400px" },
  height: { type: String, default: "auto" },
  confirmAction: { type: Function, required: true },
});

const emit = defineEmits(["close"]);




// 모달이 열릴 때 QR 코드 생성
watch(() => props.isOpen, async (newVal) => {
  if (newVal && isAllowed.value) { // 모달 열릴 때
    await  generateQRCode();
    clearInterval(timerInterval);
    timer.value = 30;
    updateTimerDisplay();
    lastUpdateTime = Date.now();

    timerInterval = setInterval(updateTimer, 1000); // 타이머 시작
    isTimerActive = true;
  } else { // 모달 닫힐 때
    clearInterval(timerInterval); // 타이머 정지
    timerInterval = null;
    isTimerActive = false;
    inputCode.value='';
  }
});

onUnmounted(()=>{
  clearInterval(timerInterval);
  timerInterval = null;
  isTimerActive = false;
})



const closeModal = () => {
  clearInterval(timerInterval); // 타이머 정지
  isTimerActive = false;
  inputCode.value = '';
  emit("close");
};

const generateQRCode = async () => {
  try {
    /*if (props.type === 'off' && !localStorage.getItem('isCheckedIn')) {
      alert('출근 먼저 처리해주세요.');
      return;
    }*/

    if(!isTimerActive) return;
    const endpoint = props.type === 'on'
        ? 'emp/attendances/check-in/qr/generate'
        : 'emp/attendances/check-out/qr/generate';

    const response = await api.post(endpoint);

    console.log('API 응답 데이터:', response.data);

    const base64String = response.data;

    if (!base64String) {
      throw new Error('QR 코드 데이터가 비어 있습니다.');
    }
    qrCodeImage.value = `data:image/png;base64,${base64String}`;
    generatedCode.value = response.data.code;
    timer.value = 30;
    updateTimerDisplay();
    inputCode.value = '';
    if (!isTimerActive) { // 타이머 중복 방지
      clearInterval(timerInterval); // 기존 타이머 종료
      timerInterval = setInterval(updateTimer, 1000); // 새 타이머 시작
      isTimerActive = true; // 타이머 활성화
    }
  } catch (error) {
    console.error('QR 코드 생성 실패:', error);
    alert('QR 코드 생성 실패: ' + error.message);
  }
};



const updateTimer = () => {
  const currentTime = Date.now();
  const elapsed = Math.floor((currentTime - lastUpdateTime) / 1000); // 실제 경과 시간(초)

  if (elapsed > 0) {
    timer.value = Math.max(0, timer.value - elapsed); // 남은 시간 계산
    lastUpdateTime = currentTime; // 마지막 업데이트 시간 갱신
    updateTimerDisplay(); // 타이머 표시 업데이트
  }

  if (timer.value === 0) {
    clearInterval(timerInterval); // 타이머 정지
    isTimerActive = false; // 타이머 상태 비활성화
    isExpired.value = true;
  }
};

const updateTimerDisplay = () => {
  const minutes = Math.floor(timer.value / 60);
  const seconds = timer.value % 60;
  timerDisplay.value = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

const handleSubmit = async () => {
  try {
    const endpoint = props.type === 'on'
        ? 'emp/attendances/check-in'
        : 'emp/attendances/check-out';

    const response = await api.post(endpoint, null, {
      params: { qrCode: inputCode.value },
    });
    console.log('서버 응답:', response.data); // 응답 데이터 로깅
/*    // 상태 코드가 200번대일 때만 성공 처리
    // 상태 업데이트
    if (props.type === 'on') {
      localStorage.setItem('isCheckedIn', 'true'); // 출근 처리
      commuteStatus.value = 'ON'; // 상태 변경
    } else {
      localStorage.removeItem('isCheckedIn'); // 퇴근 처리
      commuteStatus.value = 'OFF'; // 상태 변경
    }*/
    if (response.status >= 200 && response.status < 300) {
      alert(`${props.type === 'on' ? '출근' : '퇴근'} 처리 완료`);
      clearInterval(timerInterval);
      closeModal();

      props.confirmAction(); // 부모로부터 전달받은 confirmAction 호출

    } else {
      throw new Error('서버 응답 오류'); // 실패 처리 강제 실행
    }
  } catch (error) {
    console.error('처리 실패:', error);
    alert('처리 실패. 다시 시도하세요.');
  }
};


const refreshCode = async () => {
  if (!isAllowed.value) return;
  await generateQRCode();
  timer.value = 30;
  updateTimerDisplay();
  clearInterval(timerInterval);
  timerInterval = setInterval(updateTimer,1000);
  isExpired.value = false;
};

onMounted(() => {
/*  // 출근 여부 확인 및 상태 설정
  const isCheckedIn = localStorage.getItem('isCheckedIn') === 'true';
  isAllowed.value = props.type === 'on' ? !isCheckedIn : isCheckedIn;

  if (isCheckedIn) {
    commuteStatus.value = 'ON'; // 출근 상태 설정
  } else {
    commuteStatus.value = 'OFF'; // 퇴근 상태 설정
  }*/

  // 타이머 초기화 및 시작
  clearInterval(timerInterval); // 기존 타이머 정리
  timer.value = 30; // 타이머 초기화
  updateTimerDisplay(); // 타이머 표시 초기화
  timerInterval = setInterval(updateTimer, 1000); // 1초마다 업데이트
});

</script>

<template>
  <!-- 모달 배경 -->
  <div v-if="isOpen" class="modal-overlay" @click.self="closeModal">
    <!-- 모달 컨테이너 -->
    <div class="modal-container" :style="{ width: width, height: height }">
      <!-- 모달 헤더 -->
      <div class="modal-header">
        <h3>{{ title }}</h3>
        <button class="modal-close" @click="closeModal">&#10006;</button>
      </div>

      <!-- 모달 내용 -->
      <div class="modal-content">
        <!-- QR 코드 표시 -->
        <div v-if="qrCodeImage" class="qr-code" :class="{ 'expired': timer === 0 || inputCode !== '' }">
          <img :src="qrCodeImage" alt="QR Code" />
        </div>

        <!-- 새로고침 버튼 -->
        <div class="refresh-btn" @click="refreshCode">&#x21bb; 발급하기</div>

        <!-- 숫자 입력 필드 및 타이머 -->
        <div class="code-input">
          <input
              type="text"
              v-model="inputCode"
              maxlength="6"
              placeholder="숫자 6자리 입력"
          />
          <span class="timer">{{ timerDisplay }}</span>
        </div>
      </div>

      <!-- 모달 푸터 -->
      <div class="modal-footer">
        <button @click="closeModal" class="btn-gray">취소</button>

        <button @click="handleSubmit" class="btn-orange">확인</button>
      </div>
    </div>
  </div>
</template>




<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

.modal-container {
  background: white;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #ddd;
}

.qr-code img {
  width: 200px;
  height: 200px;
  margin: 10px auto;
  display: block;
}

.refresh-btn {
  margin: 10px auto;
  cursor: pointer;
  font-size: 20px;
}

.code-input {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.timer {
  font-size: 16px;
  font-weight: bold;
  color: #f37321;
}

.modal-footer {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 20px;
}

.btn-orange {
  padding: 10px 20px;
  background: linear-gradient(to right, #f37321, #fb0);
  color: white;
  border-radius: 5px;
  border: white;
}

.btn-gray {
  padding: 10px 20px;
  background: #d9d9d9;
  color: #3c4651;
  border-radius: 5px;
  border: white;
}

.modal-close {
  background: white;               /* 배경색 하얀색 */
  border: 2px solid white;         /* 테두리 하얀색 */
  border-radius: 50%;              /* 동그란 모양 */
  color: black;                    /* 글자색 검정 */
  font-size: 16px;                 /* 글자 크기 */
  width: 30px;                     /* 버튼 너비 */
  height: 30px;                    /* 버튼 높이 */
  display: flex;                   /* 중앙 정렬 */
  align-items: center;
  justify-content: center;
  cursor: pointer;                 /* 마우스 커서 포인터 */
}
.qr-code.expired img {
  filter: grayscale(100%) opacity(0.5); /* 흐리게 처리 */
}

</style>