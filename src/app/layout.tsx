import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/lib/theme'
import ThemeToggle from '@/components/ThemeToggle'

export const metadata: Metadata = {
  title: 'ElimuX - Discover Global Education',
  description: 'Find universities, colleges, TVET institutes, and programs worldwide. AI-powered education discovery platform.',
  keywords: 'education, university, college, TVET, programs, courses, study abroad, Kenya, Africa',
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
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <header className="sticky top-0 z-40 border-b border-border bg-elimux-dark/80 backdrop-blur-sm">
            <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
              <span className="font-bold text-foreground">ElimuX</span>
              <ThemeToggle />
            </div>
          </header>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
