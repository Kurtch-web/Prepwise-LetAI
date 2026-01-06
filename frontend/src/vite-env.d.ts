/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE?: string;
  readonly VITE_RENDER_API_BASE?: string;
  readonly VITE_VERCEL_API_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
