<!-- src/components/ToggleSwitch.vue -->
<script setup>
import { defineProps, defineEmits, computed } from 'vue';

// Props 정의
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  label: {
    type: String,
    default: '',
  },
  activeColor: {
    type: String,
    default: '#4caf50', // 기본 활성화 색상
  },
  inactiveColor: {
    type: String,
    default: '#ccc', // 기본 비활성화 색상
  },
  id: {
    type: Number,
    default: null
  },
  size: {
    type: String,
    default: 'default', // 'default' 또는 'small'
    validator: (value) => ['default', 'small'].includes(value),
  },
});

// 이벤트 정의
const emit = defineEmits(['update:modelValue', 'change']);

// 슬라이드 토글 핸들러
const onChange = (event) => {
  if (props.disabled) return;
  emit('update:modelValue', event.target.checked, props.id);
  emit('change', event.target.checked, props.id);
};

// 클릭 시 토글 핸들러
const toggle = (event) => {
  // 클릭한 요소가 input이 아니면 토글 동작을 수행
  if (event.target.tagName.toLowerCase() !== 'input') {
    emit('update:modelValue', !props.modelValue);
    emit('change', !props.modelValue);
  }
};

</script>

<template>
  <label
      class="toggle-switch"
      :class="{ disabled }"
      @click="toggle"
  >
    <input
        type="checkbox"
        :checked="modelValue"
        @change="onChange"
        :disabled="disabled"
        aria-checked="modelValue"
        role="switch"
    />
    <span class="slider"></span>
    <span v-if="label" class="label-text">{{ label }}</span>
  </label>
</template>

<style scoped>
.toggle-switch {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
  position: relative;
}

.toggle-switch.disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.toggle-switch input {
  display: none;
}

.slider {
  position: relative;
  width: 50px;
  height: 24px;
  background-color: #D9D9D9;
  border-radius: 34px;
  transition: background-color 0.3s;
  margin-right: 10px;
}

.slider::before {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  left: 2px;
  top: 2px;
  background-color: white;
  border-radius: 50%;
  transition: transform 0.3s;
}

input:checked + .slider {
  background-color: #F37321;
}

input:checked + .slider::before {
  transform: translateX(26px);
}

.label-text {
  font-size: 14px;
  color: #333;
}

/* 사이즈 조절 */
.toggle-switch.small .slider {
  width: 40px;
  height: 20px;
}

.toggle-switch.small .slider::before {
  width: 16px;
  height: 16px;
  left: 2px;
  top: 2px;
}
.slider::before {
  transition: transform 0.4s ease, background-color 0.3s ease;
}
.toggle-switch.small input:checked + .slider::before {
  transform: translateX(20px);
}
</style>
