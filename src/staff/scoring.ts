import { useCallback, useEffect, useRef, useState } from 'react'
import { requestAssessment } from '../event/api'
import { pairKey, saveAssessment, setKeyOf, type Application, type Assessment, type Listing } from '../event/store'

const CONCURRENCY = 3

/** Pairs being scored right now, shared across renders and StrictMode re-mounts. */
const inFlight = new Set<string>()
/** Pairs whose input could not be scored (no answers); skipped until "Score again". */
const unscorable = new Set<string>()

export type Progress = Record<string, { total: number; done: number }>

export function isCurrent(a: Assessment | undefined, listing: Listing): a is Assessment {
  return Boolean(a && a.setKey === setKeyOf(listing.set))
}

export function isScoring(applicationId: string, listingId: string) {
  return inFlight.has(pairKey(applicationId, listingId))
}

/**
 * Scores applications for a listing with a small worker pool. Results go
 * straight to the event store, so they survive leaving the page; progress is
 * component state and is only updated while the component is mounted.
 */
export function useScoring() {
  const [progress, setProgress] = useState<Progress>({})
  const alive = useRef(true)

  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  const report = useCallback((listingId: string, total: number, done: number | null) => {
    if (!alive.current) return
    setProgress((p) => {
      const next = { ...p }
      if (done === null) delete next[listingId]
      else next[listingId] = { total, done }
      return next
    })
  }, [])

  const score = useCallback(
    async (listing: Listing, apps: Application[], force = false) => {
      if (force) apps.forEach((a) => unscorable.delete(pairKey(a.id, listing.id)))
      const todo = apps.filter((a) => {
        const key = pairKey(a.id, listing.id)
        return !inFlight.has(key) && !unscorable.has(key)
      })
      if (!todo.length) return
      todo.forEach((a) => inFlight.add(pairKey(a.id, listing.id)))
      const setKey = setKeyOf(listing.set)
      const queue = [...todo]
      let done = 0
      report(listing.id, todo.length, 0)

      const worker = async () => {
        for (let app = queue.shift(); app; app = queue.shift()) {
          const key = pairKey(app.id, listing.id)
          try {
            const result = await requestAssessment(listing, app.answers[listing.id] ?? {})
            if (result) {
              saveAssessment({
                applicationId: app.id,
                listingId: listing.id,
                scores: result.scores,
                source: result.source,
                model: result.model,
                assessedAt: new Date().toISOString(),
                setKey,
              })
            } else unscorable.add(key)
          } catch {
            unscorable.add(key)
          } finally {
            inFlight.delete(key)
            done += 1
            report(listing.id, todo.length, done)
          }
        }
      }

      await Promise.all(Array.from({ length: Math.min(CONCURRENCY, todo.length) }, worker))
      report(listing.id, todo.length, null)
    },
    [report],
  )

  return { progress, score }
}
