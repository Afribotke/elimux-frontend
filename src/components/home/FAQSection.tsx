'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'

const FAQS = [
  {
    question: 'Is ElimuX free to use?',
    answer: 'Yes. Searching and browsing institutions, programs, and scholarships is completely free.',
  },
  {
    question: 'How do institutions join ElimuX?',
    answer: (
      <>
        Institutions can apply to be listed via our{' '}
        <Link href="/institution-onboarding" className="text-primary-400 hover:text-primary-300 transition-colors">
          institution onboarding page
        </Link>
        .
      </>
    ),
  },
  {
    question: 'What payment methods are supported?',
    answer: 'Premium subscriptions can be paid via M-Pesa or card, processed securely through Paystack.',
  },
  {
    question: 'Is ElimuX available as a mobile app?',
    answer: 'ElimuX is an installable Progressive Web App (PWA) — look for the install prompt in your browser, or use "Add to Home Screen".',
  },
]

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section className="py-16 px-4 max-w-3xl mx-auto">
      <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-10">Frequently Asked Questions</h2>
      <div className="space-y-3">
        {FAQS.map((faq, index) => {
          const isOpen = openIndex === index
          return (
            <div key={index} className="rounded-xl bg-elimux-card border border-border overflow-hidden">
              <button
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                aria-expanded={isOpen}
              >
                <span className="font-medium text-foreground">{faq.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-muted flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {isOpen && <div className="px-5 pb-4 text-sm text-muted">{faq.answer}</div>}
            </div>
          )
        })}
      </div>
    </section>
  )
}
