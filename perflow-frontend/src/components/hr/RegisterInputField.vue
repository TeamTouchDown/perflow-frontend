<script setup>
import {ref} from "vue";

const props = defineProps({
      title: String,
      placeholder: String,
      // 버튼 크기
      size: {
        type: String,
        default: 'small'
      }
});
const emit = defineEmits(['update-value']);

const inputValue = ref('');

function onInputChange(event) {
  inputValue.value = event.target.value;
  emit('update-value', inputValue.value); // 부모에게 값 전달
}

</script>

<template>
  <div class="input-container">
    <p class="title">{{props.title}}</p>
    <input class="input-text" type="text"
           @input="onInputChange"
           :placeholder=props.placeholder
           :class="[`input-${size}`]"
    >
  </div>
</template>

<style scoped>
p {
  padding: 0;
  margin: 0;
}
.input-container {
  display: grid;
  grid-template-columns: 80px 400px;
  align-items: center;
}
.title {
  font-weight: bold;
}
.input-text {
  height: 40px;
  border-radius: 5px;
  border: 1px solid #D9D9D9;
  padding-left: 10px;
}
.input-small {
  width: 200px;
}
.input-medium {
  width: 300px;
}
.input-large {
  width: 400px;
}
</style>