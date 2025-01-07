<script setup>

import ModifyInputFeild from "@/components/hr/ModifyInputFeild.vue";
import {computed, onMounted, reactive, ref} from "vue";
import SubmitButton from "@/components/hr/SubmitButton.vue";
import api from "@/config/axios.js";
import HRButtonDropDown from "@/components/hr/HRButtonDropDown.vue";
import Alert from "@/components/common/Alert.vue";

const props = defineProps({
      isSidebarOpen: {
        type: Boolean,
        default: false
      },
      jobId: Number,
      title: String
});
const emit = defineEmits(['close-sidebar'])
const jobId = computed(()=> {
  return props.jobId;
})
const name = ref();
const responsibility = ref();
const departmentId = ref();
const deptList = ref();

const updateName = (value) => {
  name.value = value;
}
const updateResponsibility = (value) => {
  responsibility.value = value;
}
const updateDept = (value) => {
  departmentId.value = value;
}


const updateJob = async (jobId) => {
  try {
    await api.put(`/hr/job/${jobId}`,{
      name: name.value,
      responsibility: responsibility.value,
      deptId: departmentId.value
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

const fetchDeptList = async () => {
  const response = await api.get("/departments/list");
  deptList.value = response.data.map(dept => ({ label: dept.name, id: dept.deptId }));
}

function closeSidebar() {
  emit('close-sidebar')
}
onMounted(()=>{
  fetchDeptList();
})
</script>

<template>
  <Alert :model-value=successModalVisible message="직책 수정 성공!" @update:modelValue="updateSuccessModalVisible"/>
  <Alert :model-value=failModalVisible message="직책 수정 중 오류가 발생했습니다." @update:modelValue="updateFailModalVisible"/>
<div class="modify-sidebar" :class="{ open: props.isSidebarOpen }">
  <div id="side-header">
    <img src="../../../assets/image/arrow-right.png" @click="closeSidebar" id="close">
    <p id="title">{{props.title}}</p>
  </div>
  <div id="modify-contents">
    <p class="job-id">직책 번호 : {{jobId}}</p>
    <ModifyInputFeild title="직책명" @update-value="updateName"/>
    <ModifyInputFeild title="직책담당업무" @update-value="updateResponsibility"/>
    <p class="sub-title">부서</p>
    <HRButtonDropDown default-option="부서를 선택하세요" width="200px" height="40px" font-size="13px" :options="deptList" @select-id="updateDept"/>
    <SubmitButton @submit="updateJob(jobId)" text="수정하기"/>
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
.job-id{
  font-size: 30px;
  font-weight: bold;
  margin-bottom: 30px;
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
.sub-title {
  font-weight: bold;
  margin-bottom: 10px;
}
</style>