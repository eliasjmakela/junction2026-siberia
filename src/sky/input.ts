import { SCREENS, type Values } from '../form/schema'
import { STAR_SCREEN } from './scene'

/** Which stars are picked out, and which stand for steps left "Not decided yet". */
export function skyStars(values: Values, isDone: (screenIndex: number) => boolean) {
  const undecidedScreen = SCREENS.map((s) => s.fields.some((f) => values[f.id]?.undecided))
  return {
    lit: STAR_SCREEN.map((i) => isDone(i)),
    undecided: STAR_SCREEN.map((i) => isDone(i) && undecidedScreen[i]),
  }
}

export function newSeed() {
  return Math.random().toString(36).slice(2, 10)
}
