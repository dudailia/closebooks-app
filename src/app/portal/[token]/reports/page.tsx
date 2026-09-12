import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { validateToken } from '@/lib/portal/auth'
import { getServiceClient } from '@/lib/portal/storage'

interface Props { params: Promise<{ token: string }> }

function formatPeriod(period: string): string {
  const parts = period.split('-')
  if (parts.length >= 2) {
    const year = parts[0]
    const month = parseInt(parts[1], 10)
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December']
    return `${months[month - 1] ?? period} ${year}`
  }
  return period
}

export default async function ReportsPage(props: Props) {
  const params = await props.params;
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined
  const session = await validateToken(params.token, ip)
  if (!session) redirect('/portal/invalid')
  if (!session.permissions.includes('view_reports')) redirect(`/portal/${params.token}`)

  // Load completed jobs for this client
  const sb = getServiceClient()
  type JobRow = { id: string; period: string; status: string; close_summary?: string; storage_path?: string; created_at: string; updated_at?: string }
  let jobs: JobRow[] = []
  if (sb) {
    const { data } = await sb
      .from('jobs')
      .select('id, period, status, close_summary, storage_path, created_at, updated_at')
      .eq('firm_id', session.firmId)
      .eq('status', 'complete')
      .order('period', { ascending: false })
      .limit(36)
    jobs = (data ?? []) as JobRow[]
  }

  // Group by year
  const byYear = new Map<string, JobRow[]>()
  for (const job of jobs) {
    const year = job.period.slice(0, 4)
    const list = byYear.get(year) ?? []
    list.push(job)
    byYear.set(year, list)
  }
  const years = Array.from(byYear.keys()).sort((a, b) => b.localeCompare(a))

  const accent = session.accentColor

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 26, color: '#1a1714', margin: '0 0 4px' }}>
          Financial Reports
        </h1>
        <p style={{ fontSize: 14, color: '#6b6560', margin: 0 }}>
          View and download your monthly close reports.
        </p>
      </div>

      {jobs.length === 0 ? (
        <div style={{ background: 'white', border: '1px solid #e8e0d4', borderRadius: 16, padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#1a1714', marginBottom: 8 }}>No reports yet</div>
          <div style={{ fontSize: 14, color: '#9ca3af' }}>
            Reports will appear here when your accountant completes a monthly close.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {years.map(year => (
            <div key={year}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
                {year}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                {(byYear.get(year) ?? []).map(job => (
                  <div key={job.id} style={{ background: 'white', border: '1px solid #e8e0d4', borderRadius: 12, padding: '18px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 18, color: '#1a1714' }}>
                        {formatPeriod(job.period)}
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20, background: '#dcfce7', color: '#166534' }}>
                        ✓ Complete
                      </span>
                    </div>

                    {job.close_summary && (
                      <p style={{ fontSize: 13, color: '#6b6560', lineHeight: 1.5, margin: '0 0 14px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {job.close_summary}
                      </p>
                    )}

                    <div style={{ display: 'flex', gap: 8 }}>
                      {job.storage_path ? (
                        <a
                          href={`/api/portal/reports/download?token=${params.token}&jobId=${job.id}`}
                          style={{
                            flex: 1, background: accent, color: 'white', borderRadius: 8,
                            padding: '8px 12px', fontSize: 13, fontWeight: 600, textDecoration: 'none',
                            textAlign: 'center', display: 'block', minHeight: 36, lineHeight: '20px',
                          }}
                        >
                          Download PDF
                        </a>
                      ) : (
                        <div style={{
                          flex: 1, background: '#f5f3ef', color: '#9ca3af', borderRadius: 8,
                          padding: '8px 12px', fontSize: 13, textAlign: 'center',
                        }}>
                          PDF not available
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
