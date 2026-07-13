
import { ShieldCheck, Sparkles, CreditCard, Unlock } from 'lucide-react'

const BADGES = [
  { icon: ShieldCheck, label: 'Verified institutions & accreditation' },
  { icon: Sparkles, label: 'AI-powered search' },
  { icon: CreditCard, label: 'Secure M-Pesa & card payments' },
  { icon: Unlock, label: 'Free to browse, no account required' },
]

export default function TrustBar() {
  return (
    <section className="py-6 px-4 border-y border-border bg-elimux-card">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
        {BADGES.map((badge, index) => (
          <div key={index} className="flex items-center gap-2 text-sm text-muted">
            <badge.icon className="w-4 h-4 text-primary-400 flex-shrink-0" />
            {badge.label}
          </div>
        ))}
      </div>
    </section>
  )
}

