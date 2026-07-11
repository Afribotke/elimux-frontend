'use client'

import { useState } from 'react'

interface LineChartProps {
  data: { date: string; value: number }[]
  height?: number
  label?: string
}

const WIDTH = 600
const PAD_X = 8
const PAD_TOP = 16
const PAD_BOTTOM = 24

export default function LineChart({ data, height = 200, label = 'value' }: LineChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-sm text-muted" style={{ height }}>
        No data yet
      </div>
    )
  }

  const maxValue = Math.max(1, ...data.map((d) => d.value))
  const plotHeight = height - PAD_TOP - PAD_BOTTOM
  const plotWidth = WIDTH - PAD_X * 2
  const stepX = data.length > 1 ? plotWidth / (data.length - 1) : 0

  function x(i: number) {
    return PAD_X + i * stepX
  }
  function y(v: number) {
    return PAD_TOP + plotHeight - (v / maxValue) * plotHeight
  }

  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(d.value)}`).join(' ')
  const areaPath = `${linePath} L ${x(data.length - 1)} ${PAD_TOP + plotHeight} L ${x(0)} ${PAD_TOP + plotHeight} Z`

  const gridLines = [0, 0.5, 1].map((f) => PAD_TOP + plotHeight * (1 - f))
  const hovered = hoverIndex != null ? data[hoverIndex] : null

  return (
    <div className="relative chart-root">
      <style jsx>{`
        .chart-root {
          --line: 218 165 32;
        }
        :global(.dark) .chart-root {
          --line: 255 193 7;
        }
      `}</style>
      <svg viewBox={`0 0 ${WIDTH} ${height}`} width="100%" height={height} role="img" aria-label={`${label} line chart`}>
        {gridLines.map((gy, i) => (
          <line key={i} x1={PAD_X} y1={gy} x2={WIDTH - PAD_X} y2={gy} stroke="rgb(var(--border))" strokeWidth="1" />
        ))}

        <path d={areaPath} fill="rgb(var(--line) / 0.1)" stroke="none" />
        <path d={linePath} fill="none" stroke="rgb(var(--line))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {hovered && (
          <>
            <line x1={x(hoverIndex!)} y1={PAD_TOP} x2={x(hoverIndex!)} y2={PAD_TOP + plotHeight} stroke="rgb(var(--muted))" strokeWidth="1" />
            <circle cx={x(hoverIndex!)} cy={y(hovered.value)} r="4" fill="rgb(var(--line))" stroke="rgb(var(--elimux-card))" strokeWidth="2" />
          </>
        )}

        {data.map((d, i) => (
          <rect
            key={i}
            x={x(i) - stepX / 2}
            y={PAD_TOP}
            width={stepX || plotWidth}
            height={plotHeight}
            fill="transparent"
            onPointerEnter={() => setHoverIndex(i)}
            onPointerLeave={() => setHoverIndex(null)}
          />
        ))}
      </svg>

      {hovered && (
        <div
          className="absolute top-0 pointer-events-none bg-elimux-dark border border-border rounded-lg px-2.5 py-1.5 text-xs shadow-lg -translate-x-1/2"
          style={{ left: `${(x(hoverIndex!) / WIDTH) * 100}%` }}
        >
          <div className="text-foreground font-semibold">{hovered.value.toLocaleString()}</div>
          <div className="text-muted">{hovered.date}</div>
        </div>
      )}
    </div>
  )
}
