
import Link from 'next/link'
import { Sparkles, CreditCard, Smartphone, Globe, Award, Trophy } from 'lucide-react'

const FEATURES = [
  {
    icon: Sparkles,
    title: 'AI-Powered Search',
    description: 'Describe what you want in your own words and let AI find matching programs.',
    href: '/ai-search',
  },
  {
    icon: CreditCard,
    title: 'M-Pesa & Card Payments',
    description: 'Subscribe to premium plans securely via M-Pesa or card, powered by Paystack.',
    href: '/pricing',
  },
  {
    icon: Smartphone,
    title: 'Installable App',
    description: 'ElimuX is a Progressive Web App — install it on your phone for quick, offline-friendly access.',
    href: null,
  },
  {
    icon: Globe,
    title: 'Global Coverage',
    description: 'Universities, colleges, and TVET institutes across multiple countries.',
    href: '/institutions',
  },
  {
    icon: Award,
    title: 'Scholarships',
    description: 'Browse scholarship opportunities alongside institutions and programs.',
    href: '/scholarships',
  },
  {
    icon: Trophy,
    title: 'Leaderboard & Rewards',
    description: 'Earn points for using ElimuX and climb the leaderboard.',
    href: '/leaderboard',
  },
]

export default function FeatureShowcase() {
  return (
    <section className="py-16 px-4 max-w-6xl mx-auto">
      <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-10">Everything You Need</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {FEATURES.map((feature, index) => {
          const content = (
            <>
              <feature.icon className="w-8 h-8 text-primary-400 mb-3" />
              <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted">{feature.description}</p>
            </>
          )
          const className =
            'p-6 rounded-2xl bg-elimux-card border border-border transition-all block' +
            (feature.href ? ' hover:border-primary-500/50' : '')

          return feature.href ? (
            <Link key={feature.title} href={feature.href} className={className}>
              {content}
            </Link>
          ) : (
            <div key={feature.title} className={className}>
              {content}
            </div>
          )
        })}
      </div>
    </section>
  )
}

