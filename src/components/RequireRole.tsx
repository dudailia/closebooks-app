'use client'

import { usePermissions } from '@/hooks/usePermissions'
import type { FirmRole } from '@/lib/permissions'
import { atLeast } from '@/lib/permissions'

export function RequireRole({
  minRole,
  children,
  fallback,
}: {
  minRole: FirmRole
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const { role, loading } = usePermissions()

  if (loading) {
    return fallback ?? <p className="text-sm" style={{ color: '#6b6560' }}>Loading…</p>
  }

  if (!atLeast(role, minRole)) {
    return (
      fallback ?? (
        <div className="rounded-xl border p-4 text-sm" style={{ borderColor: '#e8e0d4', backgroundColor: '#fff' }}>
          You don&apos;t have access to this section. Ask an owner or admin for a higher role.
        </div>
      )
    )
  }

  return <>{children}</>
}
