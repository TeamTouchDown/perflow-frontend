<script setup>

import {computed, onMounted, reactive, ref} from "vue";
import SubmitButton from "@/components/hr/SubmitButton.vue";
import api from "@/config/axios.js";
import ButtonDropDown from "@/components/common/ButtonDropDown.vue";
import DateSearchBar from "@/components/common/DateSearchBar.vue";
import EmpButtonDropDown from "@/components/common/SearchButtonDropDown.vue";
import HRButtonDropDown from "@/components/hr/HRButtonDropDown.vue";
import router from "@/router/router.js";
import Alert from "@/components/common/Alert.vue";

const props = defineProps({
      isSidebarOpen: {
        type: Boolean,
        default: false
      },
      title: String
});
const emit = defineEmits(['close-sidebar'])

const types = [
  { id: "PROMOTION", label: '승진' },
  { id: "DEMOTION", label: '강등' },
  { id: "TRANSFER", label: '부서이동' },
  { id: "CHANGE_JOB", label: '직책 변경' },
];

const empId = ref();
const after = ref();
const type = ref();
const appointDate = ref();

const jobList = ref();
const positionList = ref();
const deptList = ref();
const empList = ref();

const updateEmpId= (value) => {
  empId.value = value;
}
const updateAfter = (value) => {
  after.value = value;
}
const updateAppointDate = (value) => {
  appointDate.value = value;
}
const updateType = (value) => {
  type.value = value
}
const fetchDeptList = async () => {
  const response = await api.get("/departments/list");
  deptList.value = response.data.map(dept => ({ label: dept.name, id: dept.deptId }));
}
const fetchJobList = async () => {
  const response = await api.get("/job", {
    params: {
      page: 1,
      size: 10000
    }
  });
  jobList.value = response.data.jobResponseDTOList.map(job => ({ label: job.name, id: job.jobId }));
}
const fetchPositionList = async () => {
  const response = await api.get("/position", {
    params: {
      page: 1,
      size: 10000
    }
  });
  positionList.value = response.data.positions.map(position => ({ label: position.name, id: position.positionId }));
}
const fetchEmpList = async () => {

  const response = (await api.get("/employees/lists", {
    params: {
      page: 1,
      size: 10000
    }
  })).data;
  empList.value = response.employeeList.map(emp => ({ label: emp.name, id: emp.empId }));
}

const successModalVisible = ref(false);
const failModalVisible = ref(false);

const updateSuccessModalVisible = (value) => {

  successModalVisible.value = value;
  if(value === false ){
    location.reload();
  }
}
const updateFailModalVisible = (value) => {

  failModalVisible.value = value;
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
  empList.value = response.employeeList;
}
const registerAppoint = async () => {
  try {
    await api.post("/hr/appoint",{
      empId : empId.value,
      type : type.value,
      after : after.value,
      appointDate : appointDate.value
    });
    updateSuccessModalVisible(true);
  } catch (error) {
    if (error.response.data.message){
      updateFailModalVisible(true);
    } else {
      updateFailModalVisible(true);
    }
  }
}
function closeSidebar() {
  emit('close-sidebar')
}
onMounted(()=>{
  fetchDeptList();
  fetchPositionList();
  fetchJobList();
  fetchEmpList();
})
</script>

<template>
  <Alert :model-value=successModalVisible message="발령 등록에 성공했습니다!" @update:modelValue="updateSuccessModalVisible"/>
  <Alert :model-value=failModalVisible message="발령 등록 중 오류가 발생했습니다." @update:modelValue="updateFailModalVisible"/>
  <div class="modify-sidebar" :class="{ open: props.isSidebarOpen }">
  <div id="side-header">
    <img src="../../../assets/image/arrow-right.png" @click="closeSidebar" id="close">
    <p id="title">{{props.title}}</p>
  </div>
  <div id="modify-contents">
    <div>
      <p>사원명</p>
      <EmpButtonDropDown default-option="사원을 선택하세요"
                      width="220px" height="40px" font-size="13px" :options="empList" @select-id="updateEmpId"/>
    </div>
    <div>
      <p>발령 구분</p>
      <HRButtonDropDown default-option="발령 구분을 선택하세요"
                      width="220px" height="40px" font-size="13px" :options="types" @select-id="updateType"/>
    </div>
    <div v-if="type===types[0].id || type===types[1].id ">
      <p>직급 선택</p>
      <HRButtonDropDown default-option="직급을 선택하세요"
                      width="220px" height="40px" font-size="13px" :options="positionList" @select-id="updateAfter"/>
    </div>
    <div v-if="type===types[2].id">
      <p>부서 선택</p>
      <HRButtonDropDown default-option="부서를 선택하세요"
                      width="220px" height="40px" font-size="13px"
                      :options="deptList" @select-id="updateAfter"/>
    </div>
    <div v-if="type===types[3].id">
      <p>직책 선택</p>
      <HRButtonDropDown default-option="직책을 선택하세요"
                      width="220px" height="40px" font-size="13px" :options="jobList" @select-id="updateAfter"/>
    </div>
    <div>
      <p>발령날짜</p>
      <DateSearchBar @date="updateAppointDate" @date-selected="updateAppointDate"/>
    </div>
    <SubmitButton @submit="registerAppoint" text="등록하기"/>
  </div>
</div>
</template>

<style scoped>
p{
  margin: 0;
  padding: 0;
}
/* 사이드바 기본 스타일 */
.modify-sidebar {
  position: fixed;
  right: -400px;
  top: 0;
  bottom: 0;
  width: 400px;
  height: 1000px;
  transition: right 0.3s ease;
  overflow-x: hidden;
  overflow-y: auto;
  background-color: white;
  z-index: 10000; /* 모든 콘텐츠 위에 표시 */
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.2);
}
/* 사이드바가 열릴 때 클래스 */
.modify-sidebar.open {
  right: 0;
}
#side-header {
  padding: 20px 10px 20px 10px;
  height: 81px;
  border-bottom: 1px solid #817F7F;
  display: flex;
  align-items: center;
}
#modify-contents {
  padding: 50px 20px 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 30px;
}
#close {
  width: 30px;
  height: 30px;
  cursor: pointer;
  margin-right: 120px;
}
#title {
  font-weight: bold;
  font-size: 20px;
}
</style>