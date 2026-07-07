'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

export interface PortalProps {
  children: ReactNode
  container?: Element | null
}

export function Portal({ children, container }: PortalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const target = container ?? (typeof document !== 'undefined' ? document.body : null)
  if (!target) return null

  return createPortal(children, target)
}

export default Portal
