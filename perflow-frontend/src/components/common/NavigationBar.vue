<script setup>
import {computed, onMounted, ref, watch} from "vue";
import { useAuthStore } from "@/store/authStore.js";
import api from "@/config/axios.js";
import router from "@/router/router.js";
import Alert from "@/components/common/Alert.vue";

const authStore = useAuthStore();

const logoutModalVisible = ref(false);
const extendModalVisible = ref(false);
const refreshLogoutModal = ref(false);

const updateLogoutModalVisible = (value) => {
  logoutModalVisible.value = value;
  if(!value) {
    goTo("/login")
  }
}
const updateExtendModalVisible = (value) => {
  extendModalVisible.value = value;
}
const updateRefreshLogoutModal = (value) => {
  refreshLogoutModal.value = value;
  if(!value) {
    logout();
    goTo("/login");
  }
}

// 상태 관리
const msTime = computed(() => authStore.$state.remainingTime);
const isLogin = computed(() => authStore.$state.isLogin);

// 알림 팝업 상태
const isNotificationVisible = ref(false);
const notifications = ref([]);
let pollingInterval;

// 타이머 시작
const fetchTimer = () => {
  if (isLogin.value) {
    authStore.startTimer();
  }
};

// 유효시간 연장
const refresh = async () => {
  await authStore.refreshAccessToken();
  updateExtendModalVisible(true);
}

// 초기 닉네임 추출
const initial = computed(() => {
  const name = authStore.$state.empName || "";
  return name.substring(1, 3);
});

// 랜덤 배경색
const bgColor = ref(getRandomColor());
function getRandomColor() {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

// 로그아웃
const logout = async () => {
  await api.post(`/logout`);
  authStore.logout();

  updateLogoutModalVisible(true);
}

// 페이지 이동
const goTo = (url) => {
  if (isLogin.value) {
    router.push(url);
  }
};

// 알림 팝업 토글
const toggleNotifications = async () => {
  isNotificationVisible.value = !isNotificationVisible.value;

  // 팝업이 열릴 때만 알림 목록 가져오기
  if (isNotificationVisible.value && notifications.value.length === 0) {
    await fetchNotifications();
  }
};

// 알림 목록 가져오기
const fetchNotifications = async () => {
  try {
    const response = await api.get("/notifications", {
      headers: {
        Authorization: `Bearer ${authStore.$state.accessToken}`, // JWT 토큰 포함
      },
    });
    notifications.value = response.data; // 서버에서 받은 알림 데이터 저장
  } catch (error) {
    console.error("알림 목록을 가져오는 데 실패했습니다.", error);
  }
};

const handleNotificationClick = async (url, notiId) => {
  try {
    if (url) {
      router.push(url); // 페이지 이동
      await deleteNotification(notiId); // 알림 삭제
      isNotificationVisible.value = false; // 알림 팝업 닫기
    } else {
      console.error("URL이 없습니다.");
    }
  } catch (error) {
    console.error("알림 처리 중 오류 발생:", error);
  }
};

const deleteNotification = async (notiId) => {
  try {
    await api.delete(`/notifications/${notiId}`, {
      headers: {
        Authorization: `Bearer ${authStore.$state.accessToken}`, // JWT 토큰 포함
      },
    });
    // 삭제 후 notifications 목록 갱신
    notifications.value = notifications.value.filter(
        (notification) => notification.notiId !== notiId
    );
  } catch (error) {
    console.error("알림 삭제 실패:", error);
  }
};

const deleteAllNotifications = async () => {
  try {
    await api.delete("/notifications/delete", {
      headers: {
        Authorization: `Bearer ${authStore.$state.accessToken}`, // JWT 토큰 포함
      },
    });
    notifications.value = []; // 알림 목록 초기화
  } catch (error) {
    console.error("전체 알림 삭제 실패:", error);
  }
};

function formatTimeDifference(timestamp) {
  const now = new Date();
  const notificationTime = new Date(timestamp); // 알림 시간
  const diffInSeconds = Math.floor((now - notificationTime) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds}초 전`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}분 전`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}시간 전`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}일 전`;
  }
}

const startPolling = () => {
  pollingInterval = setInterval(() => {
    fetchNotifications();
  }, 5000); // 5초마다 알림 갱신
};

watch(msTime, (newVal) => {
  if (newVal <= 1) {
    updateRefreshLogoutModal(true);
  }
});

onMounted(() => {
  fetchTimer();
  startPolling();
});

onMounted(() => {
  clearInterval(pollingInterval);
})
</script>

<template>
  <Alert :model-value=logoutModalVisible message="로그아웃 되었습니다." @update:modelValue="updateLogoutModalVisible"/>
  <Alert :model-value=extendModalVisible message="로그인 시간이 연장되었습니다." @update:modelValue="updateExtendModalVisible"/>
  <Alert :model-value=refreshLogoutModal message="유효기간이 지나 로그아웃 됩니다.." @update:modelValue="updateRefreshLogoutModal"/>
  <div id="nav">
    <div id="nav-logo">
      <img src="@/assets/image/logo.png" alt="로고" id="logo-image" @click="goTo('/main-page')" />
      <span id="logo-text" @click="goTo('/main-page')">Perflow</span>
    </div>

    <div class="nav-right" v-if="isLogin">
      <p id="timer">남은 시간 {{ msTime }}</p>
      <img id="refresh" src="@/assets/image/refresh.png" alt="유효시간 연장" @click="refresh" />

      <!-- 알림 버튼 -->
      <div class="notification-icon" @click="toggleNotifications">
        <img src="@/assets/image/notification.png" alt="알림" />
      </div>

      <!-- 알림 팝업 -->
      <div v-if="isNotificationVisible" class="notification-popup">
        <div class="notification-header">
          <h3>알림</h3>
          <button class="delete-all-button" @click="deleteAllNotifications">전체삭제</button>
        </div>
        <!-- 알림 목록 -->
        <div class="notification-list">
          <div
              v-for="notification in notifications"
              :key="notification.notiId"
              class="notification-item"
              @click="handleNotificationClick(notification.url, notification.notiId)"
          >
            <div class="notification-content">
              <h4 class="notification-title">{{ notification.title }}</h4>
              <p class="notification-message">{{ notification.content }}</p>
            </div>
            <span class="notification-time">{{ formatTimeDifference(notification.createDatetime) }}</span>
          </div>
        </div>
      </div>

      <!-- 사용자 정보 -->
      <div class="user-icon" :style="{ backgroundColor: bgColor }" @click="goTo('/hr/my-page')">
        {{ initial }}
      </div>
      <img id="logout-image" src="@/assets/image/logout.png" alt="로그아웃" @click="logout" />
    </div>
  </div>
</template>

<style scoped>
/* 네비게이션 스타일 */
#nav {
  display: flex;
  justify-content: center; /* 모든 내용을 가운데로 정렬 */
  align-items: center;
  position: relative; /* 로고를 중앙에 위치시키기 위해 relative 설정 */
  top: 0;
  left: 0;
  width: 100%;
  height: 81px;
  background-color: #ffffff;
  padding: 0 20px;
  border-bottom: 1px solid #817F7F;
}

#nav-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute; /* 로고를 네비게이션 바의 중앙에 배치 */
  left: 50%; /* 부모 요소의 정중앙 기준 */
  transform: translateX(-50%); /* 로고를 정확히 가운데 정렬 */
}

#logo-image {
  width: 50px;
  height: 50px;
  margin-right: 5px;
  cursor: pointer;
}

#logo-text {
  font-weight: bold;
  font-size: 30px;
  font-family: Inter;
  margin-left: 5px;
  cursor: pointer;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 20px;
  position: absolute;
  right: 20px; /* 네비게이션 바의 오른쪽에 고정 */
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

.notification-icon {
  position: relative;
  cursor: pointer;
}

.notification-icon img {
  width: 30px;
  height: 30px;
}

.notification-popup {
  position: absolute;
  top: 60px;
  right: 10px;
  width: 400px;
  max-height: 400px;
  background-color: #fff;
  border: 1px solid #ddd;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  overflow-y: auto;
  z-index: 1000;
}

.notification-popup h3 {
  margin: 0;
  padding: 10px;
  border-bottom: 1px solid #ddd;
  font-size: 16px;
  font-weight: bold;
  background-color: #f5f5f5;
  text-align: left;
}

.notification-list {
  padding: 10px;
}

.notification-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  border-bottom: 1px solid #eee;
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-time {
  font-size: 12px;
  color: #888;
}

.notification-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start; /* 왼쪽 정렬 */
}

.notification-title {
  font-size: 14px;
  font-weight: bold;
  margin: 0;
  color: #333;
  text-align: left; /* 왼쪽 정렬 */
}

.notification-message {
  font-size: 12px;
  margin: 4px 0 0;
  color: #555;
  text-align: left; /* 왼쪽 정렬 */
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #ddd;
  background-color: #f5f5f5;
}

.delete-all-button {
  background-color: #f44336; /* 빨간색 버튼 */
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 12px;
}

.delete-all-button:hover {
  background-color: #d32f2f; /* hover 시 어두운 빨간색 */
}

.user-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 40px;
  height: 40px;
  color: #fff;
  font-weight: bold;
  border-radius: 4px;
  cursor: pointer;
}

#logout-image {
  width: 30px;
  height: 30px;
  cursor: pointer;
}
/* 미디어 쿼리: 화면이 작아질 때 숨김 */
@media (max-width: 900px) {
  #nav-logo {
    flex-grow: 0;
    visibility: hidden; /* 로고 숨김 */
  }
}
</style>
