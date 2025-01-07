<script setup>
const goBack = () => {
  window.history.back();
}

</script>

<template>
  <div id="back-button" @click="goBack">
    뒤로가기
  </div>
</template>

<style scoped>
#back-button {
  cursor: pointer;
  width: 100px;
  height: 40px;
  border: none;
  border-radius: 10px;
  background-color: #D9D9D9 ;
  display: flex;
  align-items: center;
  justify-content: center;
}
#back-button:hover {
  background-color: #C9C9C9;
}
</style>