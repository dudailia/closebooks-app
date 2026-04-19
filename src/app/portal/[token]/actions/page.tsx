import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { validateToken } from '@/lib/portal/auth'
import { getActionItems } from '@/lib/portal/storage'
import ActionChecklist from '@/components/portal/ActionChecklist'

interface Props { params: { token: string } }

export default async function ActionsPage({ params }: Props) {
  const headersList = headers()
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined
  const session = await validateToken(params.token, ip)
  if (!session) redirect('/portal/invalid')
  if (!session.permissions.includes('approve_items')) redirect(`/portal/${params.token}`)

  const items = await getActionItems(session.firmId, session.clientId)

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 26, color: '#1a1714', margin: '0 0 4px' }}>
          Action Items
        </h1>
        <p style={{ fontSize: 14, color: '#6b6560', margin: 0 }}>
          Things your accountant needs from you.
        </p>
      </div>
      <ActionChecklist
        token={params.token}
        accentColor={session.accentColor}
        initialItems={items}
      />
    </div>
  )
}
