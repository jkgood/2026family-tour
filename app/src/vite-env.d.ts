declare module '*.css';
declare module '*.svg';
declare module '*.png';
declare module '*.jpg';

// Vite 環境變數型別（讓 import.meta.env 能通過 tsc 檢查）
interface ImportMetaEnv {
  readonly VITE_FIREBASE_DB_URL?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// 由 vite.config.ts 在每次建置時自動產生
declare const __APP_VERSION__: string;
