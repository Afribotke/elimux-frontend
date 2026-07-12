import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ThemeProvider } from '@/lib/theme'
import ThemeToggle from '@/components/ThemeToggle'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'
import MobileNav from '@/components/MobileNav'
import PointsDisplay from '@/components/PointsDisplay'
import InstallPrompt from '@/components/InstallPrompt'
import OfflineIndicator from '@/components/OfflineIndicator'
import PushNotificationToggle from '@/components/PushNotificationToggle'
import BackgroundSyncManager from '@/components/BackgroundSyncManager'
import PoweredByHeaderBadge from '@/components/PoweredByHeaderBadge'
import Footer from '@/components/Footer'
import AppLoadingScreen from '@/components/AppLoadingScreen'

export const metadata: Metadata = {
  title: 'ElimuX - Discover Global Education',
  description: 'Find universities, colleges, TVET institutes, and programs worldwide. AI-powered education discovery platform.',
  keywords: 'education, university, college, TVET, programs, courses, study abroad, Kenya, Africa',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ElimuX',
  },
  icons: {
    icon: '/icon-192x192.png',
    apple: '/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#ffc107',
}

const themeInitScript = `(function(){try{var t=localStorage.getItem('elimux-theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}document.documentElement.classList.add(t);}catch(e){document.documentElement.classList.add('dark');}})();`

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <AppLoadingScreen />
          <header className="sticky top-0 z-40 border-b border-border bg-elimux-dark/80 backdrop-blur-sm">
            <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-bold text-foreground flex-shrink-0">ElimuX</span>
                <PoweredByHeaderBadge />
              </div>
              <div className="flex items-center gap-2">
                <PushNotificationToggle />
                <PointsDisplay />
                <ThemeToggle />
              </div>
            </div>
          </header>
          <OfflineIndicator />
          <div className="pb-16 md:pb-0">
            {children}
            <Footer />
          </div>
          <MobileNav />
          <ServiceWorkerRegister />
          <InstallPrompt />
          <BackgroundSyncManager />
        </ThemeProvider>
      </body>
    </html>
  )
}
