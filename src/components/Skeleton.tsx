'use client'

// ─── Skeleton primitives — shimmer loading states ─────────────────────────────
// Uses the .cb-skeleton CSS class defined in globals.css
// No external dependencies. Safe for SSR (no window/localStorage access).

interface SkeletonBlockProps {
  width?: string | number
  height?: number
  borderRadius?: number
  style?: React.CSSProperties
}

export function SkeletonBlock({
  width = '100%',
  height = 20,
  borderRadius = 6,
  style = {},
}: SkeletonBlockProps) {
  return (
    <div
      className="cb-skeleton"
      style={{ width, height, borderRadius, flexShrink: 0, ...style }}
    />
  )
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div style={{
      backgroundColor: '#fff',
      border: '1px solid #e8e0d4',
      borderRadius: 12,
      padding: 24,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      <SkeletonBlock height={22} width="55%" />
      <SkeletonBlock height={36} width="40%" borderRadius={4} />
      {Array.from({ length: lines - 2 }).map((_, i) => (
        <SkeletonBlock key={i} height={14} width={`${85 - i * 18}%`} />
      ))}
    </div>
  )
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  const widths = ['28%', '20%', '18%', '16%', '12%', '6%']
  return (
    <div style={{
      backgroundColor: '#fff',
      border: '1px solid #e8e0d4',
      borderRadius: 12,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 20px',
        borderBottom: '1px solid #e8e0d4',
        backgroundColor: '#f8f5f0',
        display: 'flex',
        gap: 16,
        alignItems: 'center',
      }}>
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonBlock key={i} height={12} width={widths[i] ?? '15%'} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          style={{
            padding: '12px 20px',
            borderBottom: r < rows - 1 ? '1px solid #f5f0ea' : 'none',
            display: 'flex',
            gap: 16,
            alignItems: 'center',
          }}
        >
          {Array.from({ length: cols }).map((_, c) => (
            <SkeletonBlock key={c} height={14} width={widths[c] ?? '15%'} />
          ))}
        </div>
      ))}
    </div>
  )
}

// Full-page skeleton for the main dashboard page
export function DashboardPageSkeleton() {
  return (
    <div className="page-content" style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
      <SkeletonBlock height={32} width={240} style={{ marginBottom: 8 }} />
      <SkeletonBlock height={16} width={200} style={{ marginBottom: 32 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 32 }}>
        <SkeletonCard lines={3} />
        <SkeletonCard lines={3} />
        <SkeletonCard lines={3} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
        <SkeletonTable rows={6} cols={5} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SkeletonCard lines={4} />
          <SkeletonCard lines={4} />
        </div>
      </div>
    </div>
  )
}

// Grid of client cards skeleton
export function ClientCardsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: 16 }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} lines={4} />
      ))}
    </div>
  )
}

// Stats row skeleton
export function StatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${count},1fr)`, gap: 16, marginBottom: 32 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ backgroundColor: '#fff', border: '1px solid #e8e0d4', borderRadius: 12, padding: '20px 24px' }}>
          <SkeletonBlock height={13} width="50%" style={{ marginBottom: 10 }} />
          <SkeletonBlock height={32} width="60%" style={{ marginBottom: 6 }} />
          <SkeletonBlock height={12} width="70%" />
        </div>
      ))}
    </div>
  )
}
