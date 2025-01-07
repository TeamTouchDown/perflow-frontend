<script setup>
import {ref} from "vue";
import Tooltip from "@/components/common/ToolTip.vue";

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
  width: { type: String, default: "400px" }, // 모달 너비
  height: { type: String, default: "auto"}, // 모달 높이
  tooltipText: { type: String, default: "" }, // 툴팁 내용
  tooltipPosition: { // 툴팁 위치
    type: Object,
    default: () => ({ bottom: "20px", left: "0px" }),
  },
  tooltipWidth: { type:String, default: ""},  // 툴팁 폭
});

const emit = defineEmits(["close"]);

const closeModal = () => {
  emit("close");
};

const tooltipVisible = ref(false);

</script>

<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="closeModal">
    <div class="modal-container" :style="{ width: props.width, height: props.height }"
    >
      <!-- 모달 제목 -->
      <div class="modal-header">
        <slot name="header">
          <div class="title-container">
            <h3 class="modal-title">{{ title }}</h3>
            <!-- 툴팁 -->
            <img
                v-if="tooltipText"
                src="@/assets/icons/tooltip.png"
                alt="툴팁"
                class="tooltip-icon"
                @mouseenter="tooltipVisible = true"
                @mouseleave="tooltipVisible = false"
            />
            <Tooltip
                v-if="tooltipText"
                :text="tooltipText"
                :visible="tooltipVisible"
                :width="tooltipWidth"
                :position="tooltipPosition"
            />
          </div>
        </slot>
        <button class="modal-close" @click="closeModal">✕</button>
      </div>

      <!-- 모달 내용 -->
      <div class="modal-content">
        <slot>
          <p>{{ content }}</p>
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

/* 헤더와 푸터 회색 선 제거 */
.modal-header {
  border: none; /* 회색 선 제거 */
}

.title-container {
  display: flex;
  align-items: center;
  gap: 3px;  /* 제목-툴팁 아이콘 간격 */
}

.tooltip-icon {
  width: 30px;
  height: 30px;
  cursor: pointer;
}
</style>