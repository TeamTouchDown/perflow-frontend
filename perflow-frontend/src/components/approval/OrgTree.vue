<script setup>
import { useStore } from "@/store/store.js";
import { ref, onMounted } from "vue";
import OrgTreeNode from "@/components/approval/OrgTreeNode.vue";
import {useAuthStore} from "@/store/authStore.js";

const store = useStore();
const authStore = useAuthStore();

// 부서
const topDepts = ref([]);
// 사원
const emps = ref([]); // 선택된 부서의 사원 목록
const selectedEmps = ref([]); // 선택된 사원 목록
const loggedInEmpId = authStore.empId;  // 현재 로그인 한 사원 id
// 결재 방식
const approvalTypes = ref(["동의", "합의", "참조", "병렬", "병렬합의"]);
const selectedApprovalList = ref([]); // 결재 방식과 함께 추가된 사원


// 최상위 부서 로드
const loadTopDepts = async () => {

  await store.fetchOrg(); // 모든 부서 정보 가져오기
  topDepts.value = store.allDepartment.filter(
      (dept) => !dept.managedDeptId // 상위 부서만 필터링
  );
};

// 선택된 부서와 하위 부서의 모든 사원 로드
const loadEmpsByDept = async (deptId) => {
  await store.selectDept(deptId);
  emps.value = store.currentEmployees.filter(
      (emp) => emp.empId !== loggedInEmpId  // 현재 로그인 한 사용자는 제외
  );
}

// 결재 방식 버튼 클릭 시 결재 목록 리스트에 사원 추가
const handleApproval = (type) => {

  if (selectedEmps.value.length === 0) {
    alert("사원을 선택해주세요.");
    return;
  }

  // 병렬, 병렬 합의 처리
  if ((type === "병렬" || type == "병렬합의") && selectedEmps.value.length < 2) {
    alert("최소 2명 이상을 선택해주세요.");
    return;
  }

  // 중복 체크
  const duplicates = selectedEmps.value.filter(empId =>
      selectedApprovalList.value.some(item => item.empId === empId)
  );

  if (duplicates.length > 0) {
    alert("이미 결재 목록에 추가한 사원이 있습니다.");
    return;
  }

  // 선택된 사원을 결재 방식과 함께 추가하기
  selectedEmps.value.forEach((empId) => {
    const employee = emps.value.find((emp) => emp.empId === empId);
    if (employee) {
      selectedApprovalList.value.push({
        empId: employee.empId,
        name: employee.name,
        position: employee.position,
        type: type,
      });
    }
  });

  // 체크박스 초기화
  selectedEmps.value = [];
};

onMounted(() => {
  loadTopDepts();
})

</script>

<template>
  <div class="org-tree">

    <!-- 부서 목록 -->
    <div class="tree-container">
      <ul>
        <OrgTreeNode
            v-for="dept in topDepts"
            :key="dept.deptId"
            :dept="dept"
            @onSelectDept="loadEmpsByDept"
        />
      </ul>
    </div>

    <!-- 사원 목록 -->
    <div class="emp-container">
      <div class="emp-list">
        <ul>
          <li v-for="emp in emps" :key="emp.empId">
            <input
              type="checkbox"
              :value="emp.empId"
              v-model="selectedEmps"
            />
            {{ emp.name }} {{ emp.position }}
          </li>
        </ul>
      </div>
    </div>

    <!-- 결재 방식 버튼 -->
    <div class="button-container">
      <div class="button-group">
        <button
          v-for="type in approvalTypes"
          :key="type"
          @click="handleApproval(type)"
        >
          {{ type }}
        </button>
      </div>
    </div>

    <!-- 선택된 사원 리스트 -->
    <div class="approval-list-container">
      <ul>
        <li v-for="item in selectedApprovalList" :key="item.empId">
          {{ item.type }} {{ item.name }} {{ item.position }}
        </li>
      </ul>
    </div>
  </div>

</template>

<style scoped>

.org-tree {
  display: flex;  /* 부서, 사원 목록을 한 행에 배치 */
}

.tree-container {
  width: 200px;
  height: 270px;
  border: 1px solid #d9d9d9;
  border-right: none; /* 사원 목록과 겹치는 테두리 삭제 */
  border-radius: 10px 0 0 10px;
  overflow: auto; /* 스크롤 활성화 */
  padding: 20px;
}

.emp-container {
  width: 150px;
  height: 270px;
  border: 1px solid #d9d9d9;
  border-radius: 0 10px 10px 0;
  overflow-y: auto; /* 스크롤 활성화 */
  padding: 20px;
}

.button-container {
  display: flex;
  flex-direction: column; /* 버튼을 세로로 배치 */
  justify-content: center;
  gap: 10px;
  width: 150px; /* 부서, 사원 목록과 사이즈 맞춤 */
  height: 270px;
  padding: 20px;
}

.approval-list-container {
  width: 200px;
  height: 270px;
  border: 1px solid #d9d9d9;
  border-radius: 10px;
  padding: 20px;
}

/* ul, li 스타일 */
ul {
  list-style-type: none; /* 기본 리스트 스타일 제거 */
  margin: 0; /* 기본 여백 제거 */
}

li {
  list-style-type: none;
}

.emp-list ul {
  padding: 0px;
}

.tree-container ul {
  padding: 0px;
}

.approval-list-container ul {
  padding: 0px;
}

/* 결재 방식 버튼 스타일 */
button {
  background-color: #fff;
  color: #3C4651;
  border: 1px solid #AFA9A9;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
  width: 80px;
  padding: 5px;
  text-align: center; /* 버튼 텍스트 가운데 정렬 */
  margin: 5px;
}

/* 스클로 바 스타일 */
.tree-container::-webkit-scrollbar,
.emp-container::-webkit-scrollbar {
  width: 5px; /* 스크롤 바 너비 */
}

.tree-container::-webkit-scrollbar-track,
.emp-container::-webkit-scrollbar-track {
  border: 10px;
}

.tree-container::-webkit-scrollbar-thumb,
.emp-container::-webkit-scrollbar-thumb {
  background: #D9D9D9;
  border-radius: 10px;
}
</style>