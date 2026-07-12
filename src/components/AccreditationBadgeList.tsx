interface AccreditationBadgeItem {
  code: string | null
  name: string
  logo_url?: string | null
}

interface AccreditationBadgeListProps {
  accreditations: AccreditationBadgeItem[]
  max?: number
}

export default function AccreditationBadgeList({ accreditations, max = 3 }: AccreditationBadgeListProps) {
  if (!accreditations || accreditations.length === 0) return null

  const visible = accreditations.slice(0, max)
  const overflow = accreditations.slice(max)

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {visible.map((a, i) => (
        <span
          key={i}
          title={a.name}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary-500/15 text-primary-400 border border-primary-500/30"
        >
          {a.logo_url && (
            <img src={a.logo_url} alt="" className="w-3 h-3 rounded-full object-cover" loading="lazy" decoding="async" />
          )}
          {a.code || a.name}
        </span>
      ))}
      {overflow.length > 0 && (
        <span
          title={overflow.map((a) => a.name).join(', ')}
          className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted/20 text-muted"
        >
          +{overflow.length} more
        </span>
      )}
    </div>
  )
}
