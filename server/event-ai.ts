/**
 * POST /api/questions and POST /api/assess: the AI steps of event shortlisting.
 *
 * Runs inside the Vite dev and preview servers (see vite.config.ts), so the
 * Anthropic API key stays on the server and never reaches the browser.
 *
 * Privacy:
 * - /api/questions receives the company brief only (the role in the
 *   company's words). No applicant data.
 * - /api/assess receives one listing's attributes and questions and one
 *   applicant's answers to them, already scrubbed of contact details in the
 *   browser and again here. No name, e-mail, application code or other
 *   listings' answers. Nothing is stored and request bodies are never logged.
 * - Model output must match a strict JSON schema, and the shared validators in
 *   src/event/core.ts then drop anything ungrounded or off-limits.
 *
 * Without ANTHROPIC_API_KEY, or when a call fails, the response says
 * source "rules" and the browser uses the fixed-rule fallback.
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Connect, Plugin } from 'vite'
import {
  ASSESS_SCHEMA,
  ASSESS_SYSTEM,
  QUESTIONS_SCHEMA,
  QUESTIONS_SYSTEM,
  assessPrompt,
  questionsPrompt,
  sanitizeAssessmentInput,
  sanitizeBrief,
  validateQuestionSet,
  validateScores,
  type AssessmentResult,
  type QuestionSet,
} from '../src/event/core.ts'

export const DEFAULT_MODEL = 'claude-opus-5-5'
const MAX_BODY = 64 * 1024

type Options = { apiKey?: string; model?: string }

async function callClaude(opts: Required<Options>, system: string, prompt: string, schema: object, effort: 'low' | 'medium'): Promise<unknown> {
  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  const client = new Anthropic({ apiKey: opts.apiKey, timeout: 80_000, maxRetries: 1 })
  const response = await client.beta.messages.create({
    model: opts.model,
    max_tokens: 16000,
    system,
    messages: [{ role: 'user', content: prompt }],
    output_config: { effort, format: { type: 'json_schema', schema: schema as Record<string, unknown> } },
    // On a safety decline, the API re-runs the request on a fallback model it picks.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
  })
  if (response.stop_reason !== 'end_turn') throw new Error(`stop_reason ${response.stop_reason}`)
  const text = response.content.find((b) => b.type === 'text')
  if (!text || text.type !== 'text') throw new Error('No text block')
  return JSON.parse(text.text)
}

async function reasonOf(error: unknown) {
  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  if (error instanceof Anthropic.AuthenticationError) return 'invalid API key'
  if (error instanceof Anthropic.RateLimitError) return 'rate limited'
  if (error instanceof Anthropic.APIConnectionError) return 'connection failed or timed out'
  if (error instanceof Anthropic.APIError) return `API error ${error.status}`
  return error instanceof Error ? error.message : 'unknown error'
}

export async function generateQuestions(rawBrief: unknown, opts: Options): Promise<QuestionSet | { source: 'rules' }> {
  const brief = sanitizeBrief(rawBrief)
  if (!opts.apiKey || !brief.sources.length) return { source: 'rules' }
  const model = opts.model || DEFAULT_MODEL
  try {
    const out = await callClaude({ apiKey: opts.apiKey, model }, QUESTIONS_SYSTEM, questionsPrompt(brief), QUESTIONS_SCHEMA, 'medium')
    const set = validateQuestionSet(out, brief)
    if (!set) throw new Error('Too few grounded attributes or questions')
    return { ...set, source: 'ai', model }
  } catch (error) {
    // Log the failure type only: never the brief or the model output.
    console.warn(`[questions] AI generation unavailable (${await reasonOf(error)}); using rules.`)
    return { source: 'rules' }
  }
}

export async function assess(rawInput: unknown, opts: Options): Promise<AssessmentResult | { source: 'rules' }> {
  const input = sanitizeAssessmentInput(rawInput)
  if (!opts.apiKey || !input) return { source: 'rules' }
  const model = opts.model || DEFAULT_MODEL
  try {
    const out = (await callClaude({ apiKey: opts.apiKey, model }, ASSESS_SYSTEM, assessPrompt(input), ASSESS_SCHEMA, 'medium')) as { scores?: unknown }
    return { scores: validateScores(out.scores, input), source: 'ai', model }
  } catch (error) {
    console.warn(`[assess] AI scoring unavailable (${await reasonOf(error)}); using rules.`)
    return { source: 'rules' }
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

function route(run: (body: Record<string, unknown>) => Promise<unknown>): Connect.NextHandleFunction {
  return (req, res, next) => {
    if (req.method !== 'POST') return next()
    readBody(req)
      .then((body) => run(JSON.parse(body || '{}') as Record<string, unknown>))
      .then((out) => send(res, 200, out))
      .catch(() => send(res, 400, { error: 'Invalid request' }))
  }
}

/** Vite plugin that serves the event AI endpoints in dev and preview. */
export function eventAiApi(opts: Options): Plugin {
  const mount = (middlewares: Connect.Server) => {
    middlewares.use('/api/questions', route((b) => generateQuestions(b.brief, opts)))
    middlewares.use('/api/assess', route((b) => assess(b.input, opts)))
  }
  return {
    name: 'plainly-event-ai-api',
    configureServer: (server) => mount(server.middlewares),
    configurePreviewServer: (server) => mount(server.middlewares),
  }
}
