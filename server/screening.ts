/**
 * POST /api/screening: generates the quick check for a role.
 *
 * Runs inside the Vite dev and preview servers (see vite.config.ts), so the
 * Anthropic API key stays on the server and never reaches the browser.
 *
 * Privacy:
 * - The request body is the employer's role profile only. It is whitelisted
 *   again here (sanitizeProfile) and is the only content sent to the model.
 *   No attendee data is ever sent to this endpoint: attendee answers stay in
 *   the attendee's browser.
 * - Nothing is stored and request bodies are not logged.
 * - The model output must match a strict JSON schema, and validateQuestions
 *   then drops anything off-limits before the employer reviews the questions.
 *
 * Without ANTHROPIC_API_KEY, or when the call fails, the questions come from
 * fixed rules (rulesQuestions), so the demo always works.
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Connect, Plugin } from 'vite'
import {
  MIN_AI_QUESTIONS,
  OUTPUT_SCHEMA,
  SYSTEM_PROMPT,
  promptFor,
  rulesQuestions,
  sanitizeProfile,
  validateQuestions,
  type RoleProfile,
  type Screening,
} from '../src/screening/core.ts'

/** A fast current model suited to short structured generation. */
export const DEFAULT_MODEL = 'claude-haiku-5-5'
const MAX_BODY = 32 * 1024

type Options = { apiKey?: string; model?: string }

async function generateWithClaude(profile: RoleProfile, apiKey: string, model: string): Promise<Screening> {
  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  const client = new Anthropic({ apiKey, timeout: 20_000, maxRetries: 1 })
  const response = await client.messages.create({
    model,
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: promptFor(profile) }],
    output_config: { effort: 'low', format: { type: 'json_schema', schema: OUTPUT_SCHEMA } },
  })
  if (response.stop_reason !== 'end_turn') throw new Error(`stop_reason ${response.stop_reason}`)
  const text = response.content.find((b) => b.type === 'text')
  if (!text || text.type !== 'text') throw new Error('No text block')
  const parsed = JSON.parse(text.text) as { questions?: unknown }
  const questions = validateQuestions(parsed.questions, profile)
  if (questions.length < MIN_AI_QUESTIONS) throw new Error(`Only ${questions.length} valid questions`)
  return { questions, source: 'ai', model }
}

export async function generateScreening(rawProfile: unknown, opts: Options): Promise<Screening> {
  const profile = sanitizeProfile(rawProfile)
  const rules: Screening = { questions: rulesQuestions(profile), source: 'rules' }
  if (!opts.apiKey) return rules
  try {
    return await generateWithClaude(profile, opts.apiKey, opts.model || DEFAULT_MODEL)
  } catch (error) {
    // Log the failure type only: never the profile or the model output.
    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    const reason =
      error instanceof Anthropic.AuthenticationError
        ? 'invalid API key'
        : error instanceof Anthropic.RateLimitError
          ? 'rate limited'
          : error instanceof Anthropic.APIConnectionError
            ? 'connection failed or timed out'
            : error instanceof Anthropic.APIError
              ? `API error ${error.status}`
              : error instanceof Error
                ? error.message
                : 'unknown error'
    console.warn(`[screening] AI generation unavailable (${reason}); using rules.`)
    return rules
  }
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks: Buffer[] = []
    req.on('data', (c: Buffer) => {
      size += c.length
      if (size > MAX_BODY) {
        reject(new Error('Body too large'))
        req.destroy()
      } else chunks.push(c)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('content-type', 'application/json')
  res.setHeader('cache-control', 'no-store')
  res.end(JSON.stringify(body))
}

function handler(opts: Options): Connect.NextHandleFunction {
  return (req, res, next) => {
    if (req.method !== 'POST') return next()
    readBody(req)
      .then((body) => generateScreening((JSON.parse(body || '{}') as { profile?: unknown }).profile, opts))
      .then((screening) => send(res, 200, screening))
      .catch(() => send(res, 400, { error: 'Invalid request' }))
  }
}

/** Vite plugin that serves POST /api/screening in dev and preview. */
export function screeningApi(opts: Options): Plugin {
  return {
    name: 'plainly-screening-api',
    configureServer(server) {
      server.middlewares.use('/api/screening', handler(opts))
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/screening', handler(opts))
    },
  }
}
