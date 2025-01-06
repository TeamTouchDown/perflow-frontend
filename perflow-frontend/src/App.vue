<script setup>
import SideMenuTree from "@/components/common/SideMenuTree.vue";
import {computed, ref} from "vue";
import NavigationBar from "@/components/common/NavigationBar.vue";
import Loading from "@/components/common/Loading.vue";
import {useAuthStore} from "@/store/authStore.js";
import Alert from "@/components/common/Alert.vue";

const authStore = useAuthStore();
const isLogin = computed(()=>{
  return authStore.isLogin;
})
// 사이드바 표시 상태 관리
const isSidebarOpen = ref(false);

// 마우스를 핫존 위에 올렸을 때 사이드바 열기
const showSidebar = () => {
  isSidebarOpen.value = true;
};

// 마우스를 사이드바 및 핫존 영역 밖으로 뺐을 때 사이드바 닫기
const hideSidebar = () => {
  isSidebarOpen.value = false;
};
</script>

<template>
  <Loading/>
  <NavigationBar/>
  <div class="app-container">
    <!-- 핫존 영역: 얇은 투명 영역으로 사용자가 마우스 올리면 사이드바가 열림 -->
    <div class="hotzone"
         @mouseover="showSidebar"
    ></div>

    <!-- 사이드바 -->
    <div class="sidebar"
         :class="{ open: isSidebarOpen }"
         @mouseleave="hideSidebar"
         v-if="isLogin"
    >
      <SideMenuTree />
    </div>

    <!-- 메인 컨텐츠 영역 -->
    <div class="content">
      <!-- 라우터 뷰 -->
      <div class="router-view">
        <router-view />
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  margin: 0;
  height: 100vh;
  position: relative;
}

/* 핫존: 화면 왼쪽 가장자리에 위치한 얇은 투명 div */
.hotzone {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 10px; /* 핫존 너비 */
  background: transparent;
  z-index: 10;
  cursor: pointer;
}

/* 사이드바 기본 스타일 */
.sidebar {
  position: fixed;
  left: -283px; /* 기본적으로 화면 밖에 숨겨진 상태 */
  top: 0;
  bottom: 0;
  width: 283px;
  transition: left 0.3s ease;
  overflow-x: hidden;
  overflow-y: auto; /* 스크롤이 필요할 때 스크롤바 표시 */
  z-index: 20; /* 핫존 위에 표시 */
  background-color: white;
}
/* 스크롤바 전체 영역 */
.sidebar::-webkit-scrollbar {
  width: 3px; /* 스크롤바 너비 */
}

/* 스크롤바 트랙(바탕) 영역 */
.sidebar::-webkit-scrollbar-track {
  background: none; /* 트랙 배경색 */
}

/* 스크롤바 손잡이(thumb) 영역 */
.sidebar::-webkit-scrollbar-thumb {
  background: #D9D9D9; /* 손잡이 색상 */
  border-radius: 4px; /* 모서리를 둥글게 */
}

/* 마우스를 손잡이 위에 올렸을 때 색상 변환 */
.sidebar::-webkit-scrollbar-thumb:hover {
  background: #555; /* 손잡이 호버 색상 */
}
/* 사이드바가 열릴 때 클래스 */
.sidebar.open {
  left: 0; /* 사이드바를 화면 안으로 표시 */
}
/* 메인 컨텐츠 영역 */
.content {
  flex: 1;
  position: relative;
  margin-left: 0; /* 사이드바 나오기 전 기본 값 */
}

/* 라우터 뷰 */
.router-view {
  flex: 1;
  padding: 20px;
  overflow: auto;
}
</style>
