'use client'

import { useEffect, useState } from 'react'
import { getMajorSponsor, type MajorSponsorPublic } from './api'

export function useMajorSponsor() {
  const [sponsor, setSponsor] = useState<MajorSponsorPublic | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    getMajorSponsor()
      .then((res) => {
        if (!cancelled) setSponsor(res.data)
      })
      .catch(() => {
        if (!cancelled) setSponsor(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { sponsor, loading }
}
