'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  listTasks,
  addTask,
  toggleTask,
  deleteTask,
  type ComplianceTask,
} from '@/lib/complianceTasks'

function newId(): string {
  const b = new Uint8Array(12)
  crypto.getRandomValues(b)
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')
}

export default function ComplianceTasksPage() {
  const [tasks, setTasks] = useState<ComplianceTask[]>([])
  const [title, setTitle] = useState('')
  const [due, setDue] = useState(() => new Date().toISOString().slice(0, 10))
  const [client, setClient] = useState('')

  const reload = useCallback(() => setTasks(listTasks()), [])

  useEffect(() => {
    reload()
  }, [reload])

  function handleAdd() {
    const t = title.trim()
    if (!t) return
    addTask({
      id: newId(),
      title: t,
      dueDate: due,
      clientName: client.trim() || undefined,
      status: 'open',
    })
    setTitle('')
    reload()
  }

  const openCount = tasks.filter((x) => x.status === 'open').length

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#faf8f4' }}>
      <main className="flex-1 max-w-3xl mx-auto w-full px-5 py-10 space-y-8 page-enter">
        <div>
          <Link href="/dashboard/compliance" className="text-xs transition-colors" style={{ color: '#b8734a' }}>
            ← Regulatory alerts
          </Link>
          <h1
            className="text-3xl mt-3"
            style={{
              fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
              color: '#1a1714',
              letterSpacing: '-0.02em',
            }}
          >
            Compliance tasks
          </h1>
          <p className="text-sm mt-1.5" style={{ color: '#6b6560' }}>
            Track PBC lists, 7216 consent, engagement letters, and other firm obligations. {openCount} open.
          </p>
        </div>

        <div
          className="rounded-2xl border p-5 space-y-3"
          style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium" style={{ color: '#6b6560' }}>
                Task
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Obtain signed 7216 consent — Acme"
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                style={{ borderColor: '#e8e0d4', backgroundColor: '#faf8f4' }}
              />
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: '#6b6560' }}>
                Due date
              </label>
              <input
                type="date"
                value={due}
                onChange={(e) => setDue(e.target.value)}
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                style={{ borderColor: '#e8e0d4', backgroundColor: '#faf8f4' }}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium" style={{ color: '#6b6560' }}>
              Client (optional)
            </label>
            <input
              value={client}
              onChange={(e) => setClient(e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
              style={{ borderColor: '#e8e0d4', backgroundColor: '#faf8f4' }}
            />
          </div>
          <button
            type="button"
            onClick={handleAdd}
            className="py-2.5 px-5 rounded-xl text-sm font-semibold text-white"
            style={{ backgroundColor: '#1e3a5f' }}
          >
            Add task
          </button>
        </div>

        <ul className="space-y-2">
          {tasks.length === 0 ? (
            <li className="text-sm text-center py-8" style={{ color: '#6b6560' }}>
              No tasks yet.
            </li>
          ) : (
            tasks.map((t) => (
              <li
                key={t.id}
                className="rounded-xl border px-4 py-3 flex flex-wrap items-center gap-3"
                style={{
                  borderColor: '#e8e0d4',
                  backgroundColor: '#ffffff',
                  opacity: t.status === 'done' ? 0.65 : 1,
                }}
              >
                <input
                  type="checkbox"
                  checked={t.status === 'done'}
                  onChange={() => {
                    toggleTask(t.id)
                    reload()
                  }}
                  className="w-4 h-4 rounded"
                />
                <div className="flex-1 min-w-[200px]">
                  <p
                    className="text-sm font-medium"
                    style={{
                      color: '#1a1714',
                      textDecoration: t.status === 'done' ? 'line-through' : 'none',
                    }}
                  >
                    {t.title}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#6b6560' }}>
                    Due {t.dueDate}
                    {t.clientName ? ` · ${t.clientName}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    deleteTask(t.id)
                    reload()
                  }}
                  className="text-xs text-red-600"
                >
                  Delete
                </button>
              </li>
            ))
          )}
        </ul>
      </main>
    </div>
  )
}
