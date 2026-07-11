interface RankedBarListProps {
  rows: { id: string; name: string; count: number; suffix?: string }[]
  emptyLabel?: string
}

export default function RankedBarList({ rows, emptyLabel = 'No data yet' }: RankedBarListProps) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted py-6 text-center">{emptyLabel}</p>
  }

  const max = Math.max(...rows.map((r) => r.count), 1)

  return (
    <ol className="space-y-3">
      {rows.map((row, i) => (
        <li key={row.id} className="flex items-center gap-3">
          <span className="text-xs text-muted w-4 flex-shrink-0 tabular-nums">{i + 1}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-sm text-foreground truncate">{row.name}</span>
              <span className="text-xs text-muted flex-shrink-0 tabular-nums">
                {row.count.toLocaleString()}
                {row.suffix ? ` ${row.suffix}` : ''}
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary-500"
                style={{ width: `${Math.max((row.count / max) * 100, 4)}%` }}
              />
            </div>
          </div>
        </li>
      ))}
    </ol>
  )
}
