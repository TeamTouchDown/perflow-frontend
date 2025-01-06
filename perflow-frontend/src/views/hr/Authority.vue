<script setup>

import HeaderContainer from "@/components/hr/HeaderContainer.vue";
import api from "@/config/axios.js";
import {computed, onMounted, ref} from "vue";
import SlideToggle from "@/components/common/SlideToggle.vue";
import {useStore} from "@/store/store.js";
import SearchBar from "@/components/common/SearchBar.vue";
import AppointRegisterSideBar from "@/components/hr/sideBar/AppointRegisterSideBar.vue";
import Alert from "@/components/common/Alert.vue";
import router from "@/router/router.js";

const employees = ref([]);
const selectedEmpId = ref(null);
const store = useStore();
// 선택된 사원 객체 계산
const selectedEmp = computed(() => {
  return employees.value.find(emp => emp.empId === selectedEmpId.value) || null;
});

const updateSelectedEmpId = (empId) => {
  selectedEmpId.value = empId;
}

// 권한을 체크하는 함수
const checkAuth = (number) => {
  if (!selectedEmp.value || !selectedEmp.value.authorities) return false;
  return selectedEmp.value.authorities.includes(number);
};
const successCreateModalVisible = ref(false);
const successModalVisible = ref(false);
const failModalVisible = ref(false);

const updateSuccessCreateModalVisible = (value) => {

  successCreateModalVisible.value = value;
}
const updateSuccessModalVisible = (value) => {

  successModalVisible.value = value;
}
const updateFailModalVisible = (value) => {

  failModalVisible.value = value;
}

// 사원 목록 조회
const fetchEmpList = async () => {

  const response = (await api.get("/employees/lists", {
    params: {
      page: 1,
      size: 10000
    }
  })).data;
  employees.value = response.employeeList;
}

// 사원 목록 검색
const fetchEmpListByName = async (name) => {
  const response = (await api.get("/employees/lists/search", {
    params: {
      page: 1,
      size: 10000,
      name: name
    }
  })).data;
  employees.value = response.employeeList;
}
const updateAuthority = async (checked, authId) => {

  try{
      store.showLoading()
    if(checked) {
      await api.post("/master/auth",{
        empId : selectedEmpId.value,
        authorityId : authId
      });
      updateSuccessCreateModalVisible(true);
    } else {
      await api.delete("/master/auth",{
        data:{
          empId : selectedEmpId.value,
          authorityId : authId
        }
      });
      updateSuccessModalVisible(true);
    }
    await fetchEmpList();
    store.hideLoading();
  } catch (error) {
    const errorMessage = error.response.data.message;
    // "ExceptionHandlerExceptionResolver" 오류를 무시
    if (errorMessage.includes("The given")) {
      console.warn("ExceptionHandlerExceptionResolver 오류는 무시되었습니다.");
      return; // 오류 무시
    }
    if (errorMessage){
      store.hideLoading()
      updateFailModalVisible(true);
    } else {
      store.hideLoading()
      updateFailModalVisible(true);
    }
  }
}

onMounted(()=>{
  fetchEmpList();
});
</script>

<template>
  <Alert :model-value=successCreateModalVisible message="권한 부여에 성공했습니다." @update:modelValue="updateSuccessCreateModalVisible"/>
  <Alert :model-value=successModalVisible message="권한 회수에 성공했습니다." @update:modelValue="updateSuccessModalVisible"/>
  <Alert :model-value=failModalVisible message="권한 부여중 오류가 발생했습니다." @update:modelValue="updateFailModalVisible"/>
  <div id="authority-container">
    <HeaderContainer title="권한 관리"/>
    <div id="menu"><p class="menu-list">사원 목록</p><p class="menu-list">권한목록</p></div>
    <div id="main-container">
      <div id="emp-list">
        <SearchBar width="220x" font-size="15px" placeholder="사원명" @search="fetchEmpListByName"/>
        <div v-for="emp in employees" id="emp" @click="updateSelectedEmpId(emp.empId)" :class="{ selected: emp.empId === selectedEmpId }">
          <p class="emp-id">{{emp.empId}}</p>
          <p class="emp-name">{{emp.name}}</p>
        </div>
      </div>
      <div id="authority-list">
        <div class="authority" v-if="selectedEmpId">
          <p class="auth-name">사원</p>
          <SlideToggle :model-value="checkAuth(1)" @change="updateAuthority" id=1 />
        </div>
        <div class="authority" v-if="selectedEmpId">
          <p class="auth-name">팀장</p>
          <SlideToggle :model-value="checkAuth(2)" @change="updateAuthority" id=2 />
        </div>
        <div class="authority" v-if="selectedEmpId">
          <p class="auth-name">인사관리자</p>
          <SlideToggle :model-value="checkAuth(3)" @change="updateAuthority" id=3 />
        </div>
        <div class="authority" v-if="selectedEmpId">
          <p class="auth-name">마스터</p>
          <SlideToggle :model-value="checkAuth(4)" @change="updateAuthority" id=4 />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
p {
  margin: 0;
}
#authority-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}
#main-container {
  width: 900px;
  display: flex;
  gap: 100px;
  margin-top: 20px;
}
#emp-list {
  width: 300px;
  height: 500px;
  border: 1px solid #D9D9D9;
  padding: 30px;
  font-size: 18px;
  border-radius: 10px;
  overflow-y: auto;

}
#authority-list {
  width: 500px;
  height: 300px;
  border: 1px solid #D9D9D9;
  border-radius: 10px;
  padding: 50px;
  display: flex;
  flex-direction: column;
  gap: 40px;
  align-items: center;
  justify-content: center;
}
#emp {
  display: flex;
  gap: 20px;
  cursor: pointer;
  height: 40px;
  align-items: center;
  padding: 5px;
}
#emp:hover {
  background-color: #D9D9D9;
}
.emp-id {
  width: 150px;
}
.emp-name {
  width: 150px;
}
.selected {
  background-color: #D9D9D9;
}
.auth-name {
  font-weight: bold;
  font-size: 20px;
  width: 150px;
}
.authority {
  display: flex;
  gap: 100px;
}
#menu {
  display: flex;
  width: 900px;
  margin-top: 20px;
  overflow-y: auto; /* 스크롤이 필요할 때 스크롤바 표시 */
}
.menu-list {
  width: 400px;
  margin: 0;
  text-align: left;
  font-size: 18px;
  font-weight: bold;
}
/* 스크롤바 전체 영역 */
#emp-list::-webkit-scrollbar {
  width: 3px; /* 스크롤바 너비 */
}

/* 스크롤바 트랙(바탕) 영역 */
#emp-list::-webkit-scrollbar-track {
  background: none; /* 트랙 배경색 */
}

/* 스크롤바 손잡이(thumb) 영역 */
#emp-list::-webkit-scrollbar-thumb {
  background: #D9D9D9; /* 손잡이 색상 */
  border-radius: 4px; /* 모서리를 둥글게 */
}

/* 마우스를 손잡이 위에 올렸을 때 색상 변환 */
#emp-list::-webkit-scrollbar-thumb:hover {
  background: #555; /* 손잡이 호버 색상 */
}
</style>