'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const NON_AGENT_CLIENTS = [
  { id: 'techflow-2024', name: 'TechFlow Inc', entity: '1120' },
  { id: 'greenvally-2024', name: 'Green Valley Farms', entity: '1065' },
  { id: 'meridian-2024', name: 'Meridian Consulting', entity: '1120S' },
]

const BANKS = [
  { id: 'chase', name: 'Chase', color: '#003087', initial: 'C' },
  { id: 'bofa', name: 'Bank of America', color: '#e31837', initial: 'B' },
  { id: 'wells', name: 'Wells Fargo', color: '#c8102e', initial: 'W' },
]

type BankStatus = 'idle' | 'authenticating' | 'connected'

interface BankModalState {
  bankId: string
  email: string
  password: string
  status: BankStatus
}

export default function NewAgentPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [selectedClient, setSelectedClient] = useState<typeof NON_AGENT_CLIENTS[0] | null>(null)
  const [selectedBank, setSelectedBank] = useState<string | null>(null)
  const [bankModal, setBankModal] = useState<BankModalState | null>(null)
  const [connectedBank, setConnectedBank] = useState<string | null>(null)
  const [otherBankHover, setOtherBankHover] = useState(false)

  // Step 3 settings
  const [confidenceThreshold, setConfidenceThreshold] = useState(85)
  const [reconThreshold, setReconThreshold] = useState(5)
  const [autoReport, setAutoReport] = useState(true)
  const [runSchedule, setRunSchedule] = useState<'monthly-1' | 'monthly-3' | 'manual'>('monthly-1')
  const [notifyPref, setNotifyPref] = useState<'always' | 'exceptions' | 'never'>('exceptions')

  // Step 4
  const [activating, setActivating] = useState(false)
  const [activated, setActivated] = useState(false)

  async function handleBankConnect() {
    if (!bankModal) return
    setBankModal(b => b ? { ...b, status: 'authenticating' } : b)
    await new Promise(r => setTimeout(r, 1500))
    setBankModal(b => b ? { ...b, status: 'connected' } : b)
    setConnectedBank(bankModal.bankId)
    setTimeout(() => {
      setSelectedBank(bankModal.bankId)
      setBankModal(null)
    }, 1200)
  }

  async function handleActivate() {
    setActivating(true)
    await new Promise(r => setTimeout(r, 2000))
    setActivating(false)
    setActivated(true)
  }

  const STEP_LABELS = ['Select Client', 'Connect Bank', 'Set Rules', 'Activate']

  if (activated && selectedClient) {
    return (
      <div style={{ backgroundColor: '#faf8f4', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            backgroundColor: '#dcfce7',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
            animation: 'successScale 0.4s ease',
          }}>
            <span style={{ fontSize: 36, color: '#2d5a27' }}>✓</span>
          </div>
          <h2 style={{
            fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
            fontSize: 28, fontWeight: 400, color: '#1a1714', marginBottom: 12,
          }}>Agent activated!</h2>
          <p style={{ color: '#6b6560', fontSize: 16, marginBottom: 28 }}>
            First close scheduled for Dec 1.
          </p>
          <Link href={`/dashboard/agent/${selectedClient.id}`} style={{
            display: 'inline-block',
            padding: '12px 28px', borderRadius: 10,
            backgroundColor: '#2d5a27', color: '#fff',
            fontSize: 14, fontWeight: 600, textDecoration: 'none',
          }}>
            View Agent Dashboard →
          </Link>
        </div>
        <style>{`@keyframes successScale { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#faf8f4', minHeight: '100vh' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 24px' }}>
        <Link href="/dashboard/agent" style={{ fontSize: 13, color: '#6b6560', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 24 }}>
          ← Back to Agent Dashboard
        </Link>

        <h1 style={{
          fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
          fontSize: 26, fontWeight: 400, color: '#1a1714', marginBottom: 8,
        }}>Add Client to Agent Mode</h1>
        <p style={{ color: '#6b6560', fontSize: 14, marginBottom: 32 }}>Set up autonomous bookkeeping for a new client.</p>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 36, alignItems: 'center', flexWrap: 'wrap' }}>
          {STEP_LABELS.map((label, i) => {
            const s = i + 1
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700,
                  backgroundColor: step > s ? '#2d5a27' : step === s ? '#1a1714' : '#e8e0d4',
                  color: step >= s ? '#fff' : '#6b6560',
                }}>{step > s ? '✓' : s}</div>
                <span style={{ fontSize: 12, color: step === s ? '#1a1714' : '#a09a94', fontWeight: step === s ? 600 : 400 }}>{label}</span>
                {s < STEP_LABELS.length && <div style={{ width: 24, height: 1, backgroundColor: '#e8e0d4' }} />}
              </div>
            )
          })}
        </div>

        <div style={{ backgroundColor: '#fff', border: '1px solid #e8e0d4', borderRadius: 16, padding: 32 }}>

          {/* STEP 1 */}
          {step === 1 && (
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 600, color: '#1a1714', marginBottom: 20 }}>Which client do you want to onboard?</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                {NON_AGENT_CLIENTS.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedClient(c)}
                    style={{
                      padding: '14px 16px', borderRadius: 10, textAlign: 'left',
                      border: selectedClient?.id === c.id ? '2px solid #2d5a27' : '1px solid #e8e0d4',
                      backgroundColor: selectedClient?.id === c.id ? '#f0fdf4' : '#fff',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}
                  >
                    <span style={{ fontWeight: 600, color: '#1a1714', fontSize: 14 }}>{c.name}</span>
                    <span style={{
                      padding: '2px 8px', borderRadius: 20,
                      backgroundColor: '#e0f2fe', color: '#0369a1',
                      fontSize: 11, fontWeight: 500,
                    }}>{c.entity}</span>
                  </button>
                ))}
              </div>
              <button
                disabled={!selectedClient}
                onClick={() => setStep(2)}
                style={{
                  width: '100%', padding: '12px 0', borderRadius: 10, border: 'none',
                  backgroundColor: selectedClient ? '#2d5a27' : '#e8e0d4',
                  color: selectedClient ? '#fff' : '#a09a94',
                  fontSize: 14, fontWeight: 600, cursor: selectedClient ? 'pointer' : 'not-allowed',
                }}
              >Continue →</button>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 600, color: '#1a1714', marginBottom: 6 }}>Connect a bank account</h2>
              <p style={{ color: '#6b6560', fontSize: 13, marginBottom: 20 }}>Select your client's bank to securely connect their transactions.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {BANKS.map(bank => (
                  <button
                    key={bank.id}
                    onClick={() => setBankModal({ bankId: bank.id, email: '', password: '', status: 'idle' })}
                    style={{
                      padding: '16px 20px', borderRadius: 12,
                      border: connectedBank === bank.id ? '2px solid #2d5a27' : '1px solid #e8e0d4',
                      backgroundColor: connectedBank === bank.id ? '#f0fdf4' : '#fff',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14,
                    }}
                  >
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      backgroundColor: bank.color,
                      color: '#fff', fontWeight: 800, fontSize: 18,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>{bank.initial}</div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1714' }}>{bank.name}</div>
                      {connectedBank === bank.id && <div style={{ fontSize: 12, color: '#2d5a27', marginTop: 2 }}>✓ Connected</div>}
                    </div>
                  </button>
                ))}
                <button
                  onMouseEnter={() => setOtherBankHover(true)}
                  onMouseLeave={() => setOtherBankHover(false)}
                  onClick={() => setBankModal({ bankId: 'other', email: '', password: '', status: 'idle' })}
                  style={{
                    padding: '16px 20px', borderRadius: 12,
                    border: '1px dashed #e8e0d4',
                    backgroundColor: otherBankHover ? '#faf8f4' : '#fff',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14,
                    transition: 'background-color 0.15s',
                  }}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, backgroundColor: '#e8e0d4',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, color: '#6b6560',
                  }}>+</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#6b6560', textAlign: 'left' }}>Other bank (via Plaid)</div>
                </button>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep(1)} style={{ flex: 1, padding: '12px 0', borderRadius: 10, border: '1px solid #e8e0d4', backgroundColor: '#fff', color: '#6b6560', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>← Back</button>
                <button
                  disabled={!connectedBank}
                  onClick={() => setStep(3)}
                  style={{
                    flex: 2, padding: '12px 0', borderRadius: 10, border: 'none',
                    backgroundColor: connectedBank ? '#2d5a27' : '#e8e0d4',
                    color: connectedBank ? '#fff' : '#a09a94',
                    fontSize: 14, fontWeight: 600, cursor: connectedBank ? 'pointer' : 'not-allowed',
                  }}
                >Continue →</button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 600, color: '#1a1714', marginBottom: 20 }}>Configure agent rules</h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 28 }}>
                {/* Confidence slider */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <label style={{ fontSize: 13, fontWeight: 500, color: '#1a1714' }}>Auto-categorize if confidence above</label>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#2d5a27' }}>{confidenceThreshold}%</span>
                  </div>
                  <input
                    type="range" min={70} max={95} value={confidenceThreshold}
                    onChange={e => setConfidenceThreshold(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#2d5a27' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                    <span>70%</span><span>95%</span>
                  </div>
                </div>

                {/* Recon slider */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <label style={{ fontSize: 13, fontWeight: 500, color: '#1a1714' }}>Auto-approve reconciliation if difference under</label>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#2d5a27' }}>${reconThreshold}</span>
                  </div>
                  <input
                    type="range" min={0} max={50} value={reconThreshold}
                    onChange={e => setReconThreshold(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#2d5a27' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                    <span>$0</span><span>$50</span>
                  </div>
                </div>

                {/* Auto report toggle */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#1a1714' }}>Send monthly report to client automatically</label>
                  <div
                    onClick={() => setAutoReport(r => !r)}
                    style={{
                      width: 40, height: 22, borderRadius: 11,
                      backgroundColor: autoReport ? '#2d5a27' : '#e8e0d4',
                      position: 'relative', cursor: 'pointer', transition: 'background-color 0.2s',
                      flexShrink: 0,
                    }}
                  >
                    <div style={{
                      position: 'absolute', top: 3, left: autoReport ? 21 : 3,
                      width: 16, height: 16, borderRadius: '50%',
                      backgroundColor: '#fff', transition: 'left 0.2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }} />
                  </div>
                </div>

                {/* Schedule radio */}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#1a1714', display: 'block', marginBottom: 8 }}>Run schedule</label>
                  {([['monthly-1', 'Monthly on 1st'], ['monthly-3', 'Monthly on 3rd'], ['manual', 'Manual only']] as const).map(([val, label]) => (
                    <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, cursor: 'pointer' }}>
                      <input
                        type="radio" name="schedule" value={val}
                        checked={runSchedule === val}
                        onChange={() => setRunSchedule(val)}
                        style={{ accentColor: '#2d5a27' }}
                      />
                      <span style={{ fontSize: 13, color: '#1a1714' }}>{label}</span>
                    </label>
                  ))}
                </div>

                {/* Notify radio */}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#1a1714', display: 'block', marginBottom: 8 }}>Notify me</label>
                  {([['always', 'Always'], ['exceptions', 'Exceptions only'], ['never', 'Never']] as const).map(([val, label]) => (
                    <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, cursor: 'pointer' }}>
                      <input
                        type="radio" name="notify" value={val}
                        checked={notifyPref === val}
                        onChange={() => setNotifyPref(val)}
                        style={{ accentColor: '#2d5a27' }}
                      />
                      <span style={{ fontSize: 13, color: '#1a1714' }}>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep(2)} style={{ flex: 1, padding: '12px 0', borderRadius: 10, border: '1px solid #e8e0d4', backgroundColor: '#fff', color: '#6b6560', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>← Back</button>
                <button
                  onClick={() => setStep(4)}
                  style={{ flex: 2, padding: '12px 0', borderRadius: 10, border: 'none', backgroundColor: '#2d5a27', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                >Continue →</button>
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && selectedClient && (
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 600, color: '#1a1714', marginBottom: 20 }}>Review & Activate</h2>

              <div style={{ backgroundColor: '#faf8f4', borderRadius: 12, padding: 20, marginBottom: 24 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, color: '#6b6560' }}>Client</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1714' }}>{selectedClient.name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, color: '#6b6560' }}>Bank</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1714' }}>
                      {BANKS.find(b => b.id === connectedBank)?.name ?? connectedBank}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, color: '#6b6560' }}>Auto-categorize threshold</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1714' }}>{confidenceThreshold}%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, color: '#6b6560' }}>Reconciliation tolerance</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1714' }}>${reconThreshold}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, color: '#6b6560' }}>Monthly reports</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: autoReport ? '#2d5a27' : '#6b6560' }}>{autoReport ? 'Enabled' : 'Disabled'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, color: '#6b6560' }}>Schedule</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1714' }}>
                      {runSchedule === 'monthly-1' ? 'Monthly on 1st' : runSchedule === 'monthly-3' ? 'Monthly on 3rd' : 'Manual only'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, color: '#6b6560' }}>Notifications</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1714' }}>
                      {notifyPref === 'always' ? 'Always' : notifyPref === 'exceptions' ? 'Exceptions only' : 'Never'}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep(3)} style={{ flex: 1, padding: '12px 0', borderRadius: 10, border: '1px solid #e8e0d4', backgroundColor: '#fff', color: '#6b6560', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>← Back</button>
                <button
                  onClick={handleActivate}
                  disabled={activating}
                  style={{
                    flex: 2, padding: '12px 0', borderRadius: 10, border: 'none',
                    backgroundColor: activating ? '#e8e0d4' : '#b8734a',
                    color: activating ? '#a09a94' : '#fff',
                    fontSize: 14, fontWeight: 600,
                    cursor: activating ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  {activating ? (
                    <>
                      <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#b8734a', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                      Activating...
                    </>
                  ) : 'Activate Agent'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bank Modal */}
      {bankModal && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => bankModal.status === 'idle' && setBankModal(null)}
        >
          <div
            style={{ backgroundColor: '#fff', borderRadius: 16, padding: 32, width: 340, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
            onClick={e => e.stopPropagation()}
          >
            {bankModal.status === 'connected' ? (
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#2d5a27' }}>Connected!</div>
                <div style={{ fontSize: 13, color: '#6b6560', marginTop: 4 }}>Ready to sync transactions.</div>
              </div>
            ) : (
              <>
                <div style={{
                  width: 52, height: 52, borderRadius: 12,
                  backgroundColor: BANKS.find(b => b.id === bankModal.bankId)?.color ?? '#6b6560',
                  color: '#fff', fontWeight: 800, fontSize: 22,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>
                  {BANKS.find(b => b.id === bankModal.bankId)?.initial ?? '?'}
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1a1714', textAlign: 'center', marginBottom: 20 }}>
                  {BANKS.find(b => b.id === bankModal.bankId)?.name ?? 'Bank'} Login
                </h3>
                <input
                  type="email"
                  placeholder="Email"
                  value={bankModal.email}
                  onChange={e => setBankModal(b => b ? { ...b, email: e.target.value } : b)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e8e0d4', fontSize: 13, marginBottom: 10, boxSizing: 'border-box', outline: 'none' }}
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={bankModal.password}
                  onChange={e => setBankModal(b => b ? { ...b, password: e.target.value } : b)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e8e0d4', fontSize: 13, marginBottom: 16, boxSizing: 'border-box', outline: 'none' }}
                />
                <button
                  onClick={handleBankConnect}
                  disabled={bankModal.status === 'authenticating'}
                  style={{
                    width: '100%', padding: '11px 0', borderRadius: 10, border: 'none',
                    backgroundColor: bankModal.status === 'authenticating' ? '#e8e0d4' : '#2d5a27',
                    color: bankModal.status === 'authenticating' ? '#a09a94' : '#fff',
                    fontSize: 14, fontWeight: 600,
                    cursor: bankModal.status === 'authenticating' ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  {bankModal.status === 'authenticating' ? (
                    <>
                      <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#2d5a27', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                      Authenticating...
                    </>
                  ) : 'Connect Bank'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
