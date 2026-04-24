import Nav from './Nav'
import Footer from './Footer'

export default function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-theme="dark"
      style={{
        minHeight: '100vh',
        backgroundColor: '#0A0A0F',
        color: '#F0F0F5',
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Nav />
      <div style={{ flex: 1 }}>{children}</div>
      <Footer />
    </div>
  )
}
