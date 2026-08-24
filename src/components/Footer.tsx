'use client'

import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="py-8 px-4 border-t border-border bg-elimux-dark">
      <div className="max-w-6xl mx-auto text-center space-y-4">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted">
          <Link href="/about" className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 rounded">About</Link>
          <Link href="/pricing" className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 rounded">Pricing</Link>
          <Link href="/internships" className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 rounded">Find Internships</Link>
          <Link href="/accreditation-bodies" className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 rounded">Accreditation Bodies</Link>
          <Link href="/contact" className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 rounded">Contact</Link>
          <Link href="/partner" className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 rounded">Partner Program</Link>
          <Link href="/ads/self-serve" className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 rounded">Advertise</Link>
          <Link href="/privacy" className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 rounded">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 rounded">Terms of Service</Link>
          <Link href="/cookies" className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 rounded">Cookie Policy</Link>
        </div>

        <div>
          <p className="text-muted text-sm mb-2">&copy; 2026 ElimuX. AI-powered discovery for universities, TVET, scholarships, internships, attachments, and bursaries.</p>
          <Link href="/institution-onboarding" className="text-sm text-primary-400 hover:text-primary-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 rounded">
            Are you an institution? List your programs on ElimuX
          </Link>
        </div>
      </div>
    </footer>
  )
}
