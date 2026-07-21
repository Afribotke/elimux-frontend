'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

interface CountryProfile {
  flag: string
  qualification: string
  currency: string
}

// Hardcoded priority list + defaults for P1. Full per-country schema
// (qualification systems, currencies) lands in P2 — this is a display-only stub.
const COUNTRY_PROFILES: Record<string, CountryProfile> = {
  Kenya: { flag: '🇰🇪', qualification: 'KCSE', currency: 'KES' },
  Uganda: { flag: '🇺🇬', qualification: 'UACE', currency: 'UGX' },
  Tanzania: { flag: '🇹🇿', qualification: 'ACSEE', currency: 'TZS' },
  Nigeria: { flag: '🇳🇬', qualification: 'WAEC', currency: 'NGN' },
  Ghana: { flag: '🇬🇭', qualification: 'WASSCE', currency: 'GHS' },
  'South Africa': { flag: '🇿🇦', qualification: 'NSC', currency: 'ZAR' },
  Rwanda: { flag: '🇷🇼', qualification: 'A-Level', currency: 'RWF' },
  'United Kingdom': { flag: '🇬🇧', qualification: 'A-Level', currency: 'GBP' },
  'United States': { flag: '🇺🇸', qualification: 'High School Diploma', currency: 'USD' },
  Germany: { flag: '🇩🇪', qualification: 'Abitur', currency: 'EUR' },
}

const COUNTRY_LIST = Object.keys(COUNTRY_PROFILES)
const DEFAULT_COUNTRY = 'Kenya'
const STORAGE_KEY = 'elimux_country'

export default function LocalizationBar() {
  const [country, setCountry] = useState(DEFAULT_COUNTRY)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null
    if (saved && COUNTRY_PROFILES[saved]) setCountry(saved)
  }, [])

  function selectCountry(name: string) {
    setCountry(name)
    window.localStorage.setItem(STORAGE_KEY, name)
    setModalOpen(false)
  }

  const profile = COUNTRY_PROFILES[country]

  return (
    <div className="skolex-sans flex flex-wrap items-center justify-center gap-2 text-sm" style={{ color: 'var(--skolex-t2)' }}>
      <span>
        {profile.flag} Showing results for <strong style={{ color: 'var(--skolex-text)' }}>{country}</strong> · Qualification:{' '}
        <strong style={{ color: 'var(--skolex-text)' }}>{profile.qualification}</strong> · Currency:{' '}
        <strong style={{ color: 'var(--skolex-text)' }}>{profile.currency}</strong>
      </span>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="underline underline-offset-2 hover:no-underline"
        style={{ color: 'var(--skolex-gold)' }}
      >
        Change country
      </button>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(13, 31, 60, 0.5)', backdropFilter: 'blur(6px)' }}
          onClick={() => setModalOpen(false)}
        >
          <div
            className="skolex-sans w-full max-w-sm rounded-2xl overflow-hidden"
            style={{ background: 'var(--skolex-white)', boxShadow: '0 24px 80px rgba(13,31,60,.25)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ background: 'var(--skolex-navy)', color: 'var(--skolex-white)' }}
            >
              <span className="skolex-serif text-lg">Choose your country</span>
              <button type="button" onClick={() => setModalOpen(false)} aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <ul className="max-h-80 overflow-y-auto py-2">
              {COUNTRY_LIST.map((name) => (
                <li key={name}>
                  <button
                    type="button"
                    onClick={() => selectCountry(name)}
                    className="w-full text-left px-5 py-2.5 flex items-center gap-3 text-sm hover:bg-black/[0.03]"
                    style={{ color: name === country ? 'var(--skolex-gold)' : 'var(--skolex-text)' }}
                  >
                    <span>{COUNTRY_PROFILES[name].flag}</span>
                    {name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
