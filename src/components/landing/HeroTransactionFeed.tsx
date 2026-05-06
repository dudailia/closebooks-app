'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

interface Tx {
  vendor: string
  amount: number
  category: string
  date: string
}

const TXS: Tx[] = [
  { vendor: 'Amazon AWS',       amount: 412.09, category: 'Cloud Infrastructure', date: 'Apr 19' },
  { vendor: 'Notion Labs',      amount: 20.00,  category: 'Software',             date: 'Apr 15' },
  { vendor: 'Stripe',           amount: 2.90,   category: 'Transaction Fees',     date: 'Apr 16' },
  { vendor: 'Starbucks',        amount: 6.75,   category: 'Meals',                date: 'Apr 16' },
  { vendor: 'DoorDash',         amount: 38.12,  category: 'Meals',                date: 'Apr 17' },
  { vendor: 'Uber',             amount: 22.80,  category: 'Travel',               date: 'Apr 18' },
  { vendor: 'Linear',           amount: 48.00,  category: 'Software',             date: 'Apr 19' },
  { vendor: 'Google Ads',       amount: 280.00, category: 'Marketing',            date: 'Apr 20' },
]

const VENDOR_GLYPH: Record<string, string> = {
  'Amazon AWS': 'AW',
  'Notion Labs': 'N',
  'Stripe': 'S',
  'Starbucks': 'SB',
  'DoorDash': 'DD',
  'Uber': 'U',
  'Linear': 'L',
  'Google Ads': 'G',
}

function Glyph({ label, highlight }: { label: string; highlight: boolean }) {
  return (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        flexShrink: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-sans)',
        fontWeight: 600,
        fontSize: 12,
        letterSpacing: '-0.02em',
        color: highlight ? '#00110A' : '#888888',
        background: highlight
          ? 'linear-gradient(135deg, #00C853 0%, #00B368 100%)'
          : 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
        border: `1px solid ${highlight ? 'rgba(0,217,126,0.4)' : 'rgba(255,255,255,0.08)'}`,
        transition: 'background 300ms, color 300ms, border-color 300ms',
      }}
    >
      {label}
    </div>
  )
}

type CardState = 'incoming' | 'focusing' | 'assembled' | 'exiting'

function TxCard({
  tx,
  state,
  index,
}: {
  tx: Tx
  state: CardState
  index: number
}) {
  const categorized = state === 'assembled'
  const focusing = state === 'focusing'

  // Position depends on state
  const x = state === 'incoming' ? 200 : state === 'exiting' ? -200 : 0
  const y = state === 'assembled' ? 32 + index * 56 : 0
  const scale = state === 'assembled' ? 0.94 : 1
  const opacity =
    state === 'incoming' ? 0 : state === 'exiting' ? 0 : state === 'focusing' ? 1 : 0.9

  return (
    <motion.div
      layout
      initial={false}
      animate={{ x, y, scale, opacity }}
      transition={{
        type: 'spring',
        stiffness: state === 'assembled' ? 180 : 260,
        damping: state === 'assembled' ? 22 : 28,
        mass: 0.8,
      }}
      style={{
        position: 'absolute',
        top: 140,
        left: '50%',
        marginLeft: state === 'assembled' ? -180 : -180,
        width: 360,
        padding: '12px 14px',
        borderRadius: 12,
        backgroundColor: '#0f0f0f',
        border: focusing
          ? '1px solid rgba(0,217,126,0.4)'
          : '1px solid rgba(255,255,255,0.07)',
        boxShadow: focusing
          ? '0 12px 48px rgba(0,217,126,0.15), 0 0 0 1px rgba(0,217,126,0.18)'
          : state === 'assembled'
            ? '0 4px 14px rgba(0,0,0,0.45)'
            : '0 16px 40px rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <Glyph label={VENDOR_GLYPH[tx.vendor] ?? '?'} highlight={categorized || focusing} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: 10,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 13,
              fontWeight: 500,
              color: '#FAFAFA',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {tx.vendor}
          </p>
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              fontWeight: 500,
              color: '#FF4444',
              fontVariantNumeric: 'tabular-nums',
              flexShrink: 0,
            }}
          >
            −${tx.amount.toFixed(2)}
          </p>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 4,
            gap: 10,
          }}
        >
          <span
            style={{
              fontSize: 11,
              color: categorized || focusing ? '#00C853' : '#444444',
              fontWeight: 500,
              transition: 'color 300ms',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {categorized || focusing ? tx.category : 'Analyzing…'}
          </span>
          <span
            style={{
              fontSize: 10,
              fontFamily: 'var(--font-mono)',
              color: '#444444',
              flexShrink: 0,
            }}
          >
            {tx.date}
          </span>
        </div>
      </div>
      {/* Status glyph */}
      <div
        style={{
          width: 22,
          height: 22,
          flexShrink: 0,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 999,
          position: 'relative',
          backgroundColor: categorized
            ? 'rgba(0,217,126,0.16)'
            : focusing
              ? 'rgba(0,217,126,0.1)'
              : 'rgba(255,255,255,0.06)',
          border: `1px solid ${
            categorized ? 'rgba(0,217,126,0.5)' : focusing ? 'rgba(0,217,126,0.3)' : 'rgba(255,255,255,0.08)'
          }`,
          transition: 'background-color 260ms, border-color 260ms',
        }}
      >
        {categorized || focusing ? (
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6.2l2.3 2.3 4.7-5" stroke="#00C853" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <span style={{ fontSize: 11, color: '#444444', fontWeight: 600 }}>?</span>
        )}
        {focusing && (
          <motion.span
            aria-hidden
            initial={{ scale: 1, opacity: 0.9 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut', repeat: Infinity, repeatDelay: 0.2 }}
            style={{
              position: 'absolute',
              inset: -2,
              borderRadius: 999,
              border: '2px solid rgba(0,217,126,0.45)',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
    </motion.div>
  )
}

export default function HeroTransactionFeed() {
  const reduced = useReducedMotion()
  const [focusIdx, setFocusIdx] = useState(0)
  const [cycle, setCycle] = useState(0)

  useEffect(() => {
    if (reduced) return
    if (focusIdx >= TXS.length) {
      const t = setTimeout(() => {
        setCycle((c) => c + 1)
        setFocusIdx(0)
      }, 1800)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setFocusIdx((i) => i + 1), 1100)
    return () => clearTimeout(t)
  }, [focusIdx, reduced])

  // If reduced motion, show the final assembled state only
  if (reduced) {
    return (
      <div style={{ position: 'relative', width: '100%', height: 560 }}>
        <AssembledLabel />
        {TXS.map((tx, i) => (
          <TxCard key={tx.vendor} tx={tx} state="assembled" index={i} />
        ))}
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: 560 }}>
      {/* Soft ambient gradient behind cards */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(60% 50% at 50% 40%, rgba(0,217,126,0.08), transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <AssembledLabel />
      <AnimatePresence mode="sync">
        {TXS.map((tx, i) => {
          const state: CardState =
            i < focusIdx ? 'assembled' : i === focusIdx ? 'focusing' : 'incoming'
          return <TxCard key={`${cycle}-${tx.vendor}`} tx={tx} state={state} index={i} />
        })}
      </AnimatePresence>
    </div>
  )
}

function AssembledLabel() {
  return (
    <div
      style={{
        position: 'absolute',
        top: 28,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 12px',
        borderRadius: 999,
        backgroundColor: 'rgba(0,217,126,0.08)',
        border: '1px solid rgba(0,217,126,0.24)',
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: '0.02em',
        color: '#00C853',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <motion.span
        aria-hidden
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          width: 6,
          height: 6,
          borderRadius: 999,
          backgroundColor: '#00C853',
        }}
      />
      Real-time AI categorization
    </div>
  )
}
