<script setup>
import {useStore} from "@/store/store.js";
import {computed, ref} from "vue";
// Props로 부서 데이터 전달
const props = defineProps({
  parent : Object
});
const store = useStore();
const parentId = props.parent.deptId;

// 하위 부서 표시 상태 관리
const isExpanded = ref(false);
// 토글 함수
const toggle = () => {
  isExpanded.value = !isExpanded.value;
};
// 하위 메뉴 존재 여부 파악
const hasChildren = computed(() => {
  return store.$state.allDepartment.some(dept => dept.managedDeptId === props.parent.deptId);
});
const checkDept = (event, deptId) => {
  if(event.target.checked){
    store.addEmp(Number(deptId));
  } else {
    store.removeEmp(Number(deptId));
  }
}
</script>

<template>
  <li class="menu-item">
    <!-- 현재 부서 이름 출력 -->
    <input type="checkbox" @click="checkDept($event,props.parent.deptId)" class="check">
    <p class="item-name" @click="toggle">{{ props.parent.name }}</p>
    <span v-if="hasChildren" class="arrow" :class="{ expanded: isExpanded }" @click="toggle">▼</span>
  </li>
  <!-- 하위 부서 렌더링 -->
  <ul v-if="isExpanded" class="menu">
    <DepartmentNode
        v-for="child in store.$state.allDepartment.filter(dept => dept.managedDeptId === parentId)"
        :key="child.deptId"
        :parent="child"
    />
  </ul>
</template>
<style>
.menu-item {
  display: flex;
  align-items: center;
}
.item-name {
  padding: 0;
  margin: 0;
  font-size: 20px;
}
.check {
  margin-right: 20px;
}
.menu-item:hover {
  list-style: none;
  background-color: #F7F7F7;
}

.arrow {
  transition: transform 0.2s ease;
  font-size: 12px;
  cursor: pointer;
  color: #AFA9A9;
  padding: 0;
  margin: 0 0 0 10px;
}
/* 토글 상태에 따른 화살표 회전 */
.arrow.expanded {
  transform: rotate(180deg);
}
</style>