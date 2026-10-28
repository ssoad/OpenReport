import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@openreport/schema': path.resolve(__dirname, '../../packages/schema/src'),
      '@openreport/expressions': path.resolve(__dirname, '../../packages/expressions/src'),
      '@openreport/data-engine': path.resolve(__dirname, '../../packages/data-engine/src'),
      '@openreport/layout-engine': path.resolve(__dirname, '../../packages/layout-engine/src'),
      '@openreport/exporters': path.resolve(__dirname, '../../packages/exporters/src'),
      '@openreport/core': path.resolve(__dirname, '../../packages/core/src'),
      '@openreport/dashboard': path.resolve(__dirname, '../../packages/dashboard/src')
    }
  },
  server: {
    port: 5173,
    host: true
  }
});
