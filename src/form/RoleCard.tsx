import { Sky } from '../components/Sky'
import { skyStars } from '../sky/input'
import { display, goalOf, hasValue, UNDECIDED } from './logic'
import { FIELD_BY_ID, GOALS, type Values } from './schema'
import './RoleCard.css'

type Props = { values: Values; seed: string; fingerprint: string; event: { name: string; date: string } }

/**
 * The role card: the role's need on one poster-sized card, for the event
 * listing, the stand and sharing. A miniature of the night-sky field, so it is spruce.
 */
export function RoleCard({ values, seed, fingerprint, event }: Props) {
  const goal = goalOf(values)
  const title = hasValue(FIELD_BY_ID.title, values.title) ? values.title!.text!.trim() : 'Untitled role'
  const company = hasValue(FIELD_BY_ID.company, values.company) ? values.company!.text!.trim() : null
  const must = values.skills?.undecided ? null : values.skills?.skills?.must ?? []
  const facts: [string, string][] = [
    ['Employment type', 'type'],
    ...(goal === 'pipeline'
      ? [['Before hiring', 'hiringCondition'] as [string, string]]
      : goal === 'soon'
        ? [['Expected opening', 'openingWindow'] as [string, string], ['Start', 'start'] as [string, string]]
        : [['Positions', 'positions'] as [string, string], ['Start', 'start'] as [string, string]]),
    ['Work mode', 'mode'],
    ['Finnish', 'finnish'],
  ]

  return (
    <article className="role-card" aria-label={`Role card: ${title}`}>
      <p className="role-card__top">
        <span className="role-card__brand">Plainly</span>
        <span>
          {event.name} · {event.date}
        </span>
      </p>
      <div className="role-card__figure">
        <Sky thumb seed={seed} goal={goal} fingerprint={fingerprint} step={8} {...skyStars(values, () => true)} complete />
      </div>
      <h2 className="role-card__title">{title}</h2>
      <p className="role-card__by">
        {goal && (
          <span className="role-card__status">{GOALS[goal].name}</span>
        )}
        {company && <span>{company}</span>}
      </p>
      <dl className="role-card__facts">
        {facts.map(([label, id]) => {
          const text = display(id, values)
          return (
            <div key={id}>
              <dt>{label}</dt>
              <dd className={!text || text === UNDECIDED ? 'is-gap' : undefined}>{text ?? 'Not answered'}</dd>
            </div>
          )
        })}
      </dl>
      <p className="role-card__skills">
        <span>Must-have</span>
        {must === null ? <b className="is-gap">{UNDECIDED}</b> : <b>{must.length ? must.join(', ') : 'None listed'}</b>}
      </p>
    </article>
  )
}
