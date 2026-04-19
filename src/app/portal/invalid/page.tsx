export default function PortalInvalidPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#faf8f4',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      fontFamily: 'var(--font-dm-sans, system-ui, sans-serif)',
    }}>
      <div style={{ maxWidth: 420, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔗</div>
        <h1 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 28, color: '#1a1714', margin: '0 0 12px' }}>
          Link Not Found
        </h1>
        <p style={{ fontSize: 16, color: '#6b6560', lineHeight: 1.6, margin: '0 0 24px' }}>
          This portal link is no longer valid. It may have been revoked or never existed.
        </p>
        <div style={{
          background: 'white',
          border: '1px solid #e8e0d4',
          borderRadius: 12,
          padding: '20px 24px',
          fontSize: 14,
          color: '#6b6560',
          lineHeight: 1.6,
        }}>
          Contact your accountant for a new access link.
        </div>
      </div>
    </div>
  )
}
