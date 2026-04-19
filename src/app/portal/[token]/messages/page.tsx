import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { validateToken } from '@/lib/portal/auth'
import { getMessages } from '@/lib/portal/storage'
import MessageThread from '@/components/portal/MessageThread'

interface Props { params: { token: string } }

export default async function MessagesPage({ params }: Props) {
  const headersList = headers()
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined
  const session = await validateToken(params.token, ip)
  if (!session) redirect('/portal/invalid')
  if (!session.permissions.includes('send_messages')) redirect(`/portal/${params.token}`)

  const messages = await getMessages(session.firmId, session.clientId)

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 26, color: '#1a1714', margin: '0 0 4px' }}>
          Messages
        </h1>
        <p style={{ fontSize: 14, color: '#6b6560', margin: 0 }}>Chat directly with your accountant.</p>
      </div>
      <MessageThread
        token={params.token}
        accentColor={session.accentColor}
        firmName={session.firmName}
        initialMessages={messages}
      />
    </div>
  )
}
