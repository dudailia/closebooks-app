'use client'
import { useCallback, useRef, useState } from 'react'

export interface UndoEntry {
  id: string
  label: string
  inverse: () => void
  redo?: () => void
  createdAt: number
}

const MAX = 50

export function useUndoStack() {
  const [entries, setEntries] = useState<UndoEntry[]>([])
  const [redoStack, setRedoStack] = useState<UndoEntry[]>([])
  const entriesRef = useRef(entries)
  const redoRef = useRef(redoStack)
  entriesRef.current = entries
  redoRef.current = redoStack

  const push = useCallback((entry: Omit<UndoEntry, 'id' | 'createdAt'>) => {
    const full: UndoEntry = {
      ...entry,
      id: `u-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: Date.now(),
    }
    setEntries((prev) => [...prev, full].slice(-MAX))
    setRedoStack([])
    return full.id
  }, [])

  const undo = useCallback(() => {
    const e = entriesRef.current[entriesRef.current.length - 1]
    if (!e) return null
    try {
      e.inverse()
    } catch (err) {
      console.error('undo inverse failed', err)
    }
    setEntries((prev) => prev.slice(0, -1))
    setRedoStack((prev) => [...prev, e])
    return e
  }, [])

  const redo = useCallback(() => {
    const e = redoRef.current[redoRef.current.length - 1]
    if (!e || !e.redo) return null
    try {
      e.redo()
    } catch (err) {
      console.error('redo failed', err)
    }
    setRedoStack((prev) => prev.slice(0, -1))
    setEntries((prev) => [...prev, e].slice(-MAX))
    return e
  }, [])

  const clear = useCallback(() => {
    setEntries([])
    setRedoStack([])
  }, [])

  return { entries, redoEntries: redoStack, push, undo, redo, clear }
}
