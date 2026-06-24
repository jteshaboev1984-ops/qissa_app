/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_QISSA_STORY_PROVIDER?: 'local' | 'remote'
  readonly VITE_QISSA_STORY_ENDPOINT?: string
  readonly VITE_QISSA_SUPABASE_PUBLISHABLE_KEY?: string
  readonly VITE_QISSA_STORY_TIMEOUT_MS?: string
  readonly VITE_QISSA_STORY_FALLBACK_TO_LOCAL?: 'true' | 'false'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
