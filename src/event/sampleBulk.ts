import type { Score } from './core'
import type { Application, Listing } from './store'

/**
 * The long tail of a realistic applicant pool: many short, generic or thin
 * applications with low scores, generated from fixed seeds. The hand-written
 * applicants in sampleApplicants.ts are the ones worth reading; these show
 * what staff sift through to find them.
 */

const COUNT = 160

function rng(seed: number) {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

const GENERIC = [
  'I am passionate about {topic} and always strive to deliver high-quality results.',
  'I am a hard-working team player who adapts quickly to new challenges.',
  'I believe strong communication and a positive attitude are the keys to success in any role.',
  'I have always been interested in {topic} and I am eager to learn more.',
  'I am confident that my skills and motivation make me a great fit for this position.',
  'In a fast-paced environment it is important to stay flexible and solution-oriented.',
  'I take ownership of my work and always go the extra mile for the team.',
]
const THIN = [
  'I have some experience with this.',
  'I would ask my colleagues for help.',
  'I try to do my best in every situation.',
  'I have done similar things before.',
  'I would look into it and fix it.',
  'I think this is an important part of the job.',
]
const OFF_TOPIC = [
  'I worked in a café for two summers and served many customers.',
  'In my free time I enjoy football and reading.',
  'I recently finished an online course in project management.',
  'I like meeting new people and learning about different cultures.',
]
const MEDIUM = [
  'In my previous job I worked with {topic} on some tasks and it went well.',
  'I helped a colleague with a problem related to {topic} and we solved it together.',
  'I would first find out what causes the problem and then try a few solutions.',
  'During my studies I did a small project about {topic}.',
  'I usually write down what I did so others can follow it.',
  'I have handled situations like this a few times at work.',
]
const DECENT_TAIL = [
  'It took about {n} weeks and the team still uses it.',
  'Afterwards we had about {n} fewer problems a month.',
  'I tested it with {n} colleagues before we used it more widely.',
]

const RATIONALE = {
  low: ['Claims the skill with no example of their own work.', 'Generic statement that would fit any company.', 'Not about the work this attribute describes.'],
  mid: ['Relevant, but vague: no own actions or result.', 'Mentions the right area without specifics.'],
  ok: ['A relevant example with some specifics, but no clear result.', 'Own actions are described; the result is only implied.'],
}

type Tier = 'weak' | 'medium' | 'decent'

/** Generated applications and their scores, keyed `${applicationId}:${listingId}`. */
export function bulkApplicants(listings: Listing[], takenCodes: Set<string>): { applications: Application[]; scores: Record<string, Score[]> } {
  const r = rng(20270204)
  const pick = <T,>(xs: T[]) => xs[Math.floor(r() * xs.length)]
  const alphabet = 'ABCDEFGHJKLMNPQRTUVWXYZ23456789'
  const applications: Application[] = []
  const scores: Record<string, Score[]> = {}
  const codes = new Set(takenCodes)

  for (let n = 1; n <= COUNT && listings.length; n += 1) {
    let code = ''
    do {
      code = 'A-'
      for (let i = 0; i < 4; i += 1) code += alphabet[Math.floor(r() * alphabet.length)]
    } while (codes.has(code))
    codes.add(code)

    const roll = r()
    const tier: Tier = roll < 0.65 ? 'weak' : roll < 0.93 ? 'medium' : 'decent'
    const howMany = Math.min(listings.length, r() < 0.5 ? 1 : r() < 0.7 ? 2 : 3)
    const picks = [...listings].sort(() => r() - 0.5).slice(0, howMany)
    const id = `bulk-${String(n).padStart(3, '0')}`
    const answers: Record<string, Record<string, string>> = {}

    for (const l of picks) {
      const topicOf = (qAttrs: string[]) => (l.set.attributes.find((a) => a.id === qAttrs[0])?.name ?? l.title).toLowerCase()
      const byQuestion: Record<string, string> = {}
      for (const q of l.set.questions) {
        const fill = (s: string) => s.replace('{topic}', topicOf(q.attributes)).replace('{n}', String(2 + Math.floor(r() * 6)))
        const parts =
          tier === 'weak'
            ? [pick(r() < 0.5 ? GENERIC : r() < 0.6 ? THIN : OFF_TOPIC), ...(r() < 0.4 ? [pick(GENERIC)] : [])]
            : tier === 'medium'
              ? [pick(MEDIUM), ...(r() < 0.5 ? [pick(GENERIC)] : [])]
              : [pick(MEDIUM), pick(DECENT_TAIL)]
        byQuestion[q.id] = parts.map(fill).join(' ')
      }
      answers[l.id] = byQuestion

      scores[`${id}:${l.id}`] = l.set.attributes.map((a) => {
        const q = l.set.questions.find((x) => x.attributes.includes(a.id))
        const answer = q ? byQuestion[q.id] : ''
        const nullChance = tier === 'weak' ? 0.4 : tier === 'medium' ? 0.1 : 0
        if (!q || !answer || r() < nullChance) return { attribute: a.id, score: null, evidence: '', rationale: 'No usable evidence in the answers.' }
        const score = tier === 'weak' ? Math.floor(r() * 3) : tier === 'medium' ? 1 + Math.floor(r() * 3) : 3 + Math.floor(r() * 2)
        const band = score <= 2 ? RATIONALE.low : score <= 4 ? RATIONALE.mid : RATIONALE.ok
        const evidence = answer.split(/(?<=[.!?])\s+/)[0]
        return { attribute: a.id, score, evidence, question: q.id, rationale: pick(band) }
      })
    }

    const day = 1 + Math.floor(r() * 17)
    const at = `2027-02-${String(day).padStart(2, '0')}T${String(8 + Math.floor(r() * 12)).padStart(2, '0')}:${String(Math.floor(r() * 60)).padStart(2, '0')}:00.000Z`
    applications.push({
      id,
      code,
      submittedAt: at,
      picks: picks.map((l) => l.id),
      answers,
      email: `applicant${String(n).padStart(3, '0')}@example.invalid`,
      consentAt: at,
      sample: true,
    })
  }
  return { applications, scores }
}
