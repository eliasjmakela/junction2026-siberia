import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type KeyboardEvent } from 'react'
import { useViewedCompany } from '../components/viewing'
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

type Stage = 'before' | 'day' | 'after'

/** The chosen event stage, kept in the hash as ?view=day or ?view=after. */
function useStage(): Stage {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash, () => '')
  const v = new URLSearchParams(hash.split('?')[1] ?? '').get('view')
  return v === 'after' || v === 'day' ? v : 'before'
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

/** The two best-supported attributes with a quote, as the card's short reason to meet. */
function FromAnswers({ listing, c }: { listing: Listing; c: Candidate }) {
  const scores = c.assessment?.scores ?? []
  const top = listing.set.attributes
    .map((attr, i) => ({ attr, i, s: scores.find((x) => x.attribute === attr.id) }))
    .filter((x) => !x.s?.withheld && x.s?.score != null && x.s.evidence)
    .sort((x, y) => y.s!.score! - x.s!.score! || x.i - y.i)
    .slice(0, 2)
  if (!top.length) return null
  return (
    <div className="meet-from">
      <p className="staff-label">From their answers</p>
      <ul>
        {top.map(({ attr, s }) => (
          <li key={attr.id}>
            <span className="meet-from__name">{attr.name}</span>
            <q className="meet-score__quote">{s!.evidence}</q>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ScoresAndAnswers({ listing, c }: { listing: Listing; c: Candidate }) {
  const answers = c.app.answers[listing.id] ?? {}
  return (
    <details className="meet-answers">
      <summary>Scores and answers</summary>
      <p className="staff-label">AI-drafted scores</p>
      <p className="meet-overall">{c.assessment?.overall != null ? <><b>{c.assessment.overall.toFixed(1)}</b> of 10</> : 'Not scored'}</p>
      <Scores listing={listing} c={c} />
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

const STAGES: { id: Stage; hash: string }[] = [
  { id: 'before', hash: '#/meetings' },
  { id: 'day', hash: '#/meetings?view=day' },
  { id: 'after', hash: '#/meetings?view=after' },
]

export function Meetings() {
  const state = useEvent()
  const stage = useStage()
  const viewed = useViewedCompany()
  // The viewed event company, else the company's own published role.
  const listing = viewed ?? state.listings[0] ?? null
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

  const rail: Record<Stage, { step: string; task: string; meta: string }> = {
    before: { step: 'Before the event', task: 'Book meetings', meta: `${candidates.length} invited · ${booked.length} booked` },
    day: { step: `Event day · ${EVENT.date}`, task: 'Meet at your stand', meta: `${held.length} meetings` },
    after: { step: 'After the event', task: 'Rate the meetings', meta: `${rated} of ${held.length} rated` },
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

  function setStage(next: Stage) {
    setOpen(null)
    setGridError('')
    window.location.hash = STAGES.find((x) => x.id === next)!.hash
  }

  const toggle = (c: Candidate) => (open === c.app.id ? close(c.app.id) : (setGridError(''), setOpen(c.app.id)))

  return (
    <main className="page staff meet" ref={pageRef}>
      <SiteHeader area="meetings" />

      <section className="staff-intro" aria-labelledby="meet-title">
        <h1 id="meet-title">Your meetings at {EVENT.name}</h1>
        <p className="hint">
          Book 20-minute meetings with the candidates City of Espoo invited for your role, meet them at your stand on {EVENT.date}, then rate each meeting.
        </p>
      </section>

      {listing ? (
        <section className="meet-band" aria-label="Your company">
          <dl className="meet-who">
            <div>
              <dt className="staff-label">Your company</dt>
              <dd className="meet-who__company">{listing.company}</dd>
            </div>
            <div>
              <dt className="staff-label">Role</dt>
              <dd>
                {listing.title}
                {listing.status && <span className="meet-who__status">{GOALS[listing.status].name}</span>}
              </dd>
            </div>
            <div>
              <dt className="staff-label">Stand</dt>
              <dd>{place}</dd>
            </div>
          </dl>
        </section>
      ) : (
        <p className="staff-empty">Your role is not published for this event yet. Meetings open once City of Espoo has invited candidates for it.</p>
      )}

      {listing && (
      <div className="meet-rail" role="group" aria-label="Event stage">
        {STAGES.map((st, i) => (
          <button key={st.id} type="button" className="meet-rail__step" aria-pressed={stage === st.id} onClick={() => setStage(st.id)}>
            <span className="meet-rail__n" aria-hidden="true">{i + 1}</span>
            <span className="meet-rail__text">
              <span className="meet-rail__step-name">{rail[st.id].step}</span>
              <span className="meet-rail__task">{rail[st.id].task}</span>
            </span>
            {listing && <span className="meet-rail__meta">{rail[st.id].meta}</span>}
          </button>
        ))}
      </div>
      )}
      <p className="status" role="status">
        {message}
      </p>

      {listing && stage === 'before' && (
        <section className="staff-section" aria-labelledby="meet-list-title">
          <div className="meet-head">
            <h2 id="meet-list-title" className="staff-h2">
              Book meetings
            </h2>
            <p className="meet-head__meta">{rail.before.meta}</p>
          </div>
          <p className="staff-lede">City of Espoo staff invited these candidates for your role and send each meeting time to the candidate. Candidates are shown by application code.</p>
          {candidates.length ? (
            <ul className="meet-cards">
              {candidates.map((c) => {
                const isOpen = open === c.app.id
                return (
                  <li key={c.app.id} className="meet-card">
                    <div className="meet-card__top">
                      <h3 className="meet-code">{c.app.code}</h3>
                      <div className="meet-booking">
                        {c.booking ? (
                          <>
                            <p className="meet-when">
                              {timeRange(c.booking)} <span>·</span> {c.booking.place}
                            </p>
                            <div className="meet-actions">
                              <button type="button" className="btn-quiet" data-trigger={c.app.id} aria-expanded={isOpen} onClick={() => toggle(c)}>
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
                            <button type="button" className="btn meet-book" data-trigger={c.app.id} aria-expanded={isOpen} onClick={() => toggle(c)}>
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
                    <FromAnswers listing={listing} c={c} />
                    <ScoresAndAnswers listing={listing} c={c} />
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
      )}

      {listing && stage === 'day' && (
        <section className="staff-section" aria-labelledby="meet-sched-title">
          <div className="meet-head">
            <h2 id="meet-sched-title" className="staff-h2">
              Your schedule on {EVENT.date}
            </h2>
            <p className="meet-head__meta">
              {held.length} meetings · {place}
            </p>
          </div>
          {held.length ? (
            <ul className="meet-cards">
              {held.map((c) => (
                <li key={c.app.id} className="meet-card">
                  <div className="meet-card__top">
                    <h3 className="meet-code">{c.app.code}</h3>
                    <p className="meet-when meet-when--lead">
                      {timeRange(c.booking!)} <span>·</span> {c.booking!.place}
                    </p>
                  </div>
                  <ScoresAndAnswers listing={listing} c={c} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="staff-empty">No meetings booked yet.</p>
          )}
        </section>
      )}

      {listing && stage === 'after' && (
        <section className="staff-section" aria-labelledby="meet-held-title">
          <div className="meet-head">
            <h2 id="meet-held-title" className="staff-h2">
              Rate the meetings
            </h2>
            <p className="meet-head__meta">{rail.after.meta}</p>
          </div>
          <p className="staff-lede">Ratings stay with your company.</p>
          {held.length ? (
            <ul className="meet-cards">
              {held.map((c) => (
                <li key={c.app.id} className="meet-card">
                  <div className="meet-card__top">
                    <h3 className="meet-code">{c.app.code}</h3>
                    <div className="meet-booking">
                      <p className="meet-when">
                        {timeRange(c.booking!)} <span>·</span> {c.booking!.place}
                      </p>
                      {!c.rating && <p className="meet-notbooked">Not rated</p>}
                    </div>
                  </div>
                  <RatingBox listing={listing} c={c} announce={setMessage} />
                  <ScoresAndAnswers listing={listing} c={c} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="staff-empty">No meetings to rate. Meetings you book appear here after the event.</p>
          )}
        </section>
      )}
    </main>
  )
}
