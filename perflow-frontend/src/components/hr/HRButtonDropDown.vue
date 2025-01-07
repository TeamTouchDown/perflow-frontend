<script setup>
import { ref } from 'vue';
const props = defineProps({
  options: {
    type: Array,
    default: () => [],
  },
  defaultOption: {
    type: String,
    default: "",
  },
  width: {
    type: String,
    default: "150px", // 기본 너비
  },
  height: {
    type: String,
    default: "50px", // 기본 높이
  },
  fontSize: {
    type: String,
    default: "16px", // 글자 크기
  },
  imgSize: {
    type: String,
    default: "30px", // 이미지 크기
  },
  marginLeft: {
    type: String,
    default: "40px",
  },
  disabled: {
    type: Boolean,
    default: false,
  }
});
const emit = defineEmits(["select","select-id"]);
const isMenuOpen = ref(false);
const selectedOption = ref(props.defaultOption);
const toggleMenu = () => {
  if (props.disabled) return; // 비활성화 상태일 경우 메뉴 열리지 않음
  isMenuOpen.value = !isMenuOpen.value;
};
const selectOption = (option, id) => {
  if (props.disabled) return; // 비활성화 상태일 경우 옵션 선택 불가
  selectedOption.value = option;
  isMenuOpen.value = false;
  emit("select", option);
  emit("select-id", id);
};
</script>

<template>
  <div
      class="dropdown-container btn-gray"
      :style="{ width: width, height: height, fontSize: fontSize }"
      :class="{ 'disabled': disabled }"
      @click="toggleMenu"
  >
    <!-- 선택된 옵션 -->
    <div class="selected-option">
      <span>{{ selectedOption }}</span>
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
          @click.stop="selectOption(option.label, option.id)"
      >
        {{ option.label }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
.dropdown-container {
  border: none;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  position: relative;
  border-radius: 5px;
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
}
.options {
  list-style: none;
  padding: 0;
  border: 1px solid #afa9a9;
  position: absolute;
  background-color: white;
  color: #3c4651;
  border-radius: 5px;
  top: 100%; /* 버튼 바로 아래로 드롭다운 메뉴 표시 */
  left: 0; /* 왼쪽 정렬 */
  z-index: 10; /* 다른 요소 위에 표시 */
  margin-top: 4px;
  max-height: 200px;
  overflow-y: auto; /* 스크롤이 필요할 때 스크롤바 표시 */
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
  pointer-events: none; /* 클릭 이벤트 차단 */
  opacity: 0.5; /* 비활성화 상태를 시각적으로 표시 */
  cursor: not-allowed; /* 마우스 커서를 "금지" 아이콘으로 표시 */
}
</style>