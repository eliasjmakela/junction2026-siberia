import { useRef, useState } from 'react'
import { Sky } from '../components/Sky'
import { SiteHeader } from '../components/SiteHeader'
import { SetView } from '../event/CompanyQuestions'
import { MAX_PICKS } from '../event/core'
import { EVENT, type Listing } from '../event/store'
import { goalOf } from '../form/logic'
import { RolePreview } from '../form/RolePreview'
import type { Values } from '../form/schema'
import { roleFingerprint, skyStars } from '../sky/input'
import '../event/company.css'
import './companyRole.css'

/** The role card: the summary on the front, the full role page on the back. */
function RoleCardFlip({ seed, values }: { seed: string; values: Values }) {
  const [flipped, setFlipped] = useState(false)
  const backButton = useRef<HTMLButtonElement>(null)
  const frontButton = useRef<HTMLButtonElement>(null)
  const title = values.title?.text?.trim() || 'Role'
  const stars = skyStars(values, () => true)

  function showDetails() {
    setFlipped(true)
    requestAnimationFrame(() => backButton.current?.focus())
  }

  function showCard() {
    setFlipped(false)
    requestAnimationFrame(() => frontButton.current?.focus())
  }

  return (
    <article className={`browse-card${flipped ? ' is-flipped' : ''}`} aria-label={`${title} role card`}>
      <div className="browse-card__turn">
        <div className="browse-card__face browse-card__front" aria-hidden={flipped}>
          <RolePreview values={values} part="summary" />
          <div className="browse-card__constellation" aria-hidden="true">
            <Sky thumb seed={seed} goal={goalOf(values)} fingerprint={roleFingerprint(values)} step={8} {...stars} complete />
          </div>
          <button ref={frontButton} className="browse-card__action" type="button" disabled={flipped} onClick={showDetails}>
            View role details <span aria-hidden="true">→</span>
          </button>
        </div>
        <div className="browse-card__face browse-card__back" aria-hidden={!flipped}>
          <div className="browse-card__backbar">
            <button ref={backButton} className="browse-card__back-button" type="button" disabled={!flipped} onClick={showCard}>
              <span aria-hidden="true">←</span> Role card
            </button>
          </div>
          <div className="browse-card__details">
            <RolePreview values={values} part="details" />
          </div>
        </div>
      </div>
    </article>
  )
}

/** An event company's role profile or application questions, read-only. */
export function CompanyRole({ listing, view }: { listing: Listing; view: 'profile' | 'questions' }) {
  const set = listing.set
  return (
    <main className="page company-role">
      <SiteHeader area={view} />
      {view === 'profile' ? (
        <section className="company-role__body" aria-labelledby="cr-title">
          <h1 id="cr-title" className="company-role__title">Role profile</h1>
          <p className="hint">
            {listing.company} · {listing.title}. The role card and role page job seekers see at {EVENT.name}.
          </p>
          <RoleCardFlip key={listing.id} seed={listing.seed} values={listing.values} />
        </section>
      ) : (
        <section className="cq company-role__body" aria-labelledby="cr-title">
          <h1 id="cr-title" className="cq__title company-role__title">Application questions</h1>
          <p className="cq__lede">
            {listing.company} · {listing.title}. Job seekers apply to meet up to {MAX_PICKS} companies at {EVENT.name} by answering these questions.
          </p>
          <div className="cq__panel">
            <p className="cq__meta">
              <span className="cq-tag cq-tag--live"><b>Published</b></span>
              <span>
                {set.attributes.length} attributes · {set.questions.length} questions
              </span>
            </p>
            <SetView set={set} />
          </div>
        </section>
      )}
    </main>
  )
}
