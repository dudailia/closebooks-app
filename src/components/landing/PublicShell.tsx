import Nav from './Nav'
import Footer from './Footer'

export default function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-theme="dark"
      style={{
        minHeight: '100vh',
        backgroundColor: '#080808',
        color: '#FAFAFA',
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        backgroundImage:
          'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
        backgroundSize: '64px 64px',
      }}
    >
      <Nav />
      <div style={{ flex: 1 }}>{children}</div>
      <Footer />
    </div>
  )
}
