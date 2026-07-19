import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
const gitSha = (() => {
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return null;
  }
})();
const buildLabel = gitSha ? `${pkg.version}-${gitSha}` : pkg.version;

export default defineConfig({
  plugins: process.env.LAUNCH3001_HTTPS === '1' ? [basicSsl()] : [],
  define: {
    __LAUNCH3001_BUILD__: JSON.stringify(buildLabel)
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true
  },
  build: {
    target: 'es2020'
  }
});
