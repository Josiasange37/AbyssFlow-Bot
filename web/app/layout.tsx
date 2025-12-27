import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Psycho Bot - Professional WhatsApp Bot Dashboard',
  description: 'Manage your WhatsApp bot with style and efficiency. Psycho Bot powered.',
  keywords: 'WhatsApp bot, dashboard, automation, Psycho Bot, Water Hashira',
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
