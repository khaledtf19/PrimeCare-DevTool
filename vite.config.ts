import { defineConfig } from 'vite';
import {resolve}from "path"


export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        injectFloaing: resolve(__dirname, 'src/inject/floating-ui.ts'),
      },
      output: {
        entryFileNames: 'assets/[name].js',
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
  },
});
