import type { Metadata } from 'next'
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

export const metadata: Metadata = {
  title: 'CloseBooks — AI-Powered Month-End Close',
  description: 'Categorize bank transactions with AI. Built for CPAs and bookkeepers.',
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
