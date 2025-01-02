<script setup>

import ModifyInputFeild from "@/components/hr/ModifyInputFeild.vue";
import {computed, onMounted, reactive, ref} from "vue";
import AddressInputFeild from "@/components/hr/AddressInputField.vue";
import SubmitButton from "@/components/hr/SubmitButton.vue";
import api from "@/config/axios.js";
import ButtonDropDown from "@/components/common/ButtonDropDown.vue";
import {values} from "vuedraggable/dist/vuedraggable.common.js";
import Alert from "@/components/common/Alert.vue";

const props = defineProps({
      isSidebarOpen: {
        type: Boolean,
        default: false
      },
      title: String
});
const emit = defineEmits(['close-sidebar'])

const name = ref();
const level = ref();

const updateName = (value) => {
  name.value = value;
}
const updateLevel = (value) => {
  level.value = value;
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

const registerPosition = async () => {
  try {
    await api.post("/hr/position",{
      name: name.value,
      positionLevel: level.value
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
  <Alert :model-value=successModalVisible message="직위 등록 성공!" @update:modelValue="updateSuccessModalVisible"/>
  <Alert :model-value=failModalVisible message="직위 등록 중 오류가 발생했습니다." @update:modelValue="updateFailModalVisible"/>
<div class="modify-sidebar" :class="{ open: props.isSidebarOpen }">
  <div id="side-header">
    <img src="@/assets/image/arrow-right.png" @click="closeSidebar" id="close">
    <p id="title">{{props.title}}</p>
  </div>
  <div id="modify-contents">
    <ModifyInputFeild title="직위명" @update-value="updateName"/>
    <ModifyInputFeild title="직위등급" @update-value="updateLevel"/>
    <SubmitButton @submit="registerPosition" text="등록하기"/>
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