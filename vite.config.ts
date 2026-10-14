import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  define: mode === 'element' ? { 'process.env.NODE_ENV': '"production"' } : {},
  build:
    mode === 'element'
      ? {
          outDir: 'dist-element',
          emptyOutDir: true,
          lib: { entry: 'src/element.ts', formats: ['es'], fileName: () => 'agro-scratch-game.js' },
        }
      : {},
  test: { environment: 'node' },
}));
