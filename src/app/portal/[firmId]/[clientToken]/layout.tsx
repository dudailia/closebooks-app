export default function ClientPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: '#faf8f4', minHeight: '100vh' }}>
      {children}
    </div>
  )
}
