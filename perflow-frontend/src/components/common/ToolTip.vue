<script setup>
import { defineProps, defineEmits } from "vue";

// Props 정의
defineProps({
    text: {
    type: String,
    required: true,
  },
    visible: {
    type: Boolean,
    default: false,
  },
    position: {
    type: Object,
    default: () => ({ top: null, bottom: "45px", left: "50%", right: null }), // 기본 위치
  },
    width: {
    type: String,
    default: "190px", // 기본 크기
  },
});

  // Emits 정의
  const emit = defineEmits(["visible"]);

  // 툴팁 보이기/숨기기 함수
  const showTooltip = () => {
    emit("visible", true);
  };

  const hideTooltip = () => {
    emit("visible", false);
  };
</script>

<template>
  <div
      v-if="visible"
      class="tooltip-basic"
      :style="{ bottom: position.bottom, left: position.left, width: width }"
      @mouseenter="showTooltip"
      @mouseleave="hideTooltip"
  >
    {{ text }}
  </div>
</template>

<style scoped>
.tooltip-basic {
  position: absolute;
  background-color: white;
  color: #3C4651;
  border: 1px solid #ff6600;
  padding: 5px 10px;
  border-radius: 5px;
  font-size: 14px;
  z-index: 10;
  transform: translateX(-50%); /* 툴팁 위치 중앙 정렬 */
  word-wrap: break-word; /* 긴 텍스트 줄바꿈 */
  white-space: pre-line;  /* 텍스트 줄바꿈 */
}
</style>
