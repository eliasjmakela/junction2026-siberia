/** POST /api/writing-assist: helps a company clarify one role answer. */
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Connect, Plugin } from 'vite'
import {
  WRITING_SCHEMA,
  demoSuggestion,
  parseWritingSuggestion,
  promptForWriting,
  sanitizeWritingInput,
  type WritingSuggestion,
} from '../src/writing-assistant/core.ts'

export const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash'
const MAX_BODY = 8 * 1024

type Options = { apiKey?: string; model?: string }

async function generateWithGemini(input: NonNullable<ReturnType<typeof sanitizeWritingInput>>, apiKey: string, model: string): Promise<WritingSuggestion> {
  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      model,
      input: promptForWriting(input),
      store: false,
      response_format: { type: 'text', mime_type: 'application/json', schema: WRITING_SCHEMA },
    }),
    signal: AbortSignal.timeout(20_000),
  })
  if (!response.ok) throw new Error(`Gemini API error ${response.status}`)
  const data = (await response.json()) as { output_text?: unknown }
  if (typeof data.output_text !== 'string') throw new Error('Gemini returned no text')
  const parsed = parseWritingSuggestion(JSON.parse(data.output_text))
  return { ...parsed, source: 'gemini', model }
}

async function suggest(raw: unknown, opts: Options): Promise<WritingSuggestion | null> {
  const input = sanitizeWritingInput(raw)
  if (!input) return null
  if (!opts.apiKey) return demoSuggestion(input)
  try {
    return await generateWithGemini(input, opts.apiKey, opts.model || DEFAULT_GEMINI_MODEL)
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'unknown error'
    console.warn(`[writing-assist] Gemini unavailable (${reason}); using demo response.`)
    return demoSuggestion(input)
  }
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > MAX_BODY) {
        reject(new Error('Body too large'))
        req.destroy()
      } else chunks.push(chunk)
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
      .then((body) => suggest(JSON.parse(body || '{}'), opts))
      .then((result) => result ? send(res, 200, result) : send(res, 400, { error: 'Invalid request' }))
      .catch(() => send(res, 400, { error: 'Invalid request' }))
  }
}

export function writingAssistantApi(opts: Options): Plugin {
  return {
    name: 'plainly-writing-assistant-api',
    configureServer(server) {
      server.middlewares.use('/api/writing-assist', handler(opts))
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/writing-assist', handler(opts))
    },
  }
}
