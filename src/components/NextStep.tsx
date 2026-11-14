import { Arrow } from './Arrow'
import './NextStep.css'

/** A link to the next stage of the event, at the foot of a stage's page. */
export function NextStep({ href, label, detail }: { href: string; label: string; detail: string }) {
  return (
    <nav className="next-step" aria-label="Next stage">
      <a href={href}>
        <span className="next-step__label">
          Next: {label} <Arrow />
        </span>
        <span className="next-step__detail">{detail}</span>
      </a>
    </nav>
  )
}
