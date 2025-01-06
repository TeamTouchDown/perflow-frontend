// src/views/notification/FcmService.js
import {getToken, onMessage} from 'firebase/messaging';
import {messaging, VAPID_KEY} from './firebase';
import api from "@/config/axios.js";

/**
 * FCM 토큰을 초기화하고 서버에 등록하는 함수
 * @param {String} empId - 사용자(Employee) ID
 * @param {String} deviceType - 기기 유형 (예: 'CHROME', 'FIREFOX', 'SAFARI')
 * @param {Function} setFcmTokenCallback - FCM 토큰을 설정하는 콜백 함수
 */
export async function initFCMToken(empId, deviceType, setFcmTokenCallback) {
    console.log('[FCM] 초기화 시작: empId=', empId, ', deviceType=', deviceType);

    // 1) 알림 권한 요청
    try {
        const permission = await Notification.requestPermission();
        console.log('[FCM] 알림 권한 상태:', permission);
        if (permission !== 'granted') {
            console.warn('[FCM] 알림 권한이 허용되지 않았습니다.');
            return null;
        }
    } catch (error) {
        console.error('[FCM] 알림 권한 요청 실패:', error);
        return null;
    }

    // 2) FCM 토큰 가져오기
    let currentToken = null;
    try {
        currentToken = await getToken(messaging, {vapidKey: VAPID_KEY});
        console.log('[FCM] FCM 토큰 획득 시도:', currentToken);
        if (currentToken) {
            console.log('[FCM] FCM Token 획득 성공:', currentToken);
            // 3) 백엔드에 토큰 등록
            await registerTokenToBackend(empId, currentToken, deviceType);
            console.log('[FCM] 백엔드에 토큰 등록 성공');
            // 4) 콜백을 통해 토큰 설정
            if (setFcmTokenCallback) {
                setFcmTokenCallback(currentToken);
                console.log('[FCM] 콜백을 통해 FCM 토큰 설정 완료:', currentToken);
            }
        } else {
            console.warn('[FCM] FCM 토큰을 찾을 수 없습니다.');
        }
    } catch (error) {
        console.error('[FCM] FCM 토큰 발급 실패:', error);
        return null;
    }

    // 5) 주기적으로 토큰 확인 (예: 1시간마다)
    setInterval(async () => {
        try {
            const newToken = await getToken(messaging, {vapidKey: VAPID_KEY});
            console.log('[FCM] 주기적 토큰 확인:', newToken);
            if (newToken && newToken !== currentToken) {
                console.log('[FCM] FCM Token 갱신 감지:', newToken);
                await registerTokenToBackend(empId, newToken, deviceType);
                console.log('[FCM] 갱신된 토큰을 백엔드에 등록 완료');
                if (setFcmTokenCallback) {
                    setFcmTokenCallback(newToken);
                    console.log('[FCM] 콜백을 통해 갱신된 FCM 토큰 설정 완료:', newToken);
                }
                currentToken = newToken;
            } else {
                console.log('[FCM] 토큰 갱신 없음 또는 동일한 토큰');
            }
        } catch (error) {
            console.error('[FCM] 주기적 토큰 확인 실패:', error);
        }
    }, 60 * 60 * 1000); // 1시간
}

/**
 * 백엔드에 FCM 토큰을 등록하는 함수
 * @param {String} empId - 사용자 ID
 * @param {String} token - FCM 토큰
 * @param {String} deviceType - 기기 유형
 */
export async function registerTokenToBackend(empId, token, deviceType) {
    console.log('[FCM] 백엔드에 토큰 등록:', {empId, token, deviceType});
    try {
        await api.post('/fcm/token', {
            empId: empId,
            token: token,
            deviceType: deviceType
        });
        console.log('토큰이 서버에 정상적으로 등록되었습니다.');
    } catch (error) {
        console.error('서버로 토큰 전송 실패:', error);
    }
}

/**
 * 백엔드에서 FCM 토큰을 삭제하는 함수
 * @param {String} empId - 사용자 ID
 * @param {String} token - 삭제할 FCM 토큰
 * @param {String} deviceType - 기기 유형
 */
export async function deleteTokenFromBackend(empId, token, deviceType) {
    try {
        await api.delete('/fcm/token', {
            data: {
                empId: empId,
                token: token,
                deviceType: deviceType
            }
        });
        console.log('토큰이 서버에서 삭제되었습니다.');
    } catch (error) {
        console.error('서버에서 토큰 삭제 실패:', error);
    }
}

/**
 * 포그라운드 메시지 수신 핸들러
 */
export function initForegroundMessageHandler() {
    console.log('[포그라운드] 메시지 콜백 등록');
    onMessage(messaging, (payload) => {
        console.log('포그라운드 메시지 수신:', payload);
        if (payload?.notification) {
            const {title, body, icon} = payload.notification;
            const clickAction = payload.data?.click_action || '/';

            console.log('[FCM] 알림 제목:', title, ', 알림 본문:', body);

            // 포그라운드에서 알림 표시
            const notification = new Notification(title, {
                body,
                data: {click_action: clickAction}
            });

            notification.onclick = () => {
                window.location.href = clickAction;
            };
        } else if (payload?.data) {
            console.log('[FCM] 데이터 메시지:', payload.data);
            // 데이터 메시지 처리 로직 추가 (예: 사용자에게 UI 업데이트)
        }
    });
}
