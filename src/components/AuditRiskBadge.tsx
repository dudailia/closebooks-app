'use client'

interface AuditRiskBadgeProps {
  risk: 'low' | 'medium' | 'high' | 'critical'
  showBar?: boolean
  score?: number // 0-100 documentation completeness
}

const RISK_CONFIG = {
  low:      { label: 'Low Risk',      bg: '#dcfce7', text: '#15803d', bar: '#22c55e' },
  medium:   { label: 'Medium Risk',   bg: '#fef9c3', text: '#854d0e', bar: '#eab308' },
  high:     { label: 'High Risk',     bg: '#fee2e2', text: '#991b1b', bar: '#ef4444' },
  critical: { label: 'Critical Risk', bg: '#fdf2f8', text: '#86198f', bar: '#d946ef' },
}

export default function AuditRiskBadge({ risk, showBar = false, score }: AuditRiskBadgeProps) {
  const cfg = RISK_CONFIG[risk]

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '6px', minWidth: showBar ? '120px' : 'auto' }}>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: '3px 10px',
          borderRadius: '9999px',
          fontSize: '12px',
          fontWeight: 600,
          backgroundColor: cfg.bg,
          color: cfg.text,
          whiteSpace: 'nowrap',
        }}
      >
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: cfg.bar,
            flexShrink: 0,
          }}
        />
        {cfg.label}
      </span>

      {showBar && score !== undefined && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div
            style={{
              height: '5px',
              borderRadius: '3px',
              backgroundColor: '#e8e0d4',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${score}%`,
                borderRadius: '3px',
                backgroundColor: cfg.bar,
                transition: 'width 0.6s ease',
              }}
            />
          </div>
          <span style={{ fontSize: '11px', color: '#6b6560' }}>{score}% documented</span>
        </div>
      )}
    </div>
  )
}
