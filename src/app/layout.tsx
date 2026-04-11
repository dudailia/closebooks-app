import type { Metadata, Viewport } from 'next'
import { DM_Sans, DM_Mono, DM_Serif_Display } from 'next/font/google'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  variable: '--font-dm-mono',
  weight: ['300', '400', '500'],
  display: 'swap',
})

const dmSerif = DM_Serif_Display({
  subsets: ['latin'],
  variable: '--font-dm-serif',
  weight: '400',
  display: 'swap',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#2d5a27',
  // Prevent iOS text size adjustment on rotate
  userScalable: true,
}

export const metadata: Metadata = {
  title: {
    default: 'CloseBooks — AI Accounting for CPA Firms',
    template: '%s | CloseBooks',
  },
  description: 'The complete AI accounting platform. Autonomous close, tax preparation, client portals, and more. Used by 1,200+ CPA firms.',
  keywords: ['accounting software', 'AI bookkeeping', 'CPA tools', 'automated close', 'tax preparation', 'autonomous accounting'],
  openGraph: {
    siteName: 'CloseBooks',
    type: 'website',
    locale: 'en_US',
    title: 'CloseBooks — AI Accounting for CPA Firms',
    description: 'The complete AI accounting platform. Autonomous close in minutes, not hours.',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@closebooks',
    title: 'CloseBooks — AI Accounting for CPA Firms',
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmMono.variable} ${dmSerif.variable}`}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
