'use client'

import { useState, useEffect, useRef } from 'react'

type DemoState = 'idle' | 'processing' | 'responded'

const SAMPLE_COMMANDS = [
  'Close the books for Smith Construction',
  "What's my biggest client's cash?",
  'Who needs exceptions reviewed?',
  'Schedule December close for all clients',
]

function getResponse(command: string): { text: string; intent: string } {
  const lower = command.toLowerCase()
  if (lower.includes('close the books') || lower.includes('close books')) {
    return {
      text: 'Starting close for Smith Construction now. This usually takes about 4 minutes. I\'ll text you when it\'s done.',
      intent: 'close_books',
    }
  }
  if (lower.includes('cash')) {
    return {
      text: 'Smith Construction has $847,293 in checking — that\'s up $12,400 from last week. Their burn rate is $43,200 per month.',
      intent: 'get_metric',
    }
  }
  if (lower.includes('exception')) {
    return {
      text: 'You have 10 exceptions across 3 clients. Smith Construction has 3, Chen Medical has 7, TechFlow has none right now.',
      intent: 'list_exceptions',
    }
  }
  if (lower.includes('schedule') || lower.includes('december')) {
    return {
      text: "Done. I've scheduled December closes for all 6 active clients on December 1st at 11pm. You'll get a text when each one finishes.",
      intent: 'schedule',
    }
  }
  return {
    text: 'Got it. I\'ve noted your request. For complex queries, please check your dashboard at closebooks.app.',
    intent: 'unknown',
  }
}

function getActionCard(intent: string) {
  if (intent === 'close_books') {
    return {
      bg: '#1a3a1a',
      color: '#86efac',
      text: 'Would trigger: Autonomous Close → Smith Construction',
    }
  }
  if (intent === 'get_metric') {
    return {
      bg: '#172554',
      color: '#93c5fd',
      text: 'Would answer with live data from your books',
    }
  }
  if (intent === 'list_exceptions') {
    return {
      bg: '#451a03',
      color: '#fcd34d',
      text: 'Would read exception count from your queue',
    }
  }
  if (intent === 'schedule') {
    return {
      bg: '#1a1a3a',
      color: '#c4b5fd',
      text: 'Would schedule closes for all active clients',
    }
  }
  return {
    bg: '#2a2a2a',
    color: '#d4d4d4',
    text: 'Would log your request for manual review',
  }
}

interface WaveBarProps {
  delay: number
}

function WaveBar({ delay }: WaveBarProps) {
  const [height, setHeight] = useState(40)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const animate = () => {
      setHeight(20 + Math.random() * 80)
    }
    const id = setInterval(animate, 300)
    intervalRef.current = id
    return () => clearInterval(id)
  }, [])

  return (
    <div
      style={{
        width: 8,
        backgroundColor: '#b8734a',
        borderRadius: 4,
        height: `${height}%`,
        transition: `height ${0.3}s ease`,
        transitionDelay: `${delay}ms`,
        minHeight: 8,
      }}
    />
  )
}

export default function VoiceDemoModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [demoState, setDemoState] = useState<DemoState>('idle')
  const [command, setCommand] = useState('')
  const [response, setResponse] = useState<{ text: string; intent: string } | null>(null)
  const [hoveredPill, setHoveredPill] = useState<string | null>(null)
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) {
      setDemoState('idle')
      setCommand('')
      setResponse(null)
    }
  }, [isOpen])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSubmit = () => {
    if (!command.trim()) return
    setDemoState('processing')
    setTimeout(() => {
      const res = getResponse(command)
      setResponse(res)
      setDemoState('responded')
    }, 1500)
  }

  const handleSelectSample = (sample: string) => {
    setCommand(sample)
  }

  const handleReset = () => {
    setDemoState('idle')
    setCommand('')
    setResponse(null)
  }

  const actionCard = response ? getActionCard(response.intent) : null

  return (
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
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 500,
          backgroundColor: '#ffffff',
          borderRadius: 16,
          padding: 32,
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          position: 'relative',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 22, color: '#1a1714', margin: 0 }}>
            Voice Demo
          </h2>
          <button
            onClick={onClose}
            onMouseEnter={() => setHoveredBtn('close')}
            onMouseLeave={() => setHoveredBtn(null)}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: '1px solid #e8e0d4',
              backgroundColor: hoveredBtn === 'close' ? '#f8f5f0' : '#ffffff',
              cursor: 'pointer',
              fontSize: 18,
              color: '#57534e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.15s',
            }}
          >
            ×
          </button>
        </div>

        {/* IDLE STATE */}
        {demoState === 'idle' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            {/* Mic icon */}
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                backgroundColor: '#f8f5f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#b8734a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 17, fontWeight: 600, color: '#1a1714', marginBottom: 4 }}>Type a voice command</div>
              <div style={{ fontSize: 13, color: '#78716c' }}>Or select a sample command below</div>
            </div>

            {/* Sample pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', width: '100%' }}>
              {SAMPLE_COMMANDS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSelectSample(s)}
                  onMouseEnter={() => setHoveredPill(s)}
                  onMouseLeave={() => setHoveredPill(null)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 20,
                    border: '1px solid',
                    borderColor: command === s ? '#b8734a' : '#e8e0d4',
                    backgroundColor: command === s ? '#fdf3ec' : hoveredPill === s ? '#f8f5f0' : '#ffffff',
                    cursor: 'pointer',
                    fontSize: 12,
                    color: command === s ? '#b8734a' : '#1a1714',
                    fontWeight: command === s ? 600 : 400,
                    transition: 'all 0.15s',
                    textAlign: 'left',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Text input */}
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
              placeholder="Or type your own command..."
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 10,
                border: '1px solid #e8e0d4',
                fontSize: 14,
                color: '#1a1714',
                backgroundColor: '#faf8f4',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />

            {/* Send button */}
            <button
              onClick={handleSubmit}
              onMouseEnter={() => setHoveredBtn('send')}
              onMouseLeave={() => setHoveredBtn(null)}
              disabled={!command.trim()}
              style={{
                width: '100%',
                padding: '13px 0',
                borderRadius: 10,
                border: 'none',
                backgroundColor: command.trim() ? (hoveredBtn === 'send' ? '#a36640' : '#b8734a') : '#e8e0d4',
                color: command.trim() ? '#ffffff' : '#a09080',
                fontSize: 15,
                fontWeight: 600,
                cursor: command.trim() ? 'pointer' : 'not-allowed',
                transition: 'background-color 0.15s',
              }}
            >
              Send Command
            </button>
          </div>
        )}

        {/* PROCESSING STATE */}
        {demoState === 'processing' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, padding: '16px 0' }}>
            {/* Waveform */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                height: 64,
                padding: '0 16px',
              }}
            >
              {[0, 60, 120, 180, 240].map((delay, i) => (
                <WaveBar key={i} delay={delay} />
              ))}
            </div>
            <div style={{ textAlign: 'center', color: '#57534e', fontSize: 14 }}>
              CloseBooks is processing your command...
            </div>
          </div>
        )}

        {/* RESPONDED STATE */}
        {demoState === 'responded' && response && actionCard && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Command echo */}
            <div style={{ fontSize: 12, color: '#78716c' }}>
              <strong>You said:</strong> "{command}"
            </div>

            {/* Speech bubble */}
            <div
              style={{
                backgroundColor: '#1a1714',
                color: '#ffffff',
                borderRadius: '12px 12px 12px 2px',
                padding: '16px 20px',
                fontSize: 15,
                lineHeight: 1.55,
                maxWidth: 420,
              }}
            >
              {response.text}
            </div>

            {/* Action label */}
            <div style={{ fontSize: 12, fontWeight: 600, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              What would happen:
            </div>

            {/* Action card */}
            <div
              style={{
                backgroundColor: actionCard.bg,
                borderRadius: 10,
                padding: '12px 16px',
                fontSize: 13,
                color: actionCard.color,
                fontWeight: 500,
              }}
            >
              {actionCard.text}
            </div>

            {/* Try another */}
            <button
              onClick={handleReset}
              onMouseEnter={() => setHoveredBtn('reset')}
              onMouseLeave={() => setHoveredBtn(null)}
              style={{
                padding: '11px 0',
                borderRadius: 10,
                border: '1px solid #e8e0d4',
                backgroundColor: hoveredBtn === 'reset' ? '#f8f5f0' : '#ffffff',
                color: '#1a1714',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'background-color 0.15s',
              }}
            >
              Try another command
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
