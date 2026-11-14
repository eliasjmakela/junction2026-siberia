import type { Goal } from './questions'

/** Shape canvas: 400 x 320, on the 8px module. */
export const W = 400
export const H = 320
const N = 48 // every shape is resampled to the same point count so any two can morph
const PAD = 8

export type Pt = [number, number]

const K = N / 4 // points per side

/** Sample a straight side from a to b with K points (b excluded: it starts the next side). */
function side(a: Pt, b: Pt): Pt[] {
  return Array.from({ length: K }, (_, i) => {
    const t = i / K
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t] as Pt
  })
}

/**
 * Every shape is four sides of K points, starting top-left and running clockwise,
 * so side maps to side when morphing: straight edges stay straight in between.
 */
function quad(tl: Pt, tr: Pt, br: Pt, bl: Pt): Pt[] {
  return [...side(tl, tr), ...side(tr, br), ...side(br, bl), ...side(bl, tl)]
}

const L = PAD
const R = W - PAD
const T = PAD
const B = H - PAD
const CX = W / 2
const CY = H / 2

const blunt = quad([L, T], [R, T], [R, B], [L, B])
const band = quad([L, CY - 48], [R, CY - 48], [R, CY + 48], [L, CY + 48])
const wedge = quad([L, T + 32], [R, CY], [R, CY], [L, B - 32])

function circle(): Pt[] {
  const r = 144
  const pts: Pt[] = []
  for (let i = 0; i < N; i++) {
    const a = (-3 * Math.PI) / 4 + (i / N) * Math.PI * 2
    pts.push([CX + r * Math.cos(a), CY + r * Math.sin(a)])
  }
  return pts
}

export const SHAPES: Record<'blunt' | Goal, Pt[]> = {
  blunt,
  visibility: circle(),
  need: wedge,
  general: band,
}

export function lerpShape(a: Pt[], b: Pt[], t: number): Pt[] {
  return a.map((p, i) => [p[0] + (b[i][0] - p[0]) * t, p[1] + (b[i][1] - p[1]) * t])
}

export function toPoints(pts: Pt[]): string {
  return pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
}

/** Shape for a given goal and how specific the answers are (0..1). */
export function shapeFor(goal: Goal | null, specificity: number): Pt[] {
  if (!goal) return SHAPES.blunt
  // The first answer already commits most of the way; each later answer sharpens the rest.
  const t = 0.45 + 0.55 * Math.min(1, Math.max(0, specificity))
  return lerpShape(SHAPES.blunt, SHAPES[goal], t)
}

/**
 * How out of focus the intent is, in viewBox units of blur.
 * Vague before a goal, still soft right after it, in focus once every answer is in.
 */
export function blurFor(goal: Goal | null, specificity: number): number {
  if (!goal) return 14
  const s = Math.min(1, Math.max(0, specificity))
  return 10 * Math.pow(1 - s, 1.3)
}

export const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t))
