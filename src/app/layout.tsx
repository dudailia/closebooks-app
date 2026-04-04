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
  themeColor: '#2d5a27',
}

export const metadata: Metadata = {
  title: 'CloseBooks — AI-Powered Month-End Close for CPA Firms',
  description:
    "Close your clients' books in hours, not days. AI auto-categorizes bank transactions with 85–95% accuracy. Built for CPAs and bookkeepers.",
  keywords: [
    'CPA software',
    'bookkeeping automation',
    'month-end close',
    'AI accounting',
    'transaction categorization',
    'QuickBooks export',
  ],
  authors: [{ name: 'CloseBooks' }],
  openGraph: {
    type: 'website',
    siteName: 'CloseBooks',
    title: 'CloseBooks — AI-Powered Month-End Close for CPA Firms',
    description:
      "Close your clients' books in hours, not days. AI auto-categorizes transactions with 85–95% accuracy.",
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CloseBooks — AI-Powered Month-End Close',
    description:
      'AI auto-categorizes bank transactions with 85–95% accuracy. Built for CPAs and bookkeepers.',
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
