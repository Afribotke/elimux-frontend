'use client'
import { useState } from 'react'
import { useHomepageAds, VERTICALS } from './useHomepageAds'
import AdVerticalTabs from './AdVerticalTabs'
import FeaturedCarousel from './FeaturedCarousel'
import SponsoredCard from './SponsoredCard'
import AdPlaceholderCard from './AdPlaceholderCard'
import SponsorTicker from './SponsorTicker'
import AdvertiseBanner from './AdvertiseBanner'

const ADS_FLAG = process.env.NEXT_PUBLIC_FEATURE_SKOLEX_ADS === 'true'
const ADVERTISE_URL = '/advertiser/register'
const MIN_SLOTS = 4

export default function AdsSection() {
  const [activeVertical, setActiveVertical] = useState('education')
  const { ads, config, loading } = useHomepageAds()

  if (!ADS_FLAG) return null

  const verticalAds = ads.filter(a => a.vertical === activeVertical)
  const featured = ads.filter(a => a.featured)
  const verticalLabel = VERTICALS.find(v => v.key === activeVertical)?.label || activeVertical

  const slots: (typeof verticalAds[number] | null)[] = [...verticalAds]
  while (slots.length < MIN_SLOTS) slots.push(null)

  return (
    <section className="w-full mt-12 pb-4">
      <div className="max-w-[1100px] mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <p className="skolex-sans text-sm font-semibold" style={{ color: 'var(--skolex-gold, #C8973A)' }}>
            <span className="inline-block w-2 h-2 rounded-full mr-2 align-middle" style={{ background: 'var(--skolex-gold, #C8973A)' }} />
            LIVE Partners &amp; Advertisers
          </p>
          <a href={ADVERTISE_URL} className="skolex-sans text-sm underline" style={{ color: 'var(--skolex-navy, #0D1F3C)' }}>
            Advertise here →
          </a>
        </div>

        <AdVerticalTabs active={activeVertical} onChange={setActiveVertical} />

        {!loading && featured.length > 0 && <FeaturedCarousel ads={featured} />}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-6">
          {slots.map((ad, i) =>
            ad ? (
              <SponsoredCard key={ad.id} ad={ad} />
            ) : (
              <AdPlaceholderCard
                key={`placeholder-${i}`}
                priceKes={config.ad_placeholder_price_kes}
                verticalLabel={verticalAds.length === 0 ? verticalLabel : undefined}
                advertiseUrl={ADVERTISE_URL}
              />
            )
          )}
        </div>

        <SponsorTicker ads={ads} />
        <AdvertiseBanner whatsappNumber="254793002436" advertiseUrl={ADVERTISE_URL} />
      </div>
    </section>
  )
}
