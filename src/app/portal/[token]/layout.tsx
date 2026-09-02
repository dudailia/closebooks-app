import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { validateToken } from '@/lib/portal/auth'
import PortalShell from '@/components/portal/PortalShell'

interface Props {
  children: React.ReactNode
  params: Promise<{ token: string }>
}

export default async function PortalLayout(props: Props) {
  const params = await props.params;

  const {
    children
  } = props;

  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined
  const ua = headersList.get('user-agent') ?? undefined

  const session = await validateToken(params.token, ip, ua)
  if (!session) redirect('/portal/invalid')

  return (
    <PortalShell
      token={params.token}
      firmName={session.firmName}
      accentColor={session.accentColor}
      clientName={session.clientName}
      permissions={session.permissions}
    >
      {children}
    </PortalShell>
  )
}
