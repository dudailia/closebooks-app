'use client'
import { useEffect, useRef, useState } from 'react'
import { animate, useInView } from 'framer-motion'

interface Props {
  to: number
  suffix?: string
  prefix?: string
  durationMs?: number
  decimals?: number
}

export default function StatCounter({
  to,
  suffix = '',
  prefix = '',
  durationMs = 1400,
  decimals = 0,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.4 })
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!inView) return
    const controls = animate(0, to, {
      duration: durationMs / 1000,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setValue(v),
    })
    return () => controls.stop()
  }, [inView, to, durationMs])

  const formatted =
    decimals > 0
      ? value.toFixed(decimals)
      : Math.round(value).toLocaleString('en-US')

  return (
    <span ref={ref}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  )
}
