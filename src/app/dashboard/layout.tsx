import Sidebar from '@/components/Sidebar'
import TopBar from '@/components/TopBar'
import ErrorBoundary from '@/components/ErrorBoundary'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: '#faf8f4', minHeight: '100vh' }}>
      <ErrorBoundary>
        <Sidebar />
      </ErrorBoundary>
      {/* margin-left matches sidebar width; Sidebar.tsx updates --sb-width on toggle */}
      <div style={{
        marginLeft: 'var(--sb-width, 220px)',
        transition: 'margin-left 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        minWidth: 0,
        overflowX: 'hidden',
      }}>
        <TopBar />
        <main style={{ flex: 1 }} className="page-content">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}
