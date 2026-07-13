'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'

interface BreadcrumbItem {
  label: string
  href: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
}

export default function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  const pathname = usePathname()

  if (pathname === '/') return null

  return (
    <nav aria-label="Breadcrumb" className={`py-3 px-4 ${className}`}>
      <ol className="flex items-center gap-2 text-sm flex-wrap">
        {items.map((crumb, index) => {
          const isLast = index === items.length - 1

          return (
            <li key={crumb.href} className="flex items-center gap-2">
              {index === 0 ? (
                <Link href="/" className="text-muted hover:text-foreground transition-colors flex items-center gap-1">
                  <Home className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <ChevronRight className="w-4 h-4 text-muted" />
                  {isLast ? (
                    <span className="text-foreground font-medium" aria-current="page">
                      {crumb.label}
                    </span>
                  ) : (
                    <Link href={crumb.href} className="text-muted hover:text-foreground transition-colors">
                      {crumb.label}
                    </Link>
                  )}
                </>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
