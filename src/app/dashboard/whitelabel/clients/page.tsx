'use client'

import { useState } from 'react'

interface ClientRow {
  name: string
  status: 'active' | 'inactive'
  plan: string | null
  price: number | null
  lastLogin: string
}

const INITIAL_CLIENTS: ClientRow[] = [
  { name: 'Smith Construction LLC', status: 'active', plan: 'professional', price: 150, lastLogin: '2 hours ago' },
  { name: 'Bella Vista Restaurant', status: 'active', plan: 'starter', price: 75, lastLogin: 'Yesterday' },
  { name: 'Chen Medical Practice', status: 'active', plan: 'professional', price: 150, lastLogin: '3 days ago' },
  { name: 'TechFlow Inc', status: 'inactive', plan: null, price: null, lastLogin: 'Never' },
  { name: 'Green Valley Farms', status: 'inactive', plan: null, price: null, lastLogin: 'Never' },
  { name: 'Meridian Consulting', status: 'inactive', plan: null, price: null, lastLogin: 'Never' },
]

export default function WhitelabelClientsPage() {
  const [clients, setClients] = useState<ClientRow[]>(INITIAL_CLIENTS)
  const [enableModal, setEnableModal] = useState<string | null>(null)
  const [modalPrice, setModalPrice] = useState('75')
  const [editingPrice, setEditingPrice] = useState<string | null>(null)
  const [editPriceValue, setEditPriceValue] = useState('')
  const [copiedLink, setCopiedLink] = useState<string | null>(null)
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null)
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)

  const handleEnableAll = () => {
    setClients((prev) =>
      prev.map((c) =>
        c.status === 'inactive'
          ? { ...c, status: 'active', plan: 'starter', price: 75 }
          : c
      )
    )
  }

  const handleEnablePortal = (name: string) => {
    const price = parseFloat(modalPrice) || 75
    setClients((prev) =>
      prev.map((c) =>
        c.name === name ? { ...c, status: 'active', plan: 'starter', price } : c
      )
    )
    setEnableModal(null)
    setModalPrice('75')
  }

  const handleRevoke = (name: string) => {
    setClients((prev) =>
      prev.map((c) =>
        c.name === name ? { ...c, status: 'inactive', plan: null, price: null, lastLogin: 'Never' } : c
      )
    )
  }

  const handleCopyLink = (name: string) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-')
    navigator.clipboard.writeText(`closebooks.app/portal/millercpa/${slug}`).catch(() => {})
    setCopiedLink(name)
    setTimeout(() => setCopiedLink(null), 2000)
  }

  const handleSavePrice = (name: string) => {
    const price = parseFloat(editPriceValue) || 0
    setClients((prev) =>
      prev.map((c) => (c.name === name ? { ...c, price } : c))
    )
    setEditingPrice(null)
  }

  const activeCount = clients.filter((c) => c.status === 'active').length
  const monthlyRevenue = clients.filter((c) => c.status === 'active').reduce((s, c) => s + (c.price ?? 0), 0)

  return (
    <div style={{ padding: 32 }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-dm-serif)',
              fontSize: 28,
              color: '#1a1714',
              margin: '0 0 4px 0',
            }}
          >
            Client Portal Access
          </h1>
          <p style={{ fontSize: 14, color: '#78716c', margin: 0 }}>
            {activeCount} active portals · ${monthlyRevenue.toLocaleString()}/mo gross
          </p>
        </div>
        <button
          onClick={handleEnableAll}
          onMouseEnter={() => setHoveredBtn('enable-all')}
          onMouseLeave={() => setHoveredBtn(null)}
          style={{
            padding: '10px 20px',
            borderRadius: 10,
            border: 'none',
            backgroundColor: hoveredBtn === 'enable-all' ? '#234a1e' : '#2d5a27',
            color: '#ffffff',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background-color 0.15s',
          }}
        >
          Enable All Portals
        </button>
      </div>

      {/* Table */}
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e8e0d4',
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#faf8f4' }}>
                {['Client', 'Portal Status', 'Plan', 'Monthly Price', 'Last Login', 'Actions'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '12px 18px',
                      textAlign: 'left',
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#78716c',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr
                  key={client.name}
                  onMouseEnter={() => setHoveredRow(client.name)}
                  onMouseLeave={() => setHoveredRow(null)}
                  style={{
                    borderTop: '1px solid #f0ece6',
                    backgroundColor: hoveredRow === client.name ? '#faf8f4' : '#ffffff',
                    transition: 'background-color 0.1s',
                  }}
                >
                  <td style={{ padding: '14px 18px', fontSize: 14, fontWeight: 500, color: '#1a1714' }}>
                    {client.name}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '3px 10px',
                        borderRadius: 20,
                        backgroundColor: client.status === 'active' ? '#dcfce7' : '#f5f5f4',
                        color: client.status === 'active' ? '#166534' : '#78716c',
                        fontSize: 12,
                        fontWeight: 600,
                        textTransform: 'capitalize',
                      }}
                    >
                      {client.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px', fontSize: 13, color: '#57534e', textTransform: 'capitalize' }}>
                    {client.plan ?? '—'}
                  </td>
                  <td style={{ padding: '14px 18px', fontSize: 13, color: '#1a1714' }}>
                    {client.price !== null ? (
                      editingPrice === client.name ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 13, color: '#57534e' }}>$</span>
                          <input
                            type="number"
                            value={editPriceValue}
                            onChange={(e) => setEditPriceValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSavePrice(client.name)
                              if (e.key === 'Escape') setEditingPrice(null)
                            }}
                            style={{
                              width: 70,
                              padding: '4px 8px',
                              borderRadius: 6,
                              border: '1px solid #b8734a',
                              fontSize: 13,
                              outline: 'none',
                            }}
                            autoFocus
                          />
                          <button
                            onClick={() => handleSavePrice(client.name)}
                            style={{
                              padding: '4px 8px',
                              borderRadius: 6,
                              border: 'none',
                              backgroundColor: '#2d5a27',
                              color: '#ffffff',
                              fontSize: 11,
                              cursor: 'pointer',
                            }}
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <span
                          style={{ cursor: 'pointer', textDecoration: 'underline dotted' }}
                          title="Click to edit"
                          onClick={() => {
                            setEditingPrice(client.name)
                            setEditPriceValue(String(client.price))
                          }}
                        >
                          ${client.price}/mo
                        </span>
                      )
                    ) : (
                      <span style={{ color: '#a09080' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 18px', fontSize: 13, color: '#78716c' }}>
                    {client.lastLogin}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {client.status === 'active' ? (
                        <>
                          <button
                            onClick={() => handleRevoke(client.name)}
                            onMouseEnter={() => setHoveredBtn(`revoke-${client.name}`)}
                            onMouseLeave={() => setHoveredBtn(null)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: 7,
                              border: '1px solid',
                              borderColor: hoveredBtn === `revoke-${client.name}` ? '#dc2626' : '#fca5a5',
                              backgroundColor: hoveredBtn === `revoke-${client.name}` ? '#fef2f2' : '#ffffff',
                              color: '#dc2626',
                              fontSize: 12,
                              cursor: 'pointer',
                              fontWeight: 500,
                              transition: 'all 0.15s',
                            }}
                          >
                            Revoke Access
                          </button>
                          <button
                            onClick={() => handleCopyLink(client.name)}
                            onMouseEnter={() => setHoveredBtn(`copy-${client.name}`)}
                            onMouseLeave={() => setHoveredBtn(null)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: 7,
                              border: '1px solid #e8e0d4',
                              backgroundColor: copiedLink === client.name ? '#dcfce7' : hoveredBtn === `copy-${client.name}` ? '#f8f5f0' : '#ffffff',
                              color: copiedLink === client.name ? '#166534' : '#1a1714',
                              fontSize: 12,
                              cursor: 'pointer',
                              fontWeight: 500,
                              transition: 'all 0.15s',
                            }}
                          >
                            {copiedLink === client.name ? 'Copied ✓' : 'Copy Link'}
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => { setEnableModal(client.name); setModalPrice('75') }}
                          onMouseEnter={() => setHoveredBtn(`enable-${client.name}`)}
                          onMouseLeave={() => setHoveredBtn(null)}
                          style={{
                            padding: '6px 14px',
                            borderRadius: 7,
                            border: 'none',
                            backgroundColor: hoveredBtn === `enable-${client.name}` ? '#a36640' : '#b8734a',
                            color: '#ffffff',
                            fontSize: 12,
                            cursor: 'pointer',
                            fontWeight: 600,
                            transition: 'background-color 0.15s',
                          }}
                        >
                          Enable Portal
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enable Portal Modal */}
      {enableModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setEnableModal(null) }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 420,
              backgroundColor: '#ffffff',
              borderRadius: 16,
              padding: 32,
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            }}
          >
            <h3
              style={{
                fontFamily: 'var(--font-dm-serif)',
                fontSize: 20,
                color: '#1a1714',
                margin: '0 0 8px 0',
              }}
            >
              Enable Portal
            </h3>
            <p style={{ fontSize: 14, color: '#57534e', margin: '0 0 24px 0' }}>
              Set monthly price for <strong>{enableModal}</strong>:
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 20, color: '#1a1714', fontWeight: 600 }}>$</span>
              <input
                type="number"
                value={modalPrice}
                onChange={(e) => setModalPrice(e.target.value)}
                style={{
                  width: 100,
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid #e8e0d4',
                  fontSize: 18,
                  fontWeight: 600,
                  color: '#1a1714',
                  outline: 'none',
                  textAlign: 'center',
                }}
              />
              <span style={{ fontSize: 14, color: '#78716c' }}>/month</span>
            </div>

            <div
              style={{
                padding: '12px 16px',
                borderRadius: 10,
                backgroundColor: '#f0f9ff',
                fontSize: 13,
                color: '#1e40af',
                marginBottom: 24,
              }}
            >
              You keep 70% = <strong>${((parseFloat(modalPrice) || 0) * 0.7).toFixed(2)}/month</strong>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setEnableModal(null)}
                style={{
                  flex: 1,
                  padding: '11px 0',
                  borderRadius: 10,
                  border: '1px solid #e8e0d4',
                  backgroundColor: '#ffffff',
                  color: '#1a1714',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleEnablePortal(enableModal)}
                style={{
                  flex: 1,
                  padding: '11px 0',
                  borderRadius: 10,
                  border: 'none',
                  backgroundColor: '#b8734a',
                  color: '#ffffff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Enable Portal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
