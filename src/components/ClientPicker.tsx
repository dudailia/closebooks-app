'use client'

import { useMemo, useState } from 'react'
import { searchClients } from '@/lib/clientJobs'
import type { Client } from '@/types'

// New Close step 1: pick an existing client from a searchable list, or create
// a new one. The close is then linked to the client's id (src/lib/clientJobs.ts),
// so two clients with the same name stay separate.

interface Props {
  clients: Client[]
  selectedId: string | null
  onSelect: (client: Client) => void
  /** Saves a new client; resolves to the saved client, or null if saving failed. */
  onCreate: (name: string) => Promise<Client | null>
  closesFor: (client: Client) => number
}

export default function ClientPicker({ clients, selectedId, onSelect, onCreate, closesFor }: Props) {
  const [query, setQuery] = useState('')
  const [creatingChosen, setCreating] = useState(false)
  // With no clients yet, the create form is the only choice. Derived, not
  // initial state, because the list arrives after the first render.
  const creating = creatingChosen || clients.length === 0
  const [newName, setNewName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const matches = useMemo(() => searchClients(clients, query), [clients, query])
  const nameTaken = newName.trim() !== '' &&
    clients.some((c) => c.business_name.trim().toLowerCase() === newName.trim().toLowerCase())

  async function handleCreate() {
    if (!newName.trim()) { setError('Please enter a client name.'); return }
    setSaving(true)
    const client = await onCreate(newName.trim())
    setSaving(false)
    if (!client) { setError("Couldn't save the client. Please try again."); return }
    setError(null)
    setNewName('')
    setCreating(false)
    setQuery('')
    onSelect(client)
  }

  return (
    <div className="space-y-3">
      {clients.length > 0 && (
        <>
          <input
            type="search"
            autoFocus
            aria-label="Search clients"
            placeholder="Search clients…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5a27]"
            style={{ borderColor: '#e0dbd4', backgroundColor: '#fff', color: '#1a1714' }}
          />
          <ul
            role="listbox"
            aria-label="Clients"
            className="rounded-xl border overflow-y-auto"
            style={{ borderColor: '#e0dbd4', backgroundColor: '#fff', maxHeight: 260 }}
          >
            {matches.length === 0 && (
              <li className="px-3 py-3 text-sm" style={{ color: '#a09a94' }}>No clients match &ldquo;{query}&rdquo;.</li>
            )}
            {matches.map((c) => {
              const selected = c.id === selectedId
              const closes = closesFor(c)
              return (
                <li
                  key={c.id}
                  role="option"
                  aria-selected={selected}
                  tabIndex={0}
                  onClick={() => onSelect(c)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(c) } }}
                  className="px-3 py-2.5 text-sm cursor-pointer border-b last:border-b-0"
                  style={{
                    borderColor: '#f0ece4',
                    backgroundColor: selected ? '#eef5ec' : undefined,
                    outline: selected ? '2px solid #2d5a27' : undefined,
                    outlineOffset: -2,
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium" style={{ color: '#1a1714' }}>{c.business_name}</span>
                    <span className="text-xs shrink-0" style={{ color: '#a09a94' }}>
                      {closes} {closes === 1 ? 'close' : 'closes'}
                    </span>
                  </div>
                  {/* Industry and email tell apart two clients with the same name. */}
                  <div className="text-xs mt-0.5" style={{ color: '#6b6560' }}>
                    {[c.industry, c.contact_email].filter(Boolean).join(' · ') || 'No details'}
                  </div>
                </li>
              )
            })}
          </ul>
        </>
      )}

      {creating ? (
        <div className="rounded-xl border p-3 space-y-2" style={{ borderColor: '#e0dbd4', backgroundColor: '#fff' }}>
          <label htmlFor="new-client-name" className="block text-sm font-medium" style={{ color: '#1a1714' }}>
            New client name
          </label>
          <input
            id="new-client-name"
            type="text"
            autoFocus={clients.length === 0}
            placeholder="e.g. Acme Corp, Jane Smith LLC"
            value={newName}
            onChange={(e) => { setNewName(e.target.value); setError(null) }}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5a27]"
            style={{ borderColor: error ? '#dc2626' : '#e0dbd4', backgroundColor: '#fff', color: '#1a1714' }}
          />
          {nameTaken && (
            <p className="text-xs" style={{ color: '#b8734a' }}>
              A client with this name already exists. Pick it from the list, or create a second client with the same name; their closes stay separate.
            </p>
          )}
          {error && <p className="text-xs" style={{ color: '#991b1b' }}>{error}</p>}
          <div className="flex gap-2">
            {clients.length > 0 && (
              <button
                type="button"
                onClick={() => { setCreating(false); setError(null) }}
                className="px-3 py-2 rounded-xl text-sm border"
                style={{ borderColor: '#e0dbd4', color: '#6b6560', backgroundColor: '#faf8f4' }}
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={handleCreate}
              disabled={saving}
              className="flex-1 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: '#2d5a27' }}
            >
              {saving ? 'Saving…' : 'Create client'}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => { setCreating(true); setNewName(query) }}
          className="text-sm font-medium"
          style={{ color: '#2d5a27' }}
        >
          + Create new client
        </button>
      )}
    </div>
  )
}
