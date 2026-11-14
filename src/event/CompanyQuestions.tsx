import { useMemo, useRef, useState } from 'react'
import { Arrow } from '../components/Arrow'
import type { Values } from '../form/schema'
import { removeQuestion, requestQuestionSet } from './api'
import { briefFrom } from './brief'
import { MAX_PICKS, type Attribute, type QuestionSet } from './core'
import { EVENT, publishListing, unpublishListing, useEvent, type Listing } from './store'
import './company.css'

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function ProducerTag({ set }: { set: Pick<QuestionSet, 'source' | 'model'> }) {
  if (set.source === 'ai')
    return (
      <span className="cq-tag cq-tag--ai">
        <b>AI-drafted</b>
        {set.model && <> · {set.model}</>}
      </span>
    )
  if (set.source === 'sample') return <span className="cq-tag"><b>Sample questions</b></span>
  return <span className="cq-tag"><b>Drafted from your answers</b> · fixed templates</span>
}

function AttributeList({ attributes }: { attributes: Attribute[] }) {
  return (
    <ol className="cq-attrs">
      {attributes.map((a) => (
        <li key={a.id} className="cq-attr">
          <p className="cq-attr__name">{a.name}</p>
          <p className="cq-attr__looks">{a.looksLike}</p>
          <ul className="cq-attr__sources" aria-label={`Sources for ${a.name}`}>
            {a.sources.map((s, i) => (
              <li key={i}>
                <span className="cq-attr__label">{s.label}</span>
                <q>{s.quote}</q>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  )
}

function QuestionList({ set, onRemove }: { set: QuestionSet; onRemove?: (id: string) => void }) {
  const names = new Map(set.attributes.map((a) => [a.id, a.name]))
  return (
    <ol className="cq-questions">
      {set.questions.map((q, i) => (
        <li key={q.id} className="cq-q">
          <span className="cq-q__n">{i + 1}</span>
          <div>
            <p className="cq-q__text">{q.text}</p>
            <p className="cq-q__meta">Shows: {q.attributes.map((id) => names.get(id)).filter(Boolean).join(', ')}</p>
          </div>
          {onRemove && (
            <button type="button" className="cq-q__remove" onClick={() => onRemove(q.id)} aria-label={`Remove question ${i + 1}`}>
              Remove
            </button>
          )}
        </li>
      ))}
    </ol>
  )
}

function SetView({ set, onRemove }: { set: QuestionSet; onRemove?: (id: string) => void }) {
  return (
    <>
      <h3 className="cq-h3">What applicants are scored on</h3>
      <p className="cq-sub">Each attribute quotes your answers. Staff see these quotes next to every score.</p>
      <AttributeList attributes={set.attributes} />
      <h3 className="cq-h3">Questions for applicants</h3>
      <QuestionList set={set} onRemove={onRemove} />
    </>
  )
}

/**
 * The company turns its submitted role into event application questions:
 * AI drafts the attributes the role needs (each quoting the company's own
 * answers) and open questions that let applicants show them. The company
 * reviews, removes and publishes them to the event.
 */
export function CompanyQuestions({ values, seed }: { values: Values; seed: string }) {
  const brief = useMemo(() => briefFrom(values), [values])
  const briefKey = useMemo(() => JSON.stringify(brief), [brief])
  const listingId = `role-${seed}`
  const state = useEvent()
  const published = state.listings.find((l) => l.id === listingId) ?? null
  const applicants = published ? state.allApplications.filter((a) => a.picks.includes(listingId)).length : 0
  const [draft, setDraft] = useState<QuestionSet | null>(null)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const panelRef = useRef<HTMLDivElement>(null)

  async function generate() {
    setBusy(true)
    setStatus('Drafting questions…')
    const set = await requestQuestionSet(brief)
    setBusy(false)
    if (!set) {
      setDraft(null)
      setStatus('Not enough written answers to draft questions. Answer more of the role’s text questions and try again.')
      return
    }
    setDraft(set)
    setStatus(`${set.attributes.length} attributes and ${set.questions.length} questions ready for review.`)
    requestAnimationFrame(() => panelRef.current?.focus())
  }

  function remove(id: string) {
    if (!draft) return
    const next = removeQuestion(draft, id)
    if (!next) {
      setStatus('At least two questions and two attributes are needed. Draft again to start over.')
      return
    }
    setDraft(next)
    setStatus('Question removed.')
  }

  function publish() {
    if (!draft) return
    const listing: Listing = {
      id: listingId,
      company: brief.company,
      title: brief.title,
      status: brief.status,
      brief,
      set: draft,
      values,
      seed,
      publishedAt: new Date().toISOString(),
    }
    if (!publishListing(listing)) {
      setStatus('Could not publish the questions. Try again.')
      return
    }
    setDraft(null)
    setStatus(`Published to ${EVENT.name}.`)
  }

  function withdraw() {
    unpublishListing(listingId)
    setStatus('Withdrawn from the event.')
  }

  return (
    <section className="cq" aria-labelledby="cq-title">
      <h2 id="cq-title" className="cq__title">Application questions</h2>
      <p className="cq__lede">
        Job seekers apply to meet up to {MAX_PICKS} companies at {EVENT.name} by answering their questions. From your role texts, AI drafts what
        the role needs and a few open questions about it. You review every question before it is published.
      </p>

      {draft ? (
        <div className="cq__panel" ref={panelRef} tabIndex={-1} aria-label="Draft questions">
          <p className="cq__meta">
            <ProducerTag set={draft} />
            <span>
              {draft.attributes.length} attributes · {draft.questions.length} questions
            </span>
          </p>
          <SetView set={draft} onRemove={remove} />
          <div className="cq__actions">
            <button type="button" className="btn" onClick={publish}>
              Publish to the event <Arrow />
            </button>
            <button type="button" className="btn-quiet" onClick={generate} disabled={busy}>
              {busy ? 'Drafting…' : 'Draft again'}
            </button>
          </div>
        </div>
      ) : published ? (
        <div className="cq__panel">
          <p className="cq__meta">
            <span className="cq-tag cq-tag--live">
              <b>Published</b> · {formatTime(published.publishedAt)}
            </span>
            <ProducerTag set={published.set} />
            <span>
              {applicants} {applicants === 1 ? 'applicant' : 'applicants'}
            </span>
          </p>
          {JSON.stringify(published.brief) !== briefKey && (
            <p className="cq__notice">The role has changed since these questions were published. Draft them again to match the role.</p>
          )}
          <SetView set={published.set} />
          <div className="cq__actions">
            <a className="btn" href="#/apply">
              Open applicant view <Arrow />
            </a>
            <a className="btn-quiet" href="#/staff">
              Staff review
            </a>
            <button type="button" className="btn-quiet" onClick={() => setDraft(published.set)}>
              Edit questions
            </button>
            <button type="button" className="btn-quiet" onClick={generate} disabled={busy}>
              {busy ? 'Drafting…' : 'Draft again'}
            </button>
            <button type="button" className="btn-quiet" onClick={withdraw}>
              Withdraw from the event
            </button>
          </div>
        </div>
      ) : (
        <div className="cq__actions">
          <button type="button" className="btn" onClick={generate} disabled={busy}>
            {busy ? 'Drafting…' : 'Draft application questions'} <Arrow />
          </button>
        </div>
      )}

      <p className="status" role="status">
        {status}
      </p>

      <p className="cq__privacy">
        Attributes and questions come only from your role texts, and every attribute quotes them. Anything about age, gender, family, health,
        origin, nationality, beliefs or other protected grounds is removed automatically. City of Espoo staff review the answers and decide
        whom to invite; AI-drafted scores support that review and never decide it.
      </p>
    </section>
  )
}
