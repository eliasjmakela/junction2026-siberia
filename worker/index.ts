/**
 * The Cloudflare Worker for plainly.eliasmakela.fi: serves the built app from
 * static assets and the three API routes the Vite dev server serves locally.
 * Secrets (ANTHROPIC_API_KEY, GEMINI_API_KEY) are set with `wrangler secret put`;
 * without them the routes answer with the fixed-rule and demo fallbacks.
 */
import { assess, generateQuestions } from '../server/event-ai.ts'
import { suggest } from '../server/writing-assistant.ts'

type Env = {
  ASSETS: { fetch(request: Request): Promise<Response> }
  ANTHROPIC_API_KEY?: string
  PLAINLY_AI_MODEL?: string
  GEMINI_API_KEY?: string
  PLAINLY_WRITING_MODEL?: string
}

const MAX_BODY = 64 * 1024

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } })

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url)
    if (!pathname.startsWith('/api/')) return env.ASSETS.fetch(request)
    if (request.method !== 'POST') return json(405, { error: 'Method not allowed' })

    let body: Record<string, unknown>
    try {
      const text = await request.text()
      if (text.length > MAX_BODY) return json(413, { error: 'Body too large' })
      body = JSON.parse(text || '{}') as Record<string, unknown>
    } catch {
      return json(400, { error: 'Invalid request' })
    }

    const claude = { apiKey: env.ANTHROPIC_API_KEY, model: env.PLAINLY_AI_MODEL }
    switch (pathname) {
      case '/api/questions':
        return json(200, await generateQuestions(body.brief, claude))
      case '/api/assess':
        return json(200, await assess(body.input, claude))
      case '/api/writing-assist': {
        const result = await suggest(body, { apiKey: env.GEMINI_API_KEY, model: env.PLAINLY_WRITING_MODEL })
        return result ? json(200, result) : json(400, { error: 'Invalid request' })
      }
      default:
        return json(404, { error: 'Not found' })
    }
  },
}
