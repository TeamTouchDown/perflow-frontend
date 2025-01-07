<script setup>
import {ref} from "vue";

const props = defineProps({
      title: String
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
    <input class="input-text" type="text" @input="onInputChange">
  </div>
</template>

<style scoped>
.input-container {
  margin-bottom: 10px;
}
.title {
  font-weight: bold;
  margin-bottom: 15px;
}
.input-text {
  width: 350px;
  height: 50px;
  border-radius: 5px;
  border: 1px solid #D9D9D9;
}
</style>