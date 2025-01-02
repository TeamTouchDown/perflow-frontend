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

const annualCount = ref(0);
const paymentDate = ref(0);

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

const validAnnualCount = computed(()=>{
  return annualCount.value > 14;
});
const validPaymentDate = computed(() => {
  return paymentDate.value > 0 && paymentDate.value < 29;
});

// 전체 유효성 검사
const isFormValid = computed(() => {
  return validAnnualCount.value && validPaymentDate.value && annualCount && paymentDate;
});

const updateAnnualCount = (value) => {
  annualCount.value = value;
}
const updatePaymentDate = (value) => {
  paymentDate.value =value
}

const updateCompanyInfo = async () => {

  try {
    await api.put("/hr/company/annualCount",{
      companyAnnualCount: annualCount.value
    });
    await api.put("/hr/company/paymentDatetime",{
      date : paymentDate.value
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
    <div><ModifyInputFeild title="연차 개수" @update-value="updateAnnualCount"/><p v-if="!validAnnualCount&&annualCount" class="valid-text">연차 개수는 15개 이상으로 입력해야 합니다.</p></div>
    <div><ModifyInputFeild title="급여 지급일" @update-value="updatePaymentDate"/><p v-if="!validPaymentDate&&paymentDate" class="valid-text">급여 지급일은 1일에서 28일 사이의 수를 입력해야 합니다.</p></div>
    <SubmitButton
        class="register-button"
        :disabled="!isFormValid"
        @submit="updateCompanyInfo" text="수정하기"/>
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
  display: flex;
  flex-direction: column;
  align-items: center;
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
.valid-text {
  color: red;
  font-weight: bold;
}
.register-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
</style>