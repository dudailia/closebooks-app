'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export default function CopilotShortcut() {
  const router   = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        const match = pathname.match(/\/dashboard\/clients\/([^/]+)/)
        router.push(match ? `/dashboard/clients/${match[1]}/copilot` : '/dashboard/clients')
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [pathname, router])

  return null
}
