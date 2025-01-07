<script setup>
import ButtonBasic from "@/components/common/ButtonBasic.vue";

// 사용법
// <ModalBasic
//   :isOpen="isApprovalModalOpen"
//   title="결재선 설정"
//   :button1="{ label: '닫기', color: 'gray', onClick: closeApprovalModal }"
//   :button2="{ label: '저장하기', color: 'orange', onClick: saveApprovalSettings }"
//   width="600px"
//   @close="closeApprovalModal"
// >
const props = defineProps({
  isOpen: { type: Boolean, default: false }, // 모달 열림 여부
  title: { type: String, default: "제목" }, // 모달 제목
  content: { type: String, default: "내용" }, // 모달 내용
  button1: { type: Object, default: null }, // 첫 번째 버튼 { label, color, onClick }
  button2: { type: Object, default: null }, // 두 번째 버튼 { label, color, onClick }
  width: { type: String, default: "400px" }, // 모달 너비
  height: { type: String, default: "auto"}, // 모달 높이
});

const emit = defineEmits(["close"]);

const closeModal = () => {
  emit("close");
};

const handleClick = (action) => {
  if (action) action();
};
</script>

<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="closeModal">
    <div class="modal-container" :style="{ width: props.width, height: props.height }"
    >
      <!-- 모달 제목 -->
      <div class="modal-header">
        <slot name="header">
          <h3 class="modal-title">{{ title }}</h3>
        </slot>
        <button class="modal-close" @click="closeModal">✕</button>
      </div>

      <!-- 모달 내용 -->
      <div class="modal-content">
        <slot>
          <p>{{ content }}</p>
        </slot>
      </div>

      <!-- 모달 하단 버튼 -->
      <div class="modal-footer">
        <slot name="footer">
          <ButtonBasic
              v-if="button1"
              :label="button1.label"
              :color="button1.color || 'gray'"
              :size="button1.size || 'medium'"
              @click="handleClick(button1.onClick)"
          />
          <ButtonBasic
              v-if="button2"
              :label="button2.label"
              :color="button2.color || 'orange'"
              :size="button2.size || 'medium'"
              @click="handleClick(button2.onClick)"
          />
        </slot>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 모달 배경 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

/* 모달 컨테이너 */
.modal-container {
  background: white;
  border-radius: 10px;
  width: 400px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

/* 헤더 */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #ddd;
}

.modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: bold;
}

.modal-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
}

/* 내용 */
.modal-content {
  padding: 0;
  font-size: 14px;
  color: #333;
}

/* 버튼 영역 */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
}

/* 헤더와 푸터 회색 선 제거 */
.modal-header,
.modal-footer {
  border: none; /* 회색 선 제거 */
}
</style>