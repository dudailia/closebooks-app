'use client'

import type { InputSize } from '@/components/ui/inputStyles'

export function InputSpinner({ size }: { size: InputSize }) {
  const dim = size === 'sm' ? 14 : size === 'lg' ? 18 : 16
  return (
    <svg
      width={dim}
      height={dim}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="animate-spin"
      style={{ flexShrink: 0, color: 'var(--text-secondary)' }}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="32"
        strokeDashoffset="12"
        opacity="0.35"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}
