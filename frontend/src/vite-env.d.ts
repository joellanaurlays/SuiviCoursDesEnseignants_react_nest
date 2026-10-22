/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Active le mode de prévisualisation local du module Suivi des enseignements.
   * Doit valoir exactement "true" ET être combinée à import.meta.env.DEV.
   * En production (build), import.meta.env.DEV vaut false : le mode est mort.
   */
  readonly VITE_ENABLE_LOCAL_PREVIEW?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
