import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { copyFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

function copyExtensionAssets() {
  const publicDir = resolve(__dirname, 'public');
  const distDir = resolve(__dirname, 'dist');
  if (!existsSync(distDir)) {
    mkdirSync(distDir, { recursive: true });
  }
  const files = readdirSync(publicDir);
  for (const file of files) {
    if (file.endsWith('.png') || file.endsWith('.svg') || file.endsWith('.json')) {
      copyFileSync(resolve(publicDir, file), resolve(distDir, file));
    }
  }
  // Copy pdfjs-dist worker into dist so the popup can load it
  try {
    copyFileSync(
      resolve(__dirname, 'node_modules/pdfjs-dist/build/pdf.worker.mjs'),
      resolve(distDir, 'pdf.worker.mjs')
    );
  } catch (e) {
    console.warn('Could not copy pdf.worker.mjs to dist', e);
  }
  // Ensure manifest.json is in dist for production builds
  try {
    copyFileSync(resolve(__dirname, 'manifest.json'), resolve(distDir, 'manifest.json'));
  } catch (e) {
    console.warn('manifest.json not found in root, skipping copy to dist');
  }
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-extension-files',
      closeBundle() {
        copyExtensionAssets();
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
