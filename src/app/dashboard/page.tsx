'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import DashboardNav from '@/components/DashboardNav'
import OnboardingModal, { needsOnboarding } from '@/components/OnboardingModal'
import AppFooter from '@/components/AppFooter'
import { getJobs, deleteJob } from '@/lib/storage'
import { dbGetJobs, dbDeleteJob } from '@/lib/db'
import { getQBOConnection } from '@/lib/integrations'
import ActivityFeed from '@/components/ActivityFeed'
import { calcCumulativeROI, fmtHours } from '@/lib/roiCalc'
import { getClientCloseStatuses } from '@/lib/clientStatus'
import { getCorrectionStats } from '@/lib/corrections'
import type { CategorizationJob } from '@/types'
import type { QBOConnection } from '@/lib/integrations'
import type { ClientCloseStatus, CloseStatus } from '@/lib/clientStatus'
import type { CorrectionStats } from '@/lib/corrections'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function progressPercent(job: CategorizationJob) {
  if (job.total_transactions === 0) return 0
  return Math.round(((job.approved + job.flagged) / job.total_transactions) * 100)
}

const STATUS_STYLE: Record<CategorizationJob['status'], { bg: string; text: string; label: string; dot: string }> = {
  processing: { bg: '#fef9c3', text: '#854d0e', label: 'Processing', dot: '#ca8a04' },
  review:     { bg: '#fdf2e9', text: '#9a3412', label: 'In Review',  dot: '#b8734a' },
  completed:  { bg: '#ecfdf5', text: '#065f46', label: 'Completed',  dot: '#059669' },
}

// ---------------------------------------------------------------------------
// Summary stats
// ---------------------------------------------------------------------------

function SummaryStats({ jobs }: { jobs: CategorizationJob[] }) {
  const totalClients = jobs.length
  const totalTx = jobs.reduce((s, j) => s + j.total_transactions, 0)

  const allTx = jobs.flatMap((j) => j.transactions)
  const withConf = allTx.filter((t) => t.confidence > 0)
  const avgConf = withConf.length > 0
    ? Math.round(withConf.reduce((s, t) => s + t.confidence, 0) / withConf.length * 100)
    : null

  const timeSavedMin = totalTx * 2
  const timeSavedStr = timeSavedMin === 0 ? '—'
    : timeSavedMin >= 60 ? `${(timeSavedMin / 60).toFixed(1)}h`
    : `${timeSavedMin}m`

  const stats = [
    {
      label: 'Total Clients',
      value: totalClients.toString(),
      sub: 'all time',
      color: '#1a1714',
      icon: <ClientsIcon />,
    },
    {
      label: 'Transactions Processed',
      value: totalTx.toLocaleString(),
      sub: 'across all closes',
      color: '#1a1714',
      icon: <TxIcon />,
    },
    {
      label: 'Avg Confidence',
      value: avgConf !== null ? `${avgConf}%` : '—',
      sub: 'AI categorization',
      color: avgConf !== null
        ? avgConf >= 85 ? '#166534' : avgConf >= 70 ? '#854d0e' : '#991b1b'
        : '#a09a94',
      icon: <ConfIcon />,
    },
    {
      label: 'Time Saved',
      value: timeSavedStr,
      sub: 'est. at 2 min/tx',
      color: timeSavedMin > 0 ? '#2d5a27' : '#a09a94',
      icon: <ClockIcon />,
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-xl border px-4 py-4 flex flex-col gap-2"
          style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
        >
          <span style={{ color: '#a09a94' }}>{s.icon}</span>
          <div>
            <p className="font-mono text-2xl font-semibold leading-none" style={{ color: s.color }}>
              {s.value}
            </p>
            <p className="text-xs font-medium mt-1" style={{ color: '#1a1714' }}>{s.label}</p>
            <p className="text-xs mt-0.5" style={{ color: '#a09a94' }}>{s.sub}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function SkeletonCard() {
  return (
    <div
      className="rounded-xl border p-5 space-y-3 animate-pulse"
      style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
    >
      <div className="flex justify-between">
        <div className="h-4 w-2/5 rounded-md" style={{ backgroundColor: '#f0ece4' }} />
        <div className="h-5 w-16 rounded-full" style={{ backgroundColor: '#f0ece4' }} />
      </div>
      <div className="h-3 w-1/4 rounded-md" style={{ backgroundColor: '#f0ece4' }} />
      <div className="flex gap-2 pt-1">
        <div className="h-3 w-10 rounded" style={{ backgroundColor: '#f0ece4' }} />
        <div className="h-3 w-14 rounded" style={{ backgroundColor: '#f0ece4' }} />
        <div className="h-3 w-12 rounded" style={{ backgroundColor: '#f0ece4' }} />
      </div>
      <div className="h-1.5 w-full rounded-full mt-1" style={{ backgroundColor: '#f0ece4' }} />
    </div>
  )
}

function StatSkeleton() {
  return (
    <div
      className="rounded-xl border px-4 py-4 space-y-2 animate-pulse"
      style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
    >
      <div className="h-3 w-3 rounded" style={{ backgroundColor: '#f0ece4' }} />
      <div className="h-7 w-12 rounded-md" style={{ backgroundColor: '#f0ece4' }} />
      <div className="h-3 w-24 rounded" style={{ backgroundColor: '#f0ece4' }} />
      <div className="h-3 w-16 rounded" style={{ backgroundColor: '#f0ece4' }} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Quick Actions
// ---------------------------------------------------------------------------

function QuickActions({ onPortalClick }: { onPortalClick: () => void }) {
  const actions = [
    {
      href: '/dashboard/upload',
      label: 'New Close',
      sub: 'Upload a bank statement',
      icon: <NewCloseIcon />,
      iconBg: '#e8f0e6',
      arrow: true,
    },
    {
      href: '/dashboard/clients',
      label: 'Clients',
      sub: 'Manage your client list',
      icon: <ClientsNavIcon />,
      iconBg: '#fdf2e9',
      arrow: true,
    },
    {
      href: '/demo',
      label: 'View Demo',
      sub: 'See the AI in action',
      icon: <DemoIcon />,
      iconBg: '#f5f0ea',
      arrow: true,
    },
  ]

  return (
    <div>
      <h2
        className="text-xs font-semibold tracking-widest uppercase mb-3"
        style={{ color: '#a09a94' }}
      >
        Quick Actions
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {actions.map((a) => (
          <Link
            key={a.label}
            href={a.href}
            className="group flex items-center gap-3 rounded-xl border px-4 py-3.5 transition-all"
            style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#b8734a'
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(184,115,74,0.08)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e8e0d4'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
              style={{ backgroundColor: a.iconBg }}
            >
              {a.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-tight" style={{ color: '#1a1714' }}>{a.label}</p>
              <p className="text-xs mt-0.5" style={{ color: '#a09a94' }}>{a.sub}</p>
            </div>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: '#c4bdb8', transition: 'transform 0.15s', flexShrink: 0 }}
              className="group-hover:translate-x-0.5">
              <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        ))}

        {/* Portal link — button, not href */}
        <button
          onClick={onPortalClick}
          className="group flex items-center gap-3 rounded-xl border px-4 py-3.5 transition-all text-left w-full"
          style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#b8734a'
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(184,115,74,0.08)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e8e0d4'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
            style={{ backgroundColor: '#e8f0e6' }}
          >
            <LinkIcon />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-tight" style={{ color: '#1a1714' }}>Client Portal Link</p>
            <p className="text-xs mt-0.5" style={{ color: '#a09a94' }}>Share a secure upload link</p>
          </div>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: '#c4bdb8', flexShrink: 0 }}>
            <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Job card
// ---------------------------------------------------------------------------

function JobCard({ job, onDelete }: { job: CategorizationJob; onDelete: (id: string) => void }) {
  const router = useRouter()
  const pct = progressPercent(job)
  const s = STATUS_STYLE[job.status]
  const pending = job.total_transactions - job.approved - job.flagged

  return (
    <div
      className="group rounded-xl border p-5 cursor-pointer transition-all duration-150"
      style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
      onClick={() => router.push(`/dashboard/review/${job.id}`)}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#b8734a'
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(184,115,74,0.1)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#e8e0d4'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-sm truncate" style={{ color: '#1a1714' }}>
              {job.client_name}
            </h3>
            <span
              className="shrink-0 inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: s.bg, color: s.text }}
            >
              <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: s.dot }} />
              {s.label}
            </span>
          </div>
          <p className="text-xs mt-0.5" style={{ color: '#a09a94' }}>{formatDate(job.created_at)}</p>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onDelete(job.id) }}
          className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 p-1 rounded"
          title="Delete"
          style={{ color: '#c4bdb8' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#dc2626' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#c4bdb8' }}
        >
          <TrashIcon />
        </button>
      </div>

      {/* Transaction counts */}
      <div className="flex gap-3 mt-3 flex-wrap">
        <Pill value={job.total_transactions} label="total" color="#6b6560" />
        <Pill value={job.approved} label="approved" color="#166534" />
        {pending > 0 && <Pill value={pending} label="pending" color="#854d0e" />}
        {job.flagged > 0 && <Pill value={job.flagged} label="flagged" color="#991b1b" />}
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="flex justify-between text-xs mb-1.5" style={{ color: '#c4bdb8' }}>
          <span>Review progress</span>
          <span className="font-mono" style={{ color: pct === 100 ? '#059669' : '#6b6560' }}>
            {pct}%
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#f0ece4' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              backgroundColor: pct === 100 ? '#059669' : pct >= 50 ? '#2d5a27' : '#b8734a',
            }}
          />
        </div>
      </div>
    </div>
  )
}

function Pill({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <span className="text-xs" style={{ color: '#a09a94' }}>
      <span className="font-mono font-semibold" style={{ color }}>{value}</span>
      {' '}{label}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Client Portal section
// ---------------------------------------------------------------------------

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'my-firm'
}

function ClientPortalSection({ sectionRef }: { sectionRef: React.RefObject<HTMLDivElement> }) {
  const [firmName, setFirmName]   = useState('')
  const [copied, setCopied]       = useState(false)
  const [generated, setGenerated] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function getOrigin() {
    if (typeof window !== 'undefined') return window.location.origin
    return 'http://localhost:3000'
  }

  function handleGenerate() {
    const slug = slugify(firmName || 'my-firm')
    const url  = `${getOrigin()}/portal/${slug}`
    setGenerated(url)
    setCopied(false)
  }

  async function handleCopy() {
    if (!generated) return
    try {
      await navigator.clipboard.writeText(generated)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      inputRef.current?.select()
    }
  }

  return (
    <div
      ref={sectionRef}
      id="portal"
      className="rounded-2xl border p-6"
      style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
    >
      <div className="flex items-start gap-3 mb-5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: '#e8f0e6' }}
        >
          <LinkIcon />
        </div>
        <div>
          <h2 className="text-sm font-semibold" style={{ color: '#1a1714' }}>
            Client Upload Portal
          </h2>
          <p className="text-xs mt-0.5" style={{ color: '#a09a94' }}>
            Generate a secure link your clients can use to send you bank statements — no login needed.
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={firmName}
          onChange={(e) => { setFirmName(e.target.value); setGenerated(null) }}
          onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          placeholder="Your firm name (e.g. Smith CPA)"
          className="flex-1 rounded-xl border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 transition-colors"
          style={{ borderColor: '#e8e0d4', backgroundColor: '#faf8f4', color: '#1a1714' }}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#2d5a27' }}
          onBlur={(e)  => { e.currentTarget.style.borderColor = '#e8e0d4' }}
        />
        <button
          onClick={handleGenerate}
          className="shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-colors"
          style={{ backgroundColor: '#2d5a27' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1e3d1a' }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2d5a27' }}
        >
          Get Link
        </button>
      </div>

      {generated && (
        <div className="mt-3">
          <div
            className="flex items-center gap-2 rounded-xl border px-3.5 py-2.5"
            style={{ borderColor: '#d4e5d0', backgroundColor: '#f0f5ef' }}
          >
            <input
              ref={inputRef}
              readOnly
              value={generated}
              className="flex-1 text-sm bg-transparent focus:outline-none font-mono truncate"
              style={{ color: '#2d5a27' }}
              onClick={(e) => e.currentTarget.select()}
            />
            <button
              onClick={handleCopy}
              className="shrink-0 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
              style={{
                backgroundColor: copied ? '#2d5a27' : '#ffffff',
                color:           copied ? '#ffffff' : '#2d5a27',
                border: '1px solid #2d5a27',
              }}
            >
              {copied ? <CheckSmallIcon /> : <CopyIcon />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <LockSmallIcon />
            <p className="text-xs" style={{ color: '#a09a94' }}>
              Anyone with this link can submit documents. Share it directly with clients.
            </p>
          </div>
          <a
            href={generated}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs mt-1.5 transition-colors"
            style={{ color: '#2d5a27' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#1e3d1a' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#2d5a27' }}
          >
            Preview portal →
          </a>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const [jobs, setJobs]                 = useState<CategorizationJob[]>([])
  const [mounted, setMounted]           = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [qboConn, setQboConn]           = useState<QBOConnection | null>(null)
  const [activeTab, setActiveTab]       = useState<'overview' | 'war-room'>('overview')
  const [corrStats, setCorrStats]       = useState<CorrectionStats | null>(null)
  const portalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Show localStorage data immediately for instant UI, then merge Supabase data
    const localJobs = getJobs()
    setJobs(localJobs)
    setQboConn(getQBOConnection())
    setCorrStats(getCorrectionStats())
    setMounted(true)
    if (needsOnboarding()) setShowOnboarding(true)
    // Load from Supabase in background — replaces local list if successful
    dbGetJobs().then((remoteJobs) => {
      if (remoteJobs.length > 0) {
        // Merge: remote jobs take precedence, but preserve localStorage transactions
        // for jobs that are missing them from the remote listing
        setJobs(remoteJobs.map(rj => {
          const local = localJobs.find(lj => lj.id === rj.id)
          return (local && rj.transactions.length === 0) ? { ...rj, transactions: local.transactions } : rj
        }))
      }
    }).catch(() => { /* keep localStorage jobs */ })
  }, [])

  function handleDelete(id: string) {
    dbDeleteJob(id).catch(() => { /* localStorage fallback already handled */ })
    setJobs((prev) => prev.filter((j) => j.id !== id))
  }

  function handleOnboardingClose() {
    setShowOnboarding(false)
  }

  function scrollToPortal() {
    portalRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setTimeout(() => {
      portalRef.current?.querySelector('input')?.focus()
    }, 400)
  }

  const recent = jobs.slice(0, 20)
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#faf8f4' }}>
      {showOnboarding && <OnboardingModal onClose={handleOnboardingClose} />}
      <DashboardNav onHelpClick={() => setShowOnboarding(true)} />

      <main className="flex-1 max-w-4xl mx-auto w-full px-5 py-10 space-y-8 page-enter">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium" style={{ color: '#b8734a' }}>
              {mounted ? greeting : <span className="inline-block w-28 h-4 rounded animate-pulse" style={{ backgroundColor: '#f0ece4' }} />}
            </p>
            <h1
              className="text-3xl mt-0.5"
              style={{
                fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
                color: '#1a1714',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
              }}
            >
              Your closes.
            </h1>
          </div>
          <Link
            href="/dashboard/upload"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white shrink-0"
            style={{ backgroundColor: '#2d5a27' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1e3d1a' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2d5a27' }}
          >
            <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
            New Close
          </Link>
        </div>

        {/* Stats */}
        {!mounted ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[0, 1, 2, 3].map((i) => <StatSkeleton key={i} />)}
          </div>
        ) : jobs.length > 0 ? (
          <SummaryStats jobs={jobs} />
        ) : null}

        {/* Cumulative ROI strip */}
        {mounted && jobs.length > 0 && (() => {
          const roi = calcCumulativeROI(jobs)
          if (roi.hoursSaved < 0.1) return null
          const autoPct = roi.totalTx > 0 ? Math.round((roi.autoApproved / roi.totalTx) * 100) : 0
          return (
            <div
              className="flex flex-wrap items-center gap-4 rounded-xl border px-5 py-4"
              style={{ borderColor: '#d4e8d0', backgroundColor: '#f0f7ee' }}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" fill="#2d5a27" />
                  <path d="M5 9l1.5-3L8 8.5l1.5-4L11 9" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#2d5a27' }}>
                  AI Savings
                </span>
              </div>
              <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1 flex-1">
                <span className="text-sm font-bold tabular-nums" style={{ color: '#2d5a27' }}>
                  {fmtHours(roi.hoursSaved)} saved
                </span>
                <span className="text-sm font-bold tabular-nums" style={{ color: '#2d5a27' }}>
                  ${roi.valueSaved.toLocaleString()} recovered
                </span>
                <span className="text-xs" style={{ color: '#4a7c43' }}>
                  {roi.autoApproved.toLocaleString()} of {roi.totalTx.toLocaleString()} auto-approved ({autoPct}%)
                </span>
              </div>
            </div>
          )
        })()}

        {/* Connected integrations strip */}
        {mounted && qboConn && (
          <div
            className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3"
            style={{ borderColor: '#bbf7d0', backgroundColor: '#f0fdf4' }}
          >
            <div className="flex items-center gap-2.5">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" fill="#2CA01C" />
                <path d="M4.5 8l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-sm font-medium" style={{ color: '#14532d' }}>
                QuickBooks Online connected
              </span>
              <span className="text-xs font-mono" style={{ color: '#6b7280' }}>
                {qboConn.companyName}
              </span>
              {qboConn.totalSynced > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>
                  {qboConn.totalSynced.toLocaleString()} synced
                </span>
              )}
            </div>
            <Link
              href="/dashboard/integrations"
              className="text-xs transition-colors"
              style={{ color: '#2CA01C' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#166534' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#2CA01C' }}
            >
              Manage →
            </Link>
          </div>
        )}

        {/* Tab bar */}
        {mounted && jobs.length > 1 && (
          <div className="flex gap-1 border-b" style={{ borderColor: '#e8e0d4' }}>
            {([['overview', 'Overview'], ['war-room', 'Practice View']] as const).map(([tab, label]) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="px-4 py-2.5 text-sm font-medium transition-colors -mb-px border-b-2"
                style={{
                  color: activeTab === tab ? '#2d5a27' : '#6b6560',
                  borderBottomColor: activeTab === tab ? '#2d5a27' : 'transparent',
                  backgroundColor: 'transparent',
                }}
                onMouseEnter={(e) => { if (activeTab !== tab) e.currentTarget.style.color = '#1a1714' }}
                onMouseLeave={(e) => { if (activeTab !== tab) e.currentTarget.style.color = '#6b6560' }}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* War Room tab */}
        {mounted && activeTab === 'war-room' && jobs.length > 0 && (
          <WarRoomView jobs={jobs} />
        )}

        {/* Overview tab (default) */}
        {(activeTab === 'overview' || !mounted || jobs.length <= 1) && (
          <>

        {/* Quick Actions */}
        <QuickActions onPortalClick={scrollToPortal} />

        {/* Client Portal */}
        {mounted && <ClientPortalSection sectionRef={portalRef} />}

        {/* Recent closes */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2
              className="text-xs font-semibold tracking-widest uppercase"
              style={{ color: '#a09a94' }}
            >
              Recent Closes
            </h2>
            {mounted && recent.length > 0 && (
              <span className="text-xs" style={{ color: '#a09a94' }}>
                {recent.length} {recent.length === 1 ? 'client' : 'clients'}
              </span>
            )}
          </div>

          {!mounted ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : recent.length === 0 ? (
            <div
              className="rounded-2xl border-2 border-dashed px-8 py-16 text-center"
              style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
            >
              <LedgerEmptyIcon />
              <p
                className="text-lg mt-4"
                style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif', color: '#1a1714' }}
              >
                No closes yet
              </p>
              <p className="text-sm mt-1.5 mb-6" style={{ color: '#6b6560' }}>
                Upload a client&apos;s bank statement to start categorizing.
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <Link
                  href="/dashboard/upload"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white"
                  style={{ backgroundColor: '#2d5a27' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1e3d1a' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2d5a27' }}
                >
                  Start your first close
                </Link>
                <Link
                  href="/demo"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border transition-colors"
                  style={{ borderColor: '#b8734a', color: '#b8734a', backgroundColor: '#ffffff' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fdf2e9' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff' }}
                >
                  See Demo
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recent.map((job) => (
                <JobCard key={job.id} job={job} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>

        {/* Firm Intelligence Card */}
        {mounted && corrStats && corrStats.totalCorrections > 0 && (
          <FirmIntelligenceCard stats={corrStats} />
        )}

        {/* Activity feed */}
        {mounted && (
          <div
            className="rounded-2xl border p-5"
            style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
          >
            <ActivityFeed limit={8} />
          </div>
        )}

          </> // end overview tab
        )}

      </main>
      <AppFooter />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Firm Intelligence Card
// ---------------------------------------------------------------------------

function FirmIntelligenceCard({ stats }: { stats: CorrectionStats }) {
  const { totalCorrections, estimatedAccuracy, topCorrectedFrom } = stats
  const barWidth = Math.round(((estimatedAccuracy - 80) / 17) * 100) // map 80-97 → 0-100%

  return (
    <div
      className="rounded-2xl border p-5 space-y-4"
      style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: '#f0f7ee' }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="6" r="3" stroke="#2d5a27" strokeWidth="1.4" />
              <path d="M3 13c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="#2d5a27" strokeWidth="1.4" strokeLinecap="round" />
              <path d="M11 2l1 1-3 3" stroke="#2d5a27" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: '#1a1714' }}>Firm Intelligence</p>
            <p className="text-xs mt-0.5" style={{ color: '#a09a94' }}>
              AI is learning your firm&apos;s preferences
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold tabular-nums" style={{ color: '#2d5a27' }}>
            {estimatedAccuracy}%
          </p>
          <p className="text-xs mt-0.5" style={{ color: '#6b6560' }}>est. accuracy</p>
        </div>
      </div>

      {/* Accuracy bar */}
      <div>
        <div className="flex justify-between text-xs mb-1.5" style={{ color: '#a09a94' }}>
          <span>Model calibration</span>
          <span>{totalCorrections} correction{totalCorrections !== 1 ? 's' : ''} applied</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#f0ece4' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${barWidth}%`, backgroundColor: '#2d5a27' }}
          />
        </div>
        <div className="flex justify-between text-xs mt-1" style={{ color: '#c4bdb8' }}>
          <span>Baseline 82%</span>
          <span>Target 97%</span>
        </div>
      </div>

      {topCorrectedFrom.length > 0 && (
        <div>
          <p className="text-xs font-medium mb-2" style={{ color: '#6b6560' }}>
            Frequently adjusted categories
          </p>
          <div className="flex flex-wrap gap-1.5">
            {topCorrectedFrom.map((c) => (
              <span
                key={c.category}
                className="px-2 py-1 rounded-lg text-xs"
                style={{ backgroundColor: '#faf8f4', color: '#6b6560', border: '1px solid #e8e0d4' }}
              >
                {c.category}
                <span className="ml-1 font-medium" style={{ color: '#b8734a' }}>×{c.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs" style={{ color: '#a09a94' }}>
        Every correction trains the AI to match your firm&apos;s categorization style. The more you use CloseBooks, the less you&apos;ll need to correct.
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// War Room
// ---------------------------------------------------------------------------

const WAR_ROOM_STYLE: Record<CloseStatus, { bg: string; text: string; dot: string; label: string; border: string }> = {
  needs_review:    { bg: '#fef2f2', text: '#991b1b', dot: '#ef4444', label: 'Needs Review',    border: '#fca5a5' },
  in_progress:     { bg: '#fff7ed', text: '#9a3412', dot: '#f97316', label: 'In Progress',      border: '#fed7aa' },
  not_started:     { bg: '#f5f5f5', text: '#525252', dot: '#a3a3a3', label: 'Not Started',      border: '#e5e5e5' },
  ready_to_export: { bg: '#eff6ff', text: '#1e40af', dot: '#3b82f6', label: 'Ready to Export',  border: '#bfdbfe' },
  complete:        { bg: '#ecfdf5', text: '#065f46', dot: '#059669', label: 'Complete',          border: '#6ee7b7' },
}

function WarRoomView({ jobs }: { jobs: CategorizationJob[] }) {
  const router = useRouter()
  const statuses = getClientCloseStatuses(jobs)

  const counts = statuses.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] ?? 0) + 1
    return acc
  }, {} as Record<CloseStatus, number>)

  return (
    <div className="space-y-5">
      {/* Summary pills */}
      <div className="flex flex-wrap gap-2">
        {(Object.entries(WAR_ROOM_STYLE) as [CloseStatus, typeof WAR_ROOM_STYLE[CloseStatus]][])
          .filter(([status]) => counts[status] > 0)
          .map(([status, s]) => (
            <div
              key={status}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border"
              style={{ backgroundColor: s.bg, color: s.text, borderColor: s.border }}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.dot }} />
              {counts[status]} {s.label}
            </div>
          ))}
      </div>

      {/* Client list */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#e8e0d4' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: '#faf8f4', borderBottom: '1px solid #e8e0d4' }}>
              <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wider" style={{ color: '#6b6560' }}>Client</th>
              <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wider" style={{ color: '#6b6560' }}>Status</th>
              <th className="px-4 py-3 text-right font-medium text-xs uppercase tracking-wider hidden sm:table-cell" style={{ color: '#6b6560' }}>Progress</th>
              <th className="px-4 py-3 text-right font-medium text-xs uppercase tracking-wider hidden sm:table-cell" style={{ color: '#6b6560' }}>Flagged</th>
              <th className="px-4 py-3 text-right font-medium text-xs uppercase tracking-wider hidden md:table-cell" style={{ color: '#6b6560' }}>Last Updated</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {statuses.map((cs, i) => {
              const s = WAR_ROOM_STYLE[cs.status]
              return (
                <tr
                  key={cs.clientName}
                  className="cursor-pointer transition-colors"
                  style={{
                    borderBottom: i < statuses.length - 1 ? '1px solid #f0ece4' : 'none',
                    backgroundColor: '#ffffff',
                  }}
                  onClick={() => cs.job && router.push(`/dashboard/review/${cs.job.id}`)}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#faf8f4' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff' }}
                >
                  <td className="px-4 py-3.5">
                    <span className="font-medium" style={{ color: '#1a1714' }}>{cs.clientName}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border"
                      style={{ backgroundColor: s.bg, color: s.text, borderColor: s.border }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.dot }} />
                      {s.label}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 hidden sm:table-cell">
                    <div className="flex items-center gap-2 justify-end">
                      <div
                        className="w-20 h-1.5 rounded-full overflow-hidden"
                        style={{ backgroundColor: '#f0ece4' }}
                      >
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${cs.reviewPct}%`,
                            backgroundColor: cs.reviewPct === 100 ? '#059669' : '#2d5a27',
                          }}
                        />
                      </div>
                      <span className="text-xs tabular-nums" style={{ color: '#6b6560' }}>
                        {cs.reviewPct}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-right hidden sm:table-cell">
                    {cs.flagged > 0 ? (
                      <span className="text-xs font-medium tabular-nums" style={{ color: '#dc2626' }}>
                        {cs.flagged} flagged
                      </span>
                    ) : (
                      <span style={{ color: '#a09a94' }}>—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-right hidden md:table-cell text-xs" style={{ color: '#a09a94' }}>
                    {cs.lastJobDate
                      ? new Date(cs.lastJobDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      : '—'}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: '#c4bdb8', display: 'inline' }}>
                      <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 3.5h10M5.5 3.5V2.5h3v1M11 3.5l-.6 7.5a.5.5 0 01-.5.5H4.1a.5.5 0 01-.5-.5L3 3.5"
        stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function LedgerEmptyIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" className="mx-auto opacity-40">
      <rect x="6" y="3" width="24" height="32" rx="3" stroke="#b8734a" strokeWidth="1.8" fill="none" />
      <path d="M12 12h12M12 18h12M12 24h8" stroke="#b8734a" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="34" cy="34" r="8" fill="#fdf2e9" stroke="#b8734a" strokeWidth="1.5" />
      <path d="M31 34h6M34 31v6" stroke="#b8734a" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function ClientsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M1 13c0-2.761 2.239-5 5-5s5 2.239 5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="12" cy="5" r="1.8" stroke="currentColor" strokeWidth="1.2" />
      <path d="M14 13c0-1.657-1.343-3-3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function TxIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M4 8h8M4 11h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M4 5h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function ConfIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5.5 8.5l2 2 3-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 5v3.5l2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function LinkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M6.5 9.5a3.536 3.536 0 005 0l2-2a3.536 3.536 0 00-5-5L7.5 3.5"
        stroke="#2d5a27" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M9.5 6.5a3.536 3.536 0 00-5 0l-2 2a3.536 3.536 0 005 5l1-1"
        stroke="#2d5a27" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function NewCloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="2" width="12" height="12" rx="2.5" stroke="#2d5a27" strokeWidth="1.3" />
      <path d="M8 5v6M5 8h6" stroke="#2d5a27" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function ClientsNavIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="6" cy="5" r="2.5" stroke="#b8734a" strokeWidth="1.3" />
      <path d="M1 13c0-2.761 2.239-5 5-5s5 2.239 5 5" stroke="#b8734a" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="12" cy="5" r="1.8" stroke="#b8734a" strokeWidth="1.2" />
      <path d="M14 13c0-1.657-1.343-3-3-3" stroke="#b8734a" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function DemoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M6 4l6 4-6 4V4z" stroke="#6b6560" strokeWidth="1.3" strokeLinejoin="round" fill="none" />
      <circle cx="8" cy="8" r="6.5" stroke="#6b6560" strokeWidth="1.3" />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <rect x="4" y="4" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <path d="M3 8H2a1 1 0 01-1-1V2a1 1 0 011-1h5a1 1 0 011 1v1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function CheckSmallIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function LockSmallIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
      <rect x="1.5" y="4.5" width="8" height="6" rx="1.2" stroke="#a09a94" strokeWidth="1.1" />
      <path d="M3.5 4.5V3a2 2 0 014 0v1.5" stroke="#a09a94" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  )
}
