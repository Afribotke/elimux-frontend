'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Building2, MapPin, Clock, Users } from 'lucide-react'

interface AttachmentRow {
  id: string
  title: string
  description: string | null
  location_county: string | null
  duration_weeks: number | null
  total_slots: number | null
  employer: { company_name: string; logo_url: string | null } | null
}

export default function AttachmentsListingPage() {
  const [attachments, setAttachments] = useState<AttachmentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('internships')
          .select('id, title, description, location_county, duration_weeks, total_slots, employer:employers(company_name, logo_url)')
          .eq('type', 'attachment')
          .eq('status', 'active')
          .order('created_at', { ascending: false })

        if (error) throw error
        setAttachments((data as unknown as AttachmentRow[]) || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load attachments')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <main className="min-h-screen bg-elimux-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Industrial Attachments</h1>
        <p className="text-muted max-w-2xl mb-8">
          Find attachment placements for your university program. Attachments are arranged through your
          institution — you'll need to be uploaded as a verified student by your university before applying.
        </p>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">{error}</div>
        ) : attachments.length === 0 ? (
          <div className="text-center py-16 bg-elimux-card border border-border rounded-xl">
            <p className="text-muted text-lg">No attachments available right now. Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {attachments.map((attachment) => (
              <Link
                key={attachment.id}
                href={`/attachments/${attachment.id}`}
                className="block bg-elimux-card border border-border rounded-xl hover:border-primary-500/40 transition-colors p-6"
              >
                <h3 className="text-lg font-semibold text-foreground">{attachment.title}</h3>
                <p className="text-muted text-sm line-clamp-2 mt-2">{attachment.description}</p>
                <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted">
                  {attachment.employer?.company_name && (
                    <span className="flex items-center gap-1">
                      <Building2 className="w-4 h-4" />
                      {attachment.employer.company_name}
                    </span>
                  )}
                  {attachment.location_county && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {attachment.location_county}
                    </span>
                  )}
                  {attachment.duration_weeks && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {attachment.duration_weeks} weeks
                    </span>
                  )}
                  {attachment.total_slots && (
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {attachment.total_slots} slots
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
