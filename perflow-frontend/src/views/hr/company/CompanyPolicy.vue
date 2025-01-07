<script setup>
const props = defineProps({
  paymentDatetime:Number,
  annualCount:Number,
})
</script>

<template>
  <div id="info-main-container">
    <div class="info-header-item"><span class="item-title">급여 지급일</span><p>매월 {{props.paymentDatetime}}일</p></div>
    <div class="info-header-item"><span class="item-title">최소 연차 개수</span><p>{{props.annualCount}}개</p></div>
  </div>
</template>

<style scoped>
#info-main-container{
  width: 900px;
  margin-bottom: 50px;
}
#info-main-container {
  display: flex;
  flex-direction: column;
  gap: 30px;
}
p {
  margin: 0;
  padding: 0;
}
.info-header-item {
  display: flex;
  gap: 20px;
}
.item-title {
  font-weight: bold;
  color: black;
}
</style>