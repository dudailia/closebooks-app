'use client'
import { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from 'react'

export interface ShortcutDef {
  id: string
  key: string
  meta?: boolean
  shift?: boolean
  alt?: boolean
  label: string
  group: string
  handler: (e: KeyboardEvent) => void
}

interface Ctx {
  register: (s: ShortcutDef) => void
  unregister: (id: string) => void
  list: ShortcutDef[]
}

const ShortcutCtx = createContext<Ctx | null>(null)

export function KeyboardShortcutProvider({ children }: { children: ReactNode }) {
  const [list, setList] = useState<ShortcutDef[]>([])
  const listRef = useRef<ShortcutDef[]>([])
  listRef.current = list

  const register = useCallback((s: ShortcutDef) => {
    setList((prev) => {
      const filtered = prev.filter((p) => p.id !== s.id)
      return [...filtered, s]
    })
  }, [])
  const unregister = useCallback((id: string) => {
    setList((prev) => prev.filter((p) => p.id !== id))
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null
      const tag = target?.tagName?.toLowerCase()
      const typing =
        tag === 'input' ||
        tag === 'select' ||
        tag === 'textarea' ||
        !!target?.isContentEditable
      const meta = e.metaKey || e.ctrlKey
      for (const s of listRef.current) {
        const keyMatch = e.key.toLowerCase() === s.key.toLowerCase()
        const metaMatch = !!s.meta === !!meta
        const shiftMatch = !!s.shift === !!e.shiftKey
        const altMatch = !!s.alt === !!e.altKey
        if (!(keyMatch && metaMatch && shiftMatch && altMatch)) continue
        if (typing && !s.meta && s.key !== 'escape' && s.key !== '/') continue
        e.preventDefault()
        s.handler(e)
        return
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return <ShortcutCtx.Provider value={{ register, unregister, list }}>{children}</ShortcutCtx.Provider>
}

export function useShortcuts(): Ctx {
  const ctx = useContext(ShortcutCtx)
  if (!ctx) {
    // Allow use outside provider to fail soft during SSR/unmount
    return { register: () => {}, unregister: () => {}, list: [] }
  }
  return ctx
}

export function useShortcut(def: ShortcutDef) {
  const { register, unregister } = useShortcuts()
  const handlerRef = useRef(def.handler)
  handlerRef.current = def.handler
  useEffect(() => {
    register({ ...def, handler: (e) => handlerRef.current(e) })
    return () => unregister(def.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [def.id, def.key, def.meta, def.shift, def.alt, def.label, def.group])
}
