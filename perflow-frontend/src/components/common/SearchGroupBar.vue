<script setup>
import Datepicker from 'vue3-datepicker';

const props = defineProps({
  modelValue: {
    type: [String, Date],
    default: "",
  },
  placeholder: {
    type: String,
    default: "검색어를 입력하세요",
  },
  type: {
    type: String,
    default: "text", // 'text' 또는 'date'
  },
  width: {
    type: String,
    default: "210px",
  },
  height: {
    type: String,
    default: "40px",
  },
});

const emit = defineEmits(["update:modelValue"]);

const updateValue = (value) => {
  emit("update:modelValue", value); // 부모 컴포넌트로 값 전달
};
</script>

<template>
  <div class="search-group-bar" :style="{ width: width, height: height }">
    <!-- 텍스트 입력 필드 -->
    <div class="search-container" v-if="type === 'text'">
      <input
          :type="type"
          :value="modelValue"
          @input="updateValue($event.target.value)"
          :placeholder="placeholder"
          class="search-input"
      />
    </div>
    <!-- 날짜 선택 필드 -->
    <div class="search-container" v-else>
      <Datepicker
          :model-value="modelValue"
          @update:model-value="updateValue"
          :placeholder="placeholder"
          :format="'YYYY-MM-DD'"
          :clearable="true"
          :masks="{ input: 'YYYY-MM-DD' }"
          class="datepicker"
      />
    </div>
  </div>
</template>

<style scoped>
.search-group-bar {
  display: inline-block;
  width: 100%;  /* 부모에게 전달 받은 width 적용 */
  height: 100%;
}

.search-input,
.datepicker {
  border: 1px solid #AFA9A9;
  border-radius: 10px;
  padding: 8px 10px 8px 10px;
  background-color: white;
  width: 100%;
  height: 100%;
  font-size: 14px;
}

/* datepicker */
::v-deep(.datepicker) {
  border: 1px solid #AFA9A9;
  border-radius: 10px;
  padding: 8px 10px 8px 10px;
  background-color: white;
  height: 40px;
  width: 210px;
  font-size: 14px;
}

.search-container {
  height: 100%
}
.search-input {
  height: 100%; /* 부모의 height */
  box-sizing: border-box; /* padding 포함 */
}
</style>
