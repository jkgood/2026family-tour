import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 版本號：v{主版號}.{月日}.{時分}（台灣時間），每次建置/部署都會自動跳號。
// 要改主版號（大改版）時，只要修改下面的 MAJOR。
const MAJOR = 1
const tw = new Date(Date.now() + 8 * 60 * 60 * 1000)
const pad = (n: number) => String(n).padStart(2, '0')
const APP_VERSION = `v${MAJOR}.${pad(tw.getUTCMonth() + 1)}${pad(tw.getUTCDate())}.${pad(tw.getUTCHours())}${pad(tw.getUTCMinutes())}`

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // 確保在 GitHub Pages / Vercel 相對路徑皆能正常載入
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION),
  },
})
