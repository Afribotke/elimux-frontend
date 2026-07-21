export default function AdvertiseBanner({ whatsappNumber, advertiseUrl }: { whatsappNumber: string; advertiseUrl: string }) {
  return (
    <div className="skolex-sans rounded-2xl p-6 mt-8 text-center" style={{ background: 'var(--skolex-navy, #0D1F3C)' }}>
      <p className="text-lg font-semibold text-white">Reach students across 194 countries at their decision moment</p>
      <p className="text-sm mt-1" style={{ color: 'var(--skolex-gold, #C8973A)' }}>Universities · Banks · Airlines · Insurance · Tech · Employers</p>
      <div className="flex justify-center gap-3 mt-4 flex-wrap">
        <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold rounded-full px-5 py-2" style={{ border: '1px solid rgba(255,255,255,0.4)', color: '#fff' }}>WhatsApp us</a>
        <a href={advertiseUrl} className="text-sm font-semibold rounded-full px-5 py-2" style={{ background: 'var(--skolex-gold, #C8973A)', color: 'var(--skolex-navy, #0D1F3C)' }}>Advertise</a>
      </div>
    </div>
  )
}
