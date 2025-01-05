<script setup>
import {ref} from "vue";
import api from "@/config/axios.js";
import {useAuthStore} from '@/store/authStore.js';
import router from "@/router/router.js";
import Alert from "@/components/common/Alert.vue";

const empId = ref("");
const password = ref("")
const modalVisible = ref(false);
const failModalVisible = ref(false);
const updateModalVisible = (value) => {

  modalVisible.value = value;
  if( value === false) {
    router.push("/main-page");
  }
}
const updateFailModalVisible = (value) => {

  failModalVisible.value = value;
}
// 기기 유형을 식별하는 함수
const getDeviceType = () => {
  let deviceType = 'OTHER';
  const userAgent = navigator.userAgent;
  if (userAgent.includes("Chrome") && !userAgent.includes("Edge") && !userAgent.includes("OPR")) { // Edge와 Opera 제외
    deviceType = "CHROME";
  } else if (userAgent.includes("Firefox")) {
    deviceType = "FIREFOX";
  } else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) { // Chrome 제외
    deviceType = "SAFARI";
  }
  return deviceType;
}

const login = async () => {

  try{
    const authStore = useAuthStore();

    const response = await api.post(
        `/login`,
        {
          empId : empId.value,
          password : password.value
        }
    );
    const accessToken = response.headers.get(`Authorization`);
    const refreshToken = response.headers.get(`refreshToken`);

    // 기기 유형 식별 및 설정
    const deviceType = getDeviceType();
    authStore.setDeviceType(deviceType);

    authStore.setTokens(accessToken, refreshToken);

    authStore.afterLogin();

    updateModalVisible(true);
  } catch (error) {
    updateFailModalVisible(true);
  }
}
</script>

<template>
  <article id="login-div">
    <Alert :model-value=modalVisible message="로그인에 성공했습니다!" @update:modelValue="updateModalVisible"/>
    <Alert :model-value=failModalVisible message="로그인에 실패했습니다. 입력값을 확인해주세요." @update:modelValue="updateFailModalVisible"/>
    <p class="title">Perflow 로그인</p>
    <div class="input-group">
      <span class="input-title">사번</span><br>
      <input type="text" id="id-input" v-model="empId" @keyup.enter="login">
    </div>
    <div class="input-group">
      <span class="input-title">비밀번호</span><br>
      <input type="password" id="password-input" v-model="password" @keyup.enter="login">
    </div>
    <button @click="login" class="login-button">로그인</button>
  </article>
</template>

<style scoped>
#login-div {
  display: flex;
  flex-direction: column; /* 세로 방향으로 정렬 */
  justify-content: center; /* 세로 중앙 정렬 */
  align-items: center; /* 가로 중앙 정렬 */
  gap: 10px; /* 각 요소 간의 간격 */
  margin: 0 auto; /* 수평 중앙 정렬 */
  padding-top: 100px;
}
.title {
  font-size: 50px;
  font-weight: bold;
  background: linear-gradient(90deg, #F37321, #FFBB00);
  /* 크로스 브라우저 호환을 위해 -webkit-background-clip 사용 */
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text; /* 일부 브라우저는 이 속성 사용 */
}
.input-title {
  font-weight: bold;
  font-size: 20px;
}
/* 각 입력 필드를 감싸는 그룹 */
.input-group {
  display: flex;
  flex-direction: column;
  align-items: center; /* 텍스트와 입력창 가로 중앙 정렬 */
  text-align: center; /* 텍스트 중앙 정렬 */
}

/* 입력 필드 스타일 */
#id-input, #password-input {
  width: 500px;
  height: 50px;
  border: 1px solid #ccc;
  border-radius: 4px;
  text-align: center; /* 입력 값 중앙 정렬 */
  font-size: 20px !important;
  margin-bottom: 5px;
}
#id-input, #password-input:-webkit-autofill {
  background-color: white !important; /* 자동완성 시 배경 흰색 */
  -webkit-box-shadow: 0 0 0 1000px white inset !important; /* 내부 흰색 영역 */
}
/* 로그인 버튼 스타일 */
.login-button {
  width: 500px;
  height: 50px;
  background: linear-gradient(90deg, #F37321, #FFBB00);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 20px;
  font-weight: bold;
  margin-top: 30px;
}
.login-button:hover {
  background-color: #ff5a45;
}
</style>