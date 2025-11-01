/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE: string; // add other env variables here
  // e.g. readonly VITE_OTHER_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
