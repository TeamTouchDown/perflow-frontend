// src/main.js

import { createApp } from 'vue';
import App from './App.vue';
import './assets/global.css';
import router from './router/router.js';
import { createPinia } from "pinia";
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import { useAuthStore } from "@/store/authStore.js";
import { initFCMToken, initForegroundMessageHandler } from "@/config/notification/FcmService.js";

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);
const app = createApp(App);
app.use(pinia);
app.use(router);

// 서비스 워커 등록
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/firebase-messaging-sw.js') // 정확한 경로
            .then((registration) => {
                console.log('Service Worker 등록 성공:', registration);
            })
            .catch((err) => {
                console.error('Service Worker 등록 실패:', err);
            });
    });
}

// Vue 앱 마운트
app.mount('#app').$nextTick(async () => {
    const authStore = useAuthStore();

    // 사용자 로그인 상태 확인
    if (authStore.isLogin && authStore.empId) {
        // 기기 유형 식별 로직 (예: 브라우저 이름)
        let deviceType = 'OTHER';
        const userAgent = navigator.userAgent;
        if (userAgent.includes("Chrome") && !userAgent.includes("Edge") && !userAgent.includes("OPR")) {
            deviceType = "CHROME";
        } else if (userAgent.includes("Firefox")) {
            deviceType = "FIREFOX";
        } else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) {
            deviceType = "SAFARI";
        }

        // 기기 유형을 스토어에 설정
        authStore.setDeviceType(deviceType);

        // FCM 토큰 초기화 및 등록
        await initFCMToken(authStore.empId, deviceType, (token) => {
            authStore.setFcmToken(token);
            console.log("FCM 토큰 초기화 완료:", token);
        });
    }

    // 포그라운드 메시지 핸들러 초기화
    initForegroundMessageHandler();
    console.log("포그라운드 메시지 핸들러 초기화 완료");
});
