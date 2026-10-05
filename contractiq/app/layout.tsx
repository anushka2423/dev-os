import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ContractIQ — AI Contract Review for SMBs',
  description:
    'Review NDAs and MSAs in minutes, not hours. ContractIQ extracts key terms, highlights risk, and answers your contract questions in plain English.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-bg-page text-ink-900 antialiased">{children}</body>
    </html>
  )
}
