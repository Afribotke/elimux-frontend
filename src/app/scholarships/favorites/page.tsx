'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { listScholarshipFavorites, type ScholarshipFavoriteRow } from '@/lib/api'
import ScholarshipCard from '@/components/scholarships/ScholarshipCard'
import { Bookmark, ArrowRight, Loader2 } from 'lucide-react'

export default function ScholarshipFavoritesPage() {
  const [favorites, setFavorites] = useState<ScholarshipFavoriteRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listScholarshipFavorites()
      .then((res) => setFavorites(res.data))
      .catch((err) => console.error('Error loading scholarship favorites:', err))
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className="min-h-screen py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm mb-6">
            <Bookmark className="w-4 h-4" />
            Your Saved Scholarships
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">Saved Scholarships</h1>
          <p className="text-lg text-muted max-w-2xl mx-auto">Scholarships you&apos;ve saved for later.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-16">
            <Bookmark className="w-12 h-12 text-muted mx-auto mb-4" />
            <p className="text-lg text-foreground mb-6">No saved scholarships yet.</p>
            <Link
              href="/scholarships"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold transition-colors"
            >
              Browse scholarships
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {favorites.map((fav) => (
              <Link key={fav.id} href={`/scholarships/${fav.scholarship.id}/`}>
                <ScholarshipCard scholarship={fav.scholarship} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
