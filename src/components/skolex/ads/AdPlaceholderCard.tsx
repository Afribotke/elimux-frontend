export default function AdPlaceholderCard({ priceKes, verticalLabel, advertiseUrl }: { priceKes?: string; verticalLabel?: string; advertiseUrl: string }) {
  return (
    <a href={advertiseUrl} className="skolex-sans rounded-2xl p-4 flex flex-col items-center justify-center text-center min-h-[180px]" style={{ border: '2px dashed var(--skolex-border, #d8d2c4)', background: 'var(--skolex-parchment, #F8F5EE)' }}>
      <span className="text-2xl mb-2">📣</span>
      <p className="font-semibold text-sm" style={{ color: 'var(--skolex-navy, #0D1F3C)' }}>Your ad here</p>
      {verticalLabel && <p className="text-xs mt-1 opacity-70" style={{ color: 'var(--skolex-navy, #0D1F3C)' }}>Be the first {verticalLabel} advertiser</p>}
      {priceKes && <p className="text-xs mt-2 font-semibold" style={{ color: 'var(--skolex-gold, #C8973A)' }}>From KES {Number(priceKes).toLocaleString()}/month</p>}
    </a>
  )
}
