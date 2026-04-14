'use client'

import { useCallback, useEffect, useState } from 'react'
import type { FirmRole, Permission } from '@/lib/permissions'
import { can as roleCan } from '@/lib/permissions'

export interface MembershipState {
  firmId: string | null
  role: FirmRole | null
  loading: boolean
}

export function usePermissions(): MembershipState & {
  can: (p: Permission) => boolean
  refresh: () => Promise<void>
} {
  const [firmId, setFirmId] = useState<string | null>(null)
  const [role, setRole] = useState<FirmRole | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/membership', { cache: 'no-store' })
      if (!res.ok) {
        setFirmId(null)
        setRole(null)
        return
      }
      const d = (await res.json()) as { firmId?: string; role?: FirmRole }
      setFirmId(d.firmId ?? null)
      setRole(d.role ?? null)
    } catch {
      setFirmId(null)
      setRole(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const can = useCallback(
    (p: Permission) => roleCan(role, p),
    [role]
  )

  return { firmId, role, loading, can, refresh }
}
