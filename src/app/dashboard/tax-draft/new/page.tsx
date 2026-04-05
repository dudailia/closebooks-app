'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const FORM_TYPES = [
  { id: '1120S', label: 'Form 1120-S', description: 'S-Corporation tax return', icon: 'S' },
  { id: '1065',  label: 'Form 1065',   description: 'Partnership / LLC tax return', icon: 'P' },
  { id: '1040',  label: 'Form 1040',   description: 'Individual / Sole proprietor', icon: 'I' },
  { id: '1120',  label: 'Form 1120',   description: 'C-Corporation tax return', icon: 'C' },
  { id: '1041',  label: 'Form 1041',   description: 'Estate or trust return', icon: 'E' },
]

const DEMO_CLIENTS = [
  'Smith Construction LLC', 'Bella Vista Restaurant', 'Chen Medical Practice',
  'TechFlow Inc', 'Green Valley Farms', 'Meridian Consulting Group',
]

export default function NewTaxReturnPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [client, setClient] = useState('')
  const [formType, setFormType] = useState('')
  const [hasPriorYear, setHasPriorYear] = useState<boolean | null>(null)
  const [fileName, setFileName] = useState('')
  const [generating, setGenerating] = useState(false)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) setFileName(f.name)
  }

  async function handleGenerate() {
    setGenerating(true)
    // Simulate generation delay
    await new Promise(r => setTimeout(r, 1800))
    router.push('/dashboard/tax-draft/smith-2024')
  }

  const canProceed1 = client.trim().length > 0
  const canProceed2 = hasPriorYear !== null
  const canGenerate = formType !== ''

  return (
    <div style={{ backgroundColor: '#faf8f4', minHeight: '100vh' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 24px' }}>

        {/* Back */}
        <Link href="/dashboard/tax-draft" style={{ fontSize: 13, color: '#6b6560', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 24 }}>
          ← Back to Tax Returns
        </Link>

        <h1 style={{
          fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
          fontSize: 26, fontWeight: 400, color: '#1a1714', marginBottom: 8, letterSpacing: '-0.02em',
        }}>New Tax Return</h1>
        <p style={{ color: '#6b6560', fontSize: 14, marginBottom: 32 }}>CloseBooks will prepare a complete draft return with AI annotations.</p>

        {/* Progress */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 36, alignItems: 'center' }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700,
                backgroundColor: step > s ? '#2d5a27' : step === s ? '#1a1714' : '#e8e0d4',
                color: step >= s ? '#fff' : '#6b6560',
              }}>{step > s ? '✓' : s}</div>
              <span style={{ fontSize: 12, color: step === s ? '#1a1714' : '#a09a94', fontWeight: step === s ? 600 : 400 }}>
                {s === 1 ? 'Select Client' : s === 2 ? 'Prior Year' : 'Form Type'}
              </span>
              {s < 3 && <div style={{ width: 32, height: 1, backgroundColor: '#e8e0d4' }} />}
            </div>
          ))}
        </div>

        <div style={{ backgroundColor: '#fff', border: '1px solid #e8e0d4', borderRadius: 16, padding: 32 }}>

          {/* Step 1: Client */}
          {step === 1 && (
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 600, color: '#1a1714', marginBottom: 20 }}>Which client is this return for?</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                {DEMO_CLIENTS.map(c => (
                  <button
                    key={c}
                    onClick={() => setClient(c)}
                    style={{
                      padding: '12px 16px', borderRadius: 10, textAlign: 'left',
                      border: client === c ? '2px solid #2d5a27' : '1px solid #e8e0d4',
                      backgroundColor: client === c ? '#f0fdf4' : '#fff',
                      color: '#1a1714', fontSize: 14, cursor: 'pointer',
                      fontWeight: client === c ? 600 : 400,
                    }}
                  >{c}</button>
                ))}
                <div style={{ position: 'relative' }}>
                  <input
                    placeholder="Or type a client name..."
                    value={DEMO_CLIENTS.includes(client) ? '' : client}
                    onChange={e => setClient(e.target.value)}
                    style={{
                      width: '100%', padding: '12px 16px', borderRadius: 10, boxSizing: 'border-box',
                      border: '1px solid #e8e0d4', fontSize: 14, color: '#1a1714', backgroundColor: '#faf8f4', outline: 'none',
                    }}
                  />
                </div>
              </div>
              <button
                disabled={!canProceed1}
                onClick={() => setStep(2)}
                style={{
                  width: '100%', padding: '12px 0', borderRadius: 10, border: 'none',
                  backgroundColor: canProceed1 ? '#2d5a27' : '#e8e0d4',
                  color: canProceed1 ? '#fff' : '#a09a94', fontSize: 14, fontWeight: 600, cursor: canProceed1 ? 'pointer' : 'not-allowed',
                }}
              >Continue →</button>
            </div>
          )}

          {/* Step 2: Prior year */}
          {step === 2 && (
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 600, color: '#1a1714', marginBottom: 8 }}>Do you have the prior year return?</h2>
              <p style={{ color: '#6b6560', fontSize: 13, marginBottom: 20 }}>Uploading it significantly improves accuracy — CloseBooks will read every line and carry forward positions.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                <button
                  onClick={() => setHasPriorYear(true)}
                  style={{
                    padding: '16px 20px', borderRadius: 12, textAlign: 'left', cursor: 'pointer',
                    border: hasPriorYear === true ? '2px solid #2d5a27' : '1px solid #e8e0d4',
                    backgroundColor: hasPriorYear === true ? '#f0fdf4' : '#fff',
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1714' }}>Yes — upload prior year PDF</div>
                  <div style={{ fontSize: 12, color: '#6b6560', marginTop: 2 }}>Best accuracy · Carries forward all positions</div>
                </button>
                <button
                  onClick={() => setHasPriorYear(false)}
                  style={{
                    padding: '16px 20px', borderRadius: 12, textAlign: 'left', cursor: 'pointer',
                    border: hasPriorYear === false ? '2px solid #b8734a' : '1px solid #e8e0d4',
                    backgroundColor: hasPriorYear === false ? '#fff8f4' : '#fff',
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1714' }}>Skip — use current year books only</div>
                  <div style={{ fontSize: 12, color: '#6b6560', marginTop: 2 }}>Good for new clients or first-year returns</div>
                </button>
              </div>

              {hasPriorYear && (
                <label style={{
                  display: 'block', border: '2px dashed #e8e0d4', borderRadius: 12, padding: 24,
                  textAlign: 'center', cursor: 'pointer', marginBottom: 20, backgroundColor: '#faf8f4',
                }}>
                  <input type="file" accept=".pdf" onChange={handleFileChange} style={{ display: 'none' }} />
                  {fileName ? (
                    <div>
                      <div style={{ fontSize: 24, marginBottom: 4 }}>📄</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1714' }}>{fileName}</div>
                      <div style={{ fontSize: 12, color: '#2d5a27', marginTop: 4 }}>✓ Ready to analyze</div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: 24, marginBottom: 4 }}>⬆️</div>
                      <div style={{ fontSize: 14, color: '#6b6560' }}>Drop PDF here or click to browse</div>
                    </div>
                  )}
                </label>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep(1)} style={{ flex: 1, padding: '12px 0', borderRadius: 10, border: '1px solid #e8e0d4', backgroundColor: '#fff', color: '#6b6560', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>← Back</button>
                <button
                  disabled={!canProceed2}
                  onClick={() => setStep(3)}
                  style={{
                    flex: 2, padding: '12px 0', borderRadius: 10, border: 'none',
                    backgroundColor: canProceed2 ? '#2d5a27' : '#e8e0d4',
                    color: canProceed2 ? '#fff' : '#a09a94', fontSize: 14, fontWeight: 600, cursor: canProceed2 ? 'pointer' : 'not-allowed',
                  }}
                >Continue →</button>
              </div>
            </div>
          )}

          {/* Step 3: Form type + generate */}
          {step === 3 && (
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 600, color: '#1a1714', marginBottom: 20 }}>Select the return type</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                {FORM_TYPES.map(ft => (
                  <button
                    key={ft.id}
                    onClick={() => setFormType(ft.id)}
                    style={{
                      padding: '14px 18px', borderRadius: 12, textAlign: 'left', cursor: 'pointer',
                      border: formType === ft.id ? '2px solid #2d5a27' : '1px solid #e8e0d4',
                      backgroundColor: formType === ft.id ? '#f0fdf4' : '#fff',
                      display: 'flex', alignItems: 'center', gap: 14,
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      backgroundColor: formType === ft.id ? '#2d5a27' : '#e8e0d4',
                      color: formType === ft.id ? '#fff' : '#6b6560', fontSize: 14, fontWeight: 800,
                    }}>{ft.icon}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1714' }}>{ft.label}</div>
                      <div style={{ fontSize: 12, color: '#6b6560' }}>{ft.description}</div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Summary */}
              {formType && (
                <div style={{ backgroundColor: '#f8f5f0', borderRadius: 10, padding: 16, marginBottom: 20, fontSize: 13 }}>
                  <div style={{ fontWeight: 600, color: '#1a1714', marginBottom: 4 }}>Ready to generate</div>
                  <div style={{ color: '#6b6560' }}>Client: <span style={{ color: '#1a1714' }}>{client}</span></div>
                  <div style={{ color: '#6b6560' }}>Form: <span style={{ color: '#1a1714' }}>{formType}</span></div>
                  <div style={{ color: '#6b6560' }}>Prior year: <span style={{ color: '#1a1714' }}>{hasPriorYear ? (fileName || 'PDF uploaded') : 'Skipped'}</span></div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep(2)} style={{ flex: 1, padding: '12px 0', borderRadius: 10, border: '1px solid #e8e0d4', backgroundColor: '#fff', color: '#6b6560', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>← Back</button>
                <button
                  disabled={!canGenerate || generating}
                  onClick={handleGenerate}
                  style={{
                    flex: 2, padding: '12px 0', borderRadius: 10, border: 'none',
                    backgroundColor: canGenerate && !generating ? '#b8734a' : '#e8e0d4',
                    color: canGenerate && !generating ? '#fff' : '#a09a94', fontSize: 14, fontWeight: 600,
                    cursor: canGenerate && !generating ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  {generating ? (
                    <>
                      <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                      Analyzing return...
                    </>
                  ) : '✦ Generate Draft Return'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
