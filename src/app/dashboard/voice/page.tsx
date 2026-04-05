'use client'

import { useState } from 'react'
import Link from 'next/link'
import VoiceDemoModal from '@/components/voice/VoiceDemoModal'

const CALL_HISTORY = [
  { id: 'h1', time: 'Today 9:14am', command: 'Close the books for Smith Construction', action: 'Triggered autonomous close', status: 'complete', duration: '4m 02s' },
  { id: 'h2', time: 'Yesterday 4:32pm', command: "What's Smith Construction's cash position?", action: 'Answered by voice: $847,293', status: 'answered', duration: '0:08' },
  { id: 'h3', time: 'Mon 2:18pm', command: 'Who needs exceptions reviewed?', action: 'Listed 3 clients with 10 total exceptions', status: 'answered', duration: '0:15' },
  { id: 'h4', time: 'Mon 11:04am', command: 'Schedule December close for all clients', action: '6 closes scheduled for Dec 1 at 11pm', status: 'scheduled', duration: '0:22' },
  { id: 'h5', time: 'Fri 3:47pm', command: "What's my total revenue this month?", action: 'Answered: $284,000 across 6 clients', status: 'answered', duration: '0:11' },
]

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  complete: { bg: '#dcfce7', color: '#166534' },
  answered: { bg: '#dbeafe', color: '#1e40af' },
  scheduled: { bg: '#f3e8ff', color: '#6b21a8' },
}

const TRANSCRIPTS: Record<string, string[]> = {
  h1: [
    'You: Close the books for Smith Construction',
    'CloseBooks: Starting close for Smith Construction now. Estimated time: 4 minutes.',
    '[System: Autonomous close initiated at 9:14am]',
    'CloseBooks: Close completed successfully. All 847 transactions reconciled.',
    '[System: Close finished at 9:18am — duration 4m 02s]',
  ],
  h2: [
    "You: What's Smith Construction's cash position?",
    'CloseBooks: Smith Construction has $847,293 in checking — that\'s up $12,400 from last week.',
    '[System: Query answered in 8 seconds]',
  ],
  h3: [
    'You: Who needs exceptions reviewed?',
    'CloseBooks: You have 10 exceptions across 3 clients. Smith Construction has 3, Chen Medical has 7, TechFlow has none.',
    '[System: Query answered in 15 seconds]',
  ],
  h4: [
    'You: Schedule December close for all clients',
    "CloseBooks: Done. I've scheduled December closes for all 6 active clients on December 1st at 11pm.",
    '[System: 6 close jobs scheduled]',
  ],
  h5: [
    "You: What's my total revenue this month?",
    'CloseBooks: Your total platform revenue this month is $284,000 across 6 active clients.',
    '[System: Query answered in 11 seconds]',
  ],
}

export default function VoicePage() {
  const [demoOpen, setDemoOpen] = useState(false)
  const [transcriptOpen, setTranscriptOpen] = useState<string | null>(null)
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null)
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)

  return (
    <div style={{ padding: 32, maxWidth: 860, margin: '0 auto' }}>
      {/* Hero card */}
      <div
        style={{
          maxWidth: 600,
          margin: '0 auto 24px auto',
          backgroundColor: '#ffffff',
          border: '1px solid #e8e0d4',
          borderRadius: 16,
          padding: 48,
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-dm-serif)',
            fontSize: 24,
            color: '#1a1714',
            margin: '0 0 28px 0',
          }}
        >
          Your CloseBooks Voice Line
        </h1>

        {/* Phone number display */}
        <div
          style={{
            fontFamily: 'monospace, system-ui',
            fontSize: 36,
            fontWeight: 700,
            letterSpacing: '0.15em',
            color: '#1a1714',
            marginBottom: 6,
            lineHeight: 1.2,
          }}
        >
          +1 (844) 256-7326
        </div>
        <div
          style={{
            fontFamily: 'monospace, system-ui',
            fontSize: 10,
            letterSpacing: '0.3em',
            color: '#a09080',
            marginBottom: 32,
            textTransform: 'uppercase',
          }}
        >
          C&nbsp;&nbsp;L&nbsp;&nbsp;O&nbsp;&nbsp;S&nbsp;&nbsp;E&nbsp;&nbsp;&nbsp;&nbsp;B&nbsp;&nbsp;O&nbsp;&nbsp;O&nbsp;&nbsp;K&nbsp;&nbsp;S
        </div>

        {/* Tap to call button */}
        <a
          href="tel:+18442567326"
          onMouseEnter={() => setHoveredBtn('call')}
          onMouseLeave={() => setHoveredBtn(null)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            padding: '14px 32px',
            borderRadius: 12,
            backgroundColor: hoveredBtn === 'call' ? '#a36640' : '#b8734a',
            color: '#ffffff',
            fontSize: 16,
            fontWeight: 600,
            textDecoration: 'none',
            transition: 'background-color 0.15s',
            marginBottom: 32,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6 6l1.14-1.85a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21.72 15z"/>
          </svg>
          Tap to Call
        </a>

        {/* How it works steps */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          {[
            { icon: '📞', label: 'Call the number' },
            { icon: '🗣️', label: 'Say what you want' },
            { icon: '✅', label: 'CloseBooks does it' },
          ].map((step) => (
            <div
              key={step.label}
              style={{
                backgroundColor: '#f8f5f0',
                borderRadius: 10,
                padding: '12px 16px',
                flex: 1,
                fontSize: 12,
                color: '#57534e',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 4 }}>{step.icon}</div>
              {step.label}
            </div>
          ))}
        </div>
      </div>

      {/* Try Voice Demo button */}
      <div style={{ maxWidth: 600, margin: '0 auto 32px auto' }}>
        <button
          onClick={() => setDemoOpen(true)}
          onMouseEnter={() => setHoveredBtn('demo')}
          onMouseLeave={() => setHoveredBtn(null)}
          style={{
            width: '100%',
            padding: '13px 0',
            borderRadius: 12,
            border: '1.5px solid #e8e0d4',
            backgroundColor: hoveredBtn === 'demo' ? '#f8f5f0' : '#ffffff',
            color: '#1a1714',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background-color 0.15s',
          }}
        >
          Try Voice Demo
        </button>
      </div>

      {/* Call History */}
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e8e0d4',
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e8e0d4' }}>
          <h2 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 20, color: '#1a1714', margin: 0 }}>
            Recent Calls
          </h2>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#faf8f4' }}>
                {['Time', 'Command', 'Action Taken', 'Status', 'Duration', ''].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '10px 16px',
                      textAlign: 'left',
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#78716c',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CALL_HISTORY.map((call) => {
                const st = STATUS_STYLE[call.status] ?? { bg: '#f5f5f4', color: '#57534e' }
                return (
                  <tr
                    key={call.id}
                    onMouseEnter={() => setHoveredRow(call.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    style={{
                      borderTop: '1px solid #f0ece6',
                      backgroundColor: hoveredRow === call.id ? '#faf8f4' : '#ffffff',
                      transition: 'background-color 0.1s',
                    }}
                  >
                    <td style={{ padding: '13px 16px', fontSize: 13, color: '#78716c', whiteSpace: 'nowrap' }}>
                      {call.time}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: '#1a1714', maxWidth: 200 }}>
                      {call.command}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: '#57534e' }}>
                      {call.action}
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: 20,
                          backgroundColor: st.bg,
                          color: st.color,
                          fontSize: 11,
                          fontWeight: 600,
                          textTransform: 'capitalize',
                        }}
                      >
                        {call.status}
                      </span>
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: '#78716c', whiteSpace: 'nowrap' }}>
                      {call.duration}
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <button
                        onClick={() => setTranscriptOpen(call.id)}
                        onMouseEnter={() => setHoveredBtn(`play-${call.id}`)}
                        onMouseLeave={() => setHoveredBtn(null)}
                        style={{
                          padding: '5px 12px',
                          borderRadius: 6,
                          border: '1px solid #e8e0d4',
                          backgroundColor: hoveredBtn === `play-${call.id}` ? '#f8f5f0' : '#ffffff',
                          color: '#57534e',
                          fontSize: 12,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          transition: 'background-color 0.15s',
                        }}
                      >
                        ▶ Play
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid #f0ece6', textAlign: 'right' }}>
          <Link
            href="/dashboard/voice/setup"
            style={{ fontSize: 13, color: '#b8734a', textDecoration: 'none', fontWeight: 500 }}
          >
            Set up voice assistant →
          </Link>
        </div>
      </div>

      {/* Voice Demo Modal */}
      <VoiceDemoModal isOpen={demoOpen} onClose={() => setDemoOpen(false)} />

      {/* Transcript Modal */}
      {transcriptOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setTranscriptOpen(null) }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 500,
              backgroundColor: '#ffffff',
              borderRadius: 16,
              padding: 32,
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 20, color: '#1a1714', margin: 0 }}>
                Call Transcript
              </h3>
              <button
                onClick={() => setTranscriptOpen(null)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: '1px solid #e8e0d4',
                  backgroundColor: '#ffffff',
                  cursor: 'pointer',
                  fontSize: 18,
                  color: '#57534e',
                }}
              >
                ×
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(TRANSCRIPTS[transcriptOpen] ?? []).map((line, i) => (
                <div
                  key={i}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    backgroundColor: line.startsWith('[System') ? '#faf8f4' : line.startsWith('CloseBooks') ? '#f0f9ff' : '#f8f5f0',
                    fontSize: 13,
                    color: line.startsWith('[System') ? '#78716c' : '#1a1714',
                    fontStyle: line.startsWith('[System') ? 'italic' : 'normal',
                  }}
                >
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
