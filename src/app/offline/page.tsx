import Link from 'next/link'
import { WifiOff } from 'lucide-react'

export const metadata = { title: 'Offline - ElimuX' }

export default function OfflinePage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <WifiOff className="w-12 h-12 text-primary-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">You&apos;re offline</h1>
        <p className="text-muted mb-6">
          No internet connection right now. Pages you&apos;ve visited before still work — anything new needs a connection.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 rounded-lg bg-primary-600 hover:bg-primary-700 text-elimux-dark font-semibold transition-colors"
        >
          Go to homepage
        </Link>
      </div>
    </div>
  )
}
