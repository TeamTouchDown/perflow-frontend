<script setup>

// 사용법 예시
// <InputField
//   v-model="title"
//   label="제목"
//   placeholder="제목을 입력해 주세요."
//   :isRequired="true"
//   textColor="#3C4651"
//   placeHolderColor="#AFA9A9"
//   borderColor="#AFA9A9"
// />
import { computed } from "vue";

const props = defineProps({
  modelValue: { type: String, default: "" },
  label: { type: String, default: "" },
  placeholder: { type: String, default: "" },
  isRequired: { type: Boolean, default: false },
  type: { type: String, default: "input" },
  inputType: { type: String, default: "text" },
  textColor: { type: String, default: "#3C4651" },
  placeholderColor: { type: String, default: "#AFA9A9" },
  borderColor: { type: String, default: "#AFA9A9" },
  backgroundColor: { type: String, default: "#fff" },
  width: { type: String, default: "500px" },
  height: { type: String, default: "40px" },
  fontWeight: { type: String, default: "normal" },
  labelFontWeight: { type: String, default: "bold" }, // 라벨 폰트 두께
});

const inputStyles = computed(() => ({
  color: props.textColor,
  borderColor: props.borderColor,
  backgroundColor: props.backgroundColor,
  fontWeight: props.fontWeight,
  width: props.width,
  height: props.height,
}));

const labelStyles = computed(() => ({
  fontWeight: props.labelFontWeight, // 라벨 글씨 두께
}));
</script>

<template>

  <div class="input-field">
    <!-- 라벨 -->
    <label
        v-if="label"
        :style="labelStyles"
        :class="['label', { required: isRequired }]"
    >
      {{ label }} <span v-if="isRequired" class="required">*</span>
    </label>

    <!-- Input 필드  -->
    <input
        v-if="type === 'input'"
        :type="inputType"
        :placeholder="placeholder"
        :style="inputStyles"
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
    />

    <!-- Textarea -->
    <textarea
        v-else-if="type === 'textarea'"
        :placeholder="placeholder"
        :style="inputStyles"
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
    ></textarea>
  </div>

</template>

<style scoped>
.input-field {
  display: flex;
  align-items: flex-start;  /* 라벨을 필드 상단에 정렬 */
  margin-bottom: 30px;  /* 여러 InputField 위아래로 간격 주기 */
}

.label {
  font-size: 14px;
  margin-right: 35px;
  white-space: nowrap;  /* 라벨 줄바꿈 x */
  margin-top: 10px;
}

.label.required .required {
  color: red;
}

input,
textarea {
  padding: 8px;
  border: 1px solid;
  border-radius: 10px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.3s;
  resize: none;
}
</style>