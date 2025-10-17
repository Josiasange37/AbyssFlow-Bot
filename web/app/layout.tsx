import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AbyssFlow - Professional WhatsApp Bot Dashboard',
  description: 'Manage your WhatsApp bot with style and efficiency. Water Hashira powered.',
  keywords: 'WhatsApp bot, dashboard, automation, AbyssFlow, Water Hashira',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className="dark">
      <body className={`${inter.className} bg-dark-900 text-white`}>
        {children}
      </body>
    </html>
  )
}
