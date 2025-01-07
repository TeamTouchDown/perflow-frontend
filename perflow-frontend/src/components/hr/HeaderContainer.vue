<script setup>

import ButtonBack from "@/components/common/ButtonBack.vue";

const props = defineProps({
  flow: String,
  title: String
});
</script>

<template>
  <div id="container-header">
    <div id="header-left">
      <p id="sub-title">{{ props.flow }}</p>
      <p id="container-title">{{ props.title }}</p>
    </div>
    <div>
      <ButtonBack class="back-button"/>
    </div>
  </div>
</template>

<style scoped>
#container-header {
  display: grid;
  grid-template-columns: 1fr 1fr;
  width: 900px;
}
#header-left{
  margin-top: 20px;
}
.back-button {
  float: right;
  margin-top: 50px;
}
#sub-title {
  font-size: 20px;
  padding: 0;
  margin: 0;
  height: 20px;
}
#container-title {
  font-size: 35px;
  font-weight: bold;
  color: #3C4651;
  margin-top: 10px;
}
</style>