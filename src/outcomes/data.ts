import { SAMPLE_LISTINGS } from '../event/sample'

/**
 * A simulated follow-up for the concept demo. Every value comes from a
 * fixed-seed generator: nothing is collected, looked up or sent anywhere.
 */

export type Checkpoint = 3 | 6
export type CheckState = 'done' | 'running' | 'scheduled'
export type Job = 'picked' | 'elsewhere' | 'none'

/** Demo "today": the date the simulated checks are read from. */
export const TODAY = '18 Sep 2027'

export type FollowEvent = {
  id: string
  name: string
  date: string
  seed: number
  cohort: number
  /** How readily each sample company hires from this event. */
  hirePull: number[]
  checks: Record<Checkpoint, { state: CheckState; date: string }>
}

export const EVENTS: FollowEvent[] = [
  {
    id: 's26',
    name: 'Espoo Matchmaking Day',
    date: '5 Mar 2026',
    seed: 20260305,
    cohort: 96,
    hirePull: [0.62, 0.80, 2.25, 0.84, 0.71],
    checks: { 3: { state: 'done', date: '5 Jun 2026' }, 6: { state: 'done', date: '5 Sep 2026' } },
  },
  {
    id: 'a26',
    name: 'Espoo Matchmaking Day',
    date: '10 Sep 2026',
    seed: 20260910,
    cohort: 118,
    hirePull: [2.10, 0.52, 1.14, 2.17, 1.61],
    checks: { 3: { state: 'done', date: '10 Dec 2026' }, 6: { state: 'done', date: '10 Mar 2027' } },
  },
  {
    id: 's27',
    name: 'Espoo Matchmaking Day',
    date: '4 Mar 2027',
    seed: 20270304,
    cohort: 140,
    hirePull: [1.15, 2.17, 1.01, 2.33, 0.56],
    checks: { 3: { state: 'done', date: '4 Jun 2027' }, 6: { state: 'running', date: '18 Sep 2027' } },
  },
  {
    id: 'a27',
    name: 'Espoo Matchmaking Day',
    date: '9 Sep 2027',
    seed: 20270909,
    cohort: 152,
    hirePull: [1.1, 0.9, 1.0, 0.6, 0.9],
    checks: { 3: { state: 'scheduled', date: '9 Dec 2027' }, 6: { state: 'scheduled', date: '9 Mar 2028' } },
  },
]

export const DEFAULT_EVENT = 's27'
export const RUNNING_START = '09:12'
export const RUNNING_LEFT = 'about 2 min left'

export type Person = {
  id: number
  picks: string[]
  /** Companies that invited this applicant to the event. */
  invitedBy: string[]
  attended: boolean
  matched: boolean
  job: Record<Checkpoint, Job>
  employer: Record<Checkpoint, string | null>
  survey: Record<Checkpoint, boolean>
  surveyDiffers: boolean
  /** Used only while a check is running: unchecked profiles count as not matched. */
  checkedInRun: boolean
}

export type Company = { id: string; company: string; title: string; questions: number }

export type Interval = { value: number; low: number; high: number; n: number }

export type CompanyRow = Company & {
  applicants: number
  invited: number
  attended: number
  matched: number
  /** Hires found by the profile check; null while it is not finished. */
  hires: Record<Checkpoint, number | null>
  reported: Record<Checkpoint, number | null>
  action: Action | null
  history: { date: string; hires: number | null }[]
}

export type Action = 'confirm' | 'ask' | 'again' | 'none'

export type Agent = { id: number; assigned: number; done: number; matched: number }

export type Shown = { picked: string; elsewhere: string; none: string; changes: string; confirmed: string; pickedExact: boolean }

export type Previous = { date: string; picked: string; matched: number; share: string | null }

export type Summary = {
  event: FollowEvent
  checkpoint: Checkpoint
  state: CheckState
  checkDate: string
  checked: number
  total: number
  attendance: { invited: number; attended: number; matched: number }
  outcome: { picked: number; elsewhere: number; none: number; unmatched: number }
  changes: number
  confirmed: number
  pickedShare: Interval
  agents: Agent[]
  pages: { done: number; total: number }
  shown: Shown
  previous: Previous | null
  minutes: number
  crossChecks: { reports: number; surveys: number; differ: number }
  companies: CompanyRow[]
  reportText: string
}

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

export const COMPANIES: Company[] = SAMPLE_LISTINGS.map((l) => ({
  id: l.id,
  company: l.company,
  title: l.title,
  questions: l.set.questions.length,
}))

const INTEREST = [1.3, 1.5, 1.0, 0.8, 0.9]
const SLOTS = [14, 11, 9, 12, 10]

function pickWeighted(rand: () => number, ids: string[], weights: number[]): string {
  const total = weights.reduce((s, w) => s + w, 0)
  let r = rand() * total
  for (let i = 0; i < ids.length; i += 1) {
    r -= weights[i]
    if (r <= 0) return ids[i]
  }
  return ids[ids.length - 1]
}

function generate(event: FollowEvent): Person[] {
  const rand = rng(event.seed)
  const extra = rng(event.seed + 7919)
  const ids = COMPANIES.map((c) => c.id)
  const weights = ids.map((_, i) => INTEREST[i] ?? 1)
  const pull = (c: string) => event.hirePull[ids.indexOf(c)] ?? 1

  const raw = Array.from({ length: event.cohort }, (_, id) => {
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

  const invitedBy = new Map<number, string[]>()
  for (const c of ids) {
    const ranked = raw.filter((p) => p.picks.includes(c)).sort((a, b) => b.quality[c] - a.quality[c])
    for (const p of ranked.slice(0, SLOTS[ids.indexOf(c)] ?? 10)) invitedBy.set(p.id, [...(invitedBy.get(p.id) ?? []), c])
  }

  return raw.map((p) => {
    const by = invitedBy.get(p.id) ?? []
    const attended = by.length > 0 && rand() < 0.86
    const matched = rand() < (attended ? 0.78 : 0.66)

    const candidates = attended ? by : p.picks
    const pPicked3 = attended ? 0.13 : 0.025
    const pPicked6 = attended ? 0.09 : 0.02
    const target = candidates.length ? candidates[Math.floor(rand() * candidates.length)] : null
    const roll3 = rand()
    const roll6 = rand()
    const hired3 = target !== null && roll3 < pPicked3 * pull(target) * candidates.length ** 0.4
    const hired6 = hired3 || (target !== null && roll6 < pPicked6 * pull(target) * candidates.length ** 0.4)
    const other3 = !hired3 && rand() < 0.2
    const other6 = !hired6 && (other3 || rand() < 0.15)

    const checkedRoll = extra()
    return {
      id: p.id,
      picks: p.picks,
      invitedBy: by,
      attended,
      matched,
      job: { 3: hired3 ? 'picked' : other3 ? 'elsewhere' : 'none', 6: hired6 ? 'picked' : other6 ? 'elsewhere' : 'none' },
      employer: { 3: hired3 ? target : null, 6: hired6 ? target : null },
      survey: { 3: extra() < 0.55, 6: extra() < 0.55 },
      surveyDiffers: extra() < 0.05,
      checkedInRun: checkedRoll < 0.6 || (attended && matched && !(hired3 === false && other3 === false)),
    } satisfies Person
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

/** Attendee counts of 1 or 2 are shown as "1–2" so no single person can be read off. */
export function band(n: number): string {
  return n === 0 ? '0' : n <= 2 ? '1–2' : String(n)
}
export const isBanded = (n: number) => n >= 1 && n <= 2

export const pct = (x: number) => `${Math.round(x * 100)}%`
export const range = (i: Interval) => `${pct(i.low)}–${pct(i.high)}`
export const TOO_FEW = 'Too few to show a share'

export function actionFor(attended: number, hires: number, reported: number | null): Action {
  if (hires >= 1 && reported === null) return 'confirm'
  if (hires === 0 && reported !== null && reported >= 1) return 'confirm'
  if (attended >= 5 && hires === 0) return 'ask'
  if (hires >= 1) return 'again'
  return 'none'
}
const ACTION_ORDER: Action[] = ['confirm', 'ask', 'again', 'none']

type Built = { people: Person[]; reportedNull: Record<Checkpoint, number[]> }
const built = new Map<string, Built>()
const sums = new Map<string, Summary>()

function build(event: FollowEvent): Built {
  let b = built.get(event.id)
  if (!b) {
    const people = generate(event)
    const ids = COMPANIES.map((c) => c.id)
    // Companies that have not yet reported: the smallest company with a hire, and while running also one with none.
    const nullsFor = (k: Checkpoint): number[] => {
      const hires = ids.map((id) => people.filter((p) => p.attended && p.employer[k] === id && p.invitedBy.includes(id)).length)
      const withHire = hires.map((h, i) => ({ h, i })).filter((x) => x.h >= 1).sort((a, c) => a.h - c.h || a.i - c.i)
      const none = hires.map((h, i) => ({ h, i })).filter((x) => x.h === 0)
      const out = withHire.length ? [withHire[0].i] : []
      if (event.checks[k].state === 'running' && none.length) out.push(none[0].i)
      return out
    }
    b = { people, reportedNull: { 3: nullsFor(3), 6: nullsFor(6) } }
    built.set(event.id, b)
  }
  return b
}

const find = (id: string) => EVENTS.find((e) => e.id === id) ?? EVENTS[0]

function companyRows(event: FollowEvent, cp: Checkpoint, b: Built): CompanyRow[] {
  const state = event.checks[cp].state
  const countableAt = (k: Checkpoint) => (p: Person) => p.attended && p.matched && (event.checks[k].state !== 'running' || p.checkedInRun)
  const countable = countableAt(cp)
  return COMPANIES.map((c, ci) => {
    const applicants = b.people.filter((p) => p.picks.includes(c.id))
    const att = applicants.filter((p) => p.invitedBy.includes(c.id) && p.attended)
    const inv = applicants.filter((p) => p.invitedBy.includes(c.id))
    const hiresAt = (k: Checkpoint) => att.filter((p) => countableAt(k)(p) && p.employer[k] === c.id).length
    const reportedAt = (k: Checkpoint): number | null =>
      b.reportedNull[k].includes(ci) ? null : att.filter((p) => p.employer[k] === c.id).length
    const hires: CompanyRow['hires'] = { 3: null, 6: null }
    const reported: CompanyRow['reported'] = { 3: null, 6: null }
    for (const k of [3, 6] as const) {
      if (event.checks[k].state === 'scheduled') continue
      reported[k] = reportedAt(k)
      if (event.checks[k].state === 'done' || k === cp) hires[k] = hiresAt(k)
    }
    const earlier = EVENTS.filter((e) => e.seed < event.seed).map((e) => {
      const eb = build(e)
      const eatt = eb.people.filter((p) => p.attended && p.matched && p.invitedBy.includes(c.id))
      return { date: e.date, hires: e.checks[cp].state === 'done' ? eatt.filter((p) => p.employer[cp] === c.id).length : null }
    })
    return {
      ...c,
      applicants: applicants.length,
      invited: inv.length,
      attended: att.length,
      matched: att.filter(countable).length,
      hires,
      reported,
      action: (() => {
        const base: Checkpoint = state === 'running' ? 3 : cp
        const hb = hires[base]
        return event.checks[base].state === 'done' && hb !== null ? actionFor(att.length, hb, reported[base]) : null
      })(),
      history: earlier.reverse(),
    }
  })
}

export function summary(eventId: string, cp: Checkpoint): Summary {
  const key = `${eventId}:${cp}`
  const hit = sums.get(key)
  if (hit) return hit
  const event = find(eventId)
  const b = build(event)
  const { state, date } = event.checks[cp]
  const people = b.people
  const attended = people.filter((p) => p.attended)
  const inv = people.filter((p) => p.invitedBy.length)
  const checkedP = state === 'running' ? attended.filter((p) => p.checkedInRun) : state === 'done' ? attended : []
  const matchedP = checkedP.filter((p) => p.matched)
  const picked = matchedP.filter((p) => p.job[cp] === 'picked').length
  const elsewhere = matchedP.filter((p) => p.job[cp] === 'elsewhere').length
  const live = state !== 'scheduled'
  const companies = companyRows(event, cp, b)
  const confirmed = companies.reduce((s, c) => s + Math.min(c.hires[cp] ?? 0, c.reported[cp] ?? 0), 0)
  const mi = Math.max(1, Math.round(attended.length / 6))
  const agents: Agent[] = Array.from({ length: 6 }, (_, i) => {
    const mine = attended.filter((_, k) => k % 6 === i)
    const doneP = live ? (state === 'running' ? mine.filter((p) => p.checkedInRun) : mine) : []
    return { id: i + 1, assigned: mine.length, done: doneP.length, matched: doneP.filter((p) => p.matched).length }
  })
  const survey = live ? matchedP.filter((p) => p.survey[cp]) : []
  const s: Summary = {
    event,
    checkpoint: cp,
    state,
    checkDate: date,
    checked: checkedP.length,
    total: attended.length,
    attendance: { invited: inv.length, attended: attended.length, matched: matchedP.length },
    outcome: { picked, elsewhere, none: matchedP.length - picked - elsewhere, unmatched: attended.length - matchedP.length },
    changes: picked + elsewhere,
    confirmed,
    pickedShare: wilson(picked, matchedP.length),
    agents,
    pages: { done: state === 'running' ? 3 : live ? COMPANIES.length : 0, total: COMPANIES.length },
    shown: shownOf(picked, elsewhere, matchedP.length - picked - elsewhere, confirmed),
    previous: previousOf(event, cp),
    minutes: 3 + (mi % 4),
    crossChecks: { reports: companies.filter((c) => c.reported[cp] !== null).length, surveys: survey.length, differ: survey.filter((p) => p.surveyDiffers).length },
    companies,
    reportText: '',
  }
  s.reportText = reportText(s)
  sums.set(key, s)
  return s
}

/** Display strings for the outcome counts: 1–2 is banded, and a complementary cell is hidden so a banded count cannot be recomputed. */
function shownOf(picked: number, elsewhere: number, none: number, confirmed: number): Shown {
  const vals = { picked, elsewhere, none }
  const keys = ['picked', 'elsewhere', 'none'] as const
  const out: Record<(typeof keys)[number], string> = { picked: band(picked), elsewhere: band(elsewhere), none: band(none) }
  const banded = keys.filter((k) => isBanded(vals[k]))
  if (banded.length === 1) {
    const others = keys.filter((k) => !isBanded(vals[k]) && vals[k] > 0).sort((a, b) => vals[a] - vals[b])
    if (others[0]) out[others[0]] = '3+'
  }
  const anyHidden = banded.length > 0
  const changes = picked + elsewhere
  return {
    ...out,
    changes: isBanded(changes) ? band(changes) : anyHidden ? '3+' : String(changes),
    confirmed: band(confirmed),
    pickedExact: /^\d+$/.test(out.picked) && !isBanded(picked),
  }
}

function previousOf(event: FollowEvent, cp: Checkpoint): Previous | null {
  if (event.checks[cp].state === 'scheduled') return null
  const prev = [...EVENTS].reverse().find((e) => e.seed < event.seed && e.checks[cp].state === 'done')
  if (!prev) return null
  const ps = summary(prev.id, cp)
  return { date: prev.date, picked: ps.shown.picked, matched: ps.attendance.matched, share: ps.shown.pickedExact ? pct(ps.pickedShare.value) : null }
}

function previousText(s: Summary): string {
  const p = s.previous
  if (!p) return ''
  return ` Previous event at ${s.checkpoint} months: ${p.picked} of ${p.matched}${p.share ? ` · ${p.share}` : ''}.`
}

export function sortedCompanies(s: Summary): CompanyRow[] {
  if (s.state === 'scheduled') return s.companies
  return [...s.companies].sort((a, b) => ACTION_ORDER.indexOf(a.action ?? 'none') - ACTION_ORDER.indexOf(b.action ?? 'none'))
}

function shareText(s: Summary): string {
  return s.shown.pickedExact ? `${pct(s.pickedShare.value)}, rough range ${range(s.pickedShare)}` : 'too few to show a share'
}

function reportText(s: Summary): string {
  const e = s.event
  const cp = s.checkpoint
  if (s.state === 'scheduled') {
    return `${e.name}, ${e.date}: the ${cp}-month profile check is scheduled for ${s.checkDate}.`
  }
  const a = s.attendance
  const prefix = s.state === 'running' ? 'Provisional, the profile check is still running. ' : ''
  return (
    `${prefix}${e.name}, ${e.date}: ${a.attended} of ${a.invited} invited applicants attended and met ${COMPANIES.length} companies. ` +
    `The ${cp}-month profile check matched ${a.matched} of ${a.attended} attendee profiles. ` +
    `${s.shown.picked} work at a company they applied to meet (${shareText(s)}), ` +
    `${s.shown.elsewhere} have a new employer elsewhere and ${s.shown.none} show no employer change. ` +
    `Companies confirmed ${s.shown.confirmed} of ${s.shown.picked} hires.${previousText(s)}`
  )
}

function csvCell(v: string | number | null): string {
  const t = v === null ? '' : String(v)
  return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t
}

export function toCsv(eventId: string): string {
  const head = ['level', 'event', 'event_date', 'checkpoint_months', 'check_state', 'company', 'invited', 'attended', 'profiles_matched', 'at_company_met', 'new_employer_elsewhere', 'no_employer_change', 'profile_not_matched', 'hires', 'company_report']
  const rows: (string | number | null)[][] = []
  for (const cp of [3, 6] as const) {
    const s = summary(eventId, cp)
    const live = s.state !== 'scheduled'
    const o = s.outcome
    rows.push(['event', s.event.name, s.event.date, cp, s.state, '', s.attendance.invited, s.attendance.attended, live ? s.attendance.matched : '', live ? s.shown.picked : '', live ? s.shown.elsewhere : '', live ? s.shown.none : '', live ? o.unmatched : '', '', ''])
    for (const c of s.companies) {
      rows.push(['company', s.event.name, s.event.date, cp, s.state, c.company, c.invited, c.attended, live ? c.matched : '', '', '', '', '', c.hires[cp] === null ? '' : band(c.hires[cp] as number), c.reported[cp] === null ? '' : band(c.reported[cp] as number)])
    }
  }
  return [head.join(','), ...rows.map((r) => r.map(csvCell).join(','))].join('\n') + '\n'
}
