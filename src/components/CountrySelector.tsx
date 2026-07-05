'use client'

import { useState } from 'react'
import { Globe, ChevronDown } from 'lucide-react'

interface CountrySelectorProps {
  countries: { id: string; name: string; iso_code: string }[]
  selectedCountry: string
  onSelect: (countryId: string) => void
}

export default function CountrySelector({ countries, selectedCountry, onSelect }: CountrySelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const selected = countries.find((c) => c.id === selectedCountry)

  return (
    <div className='relative'>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className='flex items-center gap-2 px-4 py-2 rounded-lg bg-elimux-card border border-gray-700/50 text-white hover:border-primary-500/50 transition-colors'
      >
        <Globe className='w-4 h-4 text-primary-400' />
        <span className='text-sm'>{selected ? selected.name : 'Select Country'}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className='absolute top-full mt-2 w-64 max-h-64 overflow-y-auto bg-elimux-card border border-gray-700/50 rounded-lg shadow-xl z-50'>
          <button
            onClick={() => { onSelect(''); setIsOpen(false) }}
            className='w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700/50 transition-colors'
          >
            All Countries
          </button>
          {countries.map((country) => (
            <button
              key={country.id}
              onClick={() => { onSelect(country.id); setIsOpen(false) }}
              className='w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700/50 transition-colors flex items-center gap-2'
            >
              <span>{country.iso_code}</span>
              {country.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
