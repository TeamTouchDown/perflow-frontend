<script setup>
import {computed, ref} from 'vue';
import SearchBar from "@/components/common/SearchBar.vue";

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
  }
});

const search = ref("");

const updateSearch = (value) => {
  search.value = value;
}

// 검색어를 포함하는 옵션을 필터링하는 computed 프로퍼티
const searchOptions = computed(() => {
  if (!search.value) {
    return props.options;
  }
  return props.options.filter(option =>
      option.label.includes(search.value)
  );
});
const emit = defineEmits(["select","select-id"]);

const isMenuOpen = ref(false);
const selectedOption = ref(props.defaultOption);

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
  search.value = "";
};

const selectOption = (option, id) => {
  selectedOption.value = option + "(" + id + ")";
  isMenuOpen.value = false;
  emit("select", option);
  emit("select-id", id);
};
</script>

<template>
  <div
      class="dropdown-container btn-gray"
      :style="{ width: width, height: height, fontSize: fontSize }"
  >
    <!-- 선택된 옵션 -->
    <div class="selected-option">
      <span>{{ selectedOption }}</span>
      <img
          v-if="isMenuOpen"
          src="../../assets/image/arrow_up_2.png"
          alt="up"
          :style="{ width: imgSize, height: imgSize, marginLeft: marginLeft }"
          @click="toggleMenu"
      />
      <img
          v-else
          src="../../assets/image/arrow_down_2.png"
          alt="down"
          :style="{ width: imgSize, height: imgSize, marginLeft: marginLeft }"
          @click="toggleMenu"
      />
    </div>

    <!-- 드롭다운 옵션 메뉴 -->
    <ul
        v-if="isMenuOpen"
        class="options"
        :style="{ fontSize: fontSize, width: width }"
    >
      <li><SearchBar width="180px" height="30px" font-size="12px" placeholder="검색어 입력" @search="updateSearch"/></li>
      <li
          v-for="(option, index) in searchOptions"
          :key="index"
          @click.stop="selectOption(option.label, option.id)"
      >
        {{ option.label }} ( {{option.id}} )
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
  left: 0;   /* 왼쪽 정렬 */
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

</style>
