'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Form1099Preview from '@/components/Form1099Preview'
import type { Recipient1099, Payer1099 } from '@/components/Form1099Preview'

// ─── Demo data ────────────────────────────────────────────────────────────────

interface RecipientDetail {
  id: string
  name: string
  address: string
  city: string
  state: string
  zip: string
  tin: string
  email: string
  formType: '1099-NEC' | '1099-MISC' | '1099-K'
  amount: number
  federalWithheld: number
  status: 'ready' | 'needs-tin' | 'filed' | 'error'
  payments: { date: string; description: string; amount: number; method: string }[]
}

const DEMO_RECIPIENTS: Record<string, RecipientDetail> = {
  r1: {
    id: 'r1', name: 'Martinez Plumbing LLC',
    address: '4821 Oak Street', city: 'Austin', state: 'TX', zip: '78701',
    tin: '456789012', email: 'jose@martinezplumbing.com',
    formType: '1099-NEC', amount: 8500, federalWithheld: 0, status: 'ready',
    payments: [
      { date: '2024-02-14', description: 'Pipe repair - 3rd floor bathroom', amount: 2400, method: 'Check #1042' },
      { date: '2024-05-08', description: 'HVAC drain line installation', amount: 3100, method: 'ACH' },
      { date: '2024-09-22', description: 'Emergency leak repair + parts', amount: 3000, method: 'Check #1187' },
    ],
  },
  r2: {
    id: 'r2', name: 'Sarah Johnson Consulting',
    address: '1205 Congress Ave, Suite 400', city: 'Austin', state: 'TX', zip: '78701',
    tin: '321098765', email: 'sarah@sjconsult.com',
    formType: '1099-NEC', amount: 9800, federalWithheld: 0, status: 'ready',
    payments: [
      { date: '2024-01-31', description: 'Q1 strategy consulting retainer', amount: 2450, method: 'ACH' },
      { date: '2024-04-30', description: 'Q2 strategy consulting retainer', amount: 2450, method: 'ACH' },
      { date: '2024-07-31', description: 'Q3 strategy consulting retainer', amount: 2450, method: 'ACH' },
      { date: '2024-10-31', description: 'Q4 strategy consulting retainer', amount: 2450, method: 'ACH' },
    ],
  },
  r9: {
    id: 'r9', name: 'Summit Tech Consulting',
    address: '890 Innovation Blvd', city: 'San Jose', state: 'CA', zip: '95134',
    tin: '', email: 'hello@summittech.io',
    formType: '1099-NEC', amount: 6700, federalWithheld: 0, status: 'needs-tin',
    payments: [
      { date: '2024-03-15', description: 'CRM implementation Phase 1', amount: 3500, method: 'Wire' },
      { date: '2024-07-20', description: 'CRM implementation Phase 2', amount: 3200, method: 'Wire' },
    ],
  },
}

function getRecipient(id: string): RecipientDetail {
  return DEMO_RECIPIENTS[id] ?? {
    id,
    name: 'Unknown Vendor',
    address: '123 Main St', city: 'Austin', state: 'TX', zip: '78701',
    tin: '', email: '',
    formType: '1099-NEC', amount: 1000, federalWithheld: 0, status: 'needs-tin',
    payments: [],
  }
}

const PAYER: Payer1099 = {
  name: 'CloseBooks Advisory LLC',
  address: '100 Congress Ave, Suite 2200',
  city: 'Austin', state: 'TX', zip: '78701',
  tin: '74-1234567',
  phone: '(512) 555-0100',
}

// ─── TIN Verify button ────────────────────────────────────────────────────────

function TinVerifyButton({ tin }: { tin: string }) {
  const [state, setState] = useState<'idle' | 'checking' | 'verified' | 'failed'>('idle')

  function verify() {
    if (!tin || state === 'checking' || state === 'verified') return
    setState('checking')
    setTimeout(() => {
      setState(tin.replace(/\D/g, '').length === 9 ? 'verified' : 'failed')
    }, 1500)
  }

  return (
    <button
      onClick={verify}
      disabled={state === 'checking' || state === 'verified' || !tin}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '7px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
        border: '1px solid',
        borderColor:
          state === 'verified' ? '#15803d' :
          state === 'failed' ? '#991b1b' :
          '#b8734a',
        color:
          state === 'verified' ? '#15803d' :
          state === 'failed' ? '#991b1b' :
          !tin ? '#ccc' : '#b8734a',
        backgroundColor: 'transparent',
        cursor: !tin || state === 'verified' || state === 'checking' ? 'not-allowed' : 'pointer',
      }}
    >
      {state === 'checking' && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      )}
      {state === 'verified' && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
      {state === 'failed' && '✗ '}
      {state === 'idle' ? 'Verify TIN' : state === 'checking' ? 'Checking…' : state === 'verified' ? 'TIN Verified' : 'TIN Not Found'}
    </button>
  )
}

// ─── Filing modal ─────────────────────────────────────────────────────────────

function FilingModal({
  recipient,
  onClose,
  onFiled,
}: {
  recipient: RecipientDetail
  onClose: () => void
  onFiled: (confirmNum: string) => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  async function handleFile() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/1099/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: recipient.id,
          recipientName: recipient.name,
          recipientTin: recipient.tin || '123456789',
          recipientAddress: `${recipient.address}, ${recipient.city}, ${recipient.state} ${recipient.zip}`,
          payerName: PAYER.name,
          payerTin: PAYER.tin,
          amount: recipient.amount,
          federalWithheld: recipient.federalWithheld,
          formType: recipient.formType,
          taxYear: 2024,
        }),
      })
      const data = await res.json()
      if (data.success) {
        onFiled(data.receipt.confirmationNumber)
      } else {
        setError(data.errors?.join(', ') || data.error || 'Filing failed')
      }
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '460px' }}>
        <div style={{ fontSize: '24px', textAlign: 'center', marginBottom: '16px' }}>📋</div>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1a1714', textAlign: 'center', marginBottom: '8px' }}>
          Confirm IRS Filing
        </h3>
        <p style={{ fontSize: '14px', color: '#6b6560', textAlign: 'center', marginBottom: '20px', lineHeight: 1.6 }}>
          You are about to file a <strong style={{ color: '#1a1714' }}>{recipient.formType}</strong> for{' '}
          <strong style={{ color: '#1a1714' }}>{recipient.name}</strong> reporting{' '}
          <strong style={{ color: '#1a1714' }}>{fmt(recipient.amount)}</strong>.{' '}
          This is a legal filing with the IRS. Confirm?
        </p>
        {error && (
          <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: '#fef2f2', color: '#991b1b', fontSize: '13px', marginBottom: '16px' }}>
            {error}
          </div>
        )}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              flex: 1, padding: '11px', borderRadius: '10px', fontWeight: 600, fontSize: '14px',
              backgroundColor: 'transparent', color: '#6b6560',
              border: '1px solid #e8e0d4', cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleFile}
            disabled={loading}
            style={{
              flex: 2, padding: '11px', borderRadius: '10px', fontWeight: 600, fontSize: '14px',
              backgroundColor: loading ? '#a0c0a0' : '#2d5a27', color: '#ffffff',
              border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Filing with IRS…' : 'File with IRS'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Recipient1099Page() {
  const params = useParams()
  const router = useRouter()
  const id = params?.recipientId as string

  const [data, setData] = useState<RecipientDetail>(getRecipient(id))
  const [showModal, setShowModal] = useState(false)
  const [confirmNum, setConfirmNum] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => { setData(getRecipient(id)) }, [id])

  const recipientForPreview: Recipient1099 = {
    id: data.id,
    name: data.name,
    address: data.address,
    city: data.city,
    state: data.state,
    zip: data.zip,
    tin: data.tin || '000000000',
    amount: data.amount,
    federalWithheld: data.federalWithheld,
    formType: data.formType,
  }

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  const statusColor = data.status === 'filed' ? '#2d5a27' :
                      data.status === 'needs-tin' ? '#854d0e' :
                      data.status === 'ready' ? '#15803d' : '#991b1b'

  return (
    <div style={{ padding: '32px', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', fontSize: '13px' }}>
        <button
          onClick={() => router.push('/dashboard/1099')}
          style={{ color: '#b8734a', textDecoration: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 600 }}
        >
          1099 Filing
        </button>
        <span style={{ color: '#c0bbb5' }}>›</span>
        <span style={{ color: '#6b6560' }}>{data.name}</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1a1714', margin: 0 }}>{data.name}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: statusColor }}>
              {data.status === 'filed' ? '✓ Filed' :
               data.status === 'needs-tin' ? '⚠ Needs TIN' :
               data.status === 'ready' ? '✓ Ready to File' : '✗ Error'}
            </span>
            <span style={{ color: '#e8e0d4' }}>·</span>
            <span style={{ fontSize: '13px', color: '#6b6560' }}>{data.formType} · Tax Year 2024</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={handleSave}
            style={{
              padding: '8px 16px', borderRadius: '9px', fontWeight: 600, fontSize: '14px',
              border: '1px solid #e8e0d4', color: saved ? '#2d5a27' : '#6b6560',
              backgroundColor: saved ? '#f0fdf4' : 'transparent', cursor: 'pointer',
            }}
          >
            {saved ? '✓ Saved' : 'Save Draft'}
          </button>
          <button
            style={{
              padding: '8px 16px', borderRadius: '9px', fontWeight: 600, fontSize: '14px',
              border: '1px solid #b8734a', color: '#b8734a',
              backgroundColor: 'transparent', cursor: 'pointer',
            }}
          >
            Download PDF
          </button>
          {!confirmNum && (
            <button
              onClick={() => setShowModal(true)}
              disabled={data.status === 'needs-tin'}
              style={{
                padding: '8px 18px', borderRadius: '9px', fontWeight: 700, fontSize: '14px',
                backgroundColor: data.status === 'needs-tin' ? '#e8e0d4' : '#2d5a27',
                color: data.status === 'needs-tin' ? '#a0a0a0' : '#ffffff',
                border: 'none', cursor: data.status === 'needs-tin' ? 'not-allowed' : 'pointer',
              }}
            >
              File with IRS
            </button>
          )}
        </div>
      </div>

      {/* Confirmation banner */}
      {confirmNum && (
        <div
          style={{
            backgroundColor: '#f0fdf4', border: '1px solid #86efac',
            borderRadius: '10px', padding: '14px 18px', marginBottom: '24px',
            display: 'flex', alignItems: 'center', gap: '12px',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><polyline points="20 6 9 17 4 12" />
          </svg>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#15803d' }}>Filed Successfully</div>
            <div style={{ fontSize: '13px', color: '#166534' }}>IRS Confirmation: <strong>{confirmNum}</strong></div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px' }}>
        {/* Left: Form preview + editable fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Form preview */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '24px', border: '1px solid #e8e0d4' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1714', marginBottom: '16px' }}>Form Preview</h2>
            <Form1099Preview recipient={recipientForPreview} payer={PAYER} taxYear={2024} />
          </div>

          {/* Transaction history */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '24px', border: '1px solid #e8e0d4' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1714', marginBottom: '4px' }}>
              Payment History
            </h2>
            <p style={{ fontSize: '13px', color: '#6b6560', marginBottom: '16px' }}>
              Payments making up the {fmt(data.amount)} total
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {data.payments.map((p, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 0',
                    borderBottom: idx < data.payments.length - 1 ? '1px solid #f0ede8' : 'none',
                    gap: '12px',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', color: '#1a1714', fontWeight: 500 }}>{p.description}</div>
                    <div style={{ fontSize: '12px', color: '#6b6560', marginTop: '2px' }}>
                      {p.date} · {p.method}
                    </div>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#1a1714', whiteSpace: 'nowrap' }}>
                    {fmt(p.amount)}
                  </div>
                </div>
              ))}
              <div
                style={{
                  display: 'flex', justifyContent: 'space-between',
                  paddingTop: '12px', borderTop: '2px solid #e8e0d4',
                  fontSize: '15px', fontWeight: 800, color: '#1a1714',
                }}
              >
                <span>Total Reportable</span>
                <span>{fmt(data.amount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Editable fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Payer info */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '20px', border: '1px solid #e8e0d4' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#6b6560', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
              Payer (Your Firm)
            </h3>
            {[
              { label: 'Name', value: PAYER.name },
              { label: 'Address', value: `${PAYER.address}, ${PAYER.city}, ${PAYER.state} ${PAYER.zip}` },
              { label: 'EIN', value: PAYER.tin },
            ].map(({ label, value }) => (
              <div key={label} style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '11px', color: '#6b6560', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '3px' }}>{label}</div>
                <div style={{ fontSize: '13px', color: '#1a1714', fontWeight: 500 }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Recipient editable */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '20px', border: '1px solid #e8e0d4' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#6b6560', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px' }}>
              Recipient Info
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'Name', key: 'name' as const, type: 'text' },
                { label: 'Address', key: 'address' as const, type: 'text' },
                { label: 'City', key: 'city' as const, type: 'text' },
                { label: 'State', key: 'state' as const, type: 'text' },
                { label: 'ZIP Code', key: 'zip' as const, type: 'text' },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: '11px', color: '#6b6560', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
                    {label}
                  </label>
                  <input
                    type={type}
                    value={data[key] as string}
                    onChange={(e) => setData({ ...data, [key]: e.target.value })}
                    style={{
                      width: '100%', padding: '8px 10px', borderRadius: '8px',
                      border: '1px solid #e8e0d4', fontSize: '13px', color: '#1a1714',
                      backgroundColor: '#faf8f4', outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>
              ))}

              {/* TIN with verify */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#6b6560', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
                  TIN / EIN / SSN
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={data.tin}
                    onChange={(e) => setData({ ...data, tin: e.target.value })}
                    placeholder="XX-XXXXXXX"
                    style={{
                      flex: 1, padding: '8px 10px', borderRadius: '8px',
                      border: data.tin ? '1px solid #e8e0d4' : '1px solid #fca5a5',
                      fontSize: '13px', fontFamily: 'monospace', color: '#1a1714',
                      backgroundColor: '#faf8f4', outline: 'none',
                    }}
                  />
                  <TinVerifyButton tin={data.tin} />
                </div>
                {!data.tin && (
                  <div style={{ fontSize: '11px', color: '#991b1b', marginTop: '3px' }}>TIN required before filing</div>
                )}
              </div>

              {/* Amount */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#6b6560', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
                  Nonemployee Compensation (Box 1)
                </label>
                <input
                  type="number"
                  value={data.amount}
                  onChange={(e) => setData({ ...data, amount: Number(e.target.value) })}
                  style={{
                    width: '100%', padding: '8px 10px', borderRadius: '8px',
                    border: '1px solid #e8e0d4', fontSize: '13px', color: '#1a1714',
                    backgroundColor: '#faf8f4', outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Form type */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#6b6560', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
                  Form Type
                </label>
                <select
                  value={data.formType}
                  onChange={(e) => setData({ ...data, formType: e.target.value as '1099-NEC' | '1099-MISC' | '1099-K' })}
                  style={{
                    width: '100%', padding: '8px 10px', borderRadius: '8px',
                    border: '1px solid #e8e0d4', fontSize: '13px', color: '#1a1714',
                    backgroundColor: '#faf8f4', outline: 'none', boxSizing: 'border-box',
                  }}
                >
                  <option>1099-NEC</option>
                  <option>1099-MISC</option>
                  <option>1099-K</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filing modal */}
      {showModal && (
        <FilingModal
          recipient={data}
          onClose={() => setShowModal(false)}
          onFiled={(num) => { setConfirmNum(num); setShowModal(false) }}
        />
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
