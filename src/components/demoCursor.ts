/**
 * A scripted demo cursor: glides to an element, clicks it, or types into it.
 * Every action checks `alive()` first, so a stopped run ends at the next step.
 * The cursor element uses the `.demo-cursor` styles in src/App.css.
 */

export const delay = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms))

export type DemoCursor = {
  /** Shows the cursor at the centre of an element (usually the demo button). */
  show: (from: Element) => void
  hide: () => void
  glide: (target: HTMLElement) => Promise<boolean>
  click: (target: HTMLElement) => Promise<boolean>
  /** Types text into an input or textarea, by character or by word. */
  type: (target: HTMLInputElement | HTMLTextAreaElement, text: string, by?: 'char' | 'word') => Promise<boolean>
  /** Waits for an element to appear (after a state change), or null on timeout or stop. */
  find: <T extends HTMLElement = HTMLElement>(selector: string, timeoutMs?: number) => Promise<T | null>
}

export function demoCursor(cursor: HTMLElement | null, alive: () => boolean): DemoCursor {
  const moveTo = (rect: DOMRect) => {
    if (cursor) cursor.style.transform = `translate3d(${rect.left + rect.width / 2}px, ${rect.top + rect.height / 2}px, 0)`
  }

  const glide = async (target: HTMLElement) => {
    if (!alive()) return false
    const before = target.getBoundingClientRect()
    if (before.top < 28 || before.bottom > window.innerHeight - 28) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
      await delay(420)
    }
    if (!alive()) return false
    moveTo(target.getBoundingClientRect())
    await delay(cursor ? 460 : 0)
    return alive()
  }

  return {
    show(from) {
      if (!cursor) return
      cursor.style.transition = 'none'
      moveTo(from.getBoundingClientRect())
      cursor.classList.add('is-visible')
      requestAnimationFrame(() => {
        cursor.style.transition = ''
      })
    },
    hide() {
      cursor?.classList.remove('is-visible', 'is-down')
    },
    glide,
    async click(target) {
      if (!(await glide(target))) return false
      cursor?.classList.add('is-down')
      target.click()
      await delay(150)
      cursor?.classList.remove('is-down')
      return alive()
    },
    async type(target, text, by = 'char') {
      if (!(await glide(target))) return false
      target.focus()
      const proto = target instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
      const setValue = Object.getOwnPropertyDescriptor(proto, 'value')?.set
      const ends: number[] = []
      if (by === 'word') {
        for (let i = 1; i <= text.length; i += 1) if (i === text.length || text[i] === ' ') ends.push(i)
      } else for (let i = 1; i <= text.length; i += 1) ends.push(i)
      for (const end of ends) {
        if (!alive()) return false
        setValue?.call(target, text.slice(0, end))
        target.dispatchEvent(new Event('input', { bubbles: true }))
        await delay(by === 'word' ? 62 : text[end - 1] === ' ' ? 91 : 58)
      }
      await delay(220)
      return alive()
    },
    async find<T extends HTMLElement = HTMLElement>(selector: string, timeoutMs = 3000) {
      const until = Date.now() + timeoutMs
      while (alive() && Date.now() < until) {
        const el = document.querySelector<T>(selector)
        if (el) return el
        await delay(50)
      }
      return null
    },
  }
}
