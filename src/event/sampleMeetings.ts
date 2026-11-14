import type { Application, Assessment, Booking, DecisionRecord, Listing, Rating } from './store'

/**
 * Built-in meeting records for the built-in company roles: the top three
 * applicants of each role are invited, two have a booked meeting and the best
 * one is rated. Stored records override them (see derive in store.ts).
 */

/** Overall score first, then application code: the order staff see and the company sees. */
export function compareRank(x: { code: string; overall: number | null | undefined }, y: { code: string; overall: number | null | undefined }) {
  return (y.overall ?? -1) - (x.overall ?? -1) || x.code.localeCompare(y.code)
}

const NOTES: Record<string, string> = {
  'sample-field-service': 'Walked through a fault diagnosis step by step.',
  'sample-backend': 'Explained a past incident clearly and named the trade-offs.',
  'sample-product-design': 'Showed how a design decision followed from user feedback.',
  'sample-data-engineer': 'Described a data check with a concrete example.',
  'sample-sustainability': 'Explained a reporting method in plain language.',
}

const AT = '2027-01-28T09:00:00.000Z'
const FIRST = '10:00'
const SECOND = '13:20'

export function seedMeetings(listings: Listing[], applications: Application[], assessments: Assessment[]) {
  const decisions: Record<string, DecisionRecord> = {}
  const bookings: Record<string, Booking> = {}
  const ratings: Record<string, Rating> = {}
  const held = new Set<string>()
  listings.forEach((listing, li) => {
    const place = `Stand ${[12, 7, 15, 4, 9][li] ?? 21}, Hall A`
    const overall = new Map(assessments.filter((a) => a.listingId === listing.id).map((a) => [a.applicationId, a.overall]))
    const top = applications
      .filter((a) => a.picks.includes(listing.id))
      .map((a) => ({ app: a, code: a.code, overall: overall.get(a.id) }))
      .sort(compareRank)
      .slice(0, 3)
    top.forEach(({ app }, rank) => {
      const key = `${app.id}:${listing.id}`
      decisions[key] = { decision: 'invite', at: AT }
      const start = rank === 0 ? FIRST : rank === 1 ? SECOND : null
      // One applicant cannot be at two stands at the same time.
      if (!start || held.has(`${app.id}@${start}`)) return
      held.add(`${app.id}@${start}`)
      bookings[key] = { applicationId: app.id, listingId: listing.id, start, place, at: AT }
      if (rank === 0) ratings[key] = { applicationId: app.id, listingId: listing.id, score: 4, next: 'interview', note: NOTES[listing.id] ?? '', at: AT }
    })
  })
  return { decisions, bookings, ratings }
}
