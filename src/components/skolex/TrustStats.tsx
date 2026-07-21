// Single source of truth for the hero trust line — update here when the
// directory's real counts move meaningfully (see ELIMUX_STATE.md §1 for
// current figures at time of writing: ~8,969 institutions).
const TRUST_STATS_LINE = '8,900+ institutions · 12,400+ programs · 194 countries'

export default function TrustStats() {
  return (
    <p className="skolex-sans text-center text-sm mt-6" style={{ color: 'var(--skolex-gold)' }}>
      {TRUST_STATS_LINE}
    </p>
  )
}
