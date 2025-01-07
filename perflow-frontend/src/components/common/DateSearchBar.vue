<script setup>
import {ref, watch} from 'vue';
import Datepicker from 'vue3-datepicker'; // vue3-datepicker 라이브러리 가져오기

// Props 정의
const props = defineProps({
  placeholder: {
    type: String,
    default: 'YYYY-MM-DD', // 기본 placeholder
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
const searchDate = ref('');
const emit = defineEmits(['date','dateSelected']); // 부모에게 전달할 이벤트 선언

// Datepicker 열기 위한 ref
const datepickerRef = ref(null);

// 검색 이벤트 발생
const emitSearch = () => {
  emit('date', searchDate.value); // search 이벤트 발생, 검색어 전달
};
// watch를 사용하여 searchDate가 변경될 때 이벤트 emit
watch(searchDate, (newDate) => {
  if (newDate) {
    emit('dateSelected', newDate)
  }
})

</script>

<template>
  <div class="date-bar" :style="{ width: width, height: height }">
    <!-- Datepicker 컴포넌트 -->
    <datepicker
        v-model="searchDate"
        :format="'yyyy-MM-dd'"
        ref="datepickerRef"
        class="date-input"
        :placeholder="placeholder"
        :style="{ fontSize: fontSize }"
    />
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
.date-bar {
  position: relative;
  display: flex; /* flex로만 설정 */
  justify-content: space-between; /* 콘텐츠가 좌우로 배치되도록 설정 */
  align-items: center; /* 세로 가운데 정렬 */
  border: 1px solid #3c4651;
  border-radius: 10px; /* 둥근 테두리 */
  padding: 0 40px 0 10px;
  background-color: white;
  box-sizing: border-box;
}

/* Datepicker 컴포넌트의 기본 테두리 없애기 */
:deep(.v3dp__input_wrapper input) {
  border: none;
  outline: none;
  width: 100%;
  height: 100%;
  font-size: inherit;
  line-height: 50%;
  padding-right: 35px; /* 오른쪽 여백 */
  color: #3c4651;
}

:deep(.v3dp__input_wrapper input)::placeholder {
  color: #afa9a9; /* 원하는 색상 */
}

/* 검색 아이콘 스타일 */
.search-icon {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  opacity: 0.5;
}

.search-icon:hover {
  opacity: 1;
}
</style>
