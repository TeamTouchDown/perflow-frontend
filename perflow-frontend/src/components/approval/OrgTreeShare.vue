<script setup>
import {useStore} from "@/store/store.js";
import {useAuthStore} from "@/store/authStore.js";
import {onMounted, ref, watch} from "vue";
import OrgTreeNode from "@/components/approval/OrgTreeNode.vue";

const store = useStore();
const authStore = useAuthStore();

// 부서
const topDepts = ref([]);
// 사원
const emps = ref([]); // 선택된 부서의 사원 목록
const selectedEmps = ref([]); // 선택된 사원 목록
const loggedInEmpId = authStore.empId;  // 현재 로그인 한 사원 id
// 결재 방식
const selectedShareList = ref([]); // 공유 목록에 추가된 사원
const selectedDeleteList = ref([]); // 공유 목록에서 삭제할 사원

// emit
const emit = defineEmits(["updateShareList", "closeModal"]);

// 부모로 데이터 전달
const saveSelection = () => {
  console.log("[OrgTree] 선택된 데이터: ", selectedShareList.value);
  emit("updateShareList", [...selectedShareList.value]);
  emit("closeModal");
};

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

// 사원 선택 시 공유 리스트에 추가
const handleShare = () => {

  selectedEmps.value.forEach((empId) => {
    const employee = emps.value.find((emp) => emp.empId === empId);
    if (employee && !selectedShareList.value.some((e) => e.empId === empId)) {
      selectedShareList.value.push({
        empId: employee.empId,
        name: employee.name,
        position: employee.position,
      });
    }
  });

  // 선택 해제된 사원 제거
  selectedShareList.value = selectedShareList.value.filter((share) =>
    selectedEmps.value.includes(share.empId)
  );

}

// selectedEmps 변경 시 handleShare 호출
watch(selectedEmps, () => {
  handleShare();
});

// 공유 목록 사원 삭제
const deleteSelectedItems = () => {
  selectedShareList.value = selectedShareList.value.filter(
      (item) => !selectedDeleteList.value.includes(item.empId)
  );

  // 선택된 사원 목록에서 삭제
  selectedEmps.value = selectedEmps.value.filter(
      (empId) => !selectedDeleteList.value.includes(empId)
  );

  // 체크박스 초기화
  selectedDeleteList.value = [];
}

onMounted(() => {
  loadTopDepts();
})
</script>

<template>
  <div class="share-container">

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

      <!-- 선택된 사원 리스트 -->
      <div class="share-list-container">
        <div class="share-header">
          <span class="header-name">이름</span>
          <span class="header-position">직위</span>
        </div>
        <div class="share-list">
          <ul>
            <li v-for="emp in selectedShareList" :key="emp.empId">
              <span class="share-name">{{ emp.name }}</span>
              <span class="share-position">{{ emp.position }}</span>
              <input
                  type="checkbox"
                  :value="emp.empId"
                  v-model="selectedDeleteList"
              />
            </li>
          </ul>
        </div>

      </div>
    </div>

    <div class="share-buttons">
      <button class="delete-button" @click="deleteSelectedItems">삭제하기</button>
      <button class="save-button" @click="saveSelection">저장하기</button>
    </div>
  </div>

</template>

<style scoped>

.share-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-left: 50px;
}

.org-tree {
  display: flex;  /* 부서, 사원 목록을 한 행에 배치 */
}

.share-buttons {
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

.share-list-container {
  position: relative; /* 헤더를 컨테이너 안에 고정하기 위함 */
  width: 160px;
  height: 270px;
  border: 1px solid #d9d9d9;
  border-radius: 10px;
  overflow-y: auto; /* 스크롤 활성화 */
  padding: 50px 0 20px 0;
  margin-left: 20px;
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
.header-position {
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

.share-header .header-name {
  margin-left: 23px;
}
.share-header .header-position {
  margin-left: 25px;
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

.share-list-container ul {
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

.share-list li {
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

.emp-name {
  width: 80px;  /* 이름 칸 고정 너비 */
  text-align: left;
}
.emp-position {
  width: 50px;
  text-align: left;
}

.share-name {
  width: 80px;
  text-align: center;
}
.share-position {
  width: 50px;
  text-align: center;
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
.share-list-container::-webkit-scrollbar {
  width: 5px; /* 스크롤 바 너비 */
}

.tree-container::-webkit-scrollbar-track,
.emp-container::-webkit-scrollbar-track,
.share-list-container::-webkit-scrollbar-track {
  border: 10px;
}

.tree-container::-webkit-scrollbar-thumb,
.emp-container::-webkit-scrollbar-thumb,
.share-list-container::-webkit-scrollbar-thumb {
  background: #D9D9D9;
  border-radius: 10px;
}
</style>