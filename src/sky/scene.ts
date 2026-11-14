/**
 * The night sky: the signature of Plainly.
 *
 * A wide, softly out-of-focus field of noise stars. As the company completes
 * each step of the form, the camera zooms (unevenly), pans and swings toward
 * the role's constellation, the focus pulls, and one more of its stars is
 * picked out of the noise. Only when the whole profile is complete do lines
 * connect the picked stars into a legible constellation.
 */
import type { Goal } from '../form/schema'

type Pt = [number, number]

export const SKY = {
  z0: 0.32,
  z1: 1.15,
  parallax: 1.4,
  rotMax: 22,
  wander: 240,
  blur0: 3,
  dof: 1.2,
  stars: 1600,
  starSize: 1.35,
  dim: 0.55,
  twinkle: 0.15,
  cSize: 1.3,
  glow: 0.5,
  vary: 30,
  speed: 1300,
}

const W = 1800
const H = 2600
const NS = 'http://www.w3.org/2000/svg'

/** Star index → the form step (1-based count of completed steps) that picks it out. */
const LIGHT_AT = [1, 2, 2, 3, 4, 5, 6, 7, 8]
/** Star index → the screen (0-based) whose answers it stands for. */
export const STAR_SCREEN = LIGHT_AT.map((s) => s - 1)

function hash(s: string) {
  let h = 1779033703 ^ s.length
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return h >>> 0
}

function rng(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

type Constellation = { pts: Pt[]; lines: [number, number][]; mags: number[]; cx: number; cy: number }

/**
 * Three closed figures, one per status, drawn so their lines never cross:
 * an outlined arrow (open now), a blunt-nosed arrow (opening soon), and a linked ring (pipeline).
 * Each role gets its own proportions, tilt and small offsets from its answer fingerprint.
 */
function constellation(fingerprint: string, goal: Goal | null): Constellation {
  const r = rng(hash(fingerprint + (goal ?? 'none')))
  const j = (a: number) => (r() - 0.5) * a
  const cx = 1000 + j(400)
  const cy = 1150 + j(500)
  let pts: Pt[]
  let lines: [number, number][]
  if (goal === 'soon') {
    pts = [[126, -32], [126, 32], [72, 72], [0, 68], [-118, 42], [-132, 0], [-118, -42], [0, -68], [72, -72]]
    lines = pts.map((_, i) => [i, (i + 1) % pts.length] as [number, number])
    lines.push([2, 8])
  } else if (goal === 'pipeline') {
    pts = [[0, -112], [72, -92], [126, -32], [112, 48], [52, 104], [-38, 112], [-112, 66], [-130, -12], [-62, -88]]
    lines = pts.map((_, i) => [i, (i + 1) % pts.length] as [number, number])
    lines.push([0, 5])
  } else {
    pts = [[160, 0], [52, -82], [52, -28], [-50, -28], [-142, -28], [-142, 28], [-50, 28], [52, 28], [52, 82]]
    lines = pts.map((_, i) => [i, (i + 1) % pts.length] as [number, number])
    lines.push([3, 6])
  }
  const a = j(SKY.vary * 0.012)
  const ca = Math.cos(a)
  const sa = Math.sin(a)
  const sx = 1 + j(SKY.vary * 0.008)
  const sy = 1 + j(SKY.vary * 0.01)
  pts = pts.map(([x, y]) => {
    x *= sx
    y *= sy
    return [cx + x * ca - y * sa + j(SKY.vary), cy + x * sa + y * ca + j(SKY.vary)]
  })
  return { pts, lines, mags: pts.map((_, i) => (i === 0 ? 1 : 0.55 + r() * 0.4)), cx, cy }
}

type Key = { lz: number; tx: number; ty: number; rot: number }

/** Uneven zoom steps, a wandering pan and a rotation that swings and settles. New for every scene. */
function cameraPath(con: Constellation): Key[] {
  const R = Math.random
  const inc = Array.from({ length: 8 }, () => 0.5 + R())
  const tot = inc.reduce((s, v) => s + v, 0)
  let acc = 0
  const c = [0, ...inc.map((v) => (acc += v) / tot)]
  return c.map((ck, k) => {
    const fall = 1 - ck
    return {
      lz: lerp(Math.log(SKY.z0), Math.log(SKY.z1), ck),
      tx: lerp(W / 2, con.cx, ck) + (R() - 0.5) * 2 * SKY.wander * fall,
      ty: lerp(H / 2, con.cy, ck) + (R() - 0.5) * 2 * SKY.wander * fall,
      rot: k === 8 ? 0 : (((R() < 0.5 ? -1 : 1) * (0.35 + R() * 0.65) * SKY.rotMax * Math.pow(fall, 0.8)) * Math.PI) / 180,
    }
  })
}

export type SkyInput = {
  /** Completed steps, 0..8: drives the camera, focus and sky dimming. */
  step: number
  /** Per star: picked out of the noise. */
  lit: boolean[]
  /** Per star: its step was answered with "Not decided yet". */
  undecided: boolean[]
  /** The profile is complete: draw the constellation lines. */
  complete: boolean
}

type State = Key & {
  blur: number
  dof: number
  dim: number
  p: number
  lit: number[]
  und: number[]
  drawn: number[]
  dash: number[]
}

type Star = { x: number; y: number; d: number; r: number; o: number; ph: number; sp: number; n: SVGCircleElement }

function el<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>, parent: Element) {
  const e = document.createElementNS(NS, tag)
  for (const k in attrs) e.setAttribute(k, String(attrs[k]))
  parent.appendChild(e)
  return e
}

export class SkyScene {
  private svg: SVGSVGElement
  private thumb: boolean
  private still: boolean
  private con: Constellation
  private path: Key[]
  private stars: Star[] = []
  private lines: { a: number; b: number; n: SVGLineElement }[]
  private cs: { p: Pt; m: number; halo: SVGCircleElement; core: SVGCircleElement; lit: SVGCircleElement }[]
  private cur: State | null = null
  private goal: State | null = null
  private completeAt = -1

  constructor(svg: SVGSVGElement, seed: string, goal: Goal | null, opts: { thumb?: boolean; still?: boolean; fingerprint?: string } = {}) {
    this.svg = svg
    this.thumb = Boolean(opts.thumb)
    this.still = Boolean(opts.still)
    svg.replaceChildren()
    this.con = constellation(opts.fingerprint ?? seed, goal)
    this.path = cameraPath(this.con)
    const r = rng(hash(seed + 'sky'))
    const gStars = el('g', {}, svg)
    const count = this.thumb ? 700 : SKY.stars
    for (let i = 0; i < count; i++) {
      const d = r()
      this.stars.push({
        x: r() * W,
        y: r() * H,
        d,
        r: 0.35 + r() * r() * 1.4,
        o: 0.25 + r() * 0.6,
        ph: r() * 6.28,
        sp: 0.5 + r() * 1.2,
        n: el('circle', { class: 'sky__star' }, gStars),
      })
    }
    const gL = el('g', {}, svg)
    this.lines = this.con.lines.map(([a, b]) => ({ a, b, n: el('line', { class: 'sky__line', 'stroke-linecap': 'round' }, gL) }))
    const gC = el('g', {}, svg)
    this.cs = this.con.pts.map((p, i) => ({
      p,
      m: this.con.mags[i],
      halo: el('circle', { class: 'sky__ink' }, gC),
      core: el('circle', { class: 'sky__star' }, gC),
      lit: el('circle', { class: 'sky__ink' }, gC),
    }))
  }

  private target(input: SkyInput): State {
    const step = Math.max(0, Math.min(8, input.step))
    const k = this.path[step]
    const p = step / 8
    return {
      ...k,
      blur: SKY.blur0 * (1 - p),
      dof: SKY.dof * p,
      dim: lerp(1, SKY.dim, p),
      p,
      lit: input.lit.map((v, i) => (v ? (input.undecided[i] ? 0.3 : 1) : 0)),
      und: input.undecided.map((v) => (v ? 1 : 0)),
      drawn: this.con.lines.map(() => (input.complete ? 1 : 0)),
      dash: this.con.lines.map(([a, b]) => (input.undecided[a] || input.undecided[b] ? 1 : 0)),
    }
  }

  set(input: SkyInput, snap = false) {
    const t = this.target(input)
    if (input.complete && this.goal && this.goal.drawn[0] === 0) this.completeAt = performance.now()
    if (snap || this.still || !this.cur) this.cur = structuredClone(t)
    this.goal = t
  }

  tick(dt: number, now: number) {
    if (!this.cur || !this.goal) return
    const k = 1 - Math.exp(-dt / (SKY.speed / 4))
    const c = this.cur
    const g = this.goal
    for (const key of ['lz', 'tx', 'ty', 'rot', 'blur', 'dof', 'dim', 'p'] as const) c[key] += (g[key] - c[key]) * k
    for (const key of ['lit', 'und', 'dash'] as const) c[key] = c[key].map((v, i) => v + (g[key][i] - v) * k)
    // Lines draw one after another along the figure once the profile is complete.
    c.drawn = c.drawn.map((v, i) => {
      const started = g.drawn[i] === 0 || now - this.completeAt > i * 140
      return started ? v + (g.drawn[i] - v) * k * 1.4 : v
    })
  }

  draw(time: number) {
    const c = this.cur
    if (!c) return
    const box = this.svg.viewBox.baseVal
    const VW = box.width || 400
    const VH = box.height || 300
    // Tall panel: frame the constellation in the open sky above the caption.
    // Short band (phones): keep it small and to the right, clear of the text.
    const band = !this.thumb && VH < 500
    const fx = band ? VW * 0.72 : VW / 2
    const fy = this.thumb ? VH / 2 : band ? VH * 0.42 : VH * 0.4
    const fit = this.thumb ? 0.6 * Math.min(1.25, Math.max(0.55, VW / 560)) : Math.min(1.25, Math.max(0.3, Math.min(VW / 560, VH / 700)))
    const z = Math.exp(c.lz) * fit
    const live = this.thumb || this.still ? 0 : 1
    // A slow idle drift keeps the sky alive between answers.
    const drx = Math.sin(time / 7000) * 10 * live * (1 - 0.6 * c.p)
    const dry = Math.cos(time / 9000) * 8 * live * (1 - 0.6 * c.p)
    const rot = c.rot + Math.sin(time / 11000) * 0.012 * live * (1 - 0.5 * c.p)
    const cos = Math.cos(rot)
    const sin = Math.sin(rot)
    const proj = (x: number, y: number, kd = 1): Pt => {
      const dx = (x - c.tx) * z * kd
      const dy = (y - c.ty) * z * kd
      return [fx + drx * kd + dx * cos - dy * sin, fy + dry * kd + dx * sin + dy * cos]
    }
    const tw = live * SKY.twinkle
    for (const s of this.stars) {
      const kd = 1 + SKY.parallax * (s.d - 0.5)
      const [x, y] = proj(s.x, s.y, kd)
      if (x < -20 || x > VW + 20 || y < -20 || y > VH + 20) {
        s.n.setAttribute('r', '0')
        continue
      }
      const b = c.blur + c.dof * Math.abs(s.d - 0.5) * 2
      const r0 = s.r * SKY.starSize * (0.75 + 0.25 * Math.min(z, 2)) * (0.7 + s.d * 0.6)
      const re = r0 + b * 0.55
      const o = s.o * c.dim * (r0 / re) * (1 - tw * 0.5 * (1 + Math.sin(time * 0.001 * s.sp + s.ph)))
      s.n.setAttribute('cx', x.toFixed(1))
      s.n.setAttribute('cy', y.toFixed(1))
      s.n.setAttribute('r', re.toFixed(2))
      s.n.setAttribute('opacity', Math.max(0.02, o).toFixed(3))
    }
    const P = this.cs.map((s) => proj(...s.p))
    this.cs.forEach((s, i) => {
      const l = c.lit[i]
      const [x, y] = P[i]
      const r0 = (1 + l * 2.4 * s.m) * SKY.cSize * (this.thumb ? 0.85 : 1)
      const re = r0 + c.blur * 0.55
      const f = (r0 * r0) / (re * re)
      for (const n of [s.halo, s.core, s.lit]) {
        n.setAttribute('cx', x.toFixed(1))
        n.setAttribute('cy', y.toFixed(1))
      }
      s.core.setAttribute('r', re.toFixed(2))
      s.core.setAttribute('opacity', ((0.35 + 0.3 * l) * f).toFixed(3))
      s.lit.setAttribute('r', re.toFixed(2))
      s.lit.setAttribute('opacity', (l * f * (1 - 0.5 * c.und[i])).toFixed(3))
      s.halo.setAttribute('r', (re * 3.2).toFixed(2))
      s.halo.setAttribute('opacity', (l * SKY.glow * 0.16 * (1 - c.und[i])).toFixed(3))
    })
    this.lines.forEach((L, i) => {
      const d = c.drawn[i]
      const a = P[L.a]
      const b = P[L.b]
      L.n.setAttribute('x1', a[0].toFixed(1))
      L.n.setAttribute('y1', a[1].toFixed(1))
      L.n.setAttribute('x2', lerp(a[0], b[0], d).toFixed(1))
      L.n.setAttribute('y2', lerp(a[1], b[1], d).toFixed(1))
      L.n.setAttribute('stroke-width', (1.3 + c.blur * 0.5).toFixed(2))
      L.n.setAttribute('opacity', (d > 0.01 ? (0.8 / (1 + c.blur * 0.35)) * (1 - 0.45 * c.dash[i]) : 0).toFixed(3))
      L.n.setAttribute('stroke-dasharray', c.dash[i] > 0.5 ? '3 5' : '')
    })
  }
}
