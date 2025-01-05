import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import replace from '@rollup/plugin-replace'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    replace({
      preventAssignment: true,
      values: {
        '__VITE_FCM_APIKEY__': JSON.stringify(process.env.VITE_FCM_APIKEY),
        '__VITE_FCM_AUTHDOMAIN__': JSON.stringify(process.env.VITE_FCM_AUTHDOMAIN),
        '__VITE_FCM_PROJECTID__': JSON.stringify(process.env.VITE_FCM_PROJECTID),
        '__VITE_FCM_STORAGEBUCKET__': JSON.stringify(process.env.VITE_FCM_STORAGEBUCKET),
        '__VITE_FCM_MESSAGINGSENDERID__': JSON.stringify(process.env.VITE_FCM_MESSAGINGSENDERID),
        '__VITE_FCM_APPID__': JSON.stringify(process.env.VITE_FCM_APPID)
      },
      include: 'src/config/firebase-messaging-sw.js' // 대체할 파일 경로
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        sw: resolve(__dirname, 'src/config/firebase-messaging-sw.js') // 서비스 워커 파일을 입력으로 포함
      },
      output: {
        entryFileNames: '[name].js',
        // 서비스 워커 파일이 루트에 위치하도록 설정
        // 다른 출력 옵션이 필요하면 추가
      }
    }
  }
})
