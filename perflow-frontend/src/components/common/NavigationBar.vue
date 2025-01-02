<script setup>
import {computed, onMounted, ref} from "vue";
import {useAuthStore} from "@/store/authStore.js";
import {useStore} from "@/store/store.js";
import api from "@/config/axios.js";
import router from "@/router/router.js";
import Alert from "@/components/common/Alert.vue";

const authStore = useAuthStore();

const logoutModalVisible = ref(false);
const extendModalVisible = ref(false);

const updateLogoutModalVisible = (value) => {
  logoutModalVisible.value = value;
  if(!value) {
    goTo("/login")
  }
}
const updateExtendModalVisible = (value) => {
  logoutModalVisible.value = value;
}

const msTime = computed(() => {
  return authStore.$state.remainingTime
});

const isLogin = computed(()=>{
  return authStore.$state.isLogin;
});

const fetchTimer = () => {
  if(isLogin){
    authStore.startTimer();
  }
};
const refresh =  async () => {
  await authStore.refreshAccessToken();
  updateExtendModalVisible(true);
}

const initial = computed(() => {
  const name = authStore.$state.empName || ''
  return name.substring(1, 3)
})
const bgColor = ref(getRandomColor());

// 랜덤 색상 생성 함수 (단순 예제)
function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

const logout = async () => {

  await api.post(`/logout`);

  authStore.logout();

  updateLogoutModalVisible(true);
}

const goTo = (url) => {
  if(authStore.isLogin){
      router.push(url);
  }
}

onMounted(()=> {
  fetchTimer();
});
</script>

<template>
  <Alert :model-value=logoutModalVisible message="로그아웃 되었습니다." @update:modelValue="updateLogoutModalVisible"/>
  <Alert :model-value=extendModalVisible message="로그인 시간이 연장되었습니다." @update:modelValue="updateExtendModalVisible"/>
  <div id="nav">
    <div id="nav-logo" @click="goTo('/main-page')">
      <img src="@/assets/image/logo.png" alt="로고" id="logo-image">
      <span id="logo-text">Perflow</span>
    </div>
    <div class="nav-right" v-if="isLogin">
      <p id="timer">남은시간 {{msTime}}</p>
      <img id="refresh" src="@/assets/image/refresh.png" alt="유효시간 연장" @click="refresh">
      <div
          class="user-icon"
          :style="{ backgroundColor: bgColor }"
          @click="goTo('/hr/my-page')"
      >
        {{ initial }}
      </div>
      <img id="logout-image" src="@/assets/image/logout.png" alt="로그아웃" @click="logout">
    </div>
  </div>
</template>

<style scoped>
#nav {
  display: flex;
  height: 81px;
  justify-content: space-between; /* 가로로 배치, 양 끝에 여유 공간 */
  align-items: center;            /* 세로축 중앙 정렬 */
  width: 100%;                    /* 전체 너비 */   /* 예시: 화면 전체 높이 */
  border-bottom: 1px solid #817F7F;
}
#nav-logo, #nav-right {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto; /* 가운데 정렬 */
  cursor: pointer;
}
#logo-image {
  width: 50px;
  height: 50px;
  margin-right: 5px;
}
#logo-text {
  font-weight: bold;
  font-size: 30px;
  font-family: Inter;
  margin-left: 5px;
}
.nav-right {
  /* 오른쪽 끝으로 자동 정렬됨 */
  text-align: right;
  position: absolute;
  right: 0;
  padding-right: 30px;
  align-items: center;
  display: flex;
  gap: 20px;
}
#timer {
  margin: 0;
  font-weight: bold;
}
#refresh {
  width: 25px;
  height: 25px;
  padding: 0;
  margin: 0;
  cursor: pointer;
}
.user-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 40px;       /* 정사각형 크기 */
  height: 40px;
  color: #fff;       /* 텍스트 색상 */
  font-weight: bold; /* 문자 강조 */
  border-radius: 4px;/* 모서리를 약간 둥글게 */
  cursor: pointer;
}
#logout-image {
  width: 30px;
  height: 30px;
  cursor: pointer;
}
</style>