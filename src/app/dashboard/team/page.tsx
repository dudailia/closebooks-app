'use client'

import { useState, useEffect } from 'react'
import { SkeletonBlock, SkeletonTable } from '@/components/Skeleton'
import { getJobs } from '@/lib/storage'
import { getTeamMembers, saveTeamMembers } from '@/lib/teamStore'
import { useSubscription } from '@/contexts/SubscriptionContext'
import Link from 'next/link'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Role = 'Owner' | 'Reviewer' | 'Staff'

interface TeamMember {
  id: string
  name: string
  email: string
  role: Role
  assignedClients: string[]
  addedAt: string
  initials: string
  color: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const ROLE_COLORS: Record<Role, string> = {
  Owner:    '#2d5a27',
  Reviewer: '#b8734a',
  Staff:    '#6b6560',
}

const ROLE_BG: Record<Role, string> = {
  Owner:    '#e8f0e6',
  Reviewer: '#fdf2e9',
  Staff:    '#f5f3f1',
}

const DEMO_MEMBER: TeamMember = {
  id:              'demo-1',
  name:            'Sarah Chen',
  email:           'sarah@example.com',
  role:            'Reviewer',
  assignedClients: [],
  addedAt:         new Date().toISOString(),
  initials:        'SC',
  color:           '#2d5a27',
}

const ROLE_PERMISSIONS: { role: Role; perms: string[] }[] = [
  {
    role:  'Owner',
    perms: [
      'Full access to all features',
      'Manage billing & subscription',
      'Change firm settings',
      'Invite & remove team members',
      'Approve any transaction',
    ],
  },
  {
    role:  'Reviewer',
    perms: [
      'Review & approve transactions',
      'View all clients',
      'Add comments & notes',
      'Export reports',
      'Cannot change billing or settings',
    ],
  },
  {
    role:  'Staff',
    perms: [
      'View assigned clients only',
      'Upload documents',
      'Add comments on assigned clients',
      'Cannot approve transactions',
      'Cannot view billing or settings',
    ],
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function loadMembers(): TeamMember[] {
  let m = getTeamMembers() as TeamMember[]
  if (m.length === 0) {
    m = [DEMO_MEMBER]
    saveTeamMembers(m)
  }
  return m
}

function loadClientNames(): string[] {
  const jobs = getJobs()
  return Array.from(new Set(jobs.map((j) => j.client_name).filter(Boolean)))
}

function makeInitials(name: string): string {
  return name.trim().slice(0, 2).toUpperCase() || '?'
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      year:  'numeric',
      month: 'short',
      day:   'numeric',
    })
  } catch {
    return iso
  }
}

const AVATAR_COLORS = [
  '#2d5a27', '#b8734a', '#4a6fa5', '#7b5ea7', '#c0554a',
  '#4a8f6f', '#8f6f4a', '#4a7a8f', '#6f4a8f', '#8f4a6f',
]

function pickColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffff
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

// ─────────────────────────────────────────────────────────────────────────────
// InviteModal
// ─────────────────────────────────────────────────────────────────────────────

function InviteModal({
  clients,
  onClose,
  onAdd,
}: {
  clients: string[]
  onClose: () => void
  onAdd:   (member: TeamMember) => void
}) {
  const [name,            setName]            = useState('')
  const [email,           setEmail]           = useState('')
  const [role,            setRole]            = useState<Role>('Staff')
  const [selectedClients, setSelectedClients] = useState<string[]>([])
  const [error,           setError]           = useState('')

  function toggleClient(c: string) {
    setSelectedClients((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimName  = name.trim()
    const trimEmail = email.trim()
    if (!trimName)  { setError('Name is required.'); return }
    if (!trimEmail) { setError('Email is required.'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimEmail)) {
      setError('Please enter a valid email address.')
      return
    }
    const member: TeamMember = {
      id:              `tm-${Date.now()}`,
      name:            trimName,
      email:           trimEmail,
      role,
      assignedClients: selectedClients,
      addedAt:         new Date().toISOString(),
      initials:        makeInitials(trimName),
      color:           pickColor(trimName),
    }
    onAdd(member)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(26,23,20,0.45)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-md rounded-2xl border shadow-xl overflow-hidden"
        style={{ backgroundColor: '#ffffff', borderColor: '#e8e0d4' }}
      >
        {/* Modal header */}
        <div
          className="px-6 py-4 border-b flex items-center justify-between"
          style={{ borderColor: '#f0ece4', backgroundColor: '#faf8f4' }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
              fontSize: '1.15rem',
              color: '#1a1714',
            }}
          >
            Invite Team Member
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: '#6b6560' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f0ece4' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <p className="text-sm rounded-lg px-3 py-2" style={{ color: '#991b1b', backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
              {error}
            </p>
          )}

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6b6560' }}>
              Full Name <span style={{ color: '#c0554a' }}>*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError('') }}
              placeholder="e.g. Jordan Lee"
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors"
              style={{ borderColor: '#e8e0d4', backgroundColor: '#faf8f4', color: '#1a1714' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#2d5a27' }}
              onBlur={(e)  => { e.currentTarget.style.borderColor = '#e8e0d4' }}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6b6560' }}>
              Email Address <span style={{ color: '#c0554a' }}>*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError('') }}
              placeholder="jordan@example.com"
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors"
              style={{ borderColor: '#e8e0d4', backgroundColor: '#faf8f4', color: '#1a1714' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#2d5a27' }}
              onBlur={(e)  => { e.currentTarget.style.borderColor = '#e8e0d4' }}
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6b6560' }}>
              Role
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Owner', 'Reviewer', 'Staff'] as Role[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className="rounded-lg border px-2 py-2 text-xs font-semibold transition-colors"
                  style={{
                    borderColor:     role === r ? ROLE_COLORS[r] : '#e8e0d4',
                    backgroundColor: role === r ? ROLE_BG[r]     : '#ffffff',
                    color:           role === r ? ROLE_COLORS[r] : '#6b6560',
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
            <p className="text-xs mt-1.5" style={{ color: '#a09a94' }}>
              {role === 'Owner'    && 'Full access including billing and settings.'}
              {role === 'Reviewer' && 'Can review and approve transactions, view all clients.'}
              {role === 'Staff'    && 'Can only view clients they are assigned to.'}
            </p>
          </div>

          {/* Assign clients */}
          {clients.length > 0 && (
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6b6560' }}>
                Assign Clients <span style={{ color: '#a09a94', fontWeight: 400 }}>(optional)</span>
              </label>
              <div
                className="rounded-lg border p-2 max-h-32 overflow-y-auto space-y-1"
                style={{ borderColor: '#e8e0d4', backgroundColor: '#faf8f4' }}
              >
                {clients.map((c) => {
                  const checked = selectedClients.includes(c)
                  return (
                    <label
                      key={c}
                      className="flex items-center gap-2 px-2 py-1 rounded cursor-pointer transition-colors text-sm"
                      style={{ color: '#1a1714' }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f0ece4' }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleClient(c)}
                        className="accent-green-700 shrink-0"
                        style={{ accentColor: '#2d5a27' }}
                      />
                      {c}
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
              style={{ borderColor: '#e8e0d4', color: '#6b6560', backgroundColor: '#ffffff' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#faf8f4' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors"
              style={{ backgroundColor: '#2d5a27' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1e3d1a' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2d5a27' }}
            >
              Send Invite
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MemberCard
// ─────────────────────────────────────────────────────────────────────────────

function MemberCard({
  member,
  onRemove,
}: {
  member:   TeamMember
  onRemove: (id: string) => void
}) {
  const MAX_SHOWN   = 3
  const shown       = member.assignedClients.slice(0, MAX_SHOWN)
  const overflow    = member.assignedClients.length - MAX_SHOWN

  return (
    <div
      className="rounded-xl border p-5 flex flex-col gap-4 transition-shadow hover:shadow-md"
      style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
    >
      {/* Top row: avatar + info + remove */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
            style={{ backgroundColor: member.color }}
          >
            {member.initials}
          </div>
          {/* Name + email */}
          <div>
            <p className="text-sm font-semibold leading-tight" style={{ color: '#1a1714' }}>
              {member.name}
            </p>
            <p className="text-xs mt-0.5 truncate max-w-[180px]" style={{ color: '#6b6560' }}>
              {member.email}
            </p>
          </div>
        </div>

        {/* Remove button */}
        <button
          onClick={() => onRemove(member.id)}
          className="w-7 h-7 flex items-center justify-center rounded-lg border transition-colors shrink-0 mt-0.5"
          style={{ borderColor: '#e8e0d4', color: '#a09a94', backgroundColor: 'transparent' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#fef2f2'
            e.currentTarget.style.borderColor     = '#fecaca'
            e.currentTarget.style.color           = '#991b1b'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.borderColor     = '#e8e0d4'
            e.currentTarget.style.color           = '#a09a94'
          }}
          aria-label={`Remove ${member.name}`}
          title="Remove member"
        >
          <TrashIcon />
        </button>
      </div>

      {/* Role badge */}
      <div className="flex items-center gap-2">
        <span
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
          style={{
            backgroundColor: ROLE_BG[member.role],
            color:           ROLE_COLORS[member.role],
          }}
        >
          {member.role}
        </span>
      </div>

      {/* Assigned clients */}
      <div>
        <p className="text-xs font-semibold mb-1.5" style={{ color: '#a09a94' }}>
          Assigned Clients
        </p>
        {member.assignedClients.length === 0 ? (
          <p className="text-xs" style={{ color: '#c4bdb8' }}>None assigned</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {shown.map((c) => (
              <span
                key={c}
                className="inline-flex items-center px-2 py-0.5 rounded-md text-xs border"
                style={{ borderColor: '#e8e0d4', backgroundColor: '#faf8f4', color: '#6b6560' }}
              >
                {c}
              </span>
            ))}
            {overflow > 0 && (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-md text-xs border"
                style={{ borderColor: '#e8e0d4', backgroundColor: '#faf8f4', color: '#a09a94' }}
              >
                +{overflow} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Added date */}
      <p className="text-xs" style={{ color: '#c4bdb8' }}>
        Added {formatDate(member.addedAt)}
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────────────────────

function EmptyState({ onInvite }: { onInvite: () => void }) {
  return (
    <div
      className="rounded-2xl border p-12 flex flex-col items-center text-center"
      style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff', borderStyle: 'dashed' }}
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ backgroundColor: '#e8f0e6' }}
      >
        <TeamIcon />
      </div>
      <p className="text-base font-semibold mb-1" style={{ color: '#1a1714' }}>
        No team members yet
      </p>
      <p className="text-sm mb-5 max-w-xs" style={{ color: '#6b6560' }}>
        Invite your first team member to start collaborating.
      </p>
      <button
        onClick={onInvite}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
        style={{ backgroundColor: '#2d5a27' }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1e3d1a' }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2d5a27' }}
      >
        <PlusIcon />
        Invite Member
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Role permissions info box
// ─────────────────────────────────────────────────────────────────────────────

function RolePermissionsBox() {
  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
    >
      <div
        className="px-5 py-4 border-b"
        style={{ borderColor: '#f0ece4', backgroundColor: '#faf8f4' }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#a09a94' }}>
          Role Permissions
        </p>
        <p className="text-xs mt-0.5" style={{ color: '#c4bdb8' }}>
          What each role can do in CloseBooks
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x" style={{ '--tw-divide-opacity': 1, borderColor: '#f0ece4' } as React.CSSProperties}>
        {ROLE_PERMISSIONS.map(({ role, perms }) => (
          <div key={role} className="px-5 py-4" style={{ borderColor: '#f0ece4' }}>
            <div className="flex items-center gap-2 mb-3">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: ROLE_COLORS[role] }}
              />
              <span className="text-sm font-semibold" style={{ color: ROLE_COLORS[role] }}>
                {role}
              </span>
            </div>
            <ul className="space-y-1.5">
              {perms.map((perm) => (
                <li key={perm} className="flex items-start gap-1.5 text-xs" style={{ color: '#6b6560' }}>
                  <span className="mt-0.5 shrink-0" style={{ color: '#c4bdb8' }}>•</span>
                  {perm}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export default function TeamPage() {
  const { subscription, loading: subLoading } = useSubscription()
  const [members,     setMembers]     = useState<TeamMember[]>([])
  const [clients,     setClients]     = useState<string[]>([])
  const [showModal,   setShowModal]   = useState(false)
  const [mounted,     setMounted]     = useState(false)

  useEffect(() => {
    setMounted(true)
    setMembers(loadMembers())
    setClients(loadClientNames())
  }, [])

  function handleAdd(member: TeamMember) {
    const maxU = subscription.maxUsers
    if (!subLoading && maxU > 0 && maxU < 999999 && members.length >= maxU) {
      alert(`Your plan allows ${maxU} team member(s). Upgrade for more seats.`)
      return
    }
    const updated = [...members, member]
    setMembers(updated)
    saveTeamMembers(updated)
  }

  function handleRemove(id: string) {
    const updated = members.filter((m) => m.id !== id)
    setMembers(updated)
    saveTeamMembers(updated)
  }

  if (!mounted) return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
      <SkeletonBlock height={32} width={160} style={{ marginBottom: 8 }} />
      <SkeletonBlock height={16} width={260} style={{ marginBottom: 32 }} />
      <SkeletonTable rows={5} cols={4} />
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col page-content" style={{ backgroundColor: '#faf8f4' }}>

      <main className="flex-1 max-w-5xl mx-auto w-full px-5 py-8 space-y-6 page-enter">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1
              style={{
                fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
                fontSize: '1.6rem',
                color: '#1a1714',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
              }}
            >
              Team
            </h1>
            <p className="text-sm mt-1" style={{ color: '#6b6560' }}>
              Manage team members and assign clients
            </p>
          </div>

          {!subLoading && subscription.maxUsers > 0 && members.length >= subscription.maxUsers && subscription.maxUsers < 999999 ? (
            <Link
              href="/pricing"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white shrink-0"
              style={{ backgroundColor: '#b8734a' }}
            >
              Upgrade for more seats
            </Link>
          ) : (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors shrink-0"
              style={{ backgroundColor: '#2d5a27' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1e3d1a' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2d5a27' }}
            >
              <PlusIcon />
              Invite Member
            </button>
          )}
        </div>

        {/* Stats strip */}
        {mounted && members.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {(
              [
                {
                  label: 'Total Members',
                  value: members.length,
                  color: '#1a1714',
                },
                {
                  label: 'Owners',
                  value: members.filter((m) => m.role === 'Owner').length,
                  color: ROLE_COLORS.Owner,
                },
                {
                  label: 'Staff',
                  value: members.filter((m) => m.role === 'Staff').length,
                  color: ROLE_COLORS.Staff,
                },
              ] as { label: string; value: number; color: string }[]
            ).map(({ label, value, color }) => (
              <div
                key={label}
                className="rounded-xl border px-4 py-3"
                style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
              >
                <p className="font-mono text-2xl font-bold" style={{ color }}>
                  {value}
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#6b6560' }}>
                  {label}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Member grid or empty state */}
        {!mounted ? (
          /* Skeleton while hydrating */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="rounded-xl border p-5 h-44 animate-pulse"
                style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
              />
            ))}
          </div>
        ) : members.length === 0 ? (
          <EmptyState onInvite={() => setShowModal(true)} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {members.map((m) => (
              <MemberCard key={m.id} member={m} onRemove={handleRemove} />
            ))}
          </div>
        )}

        {/* Role permissions box */}
        <RolePermissionsBox />

      </main>


      {/* Invite modal */}
      {showModal && (
        <InviteModal
          clients={clients}
          onClose={() => setShowModal(false)}
          onAdd={handleAdd}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────────────────

function PlusIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
      <path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M2 3.5h9M4.5 3.5V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v1M5 6v3.5M8 6v3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <rect x="2.5" y="3.5" width="8" height="7.5" rx="1" stroke="currentColor" strokeWidth="1.2" fill="none" />
    </svg>
  )
}

function TeamIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="9"  cy="7"  r="3.5" stroke="#2d5a27" strokeWidth="1.5" fill="none" />
      <circle cx="17" cy="8"  r="2.5" stroke="#2d5a27" strokeWidth="1.3" fill="none" />
      <path d="M2 19.5c0-3.5 3.1-6 7-6s7 2.5 7 6" stroke="#2d5a27" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M17 13.5c2.5.5 4 2 4 4" stroke="#2d5a27" strokeWidth="1.3" strokeLinecap="round" fill="none" />
    </svg>
  )
}
