<template>
  <div
      class="dropdown-container btn-gray"
      :style="{ width: width, height: height, fontSize: fontSize }"
      :class="{ 'disabled': disabled }"
      @click="toggleMenu"
  >
    <!-- 선택된 옵션 -->
    <div class="selected-option">
      <span>{{ selectedOptionLabel }}</span>
      <img
          v-if="isMenuOpen"
          src="../../assets/image/arrow_up_2.png"
          alt="up"
          :style="{ width: imgSize, height: imgSize, marginLeft: marginLeft }"
      />
      <img
          v-else
          src="../../assets/image/arrow_down_2.png"
          alt="down"
          :style="{ width: imgSize, height: imgSize, marginLeft: marginLeft }"
      />
    </div>

    <!-- 드롭다운 옵션 메뉴 -->
    <ul
        v-if="isMenuOpen"
        class="options"
        :style="{ fontSize: fontSize, width: width }"
    >
      <li
          v-for="(option, index) in options"
          :key="index"
          @click.stop="selectOption(option)"
      >
        {{ option.label }}
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';

const props = defineProps({
  options: {
    type: Array,
    default: () => [],
  },
  modelValue: {
    type: String,
    default: "",
  },
  width: {
    type: String,
    default: "150px",
  },
  height: {
    type: String,
    default: "50px",
  },
  fontSize: {
    type: String,
    default: "16px",
  },
  imgSize: {
    type: String,
    default: "20px",
  },
  marginLeft: {
    type: String,
    default: "7px",
  },
  disabled: {
    type: Boolean,
    default: false,
  }
});

const emit = defineEmits(["update:modelValue"]);

const isMenuOpen = ref(false);
const selectedOption = ref(props.modelValue);

// Watch for changes in modelValue prop
watch(() => props.modelValue, (newVal) => {
  selectedOption.value = newVal;
});

// Compute the label of the selected option
const selectedOptionLabel = computed(() => {
  const found = props.options.find(option => option.value === selectedOption.value);
  return found ? found.label : "선택";
});

const toggleMenu = () => {
  if (props.disabled) return;
  isMenuOpen.value = !isMenuOpen.value;
};

const selectOption = (option) => {
  if (props.disabled) return;
  selectedOption.value = option.value;
  isMenuOpen.value = false;
  emit("update:modelValue", option.value); // v-model을 위한 이벤트
};
</script>

<style scoped>
.dropdown-container {
  border: none;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  position: relative;
  border-radius: 5px;
  width: 100%;
}

.btn-gray {
  background-color: white;
  color: #3c4651;
  border: 1px solid #afa9a9;
}

.selected-option {
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.options {
  list-style: none;
  padding: 0;
  border: 1px solid #afa9a9;
  position: absolute;
  background-color: white;
  color: #3c4651;
  border-radius: 5px;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 10;
  margin-top: 4px;
  max-height: 200px;
  overflow-y: auto;
  width: 100%;
}

.options li {
  padding: 10px;
  cursor: pointer;
}

.options li:hover {
  background-color: #f5f5f5;
  border-radius: 5px;
}

.disabled {
  pointer-events: none;
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
