import Sidebar from '@/components/Sidebar'
import TopBar from '@/components/TopBar'
import ErrorBoundary from '@/components/ErrorBoundary'
import TrialBanner from '@/components/TrialBanner'
import SubscriptionSync from '@/components/SubscriptionSync'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: '#faf8f4', minHeight: '100vh' }}>
      <ErrorBoundary>
        <Sidebar />
      </ErrorBoundary>
      {/*
        On desktop: margin-left = sidebar width (updated by Sidebar via CSS var)
        On mobile (< 768px): sidebar is hidden as overlay; content takes full width
      */}
      <div
        className="dashboard-content-wrapper"
        style={{
          marginLeft: 'var(--sb-width, 220px)',
          transition: 'margin-left 0.2s ease',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          minWidth: 0,
          overflowX: 'hidden',
        }}
      >
        <TopBar />
        <SubscriptionSync />
        <TrialBanner />
        <main style={{ flex: 1 }} className="page-content">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}
