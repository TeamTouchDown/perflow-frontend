import { defineStore } from 'pinia';
import api from "@/config/axios.js";
import { ref } from "vue";
import router from "@/router/router.js";
import {jwtDecode} from "jwt-decode";
import { deleteTokenFromBackend } from "@/config/notification/FcmService.js";

export const useAuthStore = defineStore('auth', {
    state: () => ({
        accessToken: ref(null),
        refreshToken: ref(null),
        empId: ref(null),
        empName: ref(null),
        isLogin: ref(false),
        authorities: ref(null),
        fcmToken: ref(null),
        deviceType: ref(null),
        timerInterval: null,
        remainingTime: 0
    }),
    actions: {
        // 로그인 후 토큰 저장
        setTokens(newAccessToken, newRefreshToken) {
            this.accessToken = newAccessToken;
            this.refreshToken = newRefreshToken;
            this.isLogin = true;
            localStorage.setItem("accessToken", newAccessToken);
            localStorage.setItem("refreshToken", newRefreshToken);
            const decoded = jwtDecode(newAccessToken);
            this.empId = decoded.empId;
            this.empName = decoded.name;
            this.authorities = decoded.authorities;
            this.startTimer();
        },
        // FCM 토큰 설정 액션
        setFcmToken(token) {
            this.fcmToken = token;
        },
        // 기기 유형 설정 액션
        setDeviceType(type) {
            this.deviceType = type;
        },
        // 남은 시간 계산 및 실시간 업데이트
        startTimer() {
            if (!this.isLogin) {
                return;
            }

            if (this.timerInterval) {
                clearInterval(this.timerInterval); // 기존 타이머 초기화
            }

            const decoded = jwtDecode(this.accessToken);
            const expiryTime = decoded.exp * 1000; // 만료 시간 (밀리초)

            // 1초마다 남은 시간 갱신
            this.timerInterval = setInterval(() => {
                const currentTime = Date.now();
                const remaining = Math.max(0, Math.floor((expiryTime - currentTime) / 1000)); // 초 단위 남은 시간

                const minutes = String(Math.floor((remaining % 3600) / 60)).padStart(2, '0');
                const seconds = String(remaining % 60).padStart(2, '0');

                this.remainingTime = minutes + '분 ' + seconds + '초';

                if (remaining <= 0) {
                    alert("로그인 유효기간이 지났습니다.");
                    this.logout(); // 남은 시간이 0이면 로그아웃
                }
            }, 1000);
        },

        // 토큰 갱신
        async refreshAccessToken() {
            try {
                const response = await api.post('/reissue', {}, {
                    headers: { refreshToken: this.refreshToken }
                });

                const newAccessToken = response.headers.get(`Authorization`);
                const newRefreshToken = response.headers.get(`refreshToken`);

                if (!newAccessToken || !newRefreshToken) {
                    throw new Error("토큰 갱신 응답에 토큰이 없습니다.");
                }

                console.log(newAccessToken);
                console.log(newRefreshToken);
                this.setTokens(newAccessToken, newRefreshToken);
                return newAccessToken; // 갱신된 Access Token 반환
            } catch (error) {
                console.error('Failed to refresh token:', error);
                this.logout(); // 갱신 실패 시 로그아웃 처리
                throw error;
            }
        },

        // 로그아웃
        async logout() {
            const empId = this.empId;
            const fcmToken = this.fcmToken;
            const deviceType = this.deviceType;

            console.log('[로그아웃] empId:', empId, 'fcmToken:', fcmToken, 'deviceType:', deviceType);

            try {
                if (fcmToken && empId && deviceType) {
                    await deleteTokenFromBackend(empId, fcmToken, deviceType);
                    console.log('[로그아웃] FCM 토큰 삭제 요청 성공');
                } else {
                    console.warn('[로그아웃] FCM 토큰 삭제 조건 미충족:', { empId, fcmToken, deviceType });
                }
            } catch (error) {
                console.error('[FCM] 로그아웃 시 토큰 삭제 실패:', error);
            } finally {
                // 토큰 및 상태 초기화
                this.accessToken = null;
                this.refreshToken = null;
                this.fcmToken = null;
                this.deviceType = null;
                this.isLogin = false;
                this.remainingTime = 0;
                localStorage.setItem("accessToken", null);
                localStorage.setItem("refreshToken", null);
                clearInterval(this.timerInterval);
                alert("로그아웃 되었습니다.");
                router.push('/login');
            }
        },
    },
    persist: true
});
