import { Fragment, useEffect, useMemo, useState } from 'react'
import { SiteHeader } from '../components/SiteHeader'
import { GOALS } from '../form/schema'
import type { Attribute, Score } from '../event/core'
import {
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
  return a.source === 'ai' ? (
    <span className="staff-tag staff-tag--ai">
      <b>AI-drafted</b>
      {a.model && <> · {a.model}</>}
    </span>
  ) : (
    <span className="staff-tag">Rules estimate</span>
  )
}

/** One attribute score as a compact 0–10 bar with its number. */
function ScoreBar({ score, name }: { score: number | null; name: string }) {
  return (
    <span className="staff-bar">
      <span className="staff-bar__label">{name}</span>
      <span className={`staff-bar__track${score === null ? ' is-empty' : ''}`} aria-hidden="true">
        {score !== null && <span className="staff-bar__fill" style={{ width: `${score * 10}%` }} />}
      </span>
      <span className="staff-bar__value">
        {score === null ? (
          <>
            <span aria-hidden="true">–</span>
            <span className="visually-hidden">No evidence</span>
          </>
        ) : (
          <>
            {score}
            <span className="visually-hidden"> of 10</span>
          </>
        )}
      </span>
    </span>
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

function AttributeDetail({ attribute, score, listing, answers }: { attribute: Attribute; score?: Score; listing: Listing; answers: Record<string, string> }) {
  const question = score?.question ? listing.set.questions.find((q) => q.id === score.question) : undefined
  return (
    <section className="staff-attr" aria-label={attribute.name}>
      <header className="staff-attr__head">
        <h4>{attribute.name}</h4>
        {score && score.score !== null ? <p className="staff-attr__score">{score.score} / 10</p> : <p className="staff-gap">No evidence</p>}
      </header>
      <p className="staff-attr__looks">Strong answers show: {attribute.looksLike}</p>
      {score && <p className="staff-attr__rationale">{score.rationale}</p>}
      {question && score?.evidence && (
        <div className="staff-attr__evidence">
          <p className="staff-label">Evidence · {question.text}</p>
          <MarkedAnswer text={answers[question.id] ?? ''} quote={score.evidence} />
        </div>
      )}
      <div className="staff-attr__why">
        <p className="staff-label">Why the company looks for this</p>
        <ul>
          {attribute.sources.map((s) => (
            <li key={`${s.field}-${s.quote}`}>
              <span className="staff-attr__src">{s.label}</span> “{s.quote}”
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function RowDetail({ row, listing }: { row: Row; listing: Listing }) {
  const answers = row.app.answers[listing.id] ?? {}
  const a = row.assessment
  function remove() {
    if (window.confirm(`Delete application ${row.app.code}? Its answers, scores and decisions are removed from this browser.`)) deleteApplication(row.app.id)
  }
  return (
    <div className="staff-detail">
      <p className="staff-detail__meta">
        {row.app.sample && <span className="staff-tag">Sample applicant</span>}
        <span>Submitted {formatTime(row.app.submittedAt)}</span>
        {a && (
          <>
            <ProducerTag a={a} />
            <span>Scored {formatTime(a.assessedAt)}</span>
          </>
        )}
      </p>
      {a && (
        <div className="staff-detail__attrs">
          {listing.set.attributes.map((attr) => (
            <AttributeDetail key={attr.id} attribute={attr} score={a.scores.find((s) => s.attribute === attr.id)} listing={listing} answers={answers} />
          ))}
        </div>
      )}
      <h4 className="staff-label staff-detail__all">All answers</h4>
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
        <input
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

function Ranking({ state, listing, scoring }: { state: EventState; listing: Listing; scoring: boolean }) {
  const [open, setOpen] = useState<string | null>(null)
  const slots = slotsFor(state, listing.id)
  const rows: Row[] = useMemo(() => {
    const all = applicantsOf(state, listing.id).map((app) => {
      const a = assessmentOf(state, app.id, listing.id)
      return { app, assessment: isCurrent(a, listing) ? a : undefined }
    })
    return all.sort((x, y) => {
      const ox = x.assessment?.overall ?? -1
      const oy = y.assessment?.overall ?? -1
      return oy - ox || x.app.code.localeCompare(y.app.code)
    })
  }, [state, listing])
  const scored = rows.filter((r) => r.assessment).length
  const cols = 4 + listing.set.attributes.length

  if (!rows.length) return <p className="staff-empty">No applications for this role yet.</p>

  return (
    <>
      <div className="staff-toolbar">
        <SlotStepper listingId={listing.id} slots={slots} />
        <p className="staff-toolbar__count">
          {invitesFor(state, listing.id)} of {slots} invited · {scored} of {rows.length} scored
        </p>
      </div>
      <div className="staff-table-wrap">
        <table className="staff-table">
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
              {listing.set.attributes.map((a) => (
                <th scope="col" key={a.id} className="staff-table__attr">
                  {a.name}
                </th>
              ))}
              <th scope="col">Decision</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const expanded = open === row.app.id
              const detailId = `staff-detail-${row.app.id}`
              const pending = !row.assessment
              return (
                <Fragment key={row.app.id}>
                  {i === slots && scored > slots && (
                    <tr className="staff-cutoff">
                      <td colSpan={cols}>
                        <span>Event slots: {slots}</span>
                      </td>
                    </tr>
                  )}
                  <tr className={`staff-row${expanded ? ' is-open' : ''}`}>
                    <td className="staff-table__rank">{pending ? '–' : i + 1}</td>
                    <td className="staff-table__who">
                      <button type="button" className="staff-who" aria-expanded={expanded} aria-controls={detailId} onClick={() => setOpen(expanded ? null : row.app.id)}>
                        <span className="staff-who__code">{row.app.code}</span>
                        <span className="staff-who__more">{expanded ? 'Hide details' : 'Details'}</span>
                      </button>
                    </td>
                    <td className="staff-table__overall">
                      {row.assessment ? (
                        <span className="staff-overall">
                          {row.assessment.overall?.toFixed(1) ?? '–'}
                          <span className="visually-hidden"> of 10</span>
                        </span>
                      ) : (
                        <span className="staff-gap">{scoring || isScoring(row.app.id, listing.id) ? 'Scoring…' : 'Not scored'}</span>
                      )}
                    </td>
                    {listing.set.attributes.map((a) => (
                      <td key={a.id} className="staff-table__attr">
                        {row.assessment ? <ScoreBar name={a.name} score={row.assessment.scores.find((s) => s.attribute === a.id)?.score ?? null} /> : null}
                      </td>
                    ))}
                    <td className="staff-table__decision">
                      <DecisionGroup app={row.app} listingId={listing.id} decision={decisionOf(state, row.app.id, listing.id)} />
                    </td>
                  </tr>
                  {expanded && (
                    <tr className="staff-row-detail" id={detailId}>
                      <td colSpan={cols}>
                        <RowDetail row={row} listing={listing} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
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
  const fallback = listings.find((l) => applicantsOf(state, l.id).length) ?? listings[0]
  const listing = listings.find((l) => l.id === chosen) ?? fallback

  // Score every application for the selected role that has no current score.
  useEffect(() => {
    if (!listing) return
    const pending = applicantsOf(state, listing.id).filter((app) => !isCurrent(assessmentOf(state, app.id, listing.id), listing))
    if (pending.length) void score(listing, pending)
  }, [state, listing, score])

  const run = listing ? progress[listing.id] : undefined

  function clearAll() {
    if (window.confirm('Clear all event data in this browser? Published roles, applications, scores and decisions are removed. Sample records are restored.')) {
      resetEvent()
      setChosen(null)
    }
  }

  return (
    <main className="page staff">
      <SiteHeader area="staff" note="Sample applicants" />

      <section className="staff-intro" aria-labelledby="staff-title">
        <h1 id="staff-title">Applications</h1>
        <p className="hint">
          Rank applicants within each company role, check the evidence behind each score, and decide who is invited to {EVENT.name}. Applications
          close {EVENT.applyBy}.
        </p>
      </section>

      <aside className="staff-notice" aria-labelledby="staff-notice-title">
        <h2 id="staff-notice-title" className="staff-label">
          Before you decide
        </h2>
        <ul>
          <li>Scores are drafted by AI from the applicant’s answers to that company’s questions, or estimated by fixed rules when AI is unavailable. Each score shows the quote it is based on.</li>
          <li>A person decides every invitation. Check the evidence before deciding: a score is a suggestion, never a decision.</li>
          <li>Scoring never sees e-mail addresses or application codes. Attributes come only from the company’s own description of the role.</li>
          <li>An attribute without evidence counts as 0 in the overall score.</li>
        </ul>
      </aside>

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
                      {l.sample && <span className="staff-tag">Sample</span>}
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
                {listing.set.source === 'sample' ? (
                  <span className="staff-tag">Sample questions</span>
                ) : listing.set.source === 'ai' ? (
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
            <button type="button" className="btn-quiet" disabled={Boolean(run)} onClick={() => void score(listing, applicantsOf(state, listing.id), true)}>
              Score again
            </button>
          </div>
          <p className="status" role="status">
            {run ? `Scoring ${Math.min(run.done + 1, run.total)} of ${run.total}…` : ''}
          </p>
          <Ranking state={state} listing={listing} scoring={Boolean(run)} />
        </section>
      )}

      <Invitations state={state} />

      <section className="staff-section" aria-labelledby="staff-data-title">
        <h2 id="staff-data-title" className="staff-h2">
          Data in this browser
        </h2>
        <p className="staff-lede">
          Applications, scores and decisions are stored in this browser only. Delete a single application from its details, or clear everything.
        </p>
        <div className="actions">
          <button type="button" className="btn-quiet" onClick={clearAll}>
            Clear event data in this browser
          </button>
        </div>
      </section>
    </main>
  )
}
