import { Fragment, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore, type KeyboardEvent } from 'react'
import { NextStep } from '../components/NextStep'
import { SiteHeader } from '../components/SiteHeader'
import { GOALS } from '../form/schema'
import type { Attribute } from '../event/core'
import {
  answeredEarlier,
  EVENT,
  deleteApplication,
  pairKey,
  resetEvent,
  setDecision,
  setSlots,
  slotsFor,
  useEvent,
  type Application,
  type Assessment,
  type Decision,
  type EventState,
  type Listing,
} from '../event/store'
import { compareRank } from '../event/sampleMeetings'
import { isCurrent, isScoring, useScoring } from './scoring'
import '../App.css'
import '../form/fields.css'
import './staff.css'

const DECISIONS: { id: Decision; label: string }[] = [
  { id: 'invite', label: 'Invite' },
  { id: 'waitlist', label: 'Waitlist' },
  { id: 'decline', label: 'Decline' },
]

type Row = { app: Application; assessment?: Assessment }

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

const applicantsOf = (state: EventState, listingId: string) => state.allApplications.filter((a) => a.picks.includes(listingId))
const assessmentOf = (state: EventState, appId: string, listingId: string) =>
  state.assessments.find((a) => a.applicationId === appId && a.listingId === listingId)
const decisionOf = (state: EventState, appId: string, listingId: string) => state.decisions[pairKey(appId, listingId)]?.decision
const invitesFor = (state: EventState, listingId: string) =>
  applicantsOf(state, listingId).filter((a) => decisionOf(state, a.id, listingId) === 'invite').length

function ProducerTag({ a }: { a: Pick<Assessment, 'source' | 'model'> }) {
  if (a.source === 'sample') return null
  return a.source === 'ai' ? (
    <span className="staff-tag staff-tag--ai">
      <b>AI-drafted</b>
      {a.model && <> · {a.model}</>}
    </span>
  ) : (
    <span className="staff-tag">Rules estimate</span>
  )
}

const QUERY_NARROW = '(max-width: 1023px)'

/** Whether a media query matches, kept in sync as the viewport changes. */
function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (notify) => {
      const m = window.matchMedia(query)
      m.addEventListener('change', notify)
      return () => m.removeEventListener('change', notify)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

/** One attribute score as a compact 0–10 bar with its number; the whole cell opens the evidence. */
function ScoreCell({
  score,
  name,
  withheld,
  expanded,
  controls,
  narrow,
  row,
  col,
  onClick,
}: {
  score: number | null
  name: string
  withheld?: boolean
  expanded: boolean
  controls: string
  narrow: boolean
  row: number
  col: number
  onClick: () => void
}) {
  const state = score !== null ? `${score} of 10` : withheld ? 'read the answers' : 'no evidence'
  return (
    <button type="button" className="staff-score" aria-expanded={expanded} aria-controls={expanded ? controls : undefined} data-row={row} data-col={col} onClick={onClick}>
      <span className="visually-hidden">
        {narrow && `${name}: `}
        {state}, show evidence
      </span>
      <span className="staff-bar" aria-hidden="true">
        <span className="staff-bar__label">{name}</span>
        <span className={`staff-bar__track${score === null ? ' is-empty' : ''}`}>
          {score !== null && <span className="staff-bar__fill" style={{ width: `${score * 10}%` }} />}
        </span>
        <span className={`staff-bar__value${score === null && withheld ? ' is-word' : ''}`}>{score !== null ? score : withheld ? 'Read' : '–'}</span>
      </span>
      <svg className="staff-score__icon" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M2 3h5v5l-2 4H3l1.5-4H2z" />
        <path d="M9 3h5v5l-2 4h-2l1.5-4H9z" />
      </svg>
    </button>
  )
}

/** The answer with the evidence quote marked, when the quote is found in it. */
function MarkedAnswer({ text, quote }: { text: string; quote: string }) {
  const at = quote ? text.toLowerCase().indexOf(quote.toLowerCase()) : -1
  if (at < 0) return <p className="staff-answer">{text}</p>
  return (
    <p className="staff-answer">
      {text.slice(0, at)}
      <mark>{text.slice(at, at + quote.length)}</mark>
      {text.slice(at + quote.length)}
    </p>
  )
}

function Answer({ text }: { text?: string }) {
  return text?.trim() ? <p className="staff-answer">{text}</p> : <p className="staff-gap">Not answered</p>
}

function StepIcon({ kind }: { kind: 'prev' | 'next' | 'close' }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      {kind === 'prev' && <path d="M10.5 2 11.9 3.4 7.3 8l4.6 4.6L10.5 14 4.5 8z" />}
      {kind === 'next' && <path d="M5.5 2 4.1 3.4 8.7 8l-4.6 4.6L5.5 14l6-6z" />}
      {kind === 'close' && <path d="M3.4 2 8 6.6 12.6 2 14 3.4 9.4 8 14 12.6 12.6 14 8 9.4 3.4 14 2 12.6 6.6 8 2 3.4z" />}
    </svg>
  )
}

/** The strip under a row: the quote behind one score, in its answer. */
function Evidence({
  row,
  listing,
  attribute,
  index,
  id,
  narrow,
  onStep,
  onAnswers,
  onClose,
}: {
  row: Row
  listing: Listing
  attribute: Attribute
  index: number
  id?: string
  narrow: boolean
  onStep: (delta: -1 | 1) => void
  onAnswers: () => void
  onClose: () => void
}) {
  const titleId = useId()
  const answers = row.app.answers[listing.id] ?? {}
  const total = listing.set.attributes.length
  const score = row.assessment?.scores.find((s) => s.attribute === attribute.id)
  const question = score?.question ? listing.set.questions.find((q) => q.id === score.question) : undefined
  const marked = Boolean(question && score?.evidence && answers[question.id]?.toLowerCase().includes(score.evidence.toLowerCase()))
  const related = listing.set.questions.filter((q) => q.attributes.includes(attribute.id))
  const unmarked = related.length ? related : listing.set.questions
  const value = score?.score ?? null
  return (
    <section className="staff-evidence" id={id} role="region" aria-labelledby={titleId}>
      <header className="staff-evidence__head">
        <div className="staff-evidence__title" aria-live="polite" aria-atomic="true">
          <p className="staff-evidence__pos">
            {row.app.code} · {index + 1} of {total}
          </p>
          <h3 id={titleId}>{attribute.name}</h3>
          {value !== null ? <p className="staff-evidence__score">{value} / 10</p> : <p className="staff-gap">{score?.withheld ? 'Read the answers' : 'No evidence'}</p>}
        </div>
        <div className="staff-evidence__steps">
          <button type="button" className="staff-icon-btn" data-step="prev" aria-label="Previous attribute" aria-disabled={index === 0} onClick={() => onStep(-1)}>
            <StepIcon kind="prev" />
          </button>
          <button type="button" className="staff-icon-btn" data-step="next" aria-label="Next attribute" aria-disabled={index === total - 1} onClick={() => onStep(1)}>
            <StepIcon kind="next" />
          </button>
          <button type="button" className="staff-icon-btn" data-step="close" aria-label="Close" onClick={onClose}>
            <StepIcon kind="close" />
          </button>
        </div>
      </header>
      <p className="staff-evidence__looks">Strong answers show: {attribute.looksLike}</p>
      <div className="staff-evidence__body">
        <div className="staff-evidence__col">
          <p className="staff-label">Evidence</p>
          {marked && question ? (
            <>
              <p className="staff-qa__q">{question.text}</p>
              <MarkedAnswer text={answers[question.id] ?? ''} quote={score?.evidence ?? ''} />
            </>
          ) : (
            unmarked.map((q) => (
              <div key={q.id} className="staff-evidence__qa">
                <p className="staff-qa__q">{q.text}</p>
                <Answer text={answers[q.id]} />
              </div>
            ))
          )}
        </div>
        <div className="staff-evidence__col">
          <p className="staff-label">Assessment</p>
          {row.assessment && (
            <p>
              <ProducerTag a={row.assessment} />
            </p>
          )}
          {score?.rationale && <p className="staff-evidence__rationale">{score.rationale}</p>}
          {value === null && <p className="staff-evidence__fixed">{score?.withheld ? 'Left out of the overall score.' : 'Counts as 0 in the overall score.'}</p>}
        </div>
        {(() => {
          const list = (
            <ul className="staff-why">
              {attribute.sources.map((s) => (
                <li key={`${s.field}-${s.quote}`}>
                  <span className="staff-why__src">{s.label}</span> “{s.quote}”
                </li>
              ))}
            </ul>
          )
          return narrow ? (
            <details className="staff-evidence__col staff-evidence__why">
              <summary className="staff-label">Why the company looks for this</summary>
              {list}
            </details>
          ) : (
            <div className="staff-evidence__col">
              <p className="staff-label">Why the company looks for this</p>
              {list}
            </div>
          )
        })()}
      </div>
      <footer className="staff-evidence__foot">
        <button type="button" className="staff-link" onClick={onAnswers}>
          All answers
        </button>
      </footer>
    </section>
  )
}

function AnswersDetail({ row, listing, last }: { row: Row; listing: Listing; last?: string }) {
  const answers = row.app.answers[listing.id] ?? {}
  const a = row.assessment
  const state = useEvent()
  const others = state.allListings.filter((l) => l.id !== listing.id && row.app.picks.includes(l.id))
  const lastScore = last ? a?.scores.find((x) => x.attribute === last) : undefined
  function remove() {
    if (window.confirm(`Delete application ${row.app.code}? Its answers, scores and decisions are removed from this browser.`)) deleteApplication(row.app.id)
  }
  return (
    <div className="staff-detail">
      <p className="staff-detail__meta">
        <span>Submitted {formatTime(row.app.submittedAt)}</span>
        {a && (
          <>
            <ProducerTag a={a} />
            <span>Scored {formatTime(a.assessedAt)}</span>
          </>
        )}
      </p>
      {others.length > 0 && (
        <p className="staff-detail__meta">
          <span>Also applied to: {others.map((l) => `${l.company} · ${l.title}`).join('; ')}</span>
        </p>
      )}
      <h4 className="staff-label staff-detail__all">All answers</h4>
      <ol className="staff-qa">
        {listing.set.questions.map((q, i) => (
          <li key={q.id}>
            <span className="staff-qa__n">{i + 1}</span>
            <div>
              <p className="staff-qa__q">{q.text}</p>
              {lastScore?.question === q.id && lastScore.evidence && answers[q.id]?.trim() ? <MarkedAnswer text={answers[q.id]} quote={lastScore.evidence} /> : <Answer text={answers[q.id]} />}
            </div>
          </li>
        ))}
      </ol>
      <button type="button" className="staff-link" onClick={remove}>
        Delete application
      </button>
    </div>
  )
}

function DecisionGroup({ app, listingId, decision }: { app: Application; listingId: string; decision?: Decision }) {
  return (
    <div className="staff-decision" role="group" aria-label={`Decision for ${app.code}`}>
      {DECISIONS.map((d) => (
        <button
          key={d.id}
          type="button"
          className="chip staff-decision__chip"
          aria-pressed={decision === d.id}
          onClick={() => setDecision(app.id, listingId, decision === d.id ? null : d.id)}
        >
          <span className="chip__mark" aria-hidden="true" />
          {d.label}
        </button>
      ))}
    </div>
  )
}

function SlotStepper({ listingId, slots }: { listingId: string; slots: number }) {
  return (
    <div className="staff-slots">
      <label htmlFor="staff-slots-input" className="staff-slots__label">
        Event slots
      </label>
      <div className="stepper">
        <button type="button" aria-label="Fewer slots" disabled={slots <= 1} onClick={() => setSlots(listingId, slots - 1)}>
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <rect x="3" y="7" width="10" height="2" />
          </svg>
        </button>
        <input autoComplete="off" data-1p-ignore data-lpignore="true" data-bwignore data-form-type="other"
          id="staff-slots-input"
          type="number"
          inputMode="numeric"
          min={1}
          max={50}
          value={slots}
          onChange={(e) => e.target.value !== '' && setSlots(listingId, Number(e.target.value))}
        />
        <button type="button" aria-label="More slots" disabled={slots >= 50} onClick={() => setSlots(listingId, slots + 1)}>
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <rect x="3" y="7" width="10" height="2" />
            <rect x="7" y="3" width="2" height="10" />
          </svg>
        </button>
      </div>
    </div>
  )
}

type Open = { app: string; view: string; at?: string; last?: string }

/** How many ranked applicants show before "Show all". */
const TOP = 10

function Ranking({ state, listing, scoring }: { state: EventState; listing: Listing; scoring: boolean }) {
  const [openRaw, setOpen] = useState<Open | null>(null)
  const [showAll, setShowAll] = useState(false)
  const narrow = useMediaQuery(QUERY_NARROW)
  const tableRef = useRef<HTMLTableElement>(null)
  const pending = useRef<string | null>(null)
  const slots = slotsFor(state, listing.id)
  const ranked: Row[] = useMemo(() => {
    const all = applicantsOf(state, listing.id).map((app) => {
      const a = assessmentOf(state, app.id, listing.id)
      return { app, assessment: isCurrent(a, listing) ? a : undefined }
    })
    return all.sort((x, y) => compareRank({ code: x.app.code, overall: x.assessment?.overall }, { code: y.app.code, overall: y.assessment?.overall }))
  }, [state, listing])
  // The top of the ranking, plus anything not yet scored or already decided, so nothing waiting for a person is hidden.
  const rows: Row[] = useMemo(
    () => (showAll ? ranked : ranked.filter((r, i) => i < TOP || !r.assessment || decisionOf(state, r.app.id, listing.id))),
    [ranked, showAll, state, listing.id],
  )
  const hidden = ranked.length - rows.length
  const scored = ranked.filter((r) => r.assessment).length
  const invites = invitesFor(state, listing.id)
  const attrs = listing.set.attributes
  const cols = 4 + attrs.length

  // The open strip closes when its applicant, its scores or its attribute are gone or replaced.
  const openRow = openRaw ? rows.find((r) => r.app.id === openRaw.app) : undefined
  const open =
    openRaw && openRow && (openRaw.view === 'answers' || (openRow.assessment?.assessedAt === openRaw.at && attrs.some((a) => a.id === openRaw.view)))
      ? openRaw
      : null

  // Move focus after a state change has rendered (steps, "All answers", closing).
  useEffect(() => {
    if (!pending.current) return
    const el = tableRef.current?.querySelector<HTMLElement>(pending.current)
    pending.current = null
    el?.focus()
  }, [openRaw])

  // Keep what was just opened in view: the tapped score on a phone, the strip on a wide screen.
  const openKey = open && open.view !== 'answers' ? `${open.app}:${open.view}` : ''
  useEffect(() => {
    if (!openKey) return
    const t = tableRef.current
    const el = narrow ? t?.querySelector<HTMLElement>('.staff-score[aria-expanded="true"]') : t?.querySelector<HTMLElement>('.staff-evidence')
    el?.scrollIntoView({ block: 'nearest' })
  }, [openKey, narrow])

  if (!ranked.length) return <p className="staff-empty">No applications for this role yet.</p>

  const openAt = (i: number, view: string): Open => ({ app: rows[i].app.id, view, at: rows[i].assessment?.assessedAt })
  const cellSelector = (i: number, j: number) => `.staff-score[data-row="${i}"][data-col="${j}"]`

  function toggleScore(i: number, view: string) {
    setOpen(open && open.app === rows[i].app.id && open.view === view ? null : openAt(i, view))
  }

  function close(focusOwner: boolean) {
    if (!open) return
    if (focusOwner) {
      const i = rows.findIndex((r) => r.app.id === open.app)
      const j = attrs.findIndex((a) => a.id === open.view)
      pending.current = j >= 0 ? cellSelector(i, j) : `.staff-who[data-row="${i}"]`
    }
    setOpen(null)
  }

  function step(delta: -1 | 1) {
    if (!open) return
    const i = rows.findIndex((r) => r.app.id === open.app)
    const j = attrs.findIndex((a) => a.id === open.view) + delta
    if (i < 0 || j < 0 || j >= attrs.length) return
    pending.current = `[data-step="${delta < 0 ? 'prev' : 'next'}"]`
    setOpen(openAt(i, attrs[j].id))
  }

  function answersAt(i: number): Open {
    const same = open?.app === rows[i].app.id
    const last = same ? (open.view === 'answers' ? open.last : open.view) : undefined
    return { ...openAt(i, 'answers'), last }
  }

  function showAnswers(i: number) {
    pending.current = `.staff-who[data-row="${i}"]`
    setOpen(answersAt(i))
  }

  function onKeyDown(e: KeyboardEvent<HTMLTableElement>) {
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return
    const target = e.target as HTMLElement
    const cell = target.closest<HTMLElement>('.staff-score')
    if (e.key === 'Escape') {
      if (open && (cell || target.closest('.staff-evidence, .staff-detail, .staff-who'))) {
        e.preventDefault()
        close(!cell && !target.closest('.staff-who'))
      }
      return
    }
    if (!cell || !e.key.startsWith('Arrow')) return
    const r = Number(cell.dataset.row)
    const c = Number(cell.dataset.col)
    let next: HTMLElement | null = null
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      next = tableRef.current?.querySelector<HTMLElement>(cellSelector(r, c + (e.key === 'ArrowLeft' ? -1 : 1))) ?? null
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      const dir = e.key === 'ArrowUp' ? -1 : 1
      for (let k = r + dir; k >= 0 && k < rows.length && !next; k += dir) next = tableRef.current?.querySelector<HTMLElement>(cellSelector(k, c)) ?? null
    } else return
    e.preventDefault()
    if (!next) return
    next.focus()
    if (open && open.view !== 'answers') setOpen(openAt(Number(next.dataset.row), attrs[Number(next.dataset.col)].id))
  }

  return (
    <>
      <div className="staff-toolbar">
        <SlotStepper listingId={listing.id} slots={slots} />
        <p className="staff-toolbar__count">
          {invites > slots ? <strong>{invites} invited · {slots} slots</strong> : `${invites} of ${slots} invited`} · {scored} of {ranked.length} scored
        </p>
      </div>
      <div className="staff-table-wrap">
        <table className="staff-table" ref={tableRef} onKeyDown={onKeyDown}>
          <caption className="visually-hidden">
            Applicants for {listing.title}, {listing.company}, ranked by overall score
          </caption>
          <thead>
            <tr>
              <th scope="col" className="staff-table__rank">
                Rank
              </th>
              <th scope="col">Applicant</th>
              <th scope="col" className="staff-table__overall">
                Overall
              </th>
              {attrs.map((a) => (
                <th scope="col" key={a.id} className="staff-table__attr">
                  {a.name}
                </th>
              ))}
              <th scope="col">Decision</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const isOpen = open?.app === row.app.id
              const answersOpen = isOpen && open.view === 'answers'
              const openIndex = isOpen && !answersOpen ? attrs.findIndex((a) => a.id === open.view) : -1
              const stripId = `staff-strip-${row.app.id}`
              const isPending = !row.assessment
              return (
                <Fragment key={row.app.id}>
                  {i === slots && scored > slots && (
                    <tr className="staff-cutoff">
                      <td colSpan={cols}>
                        <span>{slots} event slots · for reference</span>
                      </td>
                    </tr>
                  )}
                  <tr className={`staff-row${answersOpen ? ' is-open' : ''}${openIndex >= 0 ? ' is-evidence' : ''}`}>
                    <td className="staff-table__rank">{isPending ? '–' : i + 1}</td>
                    <td className="staff-table__who">
                      <button
                        type="button"
                        className="staff-who"
                        data-row={i}
                        aria-expanded={answersOpen}
                        aria-controls={stripId}
                        onClick={() => setOpen(answersOpen ? null : answersAt(i))}
                      >
                        <span className="staff-who__code">{row.app.code}</span>
                        <span className="staff-who__more">{answersOpen ? 'Hide answers' : 'Answers'}</span>
                      </button>
                    </td>
                    <td className="staff-table__overall">
                      {row.assessment ? (
                        <span className="staff-overall">
                          {row.assessment.overall?.toFixed(1) ?? '–'}
                          <span className="visually-hidden"> of 10</span>
                        </span>
                      ) : (
                        <span className="staff-gap">
                          {answeredEarlier(row.app, listing) ? 'Answered earlier questions' : scoring || isScoring(row.app.id, listing.id) ? 'Scoring…' : 'Not scored'}
                        </span>
                      )}
                    </td>
                    {attrs.map((a, j) => {
                      const s = row.assessment?.scores.find((x) => x.attribute === a.id)
                      const here = openIndex === j
                      return (
                        <td key={a.id} className="staff-table__attr">
                          {row.assessment && (
                            <ScoreCell
                              name={a.name}
                              score={s?.score ?? null}
                              withheld={s?.withheld}
                              expanded={here}
                              controls={stripId}
                              narrow={narrow}
                              row={i}
                              col={j}
                              onClick={() => toggleScore(i, a.id)}
                            />
                          )}
                          {here && narrow && (
                            <Evidence
                              id={stripId}
                              narrow
                              row={row}
                              listing={listing}
                              attribute={a}
                              index={j}
                              onStep={step}
                              onAnswers={() => showAnswers(i)}
                              onClose={() => close(true)}
                            />
                          )}
                        </td>
                      )
                    })}
                    <td className="staff-table__decision">
                      <DecisionGroup app={row.app} listingId={listing.id} decision={decisionOf(state, row.app.id, listing.id)} />
                    </td>
                  </tr>
                  {(answersOpen || (openIndex >= 0 && !narrow)) && (
                    <tr className={`staff-row-detail${answersOpen ? '' : ' staff-row-detail--evidence'}`} id={stripId}>
                      <td colSpan={cols}>
                        {answersOpen ? (
                          <AnswersDetail row={row} listing={listing} last={open?.last} />
                        ) : (
                          <Evidence
                            narrow={false}
                            row={row}
                            listing={listing}
                            attribute={attrs[openIndex]}
                            index={openIndex}
                            onStep={step}
                            onAnswers={() => showAnswers(i)}
                            onClose={() => close(true)}
                          />
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
      {ranked.length > TOP && (
        <div className="staff-more">
          <p>
            {showAll
              ? `All ${ranked.length} applicants, ranked by overall score.`
              : `Top ${TOP} of ${ranked.length} applicants, ranked by overall score. ${hidden} more ${hidden === 1 ? 'is' : 'are'} below.`}
          </p>
          <button type="button" className="btn-quiet" aria-expanded={showAll} onClick={() => setShowAll((v) => !v)}>
            {showAll ? `Show top ${TOP}` : `Show all ${ranked.length}`}
          </button>
        </div>
      )}
    </>
  )
}

function Invitations({ state }: { state: EventState }) {
  const [status, setStatus] = useState('')
  const invited = state.allApplications
    .map((app) => ({
      app,
      listings: state.allListings.filter((l) => app.picks.includes(l.id) && decisionOf(state, app.id, l.id) === 'invite'),
    }))
    .filter((x) => x.listings.length)

  async function copy() {
    const list = invited.map((x) => x.app.email).join('\n')
    try {
      await navigator.clipboard.writeText(list)
      setStatus(`Copied ${invited.length} ${invited.length === 1 ? 'e-mail address' : 'e-mail addresses'}.`)
    } catch {
      setStatus('Could not copy. Select the addresses in the table instead.')
    }
  }

  return (
    <section className="staff-section" aria-labelledby="staff-invites-title">
      <h2 id="staff-invites-title" className="staff-h2">
        Invitations
      </h2>
      <p className="staff-lede">Applicants with at least one invitation. E-mail addresses are used only to send the invitation.</p>
      {invited.length ? (
        <>
          <div className="staff-table-wrap">
            <table className="staff-invites">
              <thead>
                <tr>
                  <th scope="col">Applicant</th>
                  <th scope="col">Invited by</th>
                  <th scope="col">E-mail</th>
                </tr>
              </thead>
              <tbody>
                {invited.map(({ app, listings }) => (
                  <tr key={app.id}>
                    <td className="staff-invites__code">{app.code}</td>
                    <td>{listings.map((l) => `${l.title}, ${l.company}`).join('; ')}</td>
                    <td className="staff-invites__email">{app.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="actions">
            <button type="button" className="btn-quiet" onClick={copy}>
              Copy e-mail addresses
            </button>
          </div>
        </>
      ) : (
        <p className="staff-empty">No invitations yet.</p>
      )}
      <p className="status" role="status">
        {status}
      </p>
    </section>
  )
}

/**
 * City of Espoo staff review at #/staff: rank applicants within each company
 * role by their AI-drafted attribute scores, check the evidence, and decide
 * who is invited. Scores are suggestions; every decision is a person's.
 */
export function Staff() {
  const state = useEvent()
  const { progress, score } = useScoring()
  const listings = state.allListings
  const [chosen, setChosen] = useState<string | null>(null)
  // The role with the most applicants (ties: first in the list).
  const fallback = listings.reduce<Listing | undefined>((best, l) => (!best || applicantsOf(state, l.id).length > applicantsOf(state, best.id).length ? l : best), undefined)
  const listing = listings.find((l) => l.id === chosen) ?? fallback

  // Score every application for the selected role that has no current score.
  useEffect(() => {
    if (!listing) return
    const pending = applicantsOf(state, listing.id).filter((app) => !answeredEarlier(app, listing) && !isCurrent(assessmentOf(state, app.id, listing.id), listing))
    if (pending.length) void score(listing, pending)
  }, [state, listing, score])

  const run = listing ? progress[listing.id] : undefined

  function clearAll() {
    if (window.confirm('Clear all event data in this browser? Published roles, applications, scores and decisions are removed. Built-in records are restored.')) {
      resetEvent()
      setChosen(null)
    }
  }

  return (
    <main className="page staff">
      <SiteHeader area="staff" />

      <section className="staff-intro" aria-labelledby="staff-title">
        <h1 id="staff-title">Applications</h1>
        <p className="hint">
          Rank applicants within each company role, check the evidence behind each score, and decide who is invited to {EVENT.name}. Applications
          close {EVENT.applyBy}.
        </p>
      </section>

      <details className="staff-notice">
        <summary>
          <span className="staff-label">Before you decide</span> A person decides every invitation. How scores work
        </summary>
        <ul>
          <li>Scores are drafted by AI from the applicant’s answers to that company’s questions, or estimated by fixed rules when AI is unavailable. Select a score to see the quote it is based on.</li>
          <li>A person decides every invitation. Check the evidence before deciding: a score is a suggestion, never a decision.</li>
          <li>Questions come from the company’s own recent problem, and scores reward concrete examples of the applicant’s own work, so generic or AI-polished answers score low.</li>
          <li>Scoring never sees e-mail addresses or application codes. Attributes come only from the company’s own description of the role.</li>
          <li>An attribute without evidence counts as 0 in the overall score. When the topic filter withholds the evidence, the attribute is left out of the overall score and shown as “Read the answers”.</li>
        </ul>
      </details>

      <section className="staff-section" aria-labelledby="staff-roles-title">
        <h2 id="staff-roles-title" className="staff-h2">
          Company roles
        </h2>
        {listings.length ? (
          <ul className="staff-roles">
            {listings.map((l) => {
              const apps = applicantsOf(state, l.id)
              const scored = apps.filter((a) => isCurrent(assessmentOf(state, a.id, l.id), l)).length
              const selected = l.id === listing?.id
              return (
                <li key={l.id}>
                  <button type="button" className="staff-role" aria-pressed={selected} onClick={() => setChosen(l.id)}>
                    <span className="staff-role__company">
                      {l.company}
                    </span>
                    <span className="staff-role__title">{l.title}</span>
                    {l.status && <span className="staff-role__status">{GOALS[l.status].name}</span>}
                    <span className="staff-role__meta">
                      {apps.length} {apps.length === 1 ? 'applicant' : 'applicants'} · {scored} scored · {invitesFor(state, l.id)} of {slotsFor(state, l.id)} invited
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="staff-empty">No company roles are published for this event yet.</p>
        )}
      </section>

      {listing && (
        <section className="staff-section" aria-labelledby="staff-rank-title">
          <div className="staff-rank-head">
            <div>
              <h2 id="staff-rank-title" className="staff-h2">
                {listing.title}
              </h2>
              <p className="staff-rank-head__meta">
                <span>{listing.company}</span>
                {listing.set.source === 'sample' ? null : listing.set.source === 'ai' ? (
                  <span className="staff-tag staff-tag--ai">
                    <b>Questions generated by AI</b>
                    {listing.set.model && <> · {listing.set.model}</>}
                  </span>
                ) : (
                  <span className="staff-tag">Questions from fixed rules</span>
                )}
                <span>
                  {listing.set.attributes.length} attributes · {listing.set.questions.length} questions
                </span>
              </p>
            </div>
            <button type="button" className="btn-quiet" disabled={Boolean(run)} onClick={() => void score(listing, applicantsOf(state, listing.id).filter((app) => !answeredEarlier(app, listing)), true)}>
              Score again
            </button>
          </div>
          <p className="status" role="status">
            {run ? `Scoring ${Math.min(run.done + 1, run.total)} of ${run.total}…` : ''}
          </p>
          <Ranking key={listing.id} state={state} listing={listing} scoring={Boolean(run)} />
        </section>
      )}

      <Invitations state={state} />

      <section className="staff-section" aria-labelledby="staff-data-title">
        <h2 id="staff-data-title" className="staff-h2">
          Data in this browser
        </h2>
        <p className="staff-lede">
          Applications, scores and decisions are stored in this browser only. Delete a single application from its answers, or clear everything.
        </p>
        <div className="actions">
          <button type="button" className="btn-quiet" onClick={clearAll}>
            Clear event data in this browser
          </button>
        </div>
      </section>
      <NextStep href="#/meetings" label="Meetings" detail="Companies book event-day meetings with the candidates you invited." />
    </main>
  )
}
