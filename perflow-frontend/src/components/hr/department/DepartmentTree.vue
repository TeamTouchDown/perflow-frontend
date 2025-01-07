<script setup>
import {onMounted} from 'vue';
import { useStore } from '@/store/store.js';
import DepartmentNode from "@/components/hr/department/DepartmentNode.vue";
const store = useStore();
onMounted(async () => {
  await store.fetchOrg(); // Pinia를 통해 데이터를 가져옵니다.
});
</script>
<!-- 최 상위 부서 컴포넌트 (부모) -->
<template>
  <ul class="menu">
    <!--    자식 컴포넌트 (재귀로 계속해서 호출) -->
    <DepartmentNode
        v-for="dept in store.$state.allDepartment.filter(dept => !dept.managedDeptId)"
        :key=dept.deptId
        :parent = dept
    />
  </ul>
</template>

<style scoped>
.menu {
  list-style: none;
}
</style>