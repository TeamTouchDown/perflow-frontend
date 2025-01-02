import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

// Axios 기본 설정
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL
});

// 요청 인터셉터: Access Token 자동 추가
api.interceptors.request.use((config) => {

    console.log(`request interceptor 시작!`)

    if(config.url.includes('/reissue')){
        if(localStorage.getItem("accessToken")){
            config.headers['Authorization'] = `${localStorage.getItem("accessToken")}`;
        }
    } else {
        if(localStorage.getItem("refreshToken")){
            config.headers['Authorization'] = `${localStorage.getItem("refreshToken")}`;
        }
    }

    return config;
});

// 응답 인터셉터: Access Token 만료 처리
api.interceptors.response.use(
    (response) => {
        return response
    }, // 성공 응답은 그대로 반환
    async (error) => {

        const { errorCode, message } = error.response.data;
        console.error(`ErrorCode: ${errorCode}, Message: ${message}`);

        console.log(`response interceptor 시작!`)

        const authStore = useAuthStore();
        const originalRequest = error.config;

        if (error.response?.status === 401 && errorCode==='NOT_VALID_ACCESS_TOKEN') {
            try {
                const newToken = await authStore.refreshAccessToken();
                originalRequest.headers['Authorization'] = `${newToken}`;
                return api(originalRequest); // 원래 요청 재시도
            } catch (refreshError) {
                return Promise.reject(refreshError); // 갱신 실패 시 오류 반환
            }
        } else if(error.response?.status === 403) {
            alert("권한이 없습니다.");
        }

        return Promise.reject(error); // 다른 오류는 그대로 반환
    }
);

export default api;
