<script setup>

// props
import {useRouter} from "vue-router";
import {ref} from "vue";

const props = defineProps({
  options: {
    type: Array,
    required: true,
    default: () => [],
  },
  defaultOption: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["select"]);

const router = useRouter();

// 현재 선택된 옵션
const selectedOption = ref(props.defaultOption);

// 드롭다운 열림/닫힘 상태
const isDropdownOpen = ref(false);

// 옵션 클릭 시 동작
const selectOption = (option) => {
  selectedOption.value = option.label;
  isDropdownOpen.value = false; // 드롭다운 닫기
  router.push({ name: option.id }); // 페이지 이동
  emit("select", option); // 선택된 옵션 부모로 전달
};

// 클릭 외부 이벤트 처리
const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value;
};

</script>

<template>
  <div class="dropdown-container" @click.stop="toggleDropdown">
    <!-- 현재 선택된 옵션 표시 -->
    <div class="dropdown-selected">
      {{ selectedOption }}
      <img
        src="@/assets/image/arrow_down_2.png"
        alt="dropdown arrow"
        class="dropdown-arrow"
        :class="{ rotated: isDropdownOpen }"
      />
    </div>

    <!-- 드롭다운 옵션 목록 -->
    <ul v-if="isDropdownOpen" class="dropdown-options">
      <li
          v-for="option in props.options"
          :key="option.id"
          class="dropdown-option"
          @click="selectOption(option)"
      >
        {{ option.label }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
.dropdown-container {
  position: relative;
  width: 200px;
  cursor: pointer;
}

.dropdown-selected {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fff;
  border: 1px solid #AFA9A9;
  border-radius: 10px;
  padding: 10px;
  font-size: 14px;
  height: 35px;
}

.dropdown-arrow {
  width: 20px;
  height: 20px;
  transition: transform 0.3s ease;
}

.dropdown-arrow.rotated {
  transform: rotate(180deg);
}

.dropdown-options {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  background-color: #fff;
  border: 1px solid #AFA9A9;
  border-radius: 10px;
  margin-top: 5px;
  list-style: none;
  padding: 0;
  z-index: 1000;
}

.dropdown-option {
  padding: 8px;
  font-size: 14px;
  color: #3C4651;
  transition: background-color 0.2s, border-radius 0.2s;
}

.dropdown-option:hover {
  background-color: #F1F1F1;
  border-radius: 8px;
}
</style>