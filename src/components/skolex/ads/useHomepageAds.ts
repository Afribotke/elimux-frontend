'use client'
import { useEffect, useState } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

export interface HomepageAd {
  id: string
  name: string
  logo_url: string | null
  title: string
  description: string | null
  chips: string[]
  cta_label: string
  cta_url: string
  vertical: string
  featured: boolean
}

export interface PublicConfig {
  ad_placeholder_price_kes?: string
  show_public_impressions?: string
}

export const VERTICALS = [
  { key: 'education', label: 'Education', icon: '🎓' },
  { key: 'finance', label: 'Finance', icon: '💰' },
  { key: 'visa-agents', label: 'Visa Agents', icon: '🛂' },
  { key: 'tvet', label: 'TVET & Trades', icon: '🔧' },
  { key: 'travel', label: 'Visa & Travel', icon: '✈️' },
  { key: 'technology', label: 'Technology', icon: '💻' },
  { key: 'career', label: 'Career', icon: '💼' },
  { key: 'health', label: 'Health', icon: '🏥' },
] as const

export function useHomepageAds() {
  const [ads, setAds] = useState<HomepageAd[]>([])
  const [config, setConfig] = useState<PublicConfig>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [adsRes, configRes] = await Promise.all([
          fetch(`${API_URL}/api/ads/homepage`).then(r => r.json()).catch(() => null),
          fetch(`${API_URL}/api/config/public`).then(r => r.json()).catch(() => null),
        ])
        if (cancelled) return
        setAds((adsRes?.data || []).map((a: any) => ({ ...a, cta_url: `${API_URL}${a.cta_url}` })))
        setConfig(configRes?.data || {})
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  return { ads, config, loading }
}
