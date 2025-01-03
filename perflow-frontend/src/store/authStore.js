import { defineStore } from 'pinia';
import api from "@/config/axios.js";
import {ref} from "vue";
import router from "@/router/router.js";
import {jwtDecode} from "jwt-decode";

export const useAuthStore = defineStore('auth', {
    state: () => ({
        accessToken: ref(),
        refreshToken: ref(),
        empId: ref(),
        empName: ref(),
        isLogin: ref(false),
        authorities: ref(),
        timerInterval: null,
        remainingTime: 0
    }),
    actions: {
        // 로그인 후 토큰 저장
        setTokens( newAccessToken, newRefreshToken ) {
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
        // 남은 시간 계산 및 실시간 업데이트
        startTimer() {

            if(!this.isLogin){
                return
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

                this.remainingTime = minutes+'분 '+seconds+'초';

                if (remaining <= 0) {
                    alert("로그인 유효기간이 지났습니다.")
                    this.logout(); // 남은 시간이 0이면 로그아웃
                }
            }, 1000);
        },

        // 토큰 갱신
        async refreshAccessToken() {
            try {
                const response = await api.post('/reissue',{} , {
                    headers : { refreshToken: this.refreshToken }
                });

                const newAccessToken = response.headers.get(`Authorization`);
                const newRefreshToken = response.headers.get(`refreshToken`);

                console.log(newAccessToken);
                console.log(newRefreshToken);
                this.setTokens( newAccessToken, newRefreshToken );
                return newAccessToken; // 갱신된 Access Token 반환
            } catch (error) {
                console.error('Failed to refresh token:', error);
                this.logout(); // 갱신 실패 시 로그아웃 처리
                throw error;
            }
        },

        // 로그아웃
        logout() {
            this.accessToken = null;
            this.refreshToken = null;
            this.isLogin = false;
            this.remainingTime = 0;
            localStorage.setItem("accessToken", null);
            localStorage.setItem("refreshToken", null);
            clearInterval(this.timerInterval);
            router.push('/login');
        },

    },
    persist:true
});
