'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import ProgramCard from '@/components/ProgramCard'
import InstitutionCard from '@/components/InstitutionCard'
import FavoriteButton from '@/components/FavoriteButton'
import ShareModal from '@/components/ShareModal'
import { GraduationCap, Building2, Bookmark, Share2, ArrowRight } from 'lucide-react'

interface ShareTarget {
  name: string
  description: string | null
  url: string
  type: 'program' | 'institution'
}

function getStoredIds(itemType: 'program' | 'institution'): string[] {
  const stored = localStorage.getItem(`elimux-favorites-${itemType}`)
  return stored ? JSON.parse(stored) : []
}

export default function FavoritesPage() {
  const [programs, setPrograms] = useState<any[]>([])
  const [institutions, setInstitutions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [shareTarget, setShareTarget] = useState<ShareTarget | null>(null)

  useEffect(() => {
    loadFavorites()
  }, [])

  async function loadFavorites() {
    setLoading(true)

    const programIds = getStoredIds('program')
    const institutionIds = getStoredIds('institution')

    const [{ data: programsData }, { data: institutionsData }] = await Promise.all([
      programIds.length > 0
        ? supabase
            .from('programs')
            .select('*, institution:institutions(name, city, country:countries(name)), category:program_categories(name, color, icon)')
            .in('id', programIds)
        : Promise.resolve({ data: [] }),
      institutionIds.length > 0
        ? supabase
            .from('institutions')
            .select('*, type:institution_types(name, icon), country:countries(name, flag_emoji)')
            .in('id', institutionIds)
        : Promise.resolve({ data: [] }),
    ])

    setPrograms(programsData || [])
    setInstitutions(institutionsData || [])
    setLoading(false)
  }

  function openShare(item: any, type: 'program' | 'institution') {
    setShareTarget({
      name: item.name,
      description: item.description ?? null,
      url: `${window.location.origin}/${type === 'program' ? 'programs' : 'institutions'}/${item.id}/`,
      type,
    })
  }

  const isEmpty = !loading && programs.length === 0 && institutions.length === 0

  return (
    <main className="min-h-screen py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm mb-6">
            <Bookmark className="w-4 h-4" />
            Your Saved Items
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">Favorites</h1>
          <p className="text-lg text-muted max-w-2xl mx-auto">
            Programs and institutions you&apos;ve saved for later.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-muted">Loading your favorites...</p>
          </div>
        ) : isEmpty ? (
          <div className="text-center py-16">
            <Bookmark className="w-12 h-12 text-muted mx-auto mb-4" />
            <p className="text-lg text-foreground mb-6">
              No favorites yet. Start searching and save programs you like!
            </p>
            <Link
              href="/ai-search"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold transition-colors"
            >
              Start exploring
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <>
            {programs.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <GraduationCap className="w-6 h-6 text-primary-400" />
                  Programs ({programs.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {programs.map((program) => (
                    <div key={program.id} className="relative">
                      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
                        <button
                          onClick={() => openShare(program, 'program')}
                          className="p-2 rounded-full bg-elimux-card text-muted hover:bg-muted/10 hover:text-foreground transition-all"
                          title="Share"
                        >
                          <Share2 className="w-5 h-5" />
                        </button>
                        <FavoriteButton itemId={program.id} itemType="program" onToggle={loadFavorites} />
                      </div>
                      <Link href={`/programs/${program.id}/`}>
                        <ProgramCard program={program} />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {institutions.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <Building2 className="w-6 h-6 text-primary-400" />
                  Institutions ({institutions.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {institutions.map((institution) => (
                    <div key={institution.id} className="relative">
                      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
                        <button
                          onClick={() => openShare(institution, 'institution')}
                          className="p-2 rounded-full bg-elimux-card text-muted hover:bg-muted/10 hover:text-foreground transition-all"
                          title="Share"
                        >
                          <Share2 className="w-5 h-5" />
                        </button>
                        <FavoriteButton itemId={institution.id} itemType="institution" onToggle={loadFavorites} />
                      </div>
                      <Link href={`/institutions/${institution.id}/`}>
                        <InstitutionCard institution={institution} />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {shareTarget && (
        <ShareModal isOpen={!!shareTarget} onClose={() => setShareTarget(null)} item={shareTarget} />
      )}
    </main>
  )
}
