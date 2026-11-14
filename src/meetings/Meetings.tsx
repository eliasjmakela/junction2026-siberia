import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type KeyboardEvent } from 'react'
import { SiteHeader } from '../components/SiteHeader'
import { touchesForbidden } from '../event/core'
import { compareRank } from '../event/sampleMeetings'
import { isCurrent } from '../staff/scoring'
import { GOALS } from '../form/schema'
import {
  EVENT,
  bookMeeting,
  cancelMeeting,
  pairKey,
  rateMeeting,
  useEvent,
  type Application,
  type Assessment,
  type Booking,
  type EventState,
  type Listing,
  type NextStep,
  type Rating,
} from '../event/store'
import { SLOTS, standOf, takenFor, timeRange } from './slots'
import '../App.css'
import '../form/fields.css'
import '../staff/staff.css'
import './meetings.css'

type Candidate = { app: Application; assessment?: Assessment; booking?: Booking; rating?: Rating }

const NEXT: { id: NextStep; label: string }[] = [
  { id: 'interview', label: 'Interview' },
  { id: 'keep', label: 'Keep in touch' },
  { id: 'none', label: 'No further steps' },
]
const NEXT_LABEL = Object.fromEntries(NEXT.map((n) => [n.id, n.label])) as Record<NextStep, string>

function subscribe(onChange: () => void) {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

/** Whether the "After the event" stage is chosen, kept in the hash as ?view=after. */
function useAfter() {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash, () => '')
  return new URLSearchParams(hash.split('?')[1] ?? '').get('view') === 'after'
}

function candidatesOf(state: EventState, listing: Listing): Candidate[] {
  return state.allApplications
    .filter((a) => a.picks.includes(listing.id) && state.decisions[pairKey(a.id, listing.id)]?.decision === 'invite')
    .map((app) => {
      const key = pairKey(app.id, listing.id)
      const a = state.assessments.find((x) => x.applicationId === app.id && x.listingId === listing.id)
      return { app, assessment: isCurrent(a, listing) ? a : undefined, booking: state.bookings[key], rating: state.ratings[key] }
    })
    .sort((x, y) => compareRank({ code: x.app.code, overall: x.assessment?.overall }, { code: y.app.code, overall: y.assessment?.overall }))
}

/** What each attribute scored, read-only, with the quote it rests on. */
function Scores({ listing, c }: { listing: Listing; c: Candidate }) {
  const scores = c.assessment?.scores ?? []
  return (
    <ul className="meet-scores">
      {listing.set.attributes.map((attr) => {
        const s = scores.find((x) => x.attribute === attr.id)
        const value = s?.score ?? null
        const state = value !== null ? `${value} of 10` : s?.withheld ? 'read the answers' : 'no evidence'
        return (
          <li key={attr.id}>
            <span className="meet-score__name">{attr.name}</span>
            <span className="staff-bar" aria-hidden="true">
              <span className={`staff-bar__track${value === null ? ' is-empty' : ''}`}>{value !== null && <span className="staff-bar__fill" style={{ width: `${value * 10}%` }} />}</span>
              <span className={`staff-bar__value${value === null && s?.withheld ? ' is-word' : ''}`}>{value !== null ? value : s?.withheld ? 'Read' : '–'}</span>
            </span>
            <span className="visually-hidden">{state}</span>
            {s?.evidence && value !== null && <q className="meet-score__quote">{s.evidence}</q>}
          </li>
        )
      })}
    </ul>
  )
}

function Answers({ listing, c }: { listing: Listing; c: Candidate }) {
  const answers = c.app.answers[listing.id] ?? {}
  return (
    <details className="meet-answers">
      <summary>Answers</summary>
      <ol className="staff-qa">
        {listing.set.questions.map((q, i) => (
          <li key={q.id}>
            <span className="staff-qa__n">{i + 1}</span>
            <div>
              <p className="staff-qa__q">{q.text}</p>
              {answers[q.id]?.trim() ? <p className="staff-answer">{answers[q.id]}</p> : <p className="staff-gap">Not answered</p>}
            </div>
          </li>
        ))}
      </ol>
    </details>
  )
}

const Overall = ({ c }: { c: Candidate }) => (
  <p className="meet-overall">{c.assessment?.overall != null ? <><b>{c.assessment.overall.toFixed(1)}</b> of 10</> : 'Not scored'}</p>
)

/** The 20-minute times of event day; taken ones cannot be chosen. */
function SlotGrid({
  code,
  place,
  taken,
  initial,
  error,
  onBook,
  onClose,
}: {
  code: string
  place: string
  taken: Set<string>
  initial?: string
  error: string
  onBook: (start: string | null) => void
  onClose: () => void
}) {
  const [pick, setPick] = useState<string | null>(initial && !taken.has(initial) ? initial : null)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('[tabindex="0"]')?.focus()
  }, [])
  const stop = pick && !taken.has(pick) ? pick : (SLOTS.find((s) => !taken.has(s)) ?? null)

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
      return
    }
    const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (!dir) return
    const free = SLOTS.filter((s) => !taken.has(s))
    const at = free.indexOf((e.target as HTMLElement).dataset.slot ?? '')
    if (at < 0) return
    e.preventDefault()
    const next = free[(at + dir + free.length) % free.length]
    setPick(next)
    ref.current?.querySelector<HTMLElement>(`[data-slot="${next}"]`)?.focus()
  }

  const part = (label: string, times: string[]) => (
    <>
      <span className="meet-slots__part" aria-hidden="true">{label}</span>
      <div className="meet-slots__row">
        {times.map((t) => {
          const isTaken = taken.has(t)
          return (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={pick === t}
              className="meet-slot"
              data-slot={t}
              disabled={isTaken}
              tabIndex={t === stop ? 0 : -1}
              onClick={() => setPick(t)}
            >
              {t}
              {isTaken && <span className="visually-hidden">, taken</span>}
            </button>
          )
        })}
      </div>
    </>
  )

  return (
    <div className="meet-grid">
      <p className="staff-label">
        {EVENT.date} · {place}
      </p>
      <div ref={ref} className="meet-slots" role="radiogroup" aria-label={`Meeting time for ${code}`} onKeyDown={onKeyDown}>
        {part('Morning', SLOTS.filter((s) => s < '12:00'))}
        {part('Afternoon', SLOTS.filter((s) => s >= '12:00'))}
      </div>
      <p className="error" role="alert">
        {error}
      </p>
      <div className="meet-actions">
        <button type="button" className="btn" onClick={() => onBook(pick)}>
          Book meeting
        </button>
        <button type="button" className="btn-quiet" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  )
}

function RatingBox({ listing, c, announce }: { listing: Listing; c: Candidate; announce: (m: string) => void }) {
  const saved = c.rating
  const [editing, setEditing] = useState(!saved)
  const [score, setScore] = useState<Rating['score'] | null>(saved?.score ?? null)
  const [next, setNext] = useState<NextStep | null>(saved?.next ?? null)
  const [note, setNote] = useState(saved?.note ?? '')
  const [error, setError] = useState('')
  const id = `meet-${c.app.id}`
  const edit = useRef<HTMLButtonElement>(null)
  const first = useRef<HTMLInputElement>(null)
  const focusEdit = () => setTimeout(() => edit.current?.focus())

  function save() {
    if (!score || !next) return setError('Choose a score and a next step.')
    if (touchesForbidden(note)) return setError('Remove personal characteristics from the note.')
    if (!rateMeeting({ applicationId: c.app.id, listingId: listing.id, score, next, note: note.trim() })) {
      setError('Could not save in this browser.')
      return announce('Could not save in this browser.')
    }
    setError('')
    setEditing(false)
    focusEdit()
    announce(`Rating saved for ${c.app.code}.`)
  }

  if (!editing && saved)
    return (
      <div className="meet-rated">
        <p className="meet-rated__line">
          <b>{saved.score} of 5</b> · {NEXT_LABEL[saved.next]}
        </p>
        {saved.note && <p className="meet-rated__note">{saved.note}</p>}
        <button
          ref={edit}
          type="button"
          className="btn-quiet"
          onClick={() => {
            setScore(saved.score)
            setNext(saved.next)
            setNote(saved.note)
            setEditing(true)
            setTimeout(() => first.current?.focus())
          }}
        >
          Edit rating
        </button>
      </div>
    )

  return (
    <form
      className="meet-rate"
      onSubmit={(e) => {
        e.preventDefault()
        save()
      }}
    >
      <fieldset className="meet-field">
        <legend className="staff-label">How good did the candidate seem?</legend>
        <div className="chips">
          {([1, 2, 3, 4, 5] as const).map((n) => (
            <label key={n} className="chip meet-chip--num">
              <input autoComplete="off" data-1p-ignore data-lpignore="true" data-bwignore data-form-type="other" ref={n === 1 ? first : undefined} type="radio" name={`${id}-score`} value={n} checked={score === n} aria-describedby={`${id}-scale`} onChange={() => setScore(n)} />
              {n}
            </label>
          ))}
        </div>
        <p className="meet-hint" id={`${id}-scale`}>
          1 Not a fit · 5 Strong
        </p>
      </fieldset>
      <fieldset className="meet-field">
        <legend className="staff-label">Next step</legend>
        <div className="chips">
          {NEXT.map((n) => (
            <label key={n.id} className="chip">
              <input autoComplete="off" data-1p-ignore data-lpignore="true" data-bwignore data-form-type="other" type="radio" name={`${id}-next`} value={n.id} checked={next === n.id} onChange={() => setNext(n.id)} />
              <span className="chip__mark" aria-hidden="true" />
              {n.label}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="meet-field">
        <label className="staff-label" htmlFor={`${id}-note`}>
          Note (optional)
        </label>
        <textarea autoComplete="off" data-1p-ignore data-lpignore="true" data-bwignore data-form-type="other" id={`${id}-note`} className="input input--area" rows={3} maxLength={280} value={note} aria-describedby={`${id}-hint`} onChange={(e) => setNote(e.target.value)} />
        <p className="meet-hint" id={`${id}-hint`}>
          Keep the note to the role and the meeting.
        </p>
      </div>
      <p className="error" role="alert">
        {error}
      </p>
      <div className="meet-actions">
        <button type="submit" className="btn">
          Save rating
        </button>
        {saved && (
          <button type="button" className="btn-quiet" onClick={() => { setEditing(false); focusEdit() }}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

export function Meetings() {
  const state = useEvent()
  const after = useAfter()
  const listings = state.allListings
  const [chosen, setChosen] = useState<string | null>(null)
  const listing = listings.find((l) => l.id === chosen) ?? state.listings[0] ?? listings[0]
  const [open, setOpen] = useState<string | null>(null)
  const [gridError, setGridError] = useState('')
  const [message, setMessage] = useState('')
  const [refocus, setRefocus] = useState<{ id: string; n: number } | null>(null)
  const pageRef = useRef<HTMLElement>(null)

  const candidates = useMemo(() => (listing ? candidatesOf(state, listing) : []), [state, listing])
  const place = listing ? standOf(listing) : ''
  const booked = candidates.filter((c) => c.booking)
  const held = [...booked].sort((x, y) => x.booking!.start.localeCompare(y.booking!.start))
  const rated = booked.filter((c) => c.rating).length

  useEffect(() => {
    if (!refocus) return
    pageRef.current?.querySelector<HTMLElement>(`[data-trigger="${CSS.escape(refocus.id)}"]`)?.focus()
  }, [refocus])

  const meta = (l: Listing) => {
    const cs = candidatesOf(state, l)
    const b = cs.filter((c) => c.booking)
    return after ? `${b.length} met · ${b.filter((c) => c.rating).length} rated` : `${cs.length} invited · ${b.length} booked`
  }

  function close(id: string) {
    setOpen(null)
    setGridError('')
    setRefocus({ id, n: Date.now() })
  }

  function book(c: Candidate, start: string | null) {
    if (!listing) return
    if (!start) return setGridError('Choose a time to continue.')
    const r = bookMeeting(c.app.id, listing.id, start, place)
    if (r === 'taken') return setGridError('That time is taken. Choose another time.')
    if (r === 'storage') {
      setGridError('Could not save in this browser.')
      return setMessage('Could not save in this browser.')
    }
    setMessage(`Meeting booked for ${c.app.code} at ${start}.`)
    close(c.app.id)
  }

  function cancel(c: Candidate) {
    if (!listing) return
    if (!cancelMeeting(c.app.id, listing.id)) return setMessage('Could not save in this browser.')
    setMessage(`Meeting cancelled for ${c.app.code}.`)
    setOpen(null)
    setRefocus({ id: c.app.id, n: Date.now() })
  }

  function setView(a: boolean) {
    setOpen(null)
    window.location.hash = a ? '#/meetings?view=after' : '#/meetings'
  }

  return (
    <main className="page staff meet" ref={pageRef}>
      <SiteHeader area="meetings" />

      <section className="staff-intro" aria-labelledby="meet-title">
        <h1 id="meet-title">Meetings</h1>
        <p className="hint">
          {after
            ? `Rate the candidates you met at ${EVENT.name}. Ratings stay with your company.`
            : `Book 20-minute meetings at your stand with the candidates City of Espoo invited for your role. Meetings take place at ${EVENT.name}, ${EVENT.date}.`}
        </p>
        <div className="meet-stage chips" role="group" aria-label="Event stage">
          <button type="button" className="chip" aria-pressed={!after} onClick={() => setView(false)}>
            <span className="chip__mark" aria-hidden="true" />
            Before the event
          </button>
          <button type="button" className="chip" aria-pressed={after} onClick={() => setView(true)}>
            <span className="chip__mark" aria-hidden="true" />
            After the event
          </button>
        </div>
        <p className="status" role="status">
          {message}
        </p>
      </section>

      <section className="staff-section" aria-labelledby="meet-roles-title">
        <h2 id="meet-roles-title" className="staff-h2">
          Your role
        </h2>
        {listings.length ? (
          <ul className="staff-roles">
            {listings.map((l) => (
              <li key={l.id}>
                <button
                  type="button"
                  className="staff-role"
                  aria-pressed={l.id === listing?.id}
                  onClick={() => {
                    setChosen(l.id)
                    setOpen(null)
                  }}
                >
                  <span className="staff-role__company">{l.company}</span>
                  <span className="staff-role__title">{l.title}</span>
                  {l.status && <span className="staff-role__status">{GOALS[l.status].name}</span>}
                  <span className="staff-role__meta">{meta(l)}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="staff-empty">No company roles are published for this event yet.</p>
        )}
      </section>

      {listing && !after && (
        <>
          <section className="staff-section" aria-labelledby="meet-list-title">
            <div className="meet-head">
              <h2 id="meet-list-title" className="staff-h2">
                Invited candidates
              </h2>
              <p className="meet-head__meta">
                {candidates.length} invited · {booked.length} booked
              </p>
            </div>
            <p className="staff-lede">City of Espoo sends each meeting time to the candidate. Candidates are shown by application code.</p>
            {candidates.length ? (
              <ul className="meet-cards">
                {candidates.map((c) => {
                  const isOpen = open === c.app.id
                  return (
                    <li key={c.app.id} className="meet-card">
                      <div className="meet-card__top">
                        <h3 className="meet-code">{c.app.code}</h3>
                        <Overall c={c} />
                        <div className="meet-booking">
                          {c.booking ? (
                            <>
                              <p className="meet-when">
                                {timeRange(c.booking)} <span>·</span> {c.booking.place}
                              </p>
                              <div className="meet-actions">
                                <button type="button" className="btn-quiet" data-trigger={c.app.id} aria-expanded={isOpen} onClick={() => (isOpen ? close(c.app.id) : (setGridError(''), setOpen(c.app.id)))}>
                                  Reschedule
                                </button>
                                <button type="button" className="btn-quiet" onClick={() => cancel(c)}>
                                  Cancel meeting
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                              <p className="meet-notbooked">Not booked</p>
                              <button type="button" className="btn meet-book" data-trigger={c.app.id} aria-expanded={isOpen} onClick={() => (isOpen ? close(c.app.id) : (setGridError(''), setOpen(c.app.id)))}>
                                Book a meeting
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      {isOpen && (
                        <SlotGrid
                          key={c.booking?.start ?? 'new'}
                          code={c.app.code}
                          place={place}
                          taken={takenFor(state, listing, c.app.id)}
                          initial={c.booking?.start}
                          error={gridError}
                          onBook={(s) => book(c, s)}
                          onClose={() => close(c.app.id)}
                        />
                      )}
                      <Scores listing={listing} c={c} />
                      <Answers listing={listing} c={c} />
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="staff-empty">
                No candidates are invited for this role yet. City of Espoo staff decide invitations in <a href="#/staff">Staff review</a>.
              </p>
            )}
          </section>

          <section className="staff-section" aria-labelledby="meet-sched-title">
            <h2 id="meet-sched-title" className="staff-h2">
              Event-day schedule
            </h2>
            {held.length ? (
              <ul className="meet-schedule">
                {held.map((c) => (
                  <li key={c.app.id}>
                    <span>{timeRange(c.booking!)}</span> {c.app.code}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="staff-empty">No meetings booked yet.</p>
            )}
          </section>
        </>
      )}

      {listing && after && (
        <section className="staff-section" aria-labelledby="meet-held-title">
          <div className="meet-head">
            <h2 id="meet-held-title" className="staff-h2">
              Meetings held
            </h2>
            <p className="meet-head__meta">
              {rated} of {held.length} rated
            </p>
          </div>
          {held.length ? (
            <ul className="meet-cards">
              {held.map((c) => (
                <li key={c.app.id} className="meet-card">
                  <div className="meet-card__top">
                    <h3 className="meet-code">{c.app.code}</h3>
                    <p className="meet-when">
                      {timeRange(c.booking!)} <span>·</span> {c.booking!.place}
                    </p>
                    {!c.rating && <p className="meet-notbooked">Not rated</p>}
                  </div>
                  <RatingBox listing={listing} c={c} announce={setMessage} />
                  <details className="meet-answers">
                    <summary>Scores and answers</summary>
                    <Overall c={c} />
                    <Scores listing={listing} c={c} />
                    <Answers listing={listing} c={c} />
                  </details>
                </li>
              ))}
            </ul>
          ) : (
            <p className="staff-empty">No meetings are booked for this role.</p>
          )}
        </section>
      )}
    </main>
  )
}
