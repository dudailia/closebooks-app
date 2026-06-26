'use client'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { fadeUp, distance as distanceTokens } from '@/lib/landing/motion'

type RevealProps = HTMLMotionProps<'div'> & {
  delay?: number
  distance?: number
}

export function Reveal({
  delay = 0,
  distance = distanceTokens.md,
  children,
  ...rest
}: RevealProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.25, margin: '-80px' }}
      variants={fadeUp(delay, distance)}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

export default Reveal
