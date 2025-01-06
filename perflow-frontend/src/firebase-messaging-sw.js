// src/firebase-messaging-sw.js
/* global __VITE_FCM_APIKEY__, __VITE_FCM_AUTHDOMAIN__, __VITE_FCM_PROJECTID__, __VITE_FCM_STORAGEBUCKET__, __VITE_FCM_MESSAGINGSENDERID__, __VITE_FCM_APPID__ */
importScripts("https://www.gstatic.com/firebasejs/11.1.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.1.0/firebase-messaging-compat.js");

console.log("서비스 워커 로드됨");

// Firebase 설정 (빌드 시점에 환경 변수로 대체)
const firebaseConfig = {
    apiKey: __VITE_FCM_APIKEY__,
    authDomain: __VITE_FCM_AUTHDOMAIN__,
    projectId: __VITE_FCM_PROJECTID__,
    storageBucket: __VITE_FCM_STORAGEBUCKET__,
    messagingSenderId: __VITE_FCM_MESSAGINGSENDERID__,
    appId: __VITE_FCM_APPID__
};

// Firebase 초기화
firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// 백그라운드 메시지 수신 핸들러
messaging.onBackgroundMessage((payload) => {
    console.log('[SW] 백그라운드 메시지 수신 성공:', payload);
    const notificationTitle = payload.notification?.title || "백그라운드 기본 제목";
    const notificationOptions = {
        body: payload.notification?.body || "백그라운드 기본 본문",
        data: {
            click_action: payload.data?.click_action || '/' // 클릭 시 이동할 URL
        }
    };
    self.registration.showNotification(notificationTitle, notificationOptions);
    console.log('[SW] 알림 표시 완료:', notificationTitle, notificationOptions);
});

// 알림 클릭 이벤트 핸들러
self.addEventListener('notificationclick', function(event) {
    console.log('[SW] 알림 클릭 이벤트 수신:', event);
    event.notification.close(); // 알림 닫기

    // 클릭된 알림의 데이터에서 URL 추출
    const clickAction = event.notification.data?.click_action;

    // URL이 지정되어 있지 않으면 기본 페이지로 이동
    const urlToOpen = new URL(clickAction || '/', self.location.origin).href;

    const promiseChain = clients.matchAll({
        type: 'window',
        includeUncontrolled: true
    }).then((windowClients) => {
        // 이미 열려 있는 창이 있는지 확인
        for (const client of windowClients) {
            if (client.url === urlToOpen && 'focus' in client) {
                return client.focus();
            }
        }
        // 열려 있는 창이 없으면 새로운 창을 엽니다.
        if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
        }
    });

    event.waitUntil(promiseChain);
});
