<script setup>
const emit = defineEmits(['click']);

defineProps({
  // 버튼 텍스트
  label: {
    type: String,
    default: '버튼',
  }
})
</script>

<template>

  <button
      class="btn-orange"
      @click="emit('click')"
  >
    <slot>{{ label }}</slot>

  </button>

</template>

<style scoped>

button > * {
  font-weight: bold;
}

.btn-orange {
  background-image: linear-gradient(to right, #f37321 0%, #fb0 100%);
  color: white;
  border: none;
  font-weight: bold;
  padding: 15px 30px;
  font-size: 20px;
  border-radius: 10px;
  width: 900px;
  margin-top: 10px;
}

</style>