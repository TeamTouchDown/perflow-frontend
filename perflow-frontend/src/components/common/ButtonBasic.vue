<script>
export const colors = ['orange', 'gray', 'white'];
export const sizes = ['small', 'medium', 'large'];

// 사용법 예시
// <ButtonBasic
//   color="gray"
//   size="medium"
//   label="취소하기"
//       @click="handleClick"
// />
</script>

<script setup>
const emit = defineEmits(['click']);

defineProps({
  // 버튼 색상
  color: {
    type: String,
    default: 'orange',
    validator: (value) => colors.includes(value),  // 허용된 색상만 사용 가능
  },
  // 버튼 크기
  size: {
    type: String,
    default: 'small',
    validator: (value) => sizes.includes(value),
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
      :class="[`btn-${size}`, `btn-${color}`]"
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
}

.btn-gray {
  background-color: #D9D9D9;
  color: #3C4651;
  border: none;
}

.btn-white {
  background-color: #fff;
  color: #3C4651;
  border: 1px solid #AFA9A9;
}

.btn-small {
  padding: 5px 10px;
  font-size: 12px;
}

.btn-medium {
  padding: 10px 20px;
  font-size: 16px;
}
.btn-large {
  padding: 15px 30px;
  font-size: 20px;
}
</style>