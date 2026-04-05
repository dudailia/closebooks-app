'use client'

interface VerifiedBadgeProps {
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

const SIZES = {
  sm: { shield: 16, fontSize: '11px', gap: 4, px: 8, py: 3 },
  md: { shield: 20, fontSize: '13px', gap: 6, px: 10, py: 4 },
  lg: { shield: 28, fontSize: '15px', gap: 8, px: 14, py: 6 },
}

export default function VerifiedBadge({ size = 'md', showLabel = true }: VerifiedBadgeProps) {
  const s = SIZES[size]

  return (
    <span
      className="verified-badge inline-flex items-center rounded-full font-semibold select-none"
      style={{
        gap: s.gap,
        paddingLeft: s.px,
        paddingRight: s.px,
        paddingTop: s.py,
        paddingBottom: s.py,
        backgroundColor: '#e8f0e6',
        border: '1px solid #c4d9c0',
        color: '#2d5a27',
        fontSize: s.fontSize,
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
      }}
    >
      {/* Shimmer layer */}
      <span
        aria-hidden
        className="badge-shimmer"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.55) 50%, transparent 60%)',
          backgroundSize: '200% 100%',
          backgroundPosition: '-100% 0',
          pointerEvents: 'none',
        }}
      />

      {/* Shield + check SVG */}
      <svg
        width={s.shield}
        height={s.shield}
        viewBox="0 0 24 24"
        fill="none"
        style={{ flexShrink: 0, position: 'relative' }}
      >
        <path
          d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.25C16.5 22.15 20 17.25 20 12V6l-8-4z"
          fill="#2d5a27"
          fillOpacity="0.15"
          stroke="#2d5a27"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path
          d="M8.5 12l2.5 2.5 5-5"
          stroke="#2d5a27"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {showLabel && (
        <span style={{ position: 'relative' }}>CloseBooks Verified</span>
      )}

      <style>{`
        .verified-badge:hover .badge-shimmer {
          animation: badge-shimmer-anim 0.7s ease forwards;
        }
        @keyframes badge-shimmer-anim {
          from { background-position: -100% 0; }
          to   { background-position: 200% 0; }
        }
      `}</style>
    </span>
  )
}
