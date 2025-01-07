<script setup>
const props = defineProps({
  establish:String,
  address:String,
  contact:String,
  email:String
})
</script>

<template>
  <div id="info-main-container">
    <div class="info-header-item"><span class="item-title">설립일</span><p>{{props.establish}}</p></div>
    <div class="info-header-item"><span class="item-title">회사 주소</span><p>{{props.address}}</p></div>
    <div class="info-header-item"><span class="item-title">회사 연락처</span><p>{{props.contact}}</p></div>
    <div class="info-header-item"><span class="item-title">회사 이메일</span><p>{{props.email}}</p></div>
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