import { useEffect, useLayoutEffect, useRef } from 'react'
import type { Goal } from '../form/schema'
import { SkyScene, type SkyInput } from '../sky/scene'
import './Sky.css'

type Props = SkyInput & {
  seed: string
  goal: Goal | null
  /** A small, static rendering (role card): no drift, no twinkle, snaps to its state. */
  thumb?: boolean
  className?: string
}

/** The night sky. Decorative: the caption next to it carries the meaning in text. */
export function Sky({ seed, goal, step, lit, undecided, complete, thumb, className }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const sceneRef = useRef<SkyScene | null>(null)
  const inputRef = useRef<SkyInput>({ step, lit, undecided, complete })
  useLayoutEffect(() => {
    inputRef.current = { step, lit, undecided, complete }
  })

  // A new scene per role identity (seed) and status; the camera path is fresh each time.
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const fit = () => {
      const r = svg.getBoundingClientRect()
      svg.setAttribute('viewBox', `0 0 ${Math.max(1, Math.round(r.width))} ${Math.max(1, Math.round(r.height))}`)
    }
    fit()
    const scene = new SkyScene(svg, seed, goal, { thumb, still: reduce })
    scene.set(inputRef.current, true)
    sceneRef.current = scene
    let frame = 0
    let last = performance.now()
    const loop = (now: number) => {
      scene.tick(Math.min(64, now - last), now)
      last = now
      scene.draw(now)
      if (!thumb && !reduce) frame = requestAnimationFrame(loop)
    }
    if (thumb || reduce) {
      scene.draw(0)
    } else {
      frame = requestAnimationFrame(loop)
    }
    const ro = new ResizeObserver(() => {
      fit()
      scene.draw(performance.now())
    })
    ro.observe(svg)
    return () => {
      cancelAnimationFrame(frame)
      ro.disconnect()
      sceneRef.current = null
    }
  }, [seed, goal, thumb])

  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return
    scene.set({ step, lit, undecided, complete })
    if (thumb || window.matchMedia('(prefers-reduced-motion: reduce)').matches) scene.draw(0)
  }, [step, lit, undecided, complete, thumb])

  return <svg ref={svgRef} className={['sky', className].filter(Boolean).join(' ')} aria-hidden="true" focusable="false" />
}
