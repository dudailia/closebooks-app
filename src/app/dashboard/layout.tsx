import Sidebar from '@/components/Sidebar'
import TopBar from '@/components/TopBar'
import ErrorBoundary from '@/components/ErrorBoundary'
import TrialBanner from '@/components/TrialBanner'
import SubscriptionSync from '@/components/SubscriptionSync'
import FirmDataProvider from '@/components/FirmDataProvider'
import { SubscriptionProvider } from '@/contexts/SubscriptionContext'
import SubscriptionBanners from '@/components/SubscriptionBanners'
import UpgradeModal from '@/components/UpgradeModal'
import SessionPulse from '@/components/SessionPulse'
import CopilotShortcut from '@/components/CopilotShortcut'
import AppChatPanelHost from '@/components/ai/AppChatPanelHost'
import ClientErrorLogger from '@/components/ClientErrorLogger'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: '#faf8f4', minHeight: '100vh' }}>
      <ClientErrorLogger />
      <CopilotShortcut />
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
        <SubscriptionProvider>
          <SessionPulse />
          <TopBar />
          <SubscriptionSync />
          <SubscriptionBanners />
          <TrialBanner />
          <FirmDataProvider>
            <main style={{ flex: 1 }} className="page-content">
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
            </main>
          </FirmDataProvider>
          <UpgradeModal />
        </SubscriptionProvider>
      </div>
      <AppChatPanelHost />
    </div>
  )
}
