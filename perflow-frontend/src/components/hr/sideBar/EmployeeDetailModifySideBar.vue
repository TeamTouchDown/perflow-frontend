<script setup>

import ModifyInputFeild from "@/components/hr/ModifyInputFeild.vue";
import {computed, reactive, ref} from "vue";
import AddressInputFeild from "@/components/hr/AddressInputField.vue";
import SubmitButton from "@/components/hr/SubmitButton.vue";
import api from "@/config/axios.js";
import DateSearchBar from "@/components/common/DateSearchBar.vue";
import {useStore} from "@/store/store.js";
import Alert from "@/components/common/Alert.vue";

const store = useStore();

const props = defineProps({
      isSidebarOpen: {
        type: Boolean,
        default: false
      },
      empId : {
        type: String
      },
      title: String
});
const emit = defineEmits(['close-sidebar']);
const pay = ref("");
const name = ref("");
const joinDate = ref("");
const email = ref("");
const contact = ref("");
// 반응형 객체로 totalAddress 정의
const address = reactive({
});
const updateAddress = (value) => {
  address.value = value;
}

const updateEmail = (value) => {
  email.value = value;
}
const updateContact = (value) => {
  contact.value = value;
}
const updatePay = (value) => {
  pay.value = value;
}
const updateName = (value) => {
  name.value = value;
}
const updateJoinDate = (value) => {
  joinDate.value = value;
}
const updateEmployee = async () => {
  const totalAddress = address.value.postcode + " " + address.value.roadAddress + " " + address.value.extraAddress
  try {
    store.showLoading();
    await api.put("/hr/employees",{
      empId: props.empId,
      name: name.value,
      email: email.value,
      contact: contact.value,
      pay: pay.value,
      address: totalAddress,
      joinDate: joinDate.value
    });
    store.hideLoading();
    updateSuccessModalVisible(true);
  } catch (error) {
    if (error.response.data.message){
      updateFailModalVisible(true);
    } else {
      updateFailModalVisible(true);
    }
    console.log(error)
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

function closeSidebar() {
  emit('close-sidebar')
}
</script>

<template>
  <Alert :model-value=successModalVisible message="정보 수정 성공!" @update:modelValue="updateSuccessModalVisible"/>
  <Alert :model-value=failModalVisible message="정보 수정 중 오류가 발생했습니다." @update:modelValue="updateFailModalVisible"/>
  <div class="modify-sidebar" :class="{ open: props.isSidebarOpen }">
  <div id="side-header">
    <img src="../../../assets/image/arrow-right.png" @click="closeSidebar" id="close">
    <p id="title">{{props.title}}</p>
  </div>
  <div id="modify-contents">
    <ModifyInputFeild title="이름" @update-value="updateName"/>
    <ModifyInputFeild title="기본급" @update-value="updatePay"/>
    <ModifyInputFeild title="연락처" @update-value="updateContact"/>
    <ModifyInputFeild title="이메일" @update-value="updateEmail"/>
    <p>입사일</p>
    <DateSearchBar title="입사일 선택" @date-selected="updateJoinDate"/>
    <AddressInputFeild @update-value="updateAddress"/>
    <SubmitButton @submit="updateEmployee" text="수정하기"/>
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
  height: 100%;
  transition: right 0.3s ease;
  overflow-x: hidden;
  overflow-y: auto; /* 스크롤이 필요할 때 스크롤바 표시 */
  background-color: white;
  z-index: 10000; /* 모든 콘텐츠 위에 표시 */
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.2);
}
/* 사이드바가 열릴 때 클래스 */
.modify-sidebar.open {
  right: 0;
}
/* 스크롤바 전체 영역 */
.modify-sidebar::-webkit-scrollbar {
  width: 3px; /* 스크롤바 너비 */
}

/* 스크롤바 트랙(바탕) 영역 */
.modify-sidebar::-webkit-scrollbar-track {
  background: none; /* 트랙 배경색 */
}

/* 스크롤바 손잡이(thumb) 영역 */
.modify-sidebar::-webkit-scrollbar-thumb {
  background: #D9D9D9; /* 손잡이 색상 */
  border-radius: 4px; /* 모서리를 둥글게 */
}

/* 마우스를 손잡이 위에 올렸을 때 색상 변환 */
.modify-sidebar::-webkit-scrollbar-thumb:hover {
  background: #555; /* 손잡이 호버 색상 */
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
</style>