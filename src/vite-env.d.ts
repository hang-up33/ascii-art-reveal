/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** AI 生成 API（Cloudflare Worker）の接続先 URL。未設定なら AI 生成は無効。 */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
