import { SAMPLE_LISTINGS } from '../event/sample'
import type { Booking, EventState, Listing } from '../event/store'

/** Meetings are 20 minutes at the company's stand on event day, 09:00 to 15:40. */
export const SLOTS: string[] = Array.from({ length: 21 }, (_, i) => {
  const m = 9 * 60 + i * 20
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
})

/** The company's other commitments that day. */
export const BUSY = ['09:00', '10:40', '12:00', '12:20', '14:40']

const STANDS = [12, 7, 15, 4, 9]

export function standOf(listing: Pick<Listing, 'id'>) {
  const i = SAMPLE_LISTINGS.findIndex((l) => l.id === listing.id)
  return `Stand ${i >= 0 ? (STANDS[i] ?? 21) : 21}, Hall A`
}

export function endOf(start: string) {
  const [h, m] = start.split(':').map(Number)
  const t = h * 60 + m + 20
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`
}

export const timeRange = (b: Pick<Booking, 'start'>) => `${b.start}–${endOf(b.start)}`

/** Times this candidate cannot take at this role; the candidate's own current time counts as free. */
export function takenFor(state: Pick<EventState, 'bookings'>, listing: Pick<Listing, 'id'>, applicationId: string) {
  const taken = new Set<string>(BUSY)
  for (const b of Object.values(state.bookings)) {
    if (b.applicationId === applicationId && b.listingId === listing.id) continue
    if (b.listingId === listing.id || b.applicationId === applicationId) taken.add(b.start)
  }
  return taken
}
