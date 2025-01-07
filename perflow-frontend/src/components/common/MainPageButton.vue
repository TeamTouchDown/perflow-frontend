<script setup>
import {defineEmits} from 'vue';

const emit = defineEmits(['click']);

defineProps({
  // 버튼 색상
  color: {
    type: String,
    default: 'orange',
  },
  // 버튼 텍스트
  label: {
    type: String,
    default: '버튼',
  }
})
</script>

<template>
  <button
      class ="btn"
      :class="[`btn-${color}`]"
      @click="emit('click')"
  >
    <slot>{{ label }}</slot>

  </button>
</template>

<style scoped>
.btn-orange {
  width: 80px;
  height: 40px;
  justify-content: center;
  align-items: center;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: bold;
  color: white;
  background-image: linear-gradient(to right, #f37321 0%, #fb0 100%);
}
.btn-gray {
  width: 160px;
  height: 41px;
  justify-content: center;
  align-items: center;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: bold;
  color: #3C4651;
  background-color: #D9D9D9;
}
</style>