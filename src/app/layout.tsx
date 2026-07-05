import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ElimuX - Discover Global Education',
  description: 'Find universities, colleges, TVET institutes, and programs worldwide. AI-powered education discovery platform.',
  keywords: 'education, university, college, TVET, programs, courses, study abroad, Kenya, Africa',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
