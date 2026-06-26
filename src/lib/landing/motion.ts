import type { Transition, Variants } from 'framer-motion'

// Canonical easing — the only place these literals are allowed to live.
export const ease = {
  out: [0.16, 1, 0.3, 1] as [number, number, number, number],
  inOut: [0.65, 0, 0.35, 1] as [number, number, number, number],
}

export const duration = { fast: 0.3, base: 0.5, slow: 0.7 } as const
export const stagger = { tight: 0.06, base: 0.1, loose: 0.14 } as const
export const distance = { sm: 12, md: 20, lg: 40 } as const

export const transitionBase: Transition = { duration: duration.base, ease: ease.out }

export function fadeUp(delay = 0, dist: number = distance.md): Variants {
  return {
    hidden: { opacity: 0, y: dist },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: duration.slow, ease: ease.out, delay },
    },
  }
}
