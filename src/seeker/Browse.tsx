import { useRef, useState } from 'react'
import { RolePreview } from '../form/RolePreview'
import { Sky } from '../components/Sky'
import { goalOf } from '../form/logic'
import { roleFingerprint, skyStars } from '../sky/input'
import { SAMPLE_ROLES } from './sampleRoles'
import './browse.css'

const EVENT = { name: 'Sample · Espoo Matchmaking Day', date: '4 Mar 2027' }

function BrowseCard({ id, values }: { id: string; values: (typeof SAMPLE_ROLES)[number]['values'] }) {
  const [flipped, setFlipped] = useState(false)
  const backButton = useRef<HTMLButtonElement>(null)
  const frontButton = useRef<HTMLButtonElement>(null)
  const title = values.title?.text?.trim() || 'Role'
  const goal = goalOf(values)
  const fingerprint = roleFingerprint(values)
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
            <Sky thumb seed={`sample-${id}`} goal={goal} fingerprint={fingerprint} step={8} {...stars} complete />
          </div>
          <button ref={frontButton} className="browse-card__action" type="button" disabled={flipped} onClick={showDetails}>
            View role details <span aria-hidden="true">→</span>
          </button>
        </div>
        <div className="browse-card__face browse-card__back" aria-hidden={!flipped}>
          <div className="browse-card__backbar">
            <span className="browse-card__sample">Sample role</span>
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

export function Browse() {
  return (
    <main className="browse">
      <header className="browse__top">
        <a className="browse__brand" href="#/roles" aria-label="Plainly roles">
          Plainly
        </a>
        <nav className="browse__nav" aria-label="Main navigation">
          <a href="#/roles" aria-current="page">Find roles</a>
          <a href="/">For companies</a>
        </nav>
        <p className="browse__event">Sample roles · <b>{EVENT.name}</b> · {EVENT.date}</p>
      </header>

      <section className="browse__intro" aria-labelledby="browse-title">
        <p className="browse__eyebrow">Espoo Matchmaking Day · Sample roles</p>
        <h1 id="browse-title">Roles to explore</h1>
        <p>See what the work involves, what the team needs, and where the details stand.</p>
      </section>

      <section className="browse__list" aria-label="Sample role cards">
        {SAMPLE_ROLES.map((role) => <BrowseCard key={role.id} id={role.id} values={role.values} />)}
      </section>
      <footer className="browse__foot">Sample role profiles · {SAMPLE_ROLES.length} roles</footer>
    </main>
  )
}
