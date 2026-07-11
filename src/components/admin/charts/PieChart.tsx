'use client'

import { useState } from 'react'

interface PieChartProps {
  data: { label: string; value: number }[]
}

// Fixed entity -> color assignment (validated: node scripts/validate_palette.js,
// light/dark surfaces both PASS). Color follows the entity, never its rank, so a
// plan keeps its color even if the filtered set changes - unknown plans fold into
// the last "other" slot rather than generating a new hue.
const COLOR_ORDER = ['Free', 'Premium', 'Institution'] as const
const SLOT_COLORS: Record<string, { light: string; dark: string }> = {
  Free: { light: '#2a78d6', dark: '#3987e5' },
  Premium: { light: '#1baf7a', dark: '#199e70' },
  Institution: { light: '#eda100', dark: '#c98500' },
  Other: { light: '#4a3aa7', dark: '#9085e9' },
}

function colorFor(label: string): string {
  return COLOR_ORDER.includes(label as any) ? label : 'Other'
}

export default function PieChart({ data }: PieChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const total = data.reduce((sum, d) => sum + d.value, 0)

  if (data.length === 0 || total === 0) {
    return <div className="flex items-center justify-center text-sm text-muted h-48">No revenue yet</div>
  }

  const radius = 70
  const center = 80
  let cumulativeAngle = -90

  const slices = data.map((d, i) => {
    const fraction = d.value / total
    const angle = fraction * 360
    const startAngle = cumulativeAngle
    const endAngle = cumulativeAngle + angle
    cumulativeAngle = endAngle

    const startRad = (startAngle * Math.PI) / 180
    const endRad = (endAngle * Math.PI) / 180
    const x1 = center + radius * Math.cos(startRad)
    const y1 = center + radius * Math.sin(startRad)
    const x2 = center + radius * Math.cos(endRad)
    const y2 = center + radius * Math.sin(endRad)
    const largeArc = angle > 180 ? 1 : 0

    const path = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`
    const colorKey = colorFor(d.label)

    return { ...d, path, fraction, colorKey }
  })

  return (
    <div className="pie-root flex flex-col sm:flex-row items-center gap-6">
      <style jsx>{`
        .pie-root {
          --c-free: 42 120 214;
          --c-premium: 27 175 122;
          --c-institution: 237 161 0;
          --c-other: 74 58 167;
        }
        :global(.dark) .pie-root {
          --c-free: 57 135 229;
          --c-premium: 25 158 112;
          --c-institution: 201 133 0;
          --c-other: 144 133 233;
        }
      `}</style>

      <svg viewBox="0 0 160 160" width="160" height="160" role="img" aria-label="Revenue by plan">
        {slices.map((s, i) => (
          <path
            key={s.label}
            d={s.path}
            fill={`var(--c-${s.colorKey.toLowerCase()})`}
            stroke="rgb(var(--elimux-card))"
            strokeWidth="2"
            opacity={hoverIndex == null || hoverIndex === i ? 1 : 0.5}
            onPointerEnter={() => setHoverIndex(i)}
            onPointerLeave={() => setHoverIndex(null)}
          />
        ))}
      </svg>

      <ul className="space-y-2 text-sm flex-1 w-full">
        {slices.map((s, i) => (
          <li
            key={s.label}
            className="flex items-center justify-between gap-3"
            onPointerEnter={() => setHoverIndex(i)}
            onPointerLeave={() => setHoverIndex(null)}
          >
            <span className="flex items-center gap-2 text-foreground">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: `var(--c-${s.colorKey.toLowerCase()})` }}
              />
              {s.label}
            </span>
            <span className="text-muted whitespace-nowrap">
              KES {s.value.toLocaleString()} <span className="text-xs">({Math.round(s.fraction * 100)}%)</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
