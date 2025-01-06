<script setup>
import {defineEmits, defineProps, ref} from 'vue';

// 소개
// 초단순하게 메세지만 보여주는 경고창입니다. 버튼을 누르면 닫힙니다.
// 사용법

// 1. <script>에 다음과 같이 정의
// const alertVisible = ref(false);
// const alertMsg = ref('');
// const showAlert = (msg) => {
//   alertMsg.value = msg;
//   alertVisible.value = true;
// }

// 2. <template> 에 Alert 컴포넌트 작성 + import
// <Alert
//   v-model="alertVisible"
//   :message="alertMsg"
// />

// 3. 기존의 alert 를 대체하여 사용합니다.
// <기존>
// alert('삐빅! 경고!');
// <대체>
// showAlert('빈 칸을 모두 채워주세요.');

// 알림 메시지와 visible 상태를 prop으로 받습니다.
const props = defineProps({
  message: {
    type: String,
    required: true
  },
  modelValue: {
    type: Boolean,
    required: true
  }
});

// 모달 닫기 이벤트를 emit으로 부모에게 전달
const emit = defineEmits(['update:modelValue']);
const closeModal = () => {
  emit('update:modelValue', false);
  // console.log("emit 호출");
};
</script>

<template>
  <div v-if="modelValue" class="alert-modal-overlay">
    <div class="alert-modal">
      <p class="alert-message">{{ message }}</p>
      <button class="alert-btn" @click="closeModal">
        닫기
      </button>
    </div>
  </div>
</template>

<style scoped>
.alert-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.alert-modal {
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  min-width: 400px;
  min-height: 150px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.alert-message {
  font-size: 20px;
  margin-top: 20px;
  margin-bottom: 20px;
  color: #3C4651;
}

.alert-btn {
  width: 80px;
  height: 40px;
  justify-content: center;
  align-items: center;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: bold;
  margin-top: 30px;
  color: white;
  background-image: linear-gradient(to right, #f37321 0%, #fb0 100%);
  cursor: pointer;
}
</style>
