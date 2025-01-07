// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getMessaging } from 'firebase/messaging';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FCM_APIKEY,
    authDomain: import.meta.env.VITE_FCM_AUTHDOMAIN,
    projectId: import.meta.env.VITE_FCM_PROJECTID,
    storageBucket: import.meta.env.VITE_FCM_STORAGEBUCKET,
    messagingSenderId: import.meta.env.VITE_FCM_MESSAGINGSENDERID,
    appId: import.meta.env.VITE_FCM_APPID
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// Firebase Messaging 인스턴스 가져오기
const messaging = getMessaging(app);

// VAPID 키 설정
const VAPID_KEY = import.meta.env.VITE_FCM_VAPID_KEY;

export { messaging, VAPID_KEY };
