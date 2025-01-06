<script setup>
import { useStore } from "@/store/store.js";
import { ref, onMounted } from "vue";
import OrgTreeNode from "@/components/approval/OrgTreeNode.vue";
import {useAuthStore} from "@/store/authStore.js";
import draggable from "vuedraggable";
import Alert from "@/components/common/Alert.vue";

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
const selectedDeleteList = ref([]); // 결재 목록에서 삭제할 사원

// emit
const emit = defineEmits(["updateApprovalList", "closeModal"]);

// 부모로 데이터 전달
const saveSelection = () => {
  console.log("[OrgTree] 선택된 데이터: ", selectedApprovalList.value);
  emit("updateApprovalList", [...selectedApprovalList.value]);
  emit("closeModal");
}

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
    showAlert("사원을 선택해주세요.");
    return;
  }

  // 병렬, 병렬 합의 처리
  if ((type === "병렬" || type == "병렬합의") && selectedEmps.value.length < 2) {
    showAlert("최소 2명 이상을 선택해주세요.");
    return;
  }

  // 중복 체크
  const duplicates = selectedEmps.value.filter(empId =>
      selectedApprovalList.value.some(item => item.empId === empId)
  );

  if (duplicates.length > 0) {
    showAlert("이미 결재 목록에 추가한 사원이 있습니다.");
    return;
  }

  // 선택된 사원을 결재 방식과 함께 추가하기
  selectedEmps.value.forEach((empId) => {
    const employee = emps.value.find((emp) => emp.empId === empId);
    if (employee) {
      selectedApprovalList.value.push({
        empId: employee.empId,
        order: selectedApprovalList.value.length + 1,
        name: employee.name,
        position: employee.position,
        type: type,
      });
    }
  });

  // 체크박스 초기화
  selectedEmps.value = [];
};

// 드래그 하여 결재 순서 변경
const updateOrder = () => {
  selectedApprovalList.value.forEach((item, index) => {
    item.order = index + 1;
  });
}

// 결재 목록 리스트의 사원 삭제
const deleteSelectedItems = () => {
  selectedApprovalList.value = selectedApprovalList.value.filter(
      (item) => !selectedDeleteList.value.includes(item.empId)
  );
  // 체크박스 초기화
  selectedDeleteList.value = [];

  // 순서 업데이트
  updateOrder();
}

const alertVisible = ref(false);
const alertMsg = ref('');
const showAlert = (msg) => {
  alertMsg.value = msg;
  alertVisible.value = true;
}

onMounted(() => {
  loadTopDepts();
})

</script>

<template>
  <Alert
     v-model="alertVisible"
     :message="alertMsg"
   />
  <div class="approval-container">
    <div class="org-tree">

      <!-- 부서 목록 -->
      <div class="tree-container">
        <div class="tree-header">
        </div>
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
        <div class="emp-header">
          <span class="header-name">이름</span>
          <span class="header-position">직위</span>
        </div>
        <div class="emp-list">
          <ul>
            <li v-for="emp in emps" :key="emp.empId">
              <input
                  type="checkbox"
                  :value="emp.empId"
                  v-model="selectedEmps"
              />
              <span class="emp-name">{{ emp.name }}</span>
              <span class="emp-position">{{ emp.position }}</span>
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
              class="styled-button"
              @click="handleApproval(type)"
          >
            <span class="button-text">{{ type }}</span>
            <img src="@/assets/icons/approval_button_arrow.png" alt="arrow" class="button-arrow" />
          </button>
        </div>
      </div>

      <!-- 선택된 사원 리스트 -->
      <div class="approval-list-container">
        <div class="share-header">
          <span class="header-order">순서</span>
          <span class="header-type">결재종류</span>
          <span class="header-name">이름</span>
          <span class="header-position">직위</span>
        </div>
        <draggable
            v-model="selectedApprovalList"
            class="type-list"
            @end="updateOrder"
        >
          <template #item="{ element }">
            <li>
              <span class="type-order">{{ element.order }}</span>
              <span class="type-type">{{ element.type }}</span>
              <span class="type-name">{{ element.name }}</span>
              <span class="type-position">{{ element.position }}</span>
              <input
                  type="checkbox"
                  :value="element.empId"
                  v-model="selectedDeleteList"
                  class="delete-checkbox"
              />
            </li>
          </template>
        </draggable>
      </div>
    </div>
    <div class="approval-buttons">
      <button class="delete-button" @click="deleteSelectedItems">삭제하기</button>
      <button class="save-button" @click="saveSelection">저장하기</button>
    </div>
  </div>

</template>

<style scoped>
.approval-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-left: 50px;
}

.org-tree {
  display: flex;  /* 부서, 사원 목록을 한 행에 배치 */
}

.approval-buttons {
  display: flex;
  justify-content: flex-end;  /* 버튼 오른쪽 정렬 */
  gap: 10px;  /* 버튼 간 간격 */
}

.tree-container {
  position: relative; /* 헤더를 컨테이너 안에 고정하기 위함 */
  width: 200px;
  height: 270px;
  border: 1px solid #d9d9d9;
  border-right: none; /* 사원 목록과 겹치는 테두리 삭제 */
  border-radius: 10px 0 0 10px;
  overflow: auto; /* 스크롤 활성화 */
  padding: 50px 20px 20px 20px;
}

.emp-container {
  position: relative; /* 헤더를 컨테이너 안에 고정하기 위함 */
  width: 180px;
  height: 270px;
  border: 1px solid #d9d9d9;
  border-radius: 0 10px 10px 0;
  overflow-y: auto; /* 스크롤 활성화 */
  padding: 50px 20px 20px 20px;
}

.button-container {
  display: flex;
  flex-direction: column; /* 버튼을 세로로 배치 */
  justify-content: center;
  width: 150px; /* 부서, 사원 목록과 사이즈 맞춤 */
  height: 270px;
  padding: 20px;
}

.approval-list-container {
  position: relative; /* 헤더를 컨테이너 안에 고정하기 위함 */
  width: 270px;
  height: 270px;
  border: 1px solid #d9d9d9;
  border-radius: 10px;
  overflow-y: auto; /* 스크롤 활성화 */
  padding: 50px 0px 20px 20px;
}

/* 컨테이너 헤더 */
.tree-header,
.emp-header,
.share-header {
  position: absolute; /* 헤더를 컨테이너 상단에 고정 */
  top: 10px;
  left: 0;
  width: 100%;
  height: 30px;
  background-color: #F3F3F3;
  padding: 5px;
  display: flex;
  gap: 20px;
}

.header-name,
.header-position,
.header-type,
.header-order {
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  color: #817F7F;
}

.emp-header .header-name {
  margin-left: 35px;
}
.emp-header .header-position {
  margin-left: 30px;
}

.share-header .header-type {
  margin-left: 0px;
}
.share-header .header-name {
  margin-left: 13px;
}
.share-header .header-position {
  margin-left: 20px;
}
.share-header .header-order {
  margin-left: 10px;
  margin-right: 0px;
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

/* 목록 체크박스, 이름, 직위, 결재종류 스타일 */
.emp-list li {
  display: flex;
  align-items: center;  /* 체크박스와 텍스트를 수직 정렬 */
  gap: 5px;  /* 체크박스, 텍스트 간 간격 */
  padding: 1px 0; /* row 상하 간격 */
}

.type-list li {
  display: flex;
  align-items: center;
  padding: 3px 0;
}

.emp-name,
.emp-position {
  white-space: nowrap;  /* 줄바꿈 x */
  overflow: hidden; /* 텍스트가 길면 숨김 */
  text-overflow: ellipsis;  /* 텍스트가 길면 ... 추가 */
}

.type-type,
.type-name,
.type-position {
  white-space: nowrap;  /* 줄바꿈 x */
  overflow: hidden; /* 텍스트가 길면 숨김 */
  text-overflow: ellipsis;  /* 텍스트가 길면 ... 추가 */
}

.emp-name {
  width: 80px;  /* 이름 칸 고정 너비 */
  text-align: left;
}
.emp-position {
  width: 50px;
  text-align: left;
}

.type-type {
  width: 60px;
  text-align: center;
  margin-left: 20px;
}
.type-name {
  width: 80px;
  text-align: center;
}
.type-position {
  width: 40px;
  text-align: center;
  margin-right: 10px;
}

/* 결재 방식 버튼 스타일 */
.styled-button {
  display: flex; /* 버튼 텍스트와 > 를 가로 배치 */
  align-items: center;  /* 세로 정렬 */
  justify-content: space-between; /* 버튼 텍스트, > 를 양쪽으로 정렬 */
}

.styled-button:hover {
  background-color: #F7F7F7; /* 마우스 올릴 때 배경색 변경 */
}

.button-group button {
  background-color: #fff;
  color: #3C4651;
  border: 1px solid #AFA9A9;
  border-radius: 7px;
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
  width: 80px;
  padding: 7px;
  text-align: center; /* 버튼 텍스트 가운데 정렬 */
  margin: 5px;
}

/* 결재 목록 행 삭제 버튼 */
.delete-button {
  background-color: #D9D9D9;
  color: #3C4651;
  border: none;
  cursor: pointer;
}
.delete-button:hover {
  background-color: #F7F7F7; /* 마우스 올릴 때 배경색 변경 */
}
/* 결재 목록 저장 버튼 */
.save-button {
  background-image: linear-gradient(to right, #f37321 0%, #fb0 100%);
  color: white;
  border: none;
}

.delete-button,
.save-button {
  width: 100px;
  height: 45px;
  border-radius: 8px;
}


/* 스클로 바 스타일 */
.tree-container::-webkit-scrollbar,
.emp-container::-webkit-scrollbar,
.approval-list-container::-webkit-scrollbar {
  width: 5px; /* 스크롤 바 너비 */
}

.tree-container::-webkit-scrollbar-track,
.emp-container::-webkit-scrollbar-track,
.approval-list-container::-webkit-scrollbar-track {
  border: 10px;
}

.tree-container::-webkit-scrollbar-thumb,
.emp-container::-webkit-scrollbar-thumb,
.approval-list-container::-webkit-scrollbar-thumb {
  background: #D9D9D9;
  border-radius: 10px;
}
</style>