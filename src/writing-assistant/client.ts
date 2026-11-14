import type { WritingSuggestion } from './core'

export async function getWritingSuggestion(input: { fieldId: string; currentAnswer: string; roleTitle: string }): Promise<WritingSuggestion> {
  const response = await fetch('/api/writing-assist', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!response.ok) throw new Error('Writing help is unavailable')
  const result = (await response.json()) as WritingSuggestion
  if (typeof result.draft !== 'string' || !Array.isArray(result.questions) || (result.source !== 'demo' && result.source !== 'gemini')) {
    throw new Error('Writing help is unavailable')
  }
  return result
}
