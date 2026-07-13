
import { Search, ListChecks, Send } from 'lucide-react'

const STEPS = [
  {
    icon: Search,
    title: '1. Search',
    description: 'Search by name, or describe what you want in your own words with AI Search.',
  },
  {
    icon: ListChecks,
    title: '2. Compare',
    description: 'Compare institutions and programs side by side — accreditation, location, and categories.',
  },
  {
    icon: Send,
    title: '3. Apply',
    description: 'Head to the institution or program page and apply directly, or start with a scholarship.',
  },
]

export default function HowItWorks() {
  return (
    <section className="py-16 px-4 max-w-6xl mx-auto">
      <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-10">How It Works</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {STEPS.map((step, index) => (
          <div key={index} className="p-6 rounded-2xl bg-elimux-card border border-border text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-500/10 border border-primary-500/20 mb-4">
              <step.icon className="w-6 h-6 text-primary-400" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
            <p className="text-sm text-muted">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

