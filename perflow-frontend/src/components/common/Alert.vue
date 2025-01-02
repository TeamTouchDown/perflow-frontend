<script setup>
import { defineProps, defineEmits } from 'vue';
import ButtonBasic from "@/components/common/ButtonBasic.vue"

// 알림 메시지와 visible 상태를 prop으로 받습니다.
const props = defineProps({
  message: {
    type: String,
    required: true
  },
  visible: {
    type: Boolean,
    required: true
  }
});

// 모달 닫기 이벤트를 emit으로 부모에게 전달
const emit = defineEmits(['update:visible']);
const closeModal = () => {
  emit('update:visible', false);
};
</script>

<template>
  <div v-if="visible" class="alert-modal-overlay">
    <div class="alert-modal">
      <p class="alert-message">{{ message }}</p>
      <Button class="alert-btn" @click="closeModal">
      확인
      </Button>
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
