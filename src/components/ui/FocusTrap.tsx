'use client'

import { useEffect, useRef, type ReactNode, type Ref } from 'react'
import { getFocusableElements } from '@/components/ui/modalStack'

export interface FocusTrapProps {
  active?: boolean
  children: ReactNode
  initialFocus?: 'first' | 'container'
  returnFocus?: boolean
  className?: string
  style?: React.CSSProperties
}

export function FocusTrap({
  active = true,
  children,
  initialFocus = 'first',
  returnFocus = true,
  className,
  style,
}: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!active) return

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null

    const container = containerRef.current
    if (!container) return

    if (initialFocus === 'container') {
      container.focus()
    } else {
      const focusable = getFocusableElements(container)
      ;(focusable[0] ?? container).focus()
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Tab' || !containerRef.current) return

      const focusable = getFocusableElements(containerRef.current)
      if (focusable.length === 0) {
        event.preventDefault()
        containerRef.current.focus()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const activeEl = document.activeElement

      if (event.shiftKey) {
        if (activeEl === first || activeEl === containerRef.current) {
          event.preventDefault()
          last.focus()
        }
        return
      }

      if (activeEl === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (returnFocus && previousFocusRef.current?.focus) {
        previousFocusRef.current.focus()
      }
    }
  }, [active, initialFocus, returnFocus])

  return (
    <div
      ref={containerRef as Ref<HTMLDivElement>}
      tabIndex={-1}
      className={className}
      style={style}
    >
      {children}
    </div>
  )
}

export default FocusTrap
