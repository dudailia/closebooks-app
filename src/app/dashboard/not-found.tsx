import Link from 'next/link'

export default function DashboardNotFound() {
  return (
    <div style={{
      padding: '80px 24px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      backgroundColor: '#faf8f4',
      minHeight: '60vh',
    }}>
      <div style={{
        fontSize: 72,
        fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
        fontWeight: 400, color: '#e8e0d4', marginBottom: 16, lineHeight: 1,
      }}>
        404
      </div>
      <h2 style={{
        fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
        fontSize: 22, fontWeight: 400, color: '#1a1714', marginBottom: 8,
      }}>
        Page not found
      </h2>
      <p style={{ color: '#6b6560', fontSize: 14, marginBottom: 28, maxWidth: 360 }}>
        This page doesn&#39;t exist. You may have followed an old link or typed the URL incorrectly.
      </p>
      <Link
        href="/dashboard"
        style={{
          backgroundColor: '#2d5a27', color: '#fff',
          borderRadius: 8, padding: '10px 24px',
          fontSize: 14, fontWeight: 600, textDecoration: 'none',
        }}
      >
        Back to Dashboard
      </Link>
    </div>
  )
}
