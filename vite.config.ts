import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { eventAiApi } from './server/event-ai.ts'
import { writingAssistantApi } from './server/writing-assistant.ts'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Server-side only: variables without the VITE_ prefix never reach the browser bundle.
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      react(),
      eventAiApi({ apiKey: env.ANTHROPIC_API_KEY, model: env.PLAINLY_AI_MODEL }),
      writingAssistantApi({ apiKey: env.GEMINI_API_KEY, model: env.PLAINLY_WRITING_MODEL }),
    ],
  }
})
