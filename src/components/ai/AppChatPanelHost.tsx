'use client'
import { useEffect, useState } from 'react'
import AppChatPanel from './AppChatPanel'
import type { ChatPromptContext } from '@/lib/ai/systemPrompts'
import type { Transaction } from '@/types'

export default function AppChatPanelHost() {
  const [context, setContext] = useState<ChatPromptContext>({
    transactions: [],
    overdueCount: 0,
  })
  const [mutator, setMutator] = useState<
    ((ids: string[], patch: (t: Transaction) => Transaction) => void) | undefined
  >(undefined)
  const [openAutoClose, setOpenAutoClose] = useState<(() => void) | undefined>(undefined)

  useEffect(() => {
    function handleCtx(e: Event) {
      const detail = (e as CustomEvent).detail
      if (detail) setContext(detail)
    }
    function handleMutator(e: Event) {
      const detail = (e as CustomEvent).detail
      // Wrap in a callback-state-setter to avoid React treating function as reducer
      setMutator(() => detail)
    }
    function handleOpenAutoClose(e: Event) {
      const detail = (e as CustomEvent).detail
      setOpenAutoClose(() => detail)
    }
    window.addEventListener('cb-chat-context', handleCtx)
    window.addEventListener('cb-chat-mutator', handleMutator)
    window.addEventListener('cb-chat-open-auto-close', handleOpenAutoClose)
    return () => {
      window.removeEventListener('cb-chat-context', handleCtx)
      window.removeEventListener('cb-chat-mutator', handleMutator)
      window.removeEventListener('cb-chat-open-auto-close', handleOpenAutoClose)
    }
  }, [])

  return (
    <AppChatPanel
      context={context}
      onMutateTransactions={mutator}
      onOpenAutoClose={openAutoClose}
    />
  )
}
