'use client'

import { useState } from 'react'
import Link from 'next/link'

const MODULES = [
  { id: 1, title: 'AI Transaction Categorization', hours: 2, status: 'complete', score: 94, creditEarned: true },
  { id: 2, title: 'Month-End Close Mastery', hours: 2, status: 'complete', score: 88, creditEarned: true },
  { id: 3, title: 'Tax Strategy with AI', hours: 2, status: 'in-progress', progress: 60, creditEarned: false },
  { id: 4, title: 'Client Success Practices', hours: 2, status: 'locked', creditEarned: false },
]

function ProgressRing({ percent, size = 160, stroke = 12 }: { percent: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference - (percent / 100) * circumference

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      {/* Track */}
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e8e0d4" strokeWidth={stroke} />
      {/* Progress */}
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="#2d5a27" strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
    </svg>
  )
}

export default function DashboardCertificationPage() {
  const completedModules = MODULES.filter(m => m.status === 'complete').length
  const totalModules = MODULES.length
  const progressPercent = (completedModules / totalModules) * 100
  const creditsEarned = MODULES.filter(m => m.creditEarned).length * 2
  const allComplete = completedModules === totalModules

  const [showShareModal, setShowShareModal] = useState(false)

  return (
    <div style={{ backgroundColor: '#faf8f4', minHeight: '100vh', padding: '32px 32px 64px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 13, color: '#6b6560', marginBottom: 8 }}>
            <Link href="/dashboard" style={{ color: '#b8734a', textDecoration: 'none' }}>← Dashboard</Link>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1a1714', margin: 0 }}>Certification</h1>
          <p style={{ fontSize: 14, color: '#6b6560', marginTop: 4 }}>CloseBooks Certified Advisor · 8 NASBA CPE Credits</p>
        </div>

        {/* Overview card */}
        <div style={{ backgroundColor: '#fff', border: '1px solid #e8e0d4', borderRadius: 16, padding: '28px 32px', marginBottom: 28, display: 'grid', gridTemplateColumns: '160px 1fr', gap: 32, alignItems: 'center' }}>
          <div style={{ position: 'relative', textAlign: 'center' }}>
            <ProgressRing percent={progressPercent} />
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#2d5a27' }}>{completedModules}/{totalModules}</div>
              <div style={{ fontSize: 11, color: '#6b6560' }}>modules</div>
            </div>
          </div>

          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1a1714', marginBottom: 6 }}>
              {allComplete ? 'Certification Complete!' : `${Math.round(progressPercent)}% Complete`}
            </h2>
            <p style={{ fontSize: 14, color: '#6b6560', marginBottom: 20, lineHeight: 1.6 }}>
              {allComplete
                ? 'Congratulations! You\'ve earned the CloseBooks Certified Advisor credential.'
                : `You\'ve completed ${completedModules} of 4 modules. Continue to earn your certification.`}
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button
                disabled={!allComplete}
                style={{
                  padding: '9px 20px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: allComplete ? 'pointer' : 'not-allowed',
                  backgroundColor: allComplete ? '#2d5a27' : '#e8e0d4',
                  color: allComplete ? '#fff' : '#a09a94',
                }}
              >
                Download Certificate ↓
              </button>
              <button
                onClick={() => setShowShareModal(true)}
                disabled={!allComplete}
                style={{
                  padding: '9px 20px', borderRadius: 8, border: '1px solid #e8e0d4', fontSize: 13, fontWeight: 600, cursor: allComplete ? 'pointer' : 'not-allowed',
                  backgroundColor: '#fff', color: allComplete ? '#1a1714' : '#a09a94',
                }}
              >
                Share on LinkedIn
              </button>
            </div>
          </div>
        </div>

        {/* CPE Credits summary */}
        <div style={{ backgroundColor: '#fff', border: '1px solid #e8e0d4', borderRadius: 12, padding: '18px 24px', marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 20 }}>📜</span>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1714' }}>
                {creditsEarned}.0 of 8.0 CPE credits earned
              </div>
              <div style={{ fontSize: 13, color: '#6b6560' }}>
                Toward your 2024 NASBA CPE requirement · Provider: CloseBooks Education (NASBA #148732)
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: '#a09a94', marginBottom: 4 }}>Progress</div>
            <div style={{ width: 120, height: 8, backgroundColor: '#e8e0d4', borderRadius: 4 }}>
              <div style={{ width: `${(creditsEarned / 8) * 100}%`, height: '100%', backgroundColor: '#2d5a27', borderRadius: 4, transition: 'width 0.6s' }} />
            </div>
          </div>
        </div>

        {/* Module cards */}
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1714', marginBottom: 16 }}>Modules</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {MODULES.map(mod => (
            <ModuleCard key={mod.id} module={mod} />
          ))}
        </div>

      </div>

      {showShareModal && (
        <ShareModal onClose={() => setShowShareModal(false)} />
      )}
    </div>
  )
}

function ModuleCard({ module }: { module: typeof MODULES[number] }) {
  const isLocked = module.status === 'locked'
  const isComplete = module.status === 'complete'
  const isInProgress = module.status === 'in-progress'

  const statusConfig = {
    complete: { label: '✓ Complete', bg: '#dcfce7', color: '#2d5a27' },
    'in-progress': { label: 'In Progress', bg: '#fef3c7', color: '#92400e' },
    locked: { label: 'Locked', bg: '#f1f5f9', color: '#64748b' },
  }[module.status]

  return (
    <div style={{
      backgroundColor: '#fff', border: '1px solid #e8e0d4', borderRadius: 12, padding: '20px 24px',
      opacity: isLocked ? 0.6 : 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
          {/* Module number circle */}
          <div style={{
            width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
            backgroundColor: isComplete ? '#2d5a27' : isInProgress ? '#fef3c7' : '#e8e0d4',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {isComplete ? (
              <span style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>✓</span>
            ) : (
              <span style={{ color: isInProgress ? '#92400e' : '#a09a94', fontSize: 16, fontWeight: 700 }}>{module.id}</span>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#1a1714' }}>
                Module {module.id}: {module.title}
              </span>
              <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 10, backgroundColor: statusConfig.bg, color: statusConfig.color, fontWeight: 600 }}>
                {statusConfig.label}
              </span>
            </div>
            <div style={{ fontSize: 12, color: '#6b6560', marginTop: 2 }}>
              {module.hours} CPE hours
              {isComplete && module.score !== undefined && (
                <span style={{ marginLeft: 12, color: '#2d5a27', fontWeight: 600 }}>Score: {module.score}% · CPE credit earned</span>
              )}
              {isInProgress && module.progress !== undefined && (
                <span style={{ marginLeft: 12 }}>{module.progress}% through module</span>
              )}
              {isLocked && <span style={{ marginLeft: 8, color: '#a09a94' }}>— Complete Module {module.id - 1} first</span>}
            </div>
            {isInProgress && module.progress !== undefined && (
              <div style={{ marginTop: 8, width: '100%', maxWidth: 200, height: 4, backgroundColor: '#e8e0d4', borderRadius: 2 }}>
                <div style={{ width: `${module.progress}%`, height: '100%', backgroundColor: '#f59e0b', borderRadius: 2 }} />
              </div>
            )}
          </div>
        </div>

        <div>
          {isComplete && (
            <Link
              href={`/dashboard/certification/${module.id}`}
              style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e8e0d4', backgroundColor: '#fff', color: '#6b6560', fontSize: 13, fontWeight: 500, textDecoration: 'none' }}
            >
              Review
            </Link>
          )}
          {isInProgress && (
            <Link
              href={`/dashboard/certification/${module.id}`}
              style={{ padding: '8px 18px', borderRadius: 8, border: 'none', backgroundColor: '#b8734a', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}
            >
              Continue →
            </Link>
          )}
          {isLocked && (
            <div style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e8e0d4', backgroundColor: '#faf8f4', color: '#a09a94', fontSize: 13 }}>
              🔒 Locked
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ShareModal({ onClose }: { onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(26,23,20,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: 32, width: '100%', maxWidth: 460, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1714', margin: 0 }}>Share on LinkedIn</h2>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: 20, cursor: 'pointer', color: '#6b6560' }}>×</button>
        </div>
        <div style={{ backgroundColor: '#faf8f4', borderRadius: 10, padding: 20, marginBottom: 20, fontSize: 14, color: '#1a1714', lineHeight: 1.6 }}>
          🎓 Proud to have earned the <strong>CloseBooks Certified Advisor</strong> credential!<br /><br />
          Completed 8 NASBA-approved CPE hours covering AI transaction categorization, month-end close mastery, tax strategy with AI, and client success practices.<br /><br />
          If you&apos;re a CPA looking to stay ahead of the AI transformation in accounting — I highly recommend it. #CPA #Accounting #AI #CPE #CloseBooks
        </div>
        <button
          onClick={onClose}
          style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', backgroundColor: '#0a66c2', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
        >
          Share on LinkedIn
        </button>
      </div>
    </div>
  )
}
