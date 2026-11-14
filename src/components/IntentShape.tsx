import { useEffect, useId, useRef, useState } from 'react'
import { H, SHAPES, W, blurFor, easeOutExpo, lerpShape, shapeFor, toPoints, type Pt } from '../drill/shapes'
import type { Goal } from '../form/schema'
import './IntentShape.css'

type Props = {
  goal: Goal | null
  specificity: number
  className?: string
}

const DURATION = 700

/**
 * The signature move: the company's intent drawn as one flat shape that is
 * cut sharper and pulled into focus with each answer. Morphs between 48-point
 * polygons while the blur on the ink eases toward zero.
 */
export function IntentShape({ goal, specificity, className }: Props) {
  const polyRef = useRef<SVGPolygonElement>(null)
  const current = useRef<Pt[]>(shapeFor(goal, specificity))
  const blurRef = useRef<SVGFEGaussianBlurElement>(null)
  const currentBlur = useRef(blurFor(goal, specificity))
  const frame = useRef(0)
  const [initialPoints] = useState(() => toPoints(shapeFor(goal, specificity)))
  const [initialBlur] = useState(() => blurFor(goal, specificity))
  const filterId = `focus-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`

  useEffect(() => {
    const target = shapeFor(goal, specificity)
    const from = current.current
    const blurTarget = blurFor(goal, specificity)
    const blurFrom = currentBlur.current
    const poly = polyRef.current
    const blur = blurRef.current
    if (!poly || !blur) return
    const setBlur = (v: number) => {
      currentBlur.current = v
      blur.setAttribute('stdDeviation', v.toFixed(2))
    }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    cancelAnimationFrame(frame.current)
    if (reduce) {
      current.current = target
      poly.setAttribute('points', toPoints(target))
      setBlur(blurTarget)
      return
    }
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION)
      const e = easeOutExpo(t)
      const pts = lerpShape(from, target, e)
      current.current = pts
      poly.setAttribute('points', toPoints(pts))
      setBlur(blurFrom + (blurTarget - blurFrom) * e)
      if (t < 1) frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame.current)
  }, [goal, specificity])

  return (
    <svg
      className={['intent-shape', className].filter(Boolean).join(' ')}
      viewBox={`0 0 ${W} ${H}`}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <filter id={filterId} filterUnits="userSpaceOnUse" x={-48} y={-48} width={W + 96} height={H + 96}>
          <feGaussianBlur ref={blurRef} stdDeviation={initialBlur.toFixed(2)} />
        </filter>
      </defs>
      {/* Register frame around the uncut stock, offset so it never touches the ink. */}
      <rect className="intent-shape__stock" x="1" y="1" width={W - 2} height={H - 2} />
      <polygon ref={polyRef} className="intent-shape__ink" points={initialPoints} filter={`url(#${filterId})`} />
      {/* Before any answer: the three possible cuts, marked on the stock like a pattern. */}
      <g className={`intent-shape__guides${goal ? ' is-hidden' : ''}`}>
        <polygon points={toPoints(SHAPES.now)} />
        <polygon points={toPoints(SHAPES.soon)} />
        <polygon points={toPoints(SHAPES.pipeline)} />
      </g>
    </svg>
  )
}

/** Filled arrow on the same 16-unit grid as the emblems. */
export function Arrow() {
  return (
    <svg className="arrow" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M1 7 H10 V3 L15 8 L10 13 V9 H1 Z" />
    </svg>
  )
}

/** Small static emblems for the legend and the result. */
export function Emblem({ goal, size = 16 }: { goal: Goal; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" focusable="false" className="emblem">
      {goal === 'now' && <path d="M1 2 L15 8 L1 14 Z" />}
      {goal === 'soon' && <path d="M1 2 L15 6 L15 10 L1 14 Z" />}
      {goal === 'pipeline' && <rect x="1" y="5" width="14" height="6" />}
    </svg>
  )
}
