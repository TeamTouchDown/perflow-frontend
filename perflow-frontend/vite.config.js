import {fileURLToPath, URL} from 'node:url'
import {defineConfig, loadEnv} from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import replace from '@rollup/plugin-replace'
import {resolve} from 'path'

export default defineConfig(({mode}) => {
    const env = loadEnv(mode, process.cwd(), '')

    return {
        plugins: [
            vue(),
            vueDevTools(),
            replace({
                preventAssignment: true,
                values: {
                    __VITE_FCM_APIKEY__: JSON.stringify(env.VITE_FCM_APIKEY || ''),
                    __VITE_FCM_AUTHDOMAIN__: JSON.stringify(env.VITE_FCM_AUTHDOMAIN || ''),
                    __VITE_FCM_PROJECTID__: JSON.stringify(env.VITE_FCM_PROJECTID || ''),
                    __VITE_FCM_STORAGEBUCKET__: JSON.stringify(env.VITE_FCM_STORAGEBUCKET || ''),
                    __VITE_FCM_MESSAGINGSENDERID__: JSON.stringify(env.VITE_FCM_MESSAGINGSENDERID || ''),
                    __VITE_FCM_APPID__: JSON.stringify(env.VITE_FCM_APPID || '')
                },
                include: resolve(__dirname, 'src/firebase-messaging-sw.js'),
            })
        ],
        resolve: {
            alias: {
                '@': fileURLToPath(new URL('./src', import.meta.url))
            }
        },
        build: {
            rollupOptions: {
                input: {
                    main: resolve(__dirname, 'index.html'), // 메인 엔트리
                    'firebase-messaging-sw': resolve(__dirname, 'src/firebase-messaging-sw.js'), // 서비스 워커 포함
                },
                output: {
                    entryFileNames: '[name].js', // 확장자를 포함한 이름 설정
                    chunkFileNames: 'assets/[name]-[hash].js',
                    assetFileNames: 'assets/[name]-[hash].[ext]',
                }
            }
        }
    }
})
