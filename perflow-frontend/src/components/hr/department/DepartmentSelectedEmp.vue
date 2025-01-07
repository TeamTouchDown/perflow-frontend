<script setup>
import {useStore} from "@/store/store.js";
import {onMounted} from "vue";
import router from "@/router/router.js";
const store = useStore()
const goToDetail = (empId) => {
  router.push({name:'EmpDetail', params : { empId : empId } });
}
onMounted(()=>{
  store.clearAll();
});
</script>

<template>

  <div class="emp-container-header">
    <p class="item-title">사번</p>
    <p class="item-title">사원명</p>
    <p class="item-title">직위</p>
    <p class="item-title">부서</p>
  </div>
  <div v-for="empList in store.$state.allEmployee" class="emp-container">
    <div v-for="emp in empList">
      <div v-for="detail in emp" class="item-list" @click="goToDetail(detail.empId)">
        <p class="item">{{ detail.empId }}</p>
        <p class="item">{{ detail.position }}</p>
        <p class="item">{{ detail.name }}</p>
        <p class="item">{{ detail.department }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.emp-container {
  display: flex;
  align-items: center;
  flex-direction: column;
  width: 500px;
}
.emp-container-header {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  padding: 5px 40px;
  border-bottom: 1px solid #3c4651;
  font-weight: bold;
  width: 500px;
}
.item-title, .item {
  padding: 0;
  margin: 0;
  text-align: center;
}
.item-list {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  width: 500px;
  padding: 5px 40px;
  cursor: pointer;
}
.item-list:hover {
  background-color: #d9d9d9;
}
</style>
