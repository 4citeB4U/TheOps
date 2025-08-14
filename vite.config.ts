import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig((mode) => {
  // process.cwd() is a Node.js function.
  // The 'loadEnv' function from Vite correctly loads variables from .env files.
  const env = loadEnv(mode, '', '');

  return {
    base: '/TheOps/',
    plugins: [react()],
    define: {
      // This makes environment variables available in your client-side code.
      // It reads GEMINI_API_KEY from your .env file or environment and makes it
      // available as `process.env.API_KEY`, which the application's services use.
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || ''),
      // This is used to disable the service worker during the GitHub Actions build
      // to prevent caching issues on certain domains.
      'process.env.VITE_DISABLE_SW': JSON.stringify(env.VITE_DISABLE_SW),
    }
  };
});
