<script setup>
import {ref} from "vue";

const props = defineProps({
  title: String,
  placeholder1: String,
  placeholder2: String
});
const emit = defineEmits(['update-value']);

const inputValue = ref('');

function onInputChange(event) {
  inputValue.value = event.target.value;
  emit('update-value', inputValue.value); // 부모에게 값 전달
}


</script>

<template>
  <div id="input-container">
    <p id="title">{{props.title}}</p>
    <input class="input-text" type="text" id="front"
           @input="onInputChange"
           :placeholder=props.placeholder1
           maxlength="6"
    >
    <p id="rrn-dash">-</p>
    <input class="input-text" type="password" id="back"
           @input="onInputChange"
           :placeholder=props.placeholder2
           maxlength="7"
    >
  </div>
</template>

<style scoped>
p {
  padding: 0;
  margin: 0;
}
#input-container {
  display: grid;
  grid-template-columns: 80px 200px 30px 200px;
  align-items: center;
}
#title {
  font-weight: bold;
}
#rrn-dash {
  font-weight: bold;
  font-size: 20px;
  text-align: center;
}
.input-text {
  height: 40px;
  width: 200px;
  border-radius: 5px;
  border: 1px solid #D9D9D9;
  padding-left: 10px;
}
</style>