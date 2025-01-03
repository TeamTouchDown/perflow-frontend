<script setup>

import ModifyInputFeild from "@/components/hr/ModifyInputFeild.vue";
import {computed, onMounted, reactive, ref} from "vue";
import AddressInputFeild from "@/components/hr/AddressInputField.vue";
import SubmitButton from "@/components/hr/SubmitButton.vue";
import api from "@/config/axios.js";
import ButtonDropDown from "@/components/common/ButtonDropDown.vue";
import SearchButtonDropDown from "@/components/common/SearchButtonDropDown.vue";
import HRButtonDropDown from "@/components/hr/HRButtonDropDown.vue";
import Alert from "@/components/common/Alert.vue";

const props = defineProps({
      isSidebarOpen: {
        type: Boolean,
        default: false
      },
      title: String
});
const emit = defineEmits(['close-sidebar'])

const deptList = ref([]);
const empList = ref([]);

const pic = ref();
const name = ref();
const manageDeptId = ref();
const responsibility = ref();
const contact = ref();

const updatePic = (value) => {
  pic.value = value;
}
const updateName = (value) => {
  name.value = value;
}
const updateManageDept = (value) => {
  manageDeptId.value = value;
}
const updateResponsibility = (value) => {
  responsibility.value =value;
}
const updateContact = (value) => {
  contact.value = value;
}

const fetchDeptList = async () => {
  const response = await api.get("/departments/list");
  deptList.value = response.data.map(dept => ({ label: dept.name, id: dept.deptId }));
}
const maxDeptId = computed(() => {
  if (deptList.value.length === 0) {
    return null; // 또는 원하는 기본값 설정
  }
  return Math.max(...deptList.value.map(dept => dept.id)) + 1;
});

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


function closeSidebar() {
  emit('close-sidebar')
}

const registerDepartment = async () => {
  try {
    await api.post("/hr/departments",{
      departmentId:maxDeptId.value,
      name:name.value,
      responsibility:responsibility.value,
      contact:contact.value,
      manageDeptId:manageDeptId.value,
      picId:pic.value
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

onMounted(async ()=>{
  await fetchEmpList();
  await fetchDeptList();
});
</script>

<template>
  <Alert :model-value=successModalVisible message="부서 등록에 성공했습니다!" @update:modelValue="updateSuccessModalVisible"/>
  <Alert :model-value=failModalVisible message="부서 등록 중 오류가 발생했습니다." @update:modelValue="updateFailModalVisible"/>
  <div class="modify-sidebar" :class="{ open: props.isSidebarOpen }">
  <div id="side-header">
    <img src="../../../assets/image/arrow-right.png" @click="closeSidebar" id="close">
    <p id="title">{{props.title}}</p>
  </div>
  <div id="modify-contents">
    <ModifyInputFeild title="부서명" @update-value="updateName"/>
    <ModifyInputFeild title="부서 담당 업무" @update-value="updateResponsibility"/>
    <ModifyInputFeild title="연락처" @update-value="updateContact"/>
    <HRButtonDropDown width="220px" default-option="상위 부서" :options="deptList" @select-id="updateManageDept"/>
    <SearchButtonDropDown default-option="부서 담당자" width="220px" :options="empList" @select-id="updatePic"/>
    <SubmitButton @submit="registerDepartment" text="등록하기"/>
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
  gap: 10px;
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