'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'

// ---------------------------------------------------------------------------
// Count-up hook
// ---------------------------------------------------------------------------
function useCountUp(target: number, duration: number = 1400) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    let startTime: number | null = null
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      // Cubic ease-out
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.floor(eased * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration])
  return value
}

// ---------------------------------------------------------------------------
// Sparkline SVG
// ---------------------------------------------------------------------------
function Sparkline() {
  const data = [210, 240, 228, 265, 290, 278, 310, 295, 340, 320, 380, 365, 410, 395, 430, 420, 460, 440, 475, 460, 490, 510, 495, 520, 505, 540, 530, 555, 570, 590]
  const w = 120, h = 40
  const min = Math.min(...data)
  const max = Math.max(...data)
  const scaleY = (v: number) => h - ((v - min) / (max - min)) * h
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${scaleY(v)}`).join(' ')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      <polyline
        points={points}
        fill="none"
        stroke="white"
        strokeWidth={1.5}
        strokeOpacity={0.7}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Transaction rows
// ---------------------------------------------------------------------------
const TRANSACTIONS = [
  { date: 'Nov 30', desc: 'ADP · Payroll', amount: -12400, category: 'Payroll' },
  { date: 'Nov 29', desc: 'Stripe · Revenue', amount: 8500, category: 'Revenue' },
  { date: 'Nov 28', desc: 'Wells Fargo · Rent', amount: -4200, category: 'Rent' },
  { date: 'Nov 27', desc: 'Mesa Supplies', amount: -3847, category: 'Materials' },
  { date: 'Nov 26', desc: 'Stripe · Revenue', amount: 6200, category: 'Revenue' },
  { date: 'Nov 25', desc: 'Office Depot', amount: -247, category: 'Office' },
  { date: 'Nov 24', desc: 'Chase · Interest', amount: -180, category: 'Bank Fees' },
  { date: 'Nov 22', desc: 'AT&T Business', amount: -340, category: 'Utilities' },
  { date: 'Nov 21', desc: 'Stripe · Revenue', amount: 11400, category: 'Revenue' },
  { date: 'Nov 20', desc: 'Insurance Premium', amount: -1200, category: 'Insurance' },
]

// ---------------------------------------------------------------------------
// Revenue vs Expenses Chart
// ---------------------------------------------------------------------------
const CHART_MONTHS = ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov']
const REVENUE_DATA = [98, 104, 112, 89, 127, 143, 119, 134, 128, 147, 122, 127]
const EXPENSE_DATA = [72, 78, 85, 71, 89, 94, 82, 91, 84, 98, 79, 87]

function RevenueChart() {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; idx: number } | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const W = 1000, H = 220
  const padL = 52, padR = 16, padT = 10, padB = 36
  const chartW = W - padL - padR
  const chartH = H - padT - padB
  const maxVal = 200

  const xPos = (i: number) => padL + (i / (CHART_MONTHS.length - 1)) * chartW
  const yPos = (v: number) => padT + chartH - (v / maxVal) * chartH

  const revPoints = REVENUE_DATA.map((v, i) => `${xPos(i)},${yPos(v)}`).join(' ')
  const expPoints = EXPENSE_DATA.map((v, i) => `${xPos(i)},${yPos(v)}`).join(' ')

  const revPoly = `${xPos(0)},${yPos(0)} ${revPoints} ${xPos(REVENUE_DATA.length - 1)},${yPos(0)}`
  const expPoly = `${xPos(0)},${yPos(0)} ${expPoints} ${xPos(EXPENSE_DATA.length - 1)},${yPos(0)}`

  const yTicks = [0, 50, 100, 150, 200]

  const handleMouseMove = (e: React.MouseEvent<SVGRectElement>, idx: number) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, idx })
  }

  const colW = chartW / CHART_MONTHS.length

  return (
    <div style={{ position: 'relative' }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height: 220, display: 'block' }}
      >
        {/* Y-axis ticks */}
        {yTicks.map(v => (
          <g key={v}>
            <line x1={padL} y1={yPos(v)} x2={W - padR} y2={yPos(v)} stroke="#e8e0d4" strokeWidth={1} />
            <text x={padL - 6} y={yPos(v) + 4} textAnchor="end" fontSize={11} fill="#9ca3af">{v === 0 ? '0' : `${v}K`}</text>
          </g>
        ))}

        {/* Revenue area */}
        <polygon points={revPoly} fill="#dcfce7" fillOpacity={0.7} />
        <polyline points={revPoints} fill="none" stroke="#2d5a27" strokeWidth={2} strokeLinejoin="round" />

        {/* Expenses area */}
        <polygon points={expPoly} fill="#fef2f2" fillOpacity={0.7} />
        <polyline points={expPoints} fill="none" stroke="#ef4444" strokeWidth={2} strokeLinejoin="round" />

        {/* X-axis labels */}
        {CHART_MONTHS.map((m, i) => (
          <text key={m} x={xPos(i)} y={H - 8} textAnchor="middle" fontSize={11} fill="#9ca3af">{m}</text>
        ))}

        {/* Hover columns */}
        {CHART_MONTHS.map((m, i) => (
          <rect
            key={m}
            x={xPos(i) - colW / 2}
            y={padT}
            width={colW}
            height={chartH}
            fill="transparent"
            onMouseMove={(e) => handleMouseMove(e, i)}
            onMouseLeave={() => setTooltip(null)}
            style={{ cursor: 'crosshair' }}
          />
        ))}

        {/* Tooltip line */}
        {tooltip !== null && (
          <line
            x1={xPos(tooltip.idx)}
            y1={padT}
            x2={xPos(tooltip.idx)}
            y2={padT + chartH}
            stroke="#1a1714"
            strokeWidth={1}
            strokeDasharray="4,3"
            opacity={0.4}
          />
        )}
      </svg>

      {/* Tooltip card */}
      {tooltip !== null && (() => {
        const i = tooltip.idx
        const rev = REVENUE_DATA[i]
        const exp = EXPENSE_DATA[i]
        const net = rev - exp
        return (
          <div style={{
            position: 'absolute',
            left: Math.min(tooltip.x + 12, 700),
            top: Math.max(tooltip.y - 60, 0),
            background: 'white',
            border: '1px solid #e8e0d4',
            borderRadius: 8,
            padding: '10px 14px',
            fontSize: 12,
            pointerEvents: 'none',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            zIndex: 10,
            minWidth: 140,
          }}>
            <div style={{ fontWeight: 700, marginBottom: 6, color: '#1a1714' }}>{CHART_MONTHS[i]}</div>
            <div style={{ color: '#2d5a27' }}>Revenue: <strong>${rev}K</strong></div>
            <div style={{ color: '#ef4444' }}>Expenses: <strong>${exp}K</strong></div>
            <div style={{ color: '#1a1714', borderTop: '1px solid #e8e0d4', marginTop: 6, paddingTop: 6 }}>Net: <strong>${net}K</strong></div>
          </div>
        )
      })()}
    </div>
  )
}

// ---------------------------------------------------------------------------
// AI CFO Chat Panel
// ---------------------------------------------------------------------------
const CHAT_RESPONSES: Record<string, string> = {
  "Am I on track this month?": "Yes — you're at $127,400 revenue this month vs your $120K average. You're 6% ahead of pace. Cash position of $847K is healthy. One flag: Q4 estimated tax of $23,400 is due Jan 15 — make sure that's reserved.",
  "Can I afford to hire someone?": "Based on your last 6 months, you're netting ~$40K/month after expenses. Adding a $60K/year employee would reduce net income by ~$5K/month. You have 19.6 months of runway, so yes — but consult your CPA at Miller CPA before committing.",
  "Compare to last November": "November 2024: $127,400 revenue, $87,000 expenses, $40,400 net. November 2023: $112,000 revenue, $79,000 expenses, $33,000 net. You're up 13.8% year-over-year.",
}

const DEFAULT_RESPONSE = "I can see your books show strong performance this month. For specific tax or financial advice, I'd recommend contacting your CPA at Miller CPA."

interface ChatMessage {
  role: 'user' | 'ai'
  text: string
}

function CFOPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [waiting, setWaiting] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const sendMessage = useCallback((text: string) => {
    if (!text.trim() || waiting) return
    const userMsg: ChatMessage = { role: 'user', text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setWaiting(true)
    setTimeout(() => {
      const responseText = CHAT_RESPONSES[text] || DEFAULT_RESPONSE
      const aiMsg: ChatMessage = { role: 'ai', text: responseText }
      setMessages(prev => [...prev, aiMsg])
      setWaiting(false)
    }, 1500)
  }, [waiting])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, waiting])

  const PILLS = ["Am I on track this month?", "Can I afford to hire someone?", "Compare to last November"]

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: open ? 0 : -400,
      width: 380,
      height: '100vh',
      background: 'white',
      borderLeft: '1px solid #e8e0d4',
      boxShadow: '-4px 0 20px rgba(0,0,0,0.08)',
      zIndex: 50,
      display: 'flex',
      flexDirection: 'column',
      transition: 'right 0.3s ease',
    }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #e8e0d4' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 20, color: '#1a1714' }}>Ask your CFO</div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Powered by your actual books.</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#9ca3af', padding: 4, lineHeight: 1 }}>×</button>
        </div>

        {/* Suggested pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          {PILLS.map(pill => (
            <button
              key={pill}
              onClick={() => sendMessage(pill)}
              style={{
                background: 'none',
                border: '1px solid #b8734a',
                borderRadius: 20,
                color: '#b8734a',
                fontSize: 12,
                padding: '4px 10px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {pill}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, marginTop: 40 }}>
            Ask anything about your finances
          </div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '85%',
              background: msg.role === 'user' ? '#1a1714' : 'white',
              color: msg.role === 'user' ? 'white' : '#1a1714',
              border: msg.role === 'ai' ? '1px solid #e8e0d4' : 'none',
              borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
              padding: '10px 14px',
              fontSize: 13,
              lineHeight: 1.5,
            }}>
              {msg.text}
              {msg.role === 'ai' && (
                <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 6, borderTop: '1px solid #f0ede8', paddingTop: 4 }}>
                  Based on Nov 2024 data · Miller CPA
                </div>
              )}
            </div>
          </div>
        ))}
        {waiting && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ background: 'white', border: '1px solid #e8e0d4', borderRadius: '12px 12px 12px 2px', padding: '10px 14px', fontSize: 13, color: '#9ca3af' }}>
              Thinking...
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid #e8e0d4', display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') sendMessage(input) }}
          placeholder="Ask about your finances..."
          style={{
            flex: 1,
            border: '1px solid #e8e0d4',
            borderRadius: 8,
            padding: '8px 12px',
            fontSize: 13,
            outline: 'none',
            color: '#1a1714',
            background: '#faf8f4',
          }}
        />
        <button
          onClick={() => sendMessage(input)}
          style={{
            background: '#1a1714',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            padding: '8px 16px',
            fontSize: 13,
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Send
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function ClientPortalPage() {
  const params = useParams()
  const firmId = (params?.firmId as string) || 'miller-cpa'
  const clientToken = (params?.clientToken as string) || 'demo-token'

  const [chatOpen, setChatOpen] = useState(false)
  const [dismissedCards, setDismissedCards] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set()
    try {
      const stored = localStorage.getItem(`cb_portal_dismissed_${clientToken}`)
      return stored ? new Set(JSON.parse(stored)) : new Set()
    } catch {
      return new Set()
    }
  })

  const [txVisible, setTxVisible] = useState<boolean[]>(Array(TRANSACTIONS.length).fill(false))

  useEffect(() => {
    TRANSACTIONS.forEach((_, i) => {
      setTimeout(() => {
        setTxVisible(prev => {
          const next = [...prev]
          next[i] = true
          return next
        })
      }, i * 40)
    })
  }, [])

  const dismissCard = (id: string) => {
    const next = new Set(dismissedCards)
    next.add(id)
    setDismissedCards(next)
    try {
      localStorage.setItem(`cb_portal_dismissed_${clientToken}`, JSON.stringify(Array.from(next)))
    } catch {}
  }

  const firmName = firmId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

  // Count-up values
  const cashCount = useCountUp(847293, 1400)
  const burnCount = useCountUp(43200, 1200)
  const revenueCount = useCountUp(127400, 1200)
  const obligationCount = useCountUp(38500, 1200)

  const formatMoney = (n: number) => {
    if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`
    if (n >= 1000) return `$${(n / 1000).toFixed(0)},${String(n % 1000).padStart(3, '0')}`
    return `$${n.toLocaleString()}`
  }

  const formatFull = (n: number) => `$${n.toLocaleString()}`

  const AI_CARDS = [
    {
      id: 'cash-flow-pattern',
      title: 'Cash Flow Pattern',
      desc: 'Your cash usually dips in January based on 3-year history. Consider delaying major purchases until February.',
    },
    {
      id: 'revenue-trend',
      title: 'Revenue Trend',
      desc: "You're tracking 12% above last November. If this continues, Q4 will be your best quarter ever.",
    },
    {
      id: 'tax-planning',
      title: 'Tax Planning',
      desc: 'Estimated Q4 tax due Jan 15: ~$23,400. Consider setting aside funds now.',
    },
  ]

  return (
    <div style={{ background: '#faf8f4', minHeight: '100vh', fontFamily: 'var(--font-dm-sans, system-ui, sans-serif)' }}>
      {/* Top Nav */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        height: 56,
        background: 'white',
        borderBottom: '1px solid #e8e0d4',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 18, color: '#1a1714' }}>{firmName}</span>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#b8734a', display: 'inline-block', marginLeft: 2 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 14, color: '#6b6560' }}>Smith Construction LLC</span>
          <button
            onClick={() => setChatOpen(true)}
            style={{
              background: 'none',
              border: '1px solid #b8734a',
              borderRadius: 20,
              color: '#b8734a',
              fontSize: 13,
              padding: '5px 14px',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Ask your CFO
          </button>
        </div>
      </nav>

      {/* Main content */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }}>

        {/* Section 1: Cash Position Hero */}
        <div style={{
          background: 'linear-gradient(135deg, #1a1714 0%, #2d2520 100%)',
          borderRadius: 16,
          padding: '32px 40px',
          height: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxSizing: 'border-box',
        }}>
          <div>
            <div style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
              CASH POSITION
            </div>
            <div style={{ fontSize: 52, fontWeight: 700, color: 'white', lineHeight: 1, marginBottom: 10 }}>
              ${cashCount.toLocaleString()}
            </div>
            <div style={{ fontSize: 14, color: '#4ade80' }}>
              ↑ $12,400 from last week
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '5px 12px', fontSize: 13, color: 'white' }}>
                Checking $621k
              </div>
              <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '5px 12px', fontSize: 13, color: 'white' }}>
                Savings $226k
              </div>
            </div>
            <Sparkline />
          </div>
        </div>

        {/* Section 2: 3 metric cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 20 }}>
          {/* Burn Rate */}
          <div style={{ background: 'white', border: '1px solid #e8e0d4', borderRadius: 12, padding: '20px 24px' }}>
            <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>Burn Rate</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#2d5a27', marginBottom: 6 }}>
              ${burnCount.toLocaleString()}/mo
            </div>
            <div style={{ fontSize: 13, color: '#9ca3af' }}>At this rate, 19.6 months runway</div>
          </div>

          {/* Revenue */}
          <div style={{ background: 'white', border: '1px solid #e8e0d4', borderRadius: 12, padding: '20px 24px' }}>
            <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>Revenue This Month</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#1a1714', marginBottom: 6 }}>
              ${revenueCount.toLocaleString()}
            </div>
            <div style={{ fontSize: 13, color: '#2d5a27' }}>↑ 12% vs last month</div>
          </div>

          {/* Next 30 Days */}
          <div style={{ background: 'white', border: '1px solid #e8e0d4', borderRadius: 12, padding: '20px 24px' }}>
            <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>Next 30 Days</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#b8734a', marginBottom: 6 }}>
              ${obligationCount.toLocaleString()} due
            </div>
            <div style={{ fontSize: 13, color: '#9ca3af' }}>Payroll, rent, subscriptions</div>
          </div>
        </div>

        {/* Section 3: Two-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '58% 40%', gap: 20, marginTop: 20 }}>
          {/* Left: Recent Transactions */}
          <div style={{ background: 'white', border: '1px solid #e8e0d4', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 20px',
              borderBottom: '1px solid #e8e0d4',
            }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1714' }}>Recent Transactions</span>
              <a href="#" style={{ fontSize: 13, color: '#b8734a', textDecoration: 'none' }}>View all 284 →</a>
            </div>
            {TRANSACTIONS.map((tx, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '10px 20px',
                  borderBottom: i < TRANSACTIONS.length - 1 ? '1px solid #f5f3ef' : 'none',
                  gap: 12,
                  transform: txVisible[i] ? 'translateX(0)' : 'translateX(20px)',
                  opacity: txVisible[i] ? 1 : 0,
                  transition: 'transform 0.3s ease, opacity 0.3s ease',
                  background: 'white',
                  cursor: 'default',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = '#f8f5f0' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'white' }}
              >
                <span style={{ fontSize: 12, color: '#9ca3af', minWidth: 44, flexShrink: 0 }}>{tx.date}</span>
                <span style={{ fontSize: 13, color: '#1a1714', flex: 1 }}>{tx.desc}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: tx.amount > 0 ? '#2d5a27' : '#ef4444', flexShrink: 0 }}>
                  {tx.amount > 0 ? '+' : ''}{formatFull(tx.amount)}
                </span>
                <span style={{
                  fontSize: 10,
                  background: '#f3f4f6',
                  color: '#6b7280',
                  borderRadius: 20,
                  padding: '2px 8px',
                  flexShrink: 0,
                }}>
                  {tx.category}
                </span>
              </div>
            ))}
          </div>

          {/* Right: Upcoming Obligations */}
          <div style={{ background: 'white', border: '1px solid #e8e0d4', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #e8e0d4' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1714' }}>Next 30 Days</span>
            </div>
            {[
              { date: 'Dec 1', label: 'Payroll Run', amount: -12400, status: 'confirmed' },
              { date: 'Dec 1', label: 'Office Rent', amount: -4200, status: 'confirmed' },
              { date: 'Dec 15', label: 'Estimated Tax Q4', amount: -23400, status: 'predicted' },
              { date: 'Dec 15', label: 'Software Stack', amount: -1840, status: 'predicted' },
              { date: 'Dec 28', label: 'Equipment Lease', amount: -2100, status: 'confirmed' },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 16px',
                  borderBottom: i < 4 ? '1px solid #f5f3ef' : 'none',
                  background: item.status === 'confirmed' ? '#f0fdf4' : 'transparent',
                  borderLeft: item.status === 'predicted' ? '3px dashed #fbbf24' : '3px solid transparent',
                }}
              >
                {/* Calendar icon */}
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  background: item.status === 'confirmed' ? '#dcfce7' : '#fef3c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: 14,
                }}>
                  📅
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 13, color: '#1a1714', fontWeight: 500 }}>{item.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#ef4444', flexShrink: 0 }}>
                      {formatFull(item.amount)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>{item.date}</span>
                    {item.status === 'confirmed'
                      ? <span style={{ fontSize: 10, background: '#dcfce7', color: '#166534', borderRadius: 20, padding: '1px 6px' }}>Confirmed</span>
                      : <span style={{ fontSize: 10, background: '#fef3c7', color: '#92400e', borderRadius: 20, padding: '1px 6px' }}>Predicted</span>
                    }
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Revenue vs Expenses Chart */}
        <div style={{ background: 'white', border: '1px solid #e8e0d4', borderRadius: 12, padding: 24, marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1714' }}>Revenue vs Expenses</span>
            <span style={{ fontSize: 13, color: '#9ca3af', background: '#f5f3ef', borderRadius: 6, padding: '4px 10px' }}>Last 12 months</span>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 20, marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 16, height: 3, background: '#2d5a27', borderRadius: 2 }} />
              <span style={{ fontSize: 12, color: '#6b7280' }}>Revenue</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 16, height: 3, background: '#ef4444', borderRadius: 2 }} />
              <span style={{ fontSize: 12, color: '#6b7280' }}>Expenses</span>
            </div>
          </div>

          <RevenueChart />

          {/* Stat chips */}
          <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
            {[
              { label: 'Best Month: Aug', value: '$147K' },
              { label: 'Avg Monthly', value: '$123K' },
              { label: 'YTD vs Last Year', value: '+18%' },
            ].map(chip => (
              <div key={chip.label} style={{
                background: '#f5f3ef',
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 13,
                color: '#6b6560',
              }}>
                {chip.label}: <strong style={{ color: '#1a1714' }}>{chip.value}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Section 5: AI Insight Cards */}
        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1714', marginBottom: 12 }}>AI Insights</div>
          <div style={{ display: 'flex', overflowX: 'auto', gap: 16, paddingBottom: 8 }}>
            {AI_CARDS.filter(c => !dismissedCards.has(c.id)).map(card => (
              <div
                key={card.id}
                style={{
                  minWidth: 280,
                  background: 'white',
                  borderRadius: 12,
                  borderLeft: '4px solid #b8734a',
                  border: '1px solid #e8e0d4',
                  borderLeftWidth: 4,
                  borderLeftColor: '#b8734a',
                  borderLeftStyle: 'solid',
                  padding: 20,
                  position: 'relative',
                  flexShrink: 0,
                }}
              >
                <button
                  onClick={() => dismissCard(card.id)}
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#9ca3af',
                    fontSize: 16,
                    lineHeight: 1,
                    padding: 2,
                  }}
                >
                  ×
                </button>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#b8734a', marginBottom: 8 }}>{card.title}</div>
                <div style={{ fontSize: 13, color: '#6b6560', lineHeight: 1.5 }}>{card.desc}</div>
              </div>
            ))}
            {AI_CARDS.every(c => dismissedCards.has(c.id)) && (
              <div style={{ fontSize: 13, color: '#9ca3af', padding: '20px 0' }}>All insights dismissed.</div>
            )}
          </div>
        </div>

        <div style={{ height: 40 }} />
      </div>

      {/* CFO Chat Panel */}
      <CFOPanel open={chatOpen} onClose={() => setChatOpen(false)} />

      {/* Overlay */}
      {chatOpen && (
        <div
          onClick={() => setChatOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.15)',
            zIndex: 40,
          }}
        />
      )}
    </div>
  )
}
