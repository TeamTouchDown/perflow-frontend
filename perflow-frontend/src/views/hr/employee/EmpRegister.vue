<script setup>

import HeaderContainer from "@/components/hr/HeaderContainer.vue";
import RegisterInputField from "@/components/hr/RegisterInputField.vue";
import RrnInputField from "@/components/hr/RrnInputField.vue";
import AddressInputField from "@/components/hr/AddressInputField.vue";
import ButtonBasic from "@/components/common/ButtonBasic.vue"
import {onMounted, reactive, ref} from "vue";
import api from "@/config/axios.js";
import {useStore} from "@/store/store.js";
import router from "@/router/router.js";
import DateSearchBar from "@/components/common/DateSearchBar.vue";
import HRButtonDropDown from "@/components/hr/HRButtonDropDown.vue";
import Alert from "@/components/common/Alert.vue";

const store = useStore();

const name = ref();
const empId = ref();
const rrn = ref();
const email = ref();
const contact = ref();
const deptId = ref();
const positionId = ref();
const jobId = ref();
const salary = ref();
const gender =ref();
const address = reactive({});
const joinDate = ref();

const updateAddress = (value) => {
  address.value = value;
}
const updateName = (value) => {
  name.value = value;
}
const updateEmpId = (value) => {
  empId.value = value;
}
const updateRrn = (value) => {
  rrn.value = value;
}
const updateEmail = (value) => {
  email.value = value;
}
const updateContact = (value) => {
  contact.value = value;
}
const updateDeptId = (dept) => {
  deptId.value = dept;
}
const updateJobId = (job) => {
  jobId.value = job;
}
const updatePositionId = (position) => {
  positionId.value = position;
}
const updateSalary = (value) => {
  salary.value = value;
}
const updateGender = (value) => {
  gender.value = value;
}
const updateJoinDate = (value) => {
  joinDate.value = value;
}
const successModalVisible = ref(false);
const failModalVisible = ref(false);

const updateSuccessModalVisible = (value) => {

  successModalVisible.value = value;
  if( value === false ) {
    router.push("/hr/employees");
  }
}
const updateFailModalVisible = (value) => {

  failModalVisible.value = value;
}

const departments = ref([]);
const jobs = ref();
const positions = ref();

const fetchDepts = async () => {
  const response = await api.get("/departments/list");
  departments.value = response.data.map(dept => ({ label: dept.name, id: dept.deptId }));
}

const fetchJobs = async () => {
  const response = (await api.get("/job", {
    params: {
      page: 1,
      size: 10000
    }
  })).data;
  jobs.value = response.jobResponseDTOList.map(job => ({ label: job.name, id: job.jobId }));
}
const fetchPositions = async () => {
  const response = (await api.get("/position", {
    params: {
      page: 1,
      size: 10000
    }
  })).data;
  positions.value = response.positions.map(position => ({ label: position.name, id: position.positionId }));
}
const registerEmp = async () => {
  try {
    store.showLoading();
    const totalAddress = address.value.postcode + " " + address.value.roadAddress + " " + address.value.extraAddress;
    await api.post("/hr/employees",{
      empId: empId.value,
      name: name.value,
      positionId: positionId.value,
      jobId: jobId.value,
      departmentId: deptId.value,
      rrn: rrn.value,
      email: email.value,
      contact: contact.value,
      pay: salary.value,
      gender: gender.value,
      address: totalAddress,
      joinDate: joinDate.value
    });
    store.hideLoading();
    updateSuccessModalVisible(true);
  } catch (error) {
    store.hideLoading();
    if(error instanceof TypeError){
      alert("입력값이 정확하지 않습니다. 확인해주세요.");
    } else if (error){
      updateFailModalVisible(true);
    } else {
      updateFailModalVisible(true);
    }
  }
}

onMounted(async ()=>{
  store.showLoading();
  await fetchDepts();
  await fetchJobs();
  await fetchPositions();
  store.hideLoading();
});
</script>

<template>
  <Alert :model-value=successModalVisible message="사원 등록 성공!" @update:modelValue="updateSuccessModalVisible"/>
  <Alert :model-value=failModalVisible message="사원 등록 중 오류가 발생했습니다." @update:modelValue="updateFailModalVisible"/>
  <div id="emp-register-container">
    <HeaderContainer
      title="구성원"
      flow="구성원 등록"
    />
    <p id="top-title">필수입력</p>
    <div id="register-container-top">
      <RegisterInputField title="사원명" placeholder="사원명을 입력해주세요." size="small" @update-value="updateName"/>
      <RegisterInputField title="사번" placeholder="사번을 입력해주세요." size="small" @update-value="updateEmpId"/>
      <RrnInputField title="주민번호" placeholder1="주민번호 앞자리" placeholder2="주빈번호 뒷자리" @update-value="updateRrn"/>
      <RegisterInputField title="이메일" placeholder="이메일 입력해주세요." size="large" @update-value="updateEmail"/>
      <RegisterInputField title="전화번호" placeholder="전화번호를 입력해주세요." size="large" @update-value="updateContact"/>
    </div>

    <hr>

    <p id="bottom-title">선택입력</p>
    <div id="register-container-bottom">
      <div class="dropdown-list">
        <div class="dropdown-container">
          <p class="item-title">직급</p>
          <HRButtonDropDown default-option="직급을 선택하세요" width="200px" height="40px" font-size="13px" :options="positions" @select-id="updatePositionId"/>
        </div>
        <div class="dropdown-container">
          <p class="item-title">직책</p>
          <HRButtonDropDown default-option="직책을 선택하세요" width="200px" height="40px" font-size="13px" :options="jobs" @select-id="updateJobId"/>
        </div>
      </div>
      <div class="dropdown-list">
        <div class="dropdown-container">
          <p class="item-title">부서</p>
          <HRButtonDropDown default-option="부서를 선택하세요" width="200px" height="40px" font-size="13px" :options="departments" @select-id="updateDeptId"/>
        </div>
        <div class="dropdown-container">
          <RegisterInputField title="월급" placeholder="월급을 입력해주세요." size="small" @update-value="updateSalary"/>
        </div>
      </div>
      <AddressInputField @update-value="updateAddress"/>
      <div class="dropdown-container2">
        <p class="item-title">입사일</p>
        <DateSearchBar width="200px" height="40px" @date="updateJoinDate" @date-selected="updateJoinDate"/>
        <div>
          <span class="radio-text">남성</span><input class="radio-button" type="radio" name="gender" @click="updateGender('MALE')">
          <span class="radio-text">여성</span><input class="radio-button" type="radio" name="gender" @click="updateGender('FEMALE')">
        </div>
      </div>
      <div class="button-container">
        <ButtonBasic
            size="large"
            color="gray"
            label="취소하기"
        />
        <ButtonBasic
            size="large"
            label="등록하기"
            @click="registerEmp"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
hr {
  width: 900px;
  margin: 0;
  height: 2px;
}
#emp-register-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #3C4651;
  gap: 30px;
}
#register-container-top{
  display: flex;
  align-items: start;
  width: 900px;
  flex-direction: column;
  gap: 20px;
}
#register-container-bottom{
  display: flex;
  align-items: start;
  width: 900px;
  flex-direction: column;
  gap: 20px;
}
#top-title {
  font-weight: bold;
  font-size: 30px;
  width: 900px;
  margin-top: 20px;
  color: #F37321;
}
#bottom-title {
  font-weight: bold;
  font-size: 30px;
  width: 900px;
  margin-top: 20px;
  color: #3c4651;
}
.dropdown-list {
  display: flex;
  gap: 50px;
}
.dropdown-container {
  display: flex;
  gap: 50px;
  align-items: center;
}
.dropdown-container2 {
  display: flex;
  gap: 40px;
  align-items: center;
}
.item-title {
  padding: 0;
  margin: 0;
  font-weight: bold;
}
.button-container {
  display: flex;
  justify-content: space-between;
  padding-left: 200px;
  padding-right: 200px;
  margin-top: 50px;
  width: 900px;
}
.radio-text {
  font-weight: bold;
  margin-right: 10px;
}
.radio-button {
  margin-right: 20px;
}
</style>