import type { Metadata, Viewport } from 'next'
import { Inter, Instrument_Serif, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
})

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  variable: '--font-display',
  weight: '400',
  style: ['normal', 'italic'],
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  weight: ['300', '400', '500', '600'],
  display: 'swap',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#00C853',
  viewportFit: 'cover',
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
  manifest: '/manifest.webmanifest',
  applicationName: 'CloseBooks',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CloseBooks',
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/apple-touch-icon.png',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
