import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Sidebar } from '@/components/Sidebar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'KarrOS — Personal Operating System',
  description: 'Studio Karrtesian personal finance and life management system.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'KarrOS',
  },
  icons: {
    apple: '/app-icon.png',
    icon: '/app-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#7c3aed',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}


import { FinanceProfileProvider } from '@/features/finance/contexts/FinanceProfileContext'
import { SystemSettingsProvider } from '@/features/system/contexts/SystemSettingsContext'
import { TasksProfileProvider } from '@/features/tasks/contexts/TasksProfileContext'
import { VaultProvider } from '@/features/vault/contexts/VaultContext'
import { SecurityLock } from '@/components/SecurityLock'
import { GlobalQuickAction } from '@/components/GlobalQuickAction'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="KarrOS" />
      </head>
      <body className={`${inter.className} bg-white text-[#0a0a0a] antialiased`}>
        <SystemSettingsProvider>
          <FinanceProfileProvider>
            <TasksProfileProvider>
              <VaultProvider>
                <SecurityLock>
                  <Sidebar />
                  {/* md:ml-[220px] — full width on mobile (sidebar is a drawer), shifted on desktop */}
                  <main className="md:ml-[220px] min-h-screen bg-white">
                    {children}
                  </main>
                  <GlobalQuickAction />
                </SecurityLock>
              </VaultProvider>
            </TasksProfileProvider>
          </FinanceProfileProvider>
        </SystemSettingsProvider>
      </body>
    </html>
  )
}
