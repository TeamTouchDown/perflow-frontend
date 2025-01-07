<script setup>
import { ref } from 'vue';

// Props 정의
const props = defineProps({
  placeholder: {
    type: String,
    default: '검색어를 입력하세요', // 기본 placeholder
  },
  width: {
    type: String,
    default: '300px', // 기본 너비
  },
  height: {
    type: String,
    default: '50px', // 기본 높이
  },
  fontSize: {
    type: String,
    default: '16px', // 기본 글꼴 크기
  },
  imgSize: {
    type: String,
    default: '30px',
  }
});

// 검색어를 관리할 변수
const searchText = ref('');
const emit = defineEmits(['search']); // 부모에게 전달할 이벤트 선언

const emitSearch = () => {
  emit('search', searchText.value); // search 이벤트 발생, 검색어 전달
};
</script>

<template>
  <div class="search-bar" :style="{ width: width, height: height }">
    <input
        type="text"
        v-model="searchText"
        :placeholder="placeholder"
        class="search-input"
        :style="{ fontSize: fontSize }"
        @keyup.enter="emitSearch"
    />
    <!-- 이미지 아이콘 -->
    <img
        src="../../assets/image/search.png"
        alt="검색"
        class="search-icon"
        @click="emitSearch"
        :style="{ width: props.imgSize, height: props.imgSize }"
    />
  </div>
</template>

<style scoped>
/* 검색 바 컨테이너 */
.search-bar {
  position: relative;
  display: inline-block;
  border: 1px solid #3c4651;
  border-radius: 10px; /* 둥근 테두리 */
  padding: 0 40px 0 10px;
  background-color: white;
  box-sizing: border-box;
}

/* 입력 필드 */
.search-input {
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  font-size: inherit;
  padding-right: 35px; /* 아이콘과 겹치지 않도록 오른쪽 여백 */
}

.search-input::placeholder {
  color: #afa9a9; /* 원하는 색상 */
}

/* 검색 아이콘 */
.search-icon {
  position: absolute;
  right: 10px; /* 오른쪽 여백 */
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  opacity: 0.5; /* 연하게 표시 */
}

.search-icon:hover {
  opacity: 1;
}
</style>

