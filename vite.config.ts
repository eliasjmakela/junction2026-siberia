import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { screeningApi } from './server/screening.ts'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Server-side only: variables without the VITE_ prefix never reach the browser bundle.
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), screeningApi({ apiKey: env.ANTHROPIC_API_KEY, model: env.PLAINLY_SCREENING_MODEL })],
  }
})
