import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { validateToken } from '@/lib/portal/auth'
import { getActionItems, getMessages, getDocuments, getServiceClient } from '@/lib/portal/storage'

interface Props { params: { token: string } }

function formatMoney(n: number) {
  if (Math.abs(n) >= 1000000) return `$${(n / 1000000).toFixed(1)}M`
  if (Math.abs(n) >= 1000) return `$${(n / 1000).toFixed(0)}K`
  return `$${n.toLocaleString()}`
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default async function PortalDashboard({ params }: Props) {
  const headersList = headers()
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined
  const session = await validateToken(params.token, ip)
  if (!session) redirect('/portal/invalid')

  // Load data in parallel
  const [actionItems, messages, documents] = await Promise.all([
    getActionItems(session.firmId, session.clientId),
    getMessages(session.firmId, session.clientId),
    getDocuments(session.firmId, session.clientId),
  ])

  // Close status from jobs table
  let closePercent = 0
  let closeStatus = 'No data yet'
  const sb = getServiceClient()
  if (sb) {
    const now = new Date()
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const { data: jobs } = await sb
      .from('jobs')
      .select('status')
      .eq('firm_id', session.firmId)
      .ilike('period', `${period}%`)
    if (jobs && jobs.length > 0) {
      const done = jobs.filter((j: { status: string }) => j.status === 'complete').length
      closePercent = Math.round((done / jobs.length) * 100)
      if (closePercent === 100) closeStatus = 'Complete'
      else if (closePercent > 0) closeStatus = 'In Progress'
      else closeStatus = 'Not Started'
    }
  }

  const pendingDocs = documents.filter(d => d.status === 'requested').length
  const openActions = actionItems.filter(a => !a.completedAt).length
  const unreadMessages = messages.filter(m => m.sender === 'firm' && !m.readAt).length

  // Recent activity feed
  type ActivityItem = { icon: string; text: string; time: string }
  const activity: ActivityItem[] = []
  messages.slice(-3).reverse().forEach(m => {
    activity.push({
      icon: m.sender === 'firm' ? '💬' : '✉️',
      text: m.sender === 'firm' ? `Message from your accountant` : `You sent a message`,
      time: timeAgo(m.createdAt),
    })
  })
  documents.slice(0, 3).forEach(d => {
    activity.push({
      icon: d.status === 'uploaded' ? '📤' : d.status === 'reviewed' ? '✅' : '📋',
      text: d.status === 'uploaded' ? `You uploaded: ${d.name}` : d.status === 'reviewed' ? `${d.name} reviewed` : `Document requested: ${d.name}`,
      time: timeAgo(d.uploadedAt ?? d.createdAt),
    })
  })
  activity.sort((a) => a.time === 'just now' ? -1 : 1).slice(0, 8)

  const accent = session.accentColor

  return (
    <div>
      {/* Welcome */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 28, color: '#1a1714', margin: '0 0 4px' }}>
          Good to see you
        </h1>
        <p style={{ fontSize: 15, color: '#6b6560', margin: 0 }}>{session.clientName}</p>
      </div>

      {/* Close Status Card */}
      <div style={{
        background: 'white',
        border: '1px solid #e8e0d4',
        borderRadius: 16,
        padding: '20px 24px',
        marginBottom: 16,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1714' }}>Monthly Close</div>
          <span style={{
            fontSize: 12,
            fontWeight: 600,
            padding: '3px 10px',
            borderRadius: 20,
            background: closePercent === 100 ? '#dcfce7' : closePercent > 0 ? '#fef3c7' : '#f5f3ef',
            color: closePercent === 100 ? '#166534' : closePercent > 0 ? '#92400e' : '#6b6560',
          }}>{closeStatus}</span>
        </div>
        <div style={{ height: 8, background: '#f5f3ef', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${closePercent}%`, background: accent, borderRadius: 4, transition: 'width 0.6s ease' }} />
        </div>
        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>{closePercent}% complete</div>
      </div>

      {/* Quick stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Docs Needed', value: pendingDocs, link: `/portal/${params.token}/documents`, color: pendingDocs > 0 ? '#b45309' : '#2d5a27' },
          { label: 'Open Actions', value: openActions, link: `/portal/${params.token}/actions`, color: openActions > 0 ? '#b45309' : '#2d5a27' },
          { label: 'New Messages', value: unreadMessages, link: `/portal/${params.token}/messages`, color: unreadMessages > 0 ? accent : '#2d5a27' },
        ].map(stat => (
          <a key={stat.label} href={stat.link} style={{ textDecoration: 'none' }}>
            <div style={{ background: 'white', border: '1px solid #e8e0d4', borderRadius: 12, padding: '16px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>{stat.label}</div>
            </div>
          </a>
        ))}
      </div>

      {/* Open action items preview */}
      {openActions > 0 && (
        <div style={{ background: 'white', border: `1px solid ${accent}40`, borderLeft: `3px solid ${accent}`, borderRadius: 12, padding: '16px 20px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1714' }}>Action Items</div>
            <a href={`/portal/${params.token}/actions`} style={{ fontSize: 13, color: accent, textDecoration: 'none', fontWeight: 500 }}>View all →</a>
          </div>
          {actionItems.filter(a => !a.completedAt).slice(0, 3).map(item => (
            <div key={item.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ width: 20, height: 20, borderRadius: 4, border: `2px solid ${accent}`, flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontSize: 14, color: '#1a1714', fontWeight: 500 }}>{item.title}</div>
                {item.dueDate && (
                  <div style={{ fontSize: 12, color: new Date(item.dueDate) < new Date() ? '#ef4444' : '#9ca3af', marginTop: 2 }}>
                    Due {new Date(item.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent activity */}
      {activity.length > 0 && (
        <div style={{ background: 'white', border: '1px solid #e8e0d4', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #e8e0d4', fontSize: 14, fontWeight: 600, color: '#1a1714' }}>
            Recent Activity
          </div>
          {activity.slice(0, 6).map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: i < Math.min(activity.length, 6) - 1 ? '1px solid #f5f3ef' : 'none' }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
              <span style={{ flex: 1, fontSize: 14, color: '#1a1714' }}>{item.text}</span>
              <span style={{ fontSize: 12, color: '#9ca3af', flexShrink: 0 }}>{item.time}</span>
            </div>
          ))}
          {activity.length === 0 && (
            <div style={{ padding: '32px 20px', textAlign: 'center', fontSize: 14, color: '#9ca3af' }}>
              No activity yet. Your accountant will send you updates here.
            </div>
          )}
        </div>
      )}

      {activity.length === 0 && openActions === 0 && pendingDocs === 0 && (
        <div style={{ background: 'white', border: '1px solid #e8e0d4', borderRadius: 16, padding: '40px 24px', textAlign: 'center', marginTop: 8 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>👋</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#1a1714', marginBottom: 8 }}>You're all caught up!</div>
          <div style={{ fontSize: 14, color: '#9ca3af' }}>Your accountant will send you updates, document requests, and reports here.</div>
        </div>
      )}
    </div>
  )
}
