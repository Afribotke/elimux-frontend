import { Libre_Baskerville, DM_Sans } from 'next/font/google'
import './skolex-theme.css'
import LocalizationBar from './LocalizationBar'
import HeroSearch from './HeroSearch'
import TrustStats from './TrustStats'
import AdsSection from './ads/AdsSection'

const libreBaskerville = Libre_Baskerville({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-skolex-serif',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-skolex-sans',
  display: 'swap',
})

export default function SkolexHome() {
  return (
    <main className={`skolex-theme min-h-screen py-16 px-4 ${libreBaskerville.variable} ${dmSans.variable}`}>
      <div className="max-w-[720px] mx-auto flex flex-col items-center">
        <div className="mb-6">
          <LocalizationBar />
        </div>
        <HeroSearch />
        <TrustStats />
      </div>
      <AdsSection />
    </main>
  )
}
