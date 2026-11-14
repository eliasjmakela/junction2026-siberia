import type { OpenQuestion } from '../event/core'
import type { Listing } from '../event/store'

/**
 * Synthetic answers for the applicant walkthrough, filled in by the
 * "Play walkthrough" action.
 */

export const DEMO_EMAIL = 'sample.applicant@example.invalid'

/** Answers to the hand-written sample questions, by sample listing id and question id. */
const SAMPLE_LISTING_ANSWERS: Record<string, Record<string, string>> = {
  'sample-backend': {
    q1: 'I moved our booking reminders from a nightly script to a small TypeScript service on PostgreSQL. I added a unique index on booking id and send date, so a retry could never send twice. Before release I replayed one week of real bookings in staging and compared the output with the old script; two time zone bugs showed up and I fixed them first.',
    q2: 'I would log every stock update with the time it happened and the time we received it, and trace one duplicated order from both channels. My guess is that the order is created before the late update arrives. I would add an idempotency key per channel order, enforced in the database, and alert when updates arrive more than five minutes late.',
    q3: 'Our deploys needed a page of manual steps that only two people knew. I turned them into one script with clear error messages and a dry-run mode. After that every developer could deploy, and failed deploys dropped from about one a week to one a month.',
  },
  'sample-data-engineer': {
    q1: 'I built a Python job that loads hourly energy meter readings into a SQL table. It rejects readings with missing timestamps or values outside the meter range and writes a short report of what it rejected. I knew it was right when monthly totals matched the invoices from the energy company for three months in a row.',
    q2: 'One source gave kilowatt-hours in local time, the other watt-hours in UTC with gaps. I converted both to UTC and kilowatt-hours in one staging step, kept the original values in separate columns, and marked filled gaps with a flag. A test for each conversion caught a daylight saving error before it reached reports.',
    q3: 'The facilities team wanted to know why one building used so much energy at night. I made one chart per building with night use highlighted and one sentence under each about what to check. They found two ventilation units that never switched off.',
  },
  'sample-sustainability': {
    q1: 'I helped prepare a cradle-to-gate footprint for a steel shelf system. Scope was materials, manufacturing and transport to the warehouse, with supplier data where we had it and ecoinvent values where we did not. I kept every emission factor traceable in Excel. Steel was 70 % of the total, so recycled content was the first lever we reported.',
    q2: 'I would make one intake template with fixed units and required fields and map every supplier file into it, leaving the originals untouched. Each row links to its source file and gets a data quality score. Before reporting I compare totals per supplier with last year and check anything that moved more than 20 %.',
    q3: 'A team reported that a new pallet halved transport emissions. The old figure included the return trip and the new one did not. I recalculated both on the same basis, which gave a 15 % cut, and explained the difference with one chart in a short meeting.',
  },
}

/** Answers for company-published questions, chosen by what the question asks for. */
const PATTERNS: [RegExp, string][] = [
  [
    /worked this way|situation where/i,
    'At my last job a customer kept losing power to a heat pump after every service. I solved this practical problem by spending a morning with their caretaker instead of guessing from tickets. I wrote down each step they took, found that one breaker was reset by the update, and wrote a one-page guide. I enjoyed meeting the customer on site. Calls about that site dropped from six a month to one in three months.',
  ],
  [
    /first month|prepares you|ready/i,
    'I have started in a new team twice. Both times I shadowed a senior technician for the first two weeks and wrote down every step I did not understand, 40 in all. In the third week I led two visits myself with a checklist I had made. By the end of the first month I ran six visits alone, and the team still uses my checklist for new starters.',
  ],
  [
    /problem like this|how would you|what do you do|incomplete/i,
    'I would first call the customer and the last technician to collect what is missing, then check the equipment on site before touching it. I did this last spring on a pump with no history. I took photos of every label, wrote the findings into the service notes, and fixed it in one visit instead of two. After that I asked our planner to add a parts list to every job, which cut repeat visits from about one in five to one in twenty.',
  ],
  [
    /piece of work|\bused\b|\bbuilt\b|experience with|hands-on/i,
    'In my last job I did electrical diagnostics and customer communication every week. Our service visits were planned from a spreadsheet that was out of date by noon, so I rebuilt it as a shared checklist with the parts list attached. I tested it with two colleagues for a week and fixed three gaps they found. I also called each customer the day before. Visits with missing parts dropped from about one in five to one in twenty.',
  ],
  [
    /fault|diagnos/i,
    'A cold room at a grocery store kept tripping every night. I measured the compressor current for two evenings, found it rose by 30 percent just before each trip, and traced it to a worn contactor. I replaced it, ran the unit for an hour and logged the readings. It has run without a trip for eight months, and I wrote the readings into the service notes for the next technician.',
  ],
  [
    /customer|explain|frustrated/i,
    'A shop owner called me angry after a second visit to the same fridge. I listened for two minutes, then showed her the old part and the new one and explained why the first repair had not lasted. I told her exactly when I would return, and I came back that Friday at nine. She stayed our customer, and she asked for me by name on the next job, which was 12 months later.',
  ],
  [
    /a time you|tell us about/i,
    'When a customer system kept failing after every update, I asked to spend a day with their team instead of guessing from tickets. I wrote down each step they took, found that one setting was reset by the update, and wrote a short guide. Failures at that site fell from four a month to none in the next three months, and their team still uses the guide.',
  ],
]

const FALLBACK = PATTERNS.map(([, answer]) => answer)

export function demoAnswerFor(listing: Listing, q: OpenQuestion, index: number): string {
  const known = SAMPLE_LISTING_ANSWERS[listing.id]?.[q.id]
  if (known) return known
  return PATTERNS.find(([re]) => re.test(q.text))?.[1] ?? FALLBACK[index % FALLBACK.length]
}

/** The companies the demo applies to: the newest company-published role first, then sample roles, two in all. */
export function demoPicks(listings: Listing[]): Listing[] {
  const own = listings.filter((l) => !l.sample).slice(0, 1)
  const samples = Object.keys(SAMPLE_LISTING_ANSWERS)
    .map((id) => listings.find((l) => l.id === id))
    .filter((l): l is Listing => Boolean(l))
  return [...own, ...samples].slice(0, 2)
}
