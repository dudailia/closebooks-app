'use client'

import { useEffect, useState } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// ReceiptAnimation
// Demo jaw-drop component — animated receipt parsing sequence
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  trigger: boolean
  documentTitle: string
  amount: number
  category: string
  merchantName: string
  onComplete: () => void
}

type Phase = 0 | 1 | 2 | 3 | 4 | 5

const CATEGORY_ICONS: Record<string, string> = {
  'Meals & Entertainment': '🍽️',
  'Office Supplies': '📎',
  'Travel': '✈️',
  'Software': '💻',
  'Marketing': '📢',
  'Utilities': '⚡',
  'Miscellaneous': '📦',
}

export default function ReceiptAnimation({
  trigger, documentTitle, amount, category, merchantName, onComplete,
}: Props) {
  const [phase, setPhase] = useState<Phase>(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!trigger) {
      setPhase(0)
      setVisible(false)
      return
    }

    setVisible(true)
    setPhase(1)

    const t2 = setTimeout(() => setPhase(2), 200)   // shimmer parsing
    const t3 = setTimeout(() => setPhase(3), 700)   // fields appear
    const t4 = setTimeout(() => setPhase(4), 1200)  // matched badge + glow
    const t5 = setTimeout(() => setPhase(5), 1600)  // settled

    const tDone = setTimeout(() => {
      onComplete()
      setVisible(false)
      setPhase(0)
    }, 3200)

    return () => {
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
      clearTimeout(t5)
      clearTimeout(tDone)
    }
  }, [trigger, onComplete])

  if (!visible) return null

  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)

  const today = new Date().toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })

  const catIcon = CATEGORY_ICONS[category] ?? '📦'

  return (
    <>
      {/* Inject keyframes */}
      <style>{`
        @keyframes ra-slide-in {
          from { transform: translateX(60px); opacity: 0; }
          to   { transform: translateX(0);   opacity: 1; }
        }
        @keyframes ra-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes ra-fade-up {
          from { transform: translateY(8px); opacity: 0; }
          to   { transform: translateY(0);   opacity: 1; }
        }
        @keyframes ra-glow-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
          50%       { box-shadow: 0 0 0 16px rgba(34,197,94,0.18); }
        }
        @keyframes ra-badge-pop {
          0%   { transform: scale(0.5); opacity: 0; }
          70%  { transform: scale(1.12); }
          100% { transform: scale(1);   opacity: 1; }
        }
        @keyframes ra-backdrop-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={onComplete}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(26,23,20,0.45)',
          zIndex: 9000,
          animation: 'ra-backdrop-in 0.2s ease forwards',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Card */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: 380,
            backgroundColor: '#ffffff',
            borderRadius: 20,
            padding: 28,
            boxShadow: '0 24px 60px rgba(0,0,0,0.22)',
            animation: phase >= 1
              ? 'ra-slide-in 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards'
              : undefined,
            ...(phase === 4 ? { animation: 'ra-glow-pulse 0.5s ease' } : {}),
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Shimmer overlay — phase 2 only */}
          {phase === 2 && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 20,
                backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(184,115,74,0.12) 40%, rgba(184,115,74,0.22) 50%, rgba(184,115,74,0.12) 60%, transparent 100%)',
                backgroundSize: '200% 100%',
                animation: 'ra-shimmer 0.9s ease infinite',
                zIndex: 1,
                pointerEvents: 'none',
              }}
            />
          )}

          {/* Top label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              backgroundColor: phase >= 4 ? '#dcfce7' : '#fdf4ff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background-color 0.4s',
            }}>
              {phase >= 4 ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7e22ce" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z"/>
                  <line x1="8" y1="8" x2="16" y2="8"/>
                  <line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
              )}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1a1714' }}>
                {phase === 2
                  ? 'Parsing document…'
                  : phase >= 4
                  ? 'Document matched!'
                  : 'New document received'}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: '#6b6560' }}>{documentTitle}</p>
            </div>

            {/* Matched badge */}
            {phase >= 4 && (
              <span
                style={{
                  marginLeft: 'auto',
                  padding: '3px 12px',
                  borderRadius: 9999,
                  fontSize: 12,
                  fontWeight: 700,
                  backgroundColor: '#dcfce7',
                  color: '#166534',
                  animation: 'ra-badge-pop 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards',
                }}
              >
                ✓ Matched
              </span>
            )}
          </div>

          {/* Divider */}
          <div style={{ height: 1, backgroundColor: '#e8e0d4', marginBottom: 20 }} />

          {/* Parsed fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <ParsedField
              label="Merchant"
              value={merchantName}
              visible={phase >= 3}
              delay={0}
            />
            <ParsedField
              label="Amount"
              value={formattedAmount}
              visible={phase >= 3}
              delay={100}
              valueStyle={{ fontWeight: 800, fontSize: 22, color: '#1a1714' }}
            />
            <ParsedField
              label="Date"
              value={today}
              visible={phase >= 3}
              delay={200}
            />
            <ParsedField
              label="Category"
              value={`${catIcon}  ${category}`}
              visible={phase >= 3}
              delay={300}
            />
          </div>

          {/* Confidence bar — phase 4+ */}
          {phase >= 4 && (
            <div
              style={{
                marginTop: 20,
                padding: '12px 16px',
                backgroundColor: '#f0fdf4',
                borderRadius: 12,
                border: '1px solid #bbf7d0',
                animation: 'ra-fade-up 0.3s ease forwards',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#15803d' }}>Match confidence</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#15803d' }}>97%</span>
              </div>
              <div style={{ height: 6, backgroundColor: '#dcfce7', borderRadius: 9999, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: '97%',
                    backgroundColor: '#22c55e',
                    borderRadius: 9999,
                    transition: 'width 0.6s cubic-bezier(0.34,1.56,0.64,1)',
                  }}
                />
              </div>
            </div>
          )}

          {/* Click-to-dismiss hint */}
          {phase >= 5 && (
            <button
              onClick={onComplete}
              style={{
                marginTop: 18,
                width: '100%',
                padding: '10px 0',
                borderRadius: 10,
                border: '1px solid #e8e0d4',
                backgroundColor: '#faf8f4',
                color: '#6b6560',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                animation: 'ra-fade-up 0.25s ease forwards',
              }}
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </>
  )
}

// ─── Helper: animated field ───────────────────────────────────────────────────

function ParsedField({
  label, value, visible, delay, valueStyle,
}: {
  label: string
  value: string
  visible: boolean
  delay: number
  valueStyle?: React.CSSProperties
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        transition: `opacity 0.3s ease ${delay}ms, transform 0.3s ease ${delay}ms`,
      }}
    >
      <span style={{ fontSize: 12, color: '#6b6560', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1714', ...valueStyle }}>{value}</span>
    </div>
  )
}
