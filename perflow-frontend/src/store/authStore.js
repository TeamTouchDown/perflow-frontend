import {defineStore} from 'pinia';
import api from "@/config/axios.js";
import {ref} from "vue";
import router from "@/router/router.js";
import {jwtDecode} from "jwt-decode";
import {deleteToken, getToken} from 'firebase/messaging';
import {messaging, VAPID_KEY} from '@/config/notification/firebase';
import {deleteTokenFromBackend, registerTokenToBackend} from "@/config/notification/FcmService.js";

export const useAuthStore = defineStore('auth', {
    state: () => ({
        accessToken: ref(),
        refreshToken: ref(),
        empId: ref(),
        empName: ref(),
        isLogin: ref(false),
        authorities: ref(),
        timerInterval: null,
        remainingTime: 0,
        fcmToken: ref(null),
        deviceType: ref(null),
    }),
    actions: {
        // 로그인 후 토큰 저장
        setTokens(newAccessToken, newRefreshToken) {
            this.accessToken = newAccessToken;
            this.refreshToken = newRefreshToken;
            this.isLogin = true;
            localStorage.setItem("accessToken", newAccessToken);
            localStorage.setItem("refreshToken", newRefreshToken);
            localStorage.setItem("isLogin", "true");
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
                return
            }

            if (this.timerInterval) {
                clearInterval(this.timerInterval); // 기존 타이머 초기화
            }

            const decoded = jwtDecode(this.accessToken);
            const expiryTime = decoded.exp * 1000; // 만료 시간 (밀리초)

            // 1초마다 남은 시간 갱신
            this.timerInterval = setInterval(() => {
                if(localStorage.getItem("isLogin") === "false"){
                    this.isLogin = false;
                    this.logout();
                }
                const currentTime = Date.now();
                const remaining = Math.max(0, Math.floor((expiryTime - currentTime) / 1000)); // 초 단위 남은 시간

                const minutes = String(Math.floor((remaining % 3600) / 60)).padStart(2, '0');
                const seconds = String(remaining % 60).padStart(2, '0');

                this.remainingTime = minutes + '분 ' + seconds + '초';

                if (remaining <= 0) {
                    this.logout(); // 남은 시간이 0이면 로그아웃
                }
            }, 1000);
        },

        // 토큰 갱신
        async refreshAccessToken() {
            try {
                const response = await api.post('/reissue', {}, {
                    headers: {refreshToken: this.refreshToken}
                });

                const newAccessToken = response.headers.get(`Authorization`);
                const newRefreshToken = response.headers.get(`refreshToken`);

                if (!newAccessToken || !newRefreshToken) {
                    throw new Error("토큰 갱신 응답에 토큰이 없습니다.");
                }

                this.setTokens(newAccessToken, newRefreshToken);
                return newAccessToken; // 갱신된 Access Token 반환
            } catch (error) {
                console.error('Failed to refresh token:', error);
                this.logout(); // 갱신 실패 시 로그아웃 처리
                throw error;
            }
        },

        async afterLogin() {
            // 1) 기존 FCM 토큰이 있으면 클라이언트 & 서버에서 삭제
            if (this.fcmToken) {
                try {
                    await deleteToken(messaging);
                } catch (err) {
                    console.error('[FCM] 기존 클라이언트 토큰 삭제 실패:', err);
                }

                try {
                    if (this.empId && this.deviceType) {
                        await deleteTokenFromBackend(this.empId, this.fcmToken, this.deviceType);
                        console.log('[FCM] 기존 토큰 서버 삭제 성공');
                    }
                } catch (err) {
                    console.error('[FCM] 기존 토큰 서버 삭제 실패:', err);
                }
            }

            // 2) 새 토큰 발급
            let currentToken = null;
            try {
                currentToken = await getToken(messaging, {vapidKey: VAPID_KEY});

                if (currentToken) {
                    // 서버 등록
                    await registerTokenToBackend(this.empId, currentToken, this.deviceType);

                    // 스토어에 저장
                    this.fcmToken = currentToken;
                }
            } catch (err) {
                console.error('[FCM] 새 토큰 발급 실패:', err);
            }
        },

        // 로그아웃
        async logout() {
            const empId = this.empId;
            const fcmToken = this.fcmToken;
            const deviceType = this.deviceType;

            try {
                if (fcmToken && empId && deviceType) {
                    await deleteTokenFromBackend(empId, fcmToken, deviceType);
                } else {
                    console.warn('[로그아웃] FCM 토큰 삭제 조건 미충족:', {empId, fcmToken, deviceType});
                }
            } catch (error) {
                console.error('[FCM] 로그아웃 시 토큰 삭제 실패:', error);
            } finally {
                try {
                    if (fcmToken) {
                        await deleteToken(messaging);
                    }
                } catch (err) {
                    console.error('[로그아웃] 클라이언트 토큰 삭제 실패:', err);
                }

                // 토큰 및 상태 초기화
                this.accessToken = null;
                this.refreshToken = null;
                this.fcmToken = null;
                this.deviceType = null;
                this.isLogin = false;
                this.empId = null;
                this.empName = null;
                this.authorities = null;
                this.remainingTime = 0;
                localStorage.setItem("accessToken", null);
                localStorage.setItem("refreshToken", null);
                localStorage.setItem("isLogin", "false");
                clearInterval(this.timerInterval);
                router.push('/login');
            }
        },
    },
    persist: true
});
