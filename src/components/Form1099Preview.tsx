'use client'

export interface Recipient1099 {
  id: string
  name: string
  address: string
  city: string
  state: string
  zip: string
  tin: string
  amount: number
  federalWithheld?: number
  stateWithheld?: number
  stateIncome?: number
  accountNumber?: string
  formType: '1099-NEC' | '1099-MISC' | '1099-K'
}

export interface Payer1099 {
  name: string
  address: string
  city: string
  state: string
  zip: string
  tin: string
  phone?: string
}

interface Form1099PreviewProps {
  recipient: Recipient1099
  payer: Payer1099
  taxYear?: number
}

function Box({ label, value, boxNum, wide }: { label: string; value?: string; boxNum?: string; wide?: boolean }) {
  return (
    <div
      style={{
        border: '1px solid #555',
        padding: '4px 6px',
        minHeight: wide ? '44px' : '36px',
        flex: wide ? '2 1 0' : '1 1 0',
        position: 'relative',
        backgroundColor: '#ffffff',
      }}
    >
      {boxNum && (
        <div style={{ fontSize: '8px', color: '#444', marginBottom: '2px' }}>
          Box {boxNum}
        </div>
      )}
      <div style={{ fontSize: '8px', color: '#555', lineHeight: 1.2 }}>{label}</div>
      {value && (
        <div style={{ fontSize: '11px', fontWeight: 600, color: '#1a1714', marginTop: '2px' }}>
          {value}
        </div>
      )}
    </div>
  )
}

export default function Form1099Preview({ recipient, payer, taxYear = 2024 }: Form1099PreviewProps) {
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  const maskedTin = recipient.tin.replace(/(\d{2})(\d{3})(\d{4})/, 'XX-XXX$3')

  return (
    <div
      style={{
        fontFamily: '"Courier New", monospace',
        border: '2px solid #333',
        maxWidth: '640px',
        backgroundColor: '#ffffff',
        fontSize: '9px',
      }}
    >
      {/* Header bar */}
      <div
        style={{
          backgroundColor: '#1a3a1a',
          color: '#ffffff',
          padding: '6px 10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '1px' }}>
          {recipient.formType}
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '10px' }}>Nonemployee Compensation</div>
          <div style={{ fontSize: '9px', opacity: 0.8 }}>OMB No. 1545-0116</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '18px', fontWeight: 700 }}>{taxYear}</div>
          <div style={{ fontSize: '8px', opacity: 0.8 }}>Form {recipient.formType}</div>
        </div>
      </div>

      {/* Top section: Payer + Recipient */}
      <div style={{ display: 'flex', borderBottom: '1px solid #555' }}>
        {/* Payer info */}
        <div style={{ flex: 1, borderRight: '1px solid #555', padding: '8px' }}>
          <div style={{ fontSize: '8px', color: '#555', marginBottom: '4px', fontWeight: 700, textTransform: 'uppercase' }}>
            Payer's name, street address, city, state, ZIP code
          </div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#1a1714' }}>{payer.name}</div>
          <div style={{ fontSize: '10px', color: '#444', lineHeight: 1.5 }}>
            {payer.address}<br />
            {payer.city}, {payer.state} {payer.zip}
          </div>
          {payer.phone && (
            <div style={{ fontSize: '9px', color: '#666', marginTop: '4px' }}>{payer.phone}</div>
          )}
        </div>

        {/* VOID / CORRECTED + Payer TIN + Recipient TIN */}
        <div style={{ width: '160px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #555' }}>
            <div style={{ flex: 1, padding: '4px 6px', borderRight: '1px solid #555', fontSize: '9px' }}>VOID □</div>
            <div style={{ flex: 1, padding: '4px 6px', fontSize: '9px' }}>CORRECTED □</div>
          </div>
          <div style={{ padding: '6px', borderBottom: '1px solid #555' }}>
            <div style={{ fontSize: '8px', color: '#555' }}>Payer's TIN</div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#1a1714' }}>{payer.tin}</div>
          </div>
          <div style={{ padding: '6px' }}>
            <div style={{ fontSize: '8px', color: '#555' }}>Recipient's TIN</div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#1a1714' }}>{maskedTin}</div>
          </div>
        </div>
      </div>

      {/* Recipient info */}
      <div
        style={{
          padding: '8px',
          borderBottom: '1px solid #555',
          display: 'flex',
          justifyContent: 'space-between',
          gap: '8px',
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '8px', color: '#555', marginBottom: '3px' }}>
            Recipient's name
          </div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#1a1714' }}>{recipient.name}</div>
          <div style={{ fontSize: '10px', color: '#444', marginTop: '4px', lineHeight: 1.5 }}>
            {recipient.address}<br />
            {recipient.city}, {recipient.state} {recipient.zip}
          </div>
        </div>
        <div style={{ width: '120px' }}>
          <div style={{ fontSize: '8px', color: '#555', marginBottom: '3px' }}>Account number</div>
          <div style={{ fontSize: '10px', color: '#666' }}>{recipient.accountNumber ?? '—'}</div>
          <div style={{ fontSize: '8px', color: '#555', marginTop: '8px', marginBottom: '3px' }}>
            2nd TIN not.
          </div>
          <div style={{ fontSize: '10px' }}>□</div>
        </div>
      </div>

      {/* Boxes row 1 */}
      <div style={{ display: 'flex', borderBottom: '1px solid #555' }}>
        <Box boxNum="1" label="Nonemployee compensation" value={fmt(recipient.amount)} wide />
        <Box boxNum="2" label="Payer made direct sales totaling $5,000 or more" />
        <Box boxNum="3" label="(reserved for future use)" />
      </div>

      {/* Boxes row 2 */}
      <div style={{ display: 'flex', borderBottom: '1px solid #555' }}>
        <Box
          boxNum="4"
          label="Federal income tax withheld"
          value={recipient.federalWithheld ? fmt(recipient.federalWithheld) : '$0.00'}
        />
        <Box boxNum="5" label="State tax withheld" value={recipient.stateWithheld ? fmt(recipient.stateWithheld) : '—'} />
        <Box boxNum="6" label="State/Payer's state no." />
        <Box boxNum="7" label="State income" value={recipient.stateIncome ? fmt(recipient.stateIncome) : '—'} />
      </div>

      {/* Footer */}
      <div
        style={{
          backgroundColor: '#f5f5f0',
          padding: '4px 10px',
          fontSize: '8px',
          color: '#666',
          textAlign: 'center',
        }}
      >
        Department of the Treasury — Internal Revenue Service · Copy B — For Recipient · This is important tax information and is being furnished to the IRS.
      </div>
    </div>
  )
}
