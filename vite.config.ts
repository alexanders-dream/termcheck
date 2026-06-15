import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { copyFileSync, readdirSync } from 'node:fs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

function copyIconsToDist() {
  const publicDir = resolve(__dirname, 'public');
  const distDir = resolve(__dirname, 'dist');
  const files = readdirSync(publicDir);
  for (const file of files) {
    if (file.endsWith('.png') || file.endsWith('.svg') || file.endsWith('.json')) {
      copyFileSync(resolve(publicDir, file), resolve(distDir, file));
    }
  }
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-extension-files',
      closeBundle() {
        copyIconsToDist();
        console.log('Extension files copied to dist/');
      },
    },
  ],
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/index.html'),
        background: resolve(__dirname, 'src/background/index.ts'),
        content: resolve(__dirname, 'src/content/index.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
        format: 'es',
      },
      external: () => false,
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
      },
    },
  },
});
