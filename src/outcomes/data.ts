import { SAMPLE_LISTINGS } from '../event/sample'

/**
 * A simulated follow-up cohort for the concept demo. Every value comes from a
 * fixed-seed generator: nothing is collected, looked up or sent anywhere.
 */

export type Checkpoint = 3 | 6

export type Job = 'picked' | 'elsewhere' | 'none'

export type Person = {
  id: number
  picks: string[]
  /** Companies that invited this applicant to the event. */
  invitedBy: string[]
  attended: boolean
  /** A profile was found and confirmed for this participant. */
  matched: boolean
  /** Employment found at each checkpoint, cumulative. */
  job: Record<Checkpoint, Job>
  /** The company of a picked-company hire. */
  employer: Record<Checkpoint, string | null>
}

export type Company = { id: string; company: string; title: string }

export type Interval = { value: number; low: number; high: number; n: number }

export type Funnel = { applied: number; invited: number; attended: number; matched: number; picked: number; elsewhere: number }

export type CompanyRow = Company & {
  applicants: number
  invited: number
  attended: number
  hires: Record<Checkpoint, number>
  invitedRate: Interval
  otherRate: Interval
}

export type WorkerBatch = { batch: number; worker: string; profiles: number; matched: number; employers: number; seconds: number }

export type Summary = {
  checkpoint: Checkpoint
  checkedOn: string
  funnel: Funnel
  pickedShare: Interval
  anyJobShare: Interval
  coverage: Interval
  hires: number
  companies: CompanyRow[]
  batches: WorkerBatch[]
}

export const EVENT_DATE = '4 Mar 2027'
export const CHECKED_ON: Record<Checkpoint, string> = { 3: '4 Jun 2027', 6: '6 Sep 2027' }
const COHORT = 140
const SLOTS = 14

/** mulberry32: small, fast, deterministic. */
function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const COMPANIES: Company[] = SAMPLE_LISTINGS.map((l) => ({ id: l.id, company: l.company, title: l.title }))

/** Relative interest per company, and how readily each one hires from the event. */
const INTEREST = [1.3, 1.5, 1.0, 0.8, 0.9]
const HIRE_PULL = [1.2, 1.0, 0.9, 0.45, 0.8]

function pickWeighted(rand: () => number, ids: string[], weights: number[]): string {
  const total = weights.reduce((s, w) => s + w, 0)
  let r = rand() * total
  for (let i = 0; i < ids.length; i += 1) {
    r -= weights[i]
    if (r <= 0) return ids[i]
  }
  return ids[ids.length - 1]
}

function generate(): Person[] {
  const rand = rng(20270304)
  const ids = COMPANIES.map((c) => c.id)
  const weights = ids.map((_, i) => INTEREST[i] ?? 1)

  // Applications: 1–3 picks each, plus a synthetic answer-quality score per pick.
  const raw = Array.from({ length: COHORT }, (_, id) => {
    const count = rand() < 0.35 ? 1 : rand() < 0.6 ? 2 : 3
    const picks: string[] = []
    while (picks.length < Math.min(count, ids.length)) {
      const c = pickWeighted(rand, ids, weights)
      if (!picks.includes(c)) picks.push(c)
    }
    const base = rand()
    const quality = Object.fromEntries(picks.map((c) => [c, Math.min(1, Math.max(0, base * 0.7 + rand() * 0.3))]))
    return { id, picks, quality }
  })

  // Each company invites its top-ranked applicants up to its slots.
  const invitedBy = new Map<number, string[]>()
  for (const c of ids) {
    const ranked = raw.filter((p) => p.picks.includes(c)).sort((a, b) => b.quality[c] - a.quality[c])
    for (const p of ranked.slice(0, SLOTS)) invitedBy.set(p.id, [...(invitedBy.get(p.id) ?? []), c])
  }

  return raw.map((p) => {
    const by = invitedBy.get(p.id) ?? []
    const invited = by.length > 0
    const attended = invited && rand() < 0.86
    const matched = rand() < (attended ? 0.78 : 0.66)
    const pull = (c: string) => HIRE_PULL[ids.indexOf(c)] ?? 1

    // Picked-company hire: much likelier for attendees, rising by 6 months.
    const candidates = attended ? by : p.picks
    const pPicked3 = attended ? 0.13 : 0.025
    const pPicked6 = attended ? 0.09 : 0.02
    const target = candidates.length ? candidates[Math.floor(rand() * candidates.length)] : null
    const roll3 = rand()
    const roll6 = rand()
    const hired3 = target !== null && roll3 < pPicked3 * pull(target) * candidates.length ** 0.4
    const hired6 = hired3 || (target !== null && roll6 < pPicked6 * pull(target) * candidates.length ** 0.4)
    const other3 = !hired3 && rand() < 0.14
    const other6 = !hired6 && (other3 || rand() < 0.13)

    return {
      id: p.id,
      picks: p.picks,
      invitedBy: by,
      attended,
      matched,
      job: { 3: hired3 ? 'picked' : other3 ? 'elsewhere' : 'none', 6: hired6 ? 'picked' : other6 ? 'elsewhere' : 'none' },
      employer: { 3: hired3 ? target : null, 6: hired6 ? target : null },
    }
  })
}

/** Wilson score interval at 95%: a rough range that behaves at small counts. */
export function wilson(successes: number, n: number): Interval {
  if (!n) return { value: 0, low: 0, high: 0, n }
  const z = 1.96
  const p = successes / n
  const denom = 1 + (z * z) / n
  const centre = (p + (z * z) / (2 * n)) / denom
  const half = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / denom
  return { value: p, low: Math.max(0, centre - half), high: Math.min(1, centre + half), n }
}

function batchesFor(people: Person[], checkpoint: Checkpoint): WorkerBatch[] {
  const rand = rng(checkpoint === 3 ? 603 : 906)
  const workers = ['Worker 1', 'Worker 2', 'Worker 3', 'Worker 4', 'Worker 5', 'Worker 6']
  // Attendees and the applicants used for comparison, plus the five company pages.
  const queue = people.filter((p) => p.matched || rand() < 0.5)
  const size = 18
  const out: WorkerBatch[] = []
  for (let i = 0; i < queue.length; i += size) {
    const chunk = queue.slice(i, i + size)
    const matched = chunk.filter((p) => p.matched).length
    out.push({
      batch: out.length + 1,
      worker: workers[out.length % workers.length],
      profiles: chunk.length,
      matched,
      employers: chunk.filter((p) => p.matched && p.job[checkpoint] !== 'none').length,
      seconds: Math.round(40 + rand() * 50),
    })
  }
  out.push({ batch: out.length + 1, worker: workers[out.length % workers.length], profiles: COMPANIES.length, matched: COMPANIES.length, employers: 0, seconds: Math.round(12 + rand() * 10) })
  return out
}

let cache: { people: Person[]; summaries: Partial<Record<Checkpoint, Summary>> } | null = null

export function summary(checkpoint: Checkpoint): Summary {
  if (!cache) cache = { people: generate(), summaries: {} }
  const hit = cache.summaries[checkpoint]
  if (hit) return hit
  const people = cache.people

  const invited = people.filter((p) => p.invitedBy.length)
  const attended = invited.filter((p) => p.attended)
  const matched = attended.filter((p) => p.matched)
  const picked = matched.filter((p) => p.job[checkpoint] === 'picked').length
  const elsewhere = matched.filter((p) => p.job[checkpoint] === 'elsewhere').length

  const companies: CompanyRow[] = COMPANIES.map((c) => {
    const applicants = people.filter((p) => p.picks.includes(c.id))
    const inv = applicants.filter((p) => p.invitedBy.includes(c.id))
    const att = inv.filter((p) => p.attended)
    const attMatched = att.filter((p) => p.matched)
    const others = applicants.filter((p) => !p.invitedBy.includes(c.id) && p.matched)
    const hiresAt = (cp: Checkpoint) => attMatched.filter((p) => p.employer[cp] === c.id).length
    return {
      ...c,
      applicants: applicants.length,
      invited: inv.length,
      attended: att.length,
      hires: { 3: hiresAt(3), 6: hiresAt(6) },
      invitedRate: wilson(hiresAt(checkpoint), attMatched.length),
      otherRate: wilson(others.filter((p) => p.employer[checkpoint] === c.id).length, others.length),
    }
  })

  const s: Summary = {
    checkpoint,
    checkedOn: CHECKED_ON[checkpoint],
    funnel: { applied: people.length, invited: invited.length, attended: attended.length, matched: matched.length, picked, elsewhere },
    pickedShare: wilson(picked, matched.length),
    anyJobShare: wilson(picked + elsewhere, matched.length),
    coverage: wilson(matched.length, attended.length),
    hires: picked,
    companies,
    batches: batchesFor(people, checkpoint),
  }
  cache.summaries[checkpoint] = s
  return s
}
