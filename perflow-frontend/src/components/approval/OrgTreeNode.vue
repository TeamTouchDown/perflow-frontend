<script setup>

import {useStore} from "@/store/store.js";
import {ref} from "vue";

// props
const props = defineProps({
  // 하위 부서 정보
  dept: {
    type: Object,
    required: true,
  },
});

// emit
const emit = defineEmits(["onSelectDept"]); // OrgTree 로 선택한 부서 전달

const expandedDepts = ref(new Set());
const store = useStore();

// 하위 부서 로드 및 트리 확장/축소
const toggleSubDepts = (dept) => {
  if (!expandedDepts.value.has(dept.deptId)) {
    expandedDepts.value.add(dept.deptId); // 트리 확장
    if (!dept.subDepts) {
      dept.subDepts = []; // 초기화
    }
    // 하위 부서 로드
    dept.subDepts = store.allDepartment.filter(
        (subDept) => subDept.managedDeptId === dept.deptId
    );
  } else {
    expandedDepts.value.delete(dept.deptId); // 트리 축소
  }
};

// 부서 클릭 시 사원 업데이트
const selectDept = () => {
  emit("onSelectDept", props.dept.deptId);
}

</script>

<template>
  <li>
    <div class="dept-container">
      <!-- 부서 버튼 -->
      <span class="toggle-btn" @click.stop="toggleSubDepts(dept)">
        {{ expandedDepts.has(dept.deptId) ? "▼" : "▶" }}
      </span>
      <!-- 부서 이름 -->
      <span class="dept-name" @click="selectDept">
        {{ dept.name }}
      </span>
    </div>
    <!-- 하위 부서 렌더링 -->
    <ul v-if="expandedDepts.has(dept.deptId)">
      <OrgTreeNode
          v-for="subDept in dept.subDepts"
          :key="subDept.deptId"
          :dept="subDept"
          @onSelectDept="$emit('onSelectDept', $event)"
      />
    </ul>
  </li>

</template>

<style scoped>

.dept-container {
  display: flex;
  align-items: center;
  cursor: pointer;
}

/* ▼, ▶ 스타일 */
.toggle-btn {
  margin-right: 5px;
  cursor: pointer;
  font-weight: bold;
  font-size: 10px;
  color: #AFA9A9;
}

.dept-name {
  cursor: pointer;
  color: #3C4651;
}

.dept-name:hover {
  color: #f37321;
  text-decoration: underline;
}

/* 부서, 사원 이름 스타일 */
ul {
  list-style-type: none; /* 기본 리스트 스타일 제거 */
  margin: 0; /* 기본 여백 제거 */
}

</style>