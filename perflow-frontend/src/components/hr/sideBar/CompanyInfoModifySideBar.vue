<script setup>

import ModifyInputFeild from "@/components/hr/ModifyInputFeild.vue";
import {computed, reactive, ref} from "vue";
import AddressInputFeild from "@/components/hr/AddressInputField.vue";
import SubmitButton from "@/components/hr/SubmitButton.vue";
import api from "@/config/axios.js";
import DateSearchBar from "@/components/common/DateSearchBar.vue";
import Alert from "@/components/common/Alert.vue";

const props = defineProps({
      isSidebarOpen: {
        type: Boolean,
        default: false
      },
      title: String
});
const emit = defineEmits(['close-sidebar'])

const email = ref("");
const contact = ref("");
const establish = ref();
const address = reactive({
});

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

const updateAddress = (value) => {
  address.value = value;
}

const updateEmail = (value) => {
  email.value = value;
}
const updateContact = (value) => {
  contact.value = value;
}
const updateEstablish = (value) => {
  establish.value = value;
}


const updateCompanyInfo = async () => {

  const totalAddress = address.value.postcode + " " + address.value.roadAddress + " " + address.value.extraAddress
  try {
    await api.put("/hr/company",{
      address: totalAddress,
      establish: establish.value ,
      email: email.value,
      contact: contact.value
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
    <div class="establish">
      <p>설립일</p>
      <DateSearchBar @date-selected="updateEstablish"/>
    </div>
    <ModifyInputFeild title="회사 연락처" @update-value="updateContact"/>
    <ModifyInputFeild title="회사 이메일" @update-value="updateEmail"/>
    <address-input-feild @update-value="updateAddress"/>
    <SubmitButton @submit="updateCompanyInfo" text="수정하기"/>
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
  height: auto;
  transition: right 0.3s ease;
  overflow-x: hidden;
  overflow-y: hidden;
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
  padding: 20px 20px 20px 20px;
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
.establish {
  font-weight: bold;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 10px;
}
</style>