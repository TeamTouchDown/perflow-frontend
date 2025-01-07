<script setup>
const emit = defineEmits(['submit']);
const props = defineProps({
  text:String
})
</script>

<template>
  <button class="submit-button" @click="emit('submit')">{{props.text}}</button>
</template>

<style scoped>
.submit-button {
  width: 350px;
  height: 50px;
  background: linear-gradient(90deg, #F37321, #FFBB00);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 20px;
  font-weight: bold;
  margin-top: 30px;
}
.submit-button:hover {
  background-color: #ff5a45;
}
</style>