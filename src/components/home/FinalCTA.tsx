
import Link from 'next/link'
import { Sparkles, ArrowRight } from 'lucide-react'

export default function FinalCTA() {
  return (
    <section className="py-16 px-4 max-w-6xl mx-auto">
      <div className="rounded-2xl bg-gradient-to-r from-primary-600/20 to-primary-800/20 border border-primary-500/20 p-10 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">Start Your Education Journey</h2>
        <p className="text-muted mb-8 max-w-xl mx-auto">
          Search universities, colleges, and programs worldwide — or let AI find the right fit for you.
        </p>
        <Link
          href="/ai-search"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          Get Started
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  )
}

