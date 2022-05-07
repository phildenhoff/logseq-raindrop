import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import logseqDevPlugin from "vite-plugin-logseq";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    svelte(),
    logseqDevPlugin()
  ],
  build: {
    target: "esnext",
    minify: "esbuild",
  },

})
