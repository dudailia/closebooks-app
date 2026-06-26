'use client'
import { MotionConfig } from 'framer-motion'

// Client boundary so server components (page.tsx, PublicShell) can apply the
// global reduced-motion policy without rendering MotionConfig directly.
export default function PublicMotion({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}
