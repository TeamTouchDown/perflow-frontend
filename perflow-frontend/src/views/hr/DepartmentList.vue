<script setup>

import HeaderContainer from "@/components/hr/HeaderContainer.vue";
import ButtonBasic from "@/components/common/ButtonBasic.vue"
import DepartmentTree from "@/components/hr/department/DepartmentTree.vue";
import DepartmentSelectedEmp from "@/components/hr/department/DepartmentSelectedEmp.vue";
import {ref} from "vue";
import DepartmentRegisterSideBar from "@/components/hr/sideBar/DepartmentRegisterSideBar.vue";


const isSidebarOpen = ref(false)

function showSidebar() {
  isSidebarOpen.value = true;
}
function hideSidebar() {
  isSidebarOpen.value = false;
}
</script>

<template>
  <DepartmentRegisterSideBar :isSidebarOpen="isSidebarOpen" @close-sidebar="hideSidebar" title="부서 등록"/>
  <div id="department-list-container">
    <header-container title="부서 관리"/>
    <div id="item-container">
      <div id="buttons">
        <ButtonBasic class="button-item" label="추가" @click="showSidebar"/>
      </div>
    </div>
    <div id="main-container">
      <div id="dept-tree">
        <DepartmentTree/>
      </div>
      <div id="emp-list">
        <DepartmentSelectedEmp/>
      </div>
    </div>
  </div>
</template>

<style scoped>
#department-list-container {
  display: flex;
  align-items: center;
  flex-direction: column;
}
#item-container {
  display: flex;
  justify-content: space-between;
  width: 900px;
  margin-top: 30px;
}
#main-container {
  display: flex;
  width: 900px;
  justify-content: space-between;
  margin-top: 10px;
}
.button-item {
  margin-right: 10px;
}
#dept-tree {
  width: 300px;
  border: 1px solid #3c4651;
  border-radius: 10px;
  height: 600px;
  padding: 20px;
}
#emp-list {
  width: 500px;
  border: 1px solid #3c4651;
  border-radius: 10px;
  height: 600px;
  overflow-y: auto;
}
</style>