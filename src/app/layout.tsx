import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ThemeProvider } from '@/lib/theme'
import ThemeToggle from '@/components/ThemeToggle'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'
import MobileNav from '@/components/MobileNav'
import PointsDisplay from '@/components/PointsDisplay'

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
          <header className="sticky top-0 z-40 border-b border-border bg-elimux-dark/80 backdrop-blur-sm">
            <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
              <span className="font-bold text-foreground">ElimuX</span>
              <div className="flex items-center gap-2">
                <PointsDisplay />
                <ThemeToggle />
              </div>
            </div>
          </header>
          <div className="pb-16 md:pb-0">{children}</div>
          <MobileNav />
          <ServiceWorkerRegister />
        </ThemeProvider>
      </body>
    </html>
  )
}
