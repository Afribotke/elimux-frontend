'use client'

import { useMemo, useState } from 'react'

interface TrendChartProps {
  label: string
  data: { date: string; value: number }[]
}

const WIDTH = 560
const HEIGHT = 180
const PAD_LEFT = 44
const PAD_RIGHT = 12
const PAD_TOP = 12
const PAD_BOTTOM = 28

// Round a max value up to a "clean" tick ceiling (0, 5, 10, 25, 50, 100, ...).
function niceCeiling(max: number): number {
  if (max <= 0) return 5
  const magnitude = Math.pow(10, Math.floor(Math.log10(max)))
  const steps = [1, 2, 2.5, 5, 10]
  for (const step of steps) {
    const candidate = step * magnitude
    if (candidate >= max) return candidate
  }
  return 10 * magnitude
}

export default function CampaignTrendChart({ label, data }: TrendChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  const { points, areaPath, linePath, yMax, yTicks } = useMemo(() => {
    const n = data.length
    const innerW = WIDTH - PAD_LEFT - PAD_RIGHT
    const innerH = HEIGHT - PAD_TOP - PAD_BOTTOM
    const maxVal = Math.max(...data.map((d) => d.value), 0)
    const yMax = niceCeiling(maxVal)

    const pts = data.map((d, i) => {
      const x = n > 1 ? PAD_LEFT + (i / (n - 1)) * innerW : PAD_LEFT + innerW / 2
      const y = PAD_TOP + innerH - (yMax > 0 ? (d.value / yMax) * innerH : 0)
      return { x, y, ...d }
    })

    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
    const area =
      pts.length > 0
        ? `${line} L ${pts[pts.length - 1].x.toFixed(1)} ${(PAD_TOP + innerH).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(PAD_TOP + innerH).toFixed(1)} Z`
        : ''

    const ticks = [0, 0.5, 1].map((f) => Math.round(yMax * f))

    return { points: pts, areaPath: area, linePath: line, yMax, yTicks: ticks }
  }, [data])

  const hovered = hoverIndex !== null ? points[hoverIndex] : null

  const handleMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (points.length === 0) return
    const rect = e.currentTarget.getBoundingClientRect()
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH
    let closest = 0
    let closestDist = Infinity
    points.forEach((p, i) => {
      const dist = Math.abs(p.x - relX)
      if (dist < closestDist) {
        closestDist = dist
        closest = i
      }
    })
    setHoverIndex(closest)
  }

  return (
    <div className="bg-elimux-card border border-border rounded-xl p-4">
      <div className="text-sm font-medium text-foreground mb-2">{label}</div>
      <div className="relative">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full h-auto"
          onPointerMove={handleMove}
          onPointerLeave={() => setHoverIndex(null)}
        >
          {yTicks.map((t, i) => {
            const innerH = HEIGHT - PAD_TOP - PAD_BOTTOM
            const y = PAD_TOP + innerH - (yMax > 0 ? (t / yMax) * innerH : 0)
            return (
              <g key={i}>
                <line
                  x1={PAD_LEFT}
                  x2={WIDTH - PAD_RIGHT}
                  y1={y}
                  y2={y}
                  stroke="rgb(var(--border))"
                  strokeWidth={1}
                />
                <text x={PAD_LEFT - 8} y={y + 3} textAnchor="end" fontSize={10} fill="rgb(var(--muted))">
                  {t.toLocaleString()}
                </text>
              </g>
            )
          })}

          {points.length > 1 && (
            <>
              <path d={areaPath} fill="rgb(var(--primary-500))" fillOpacity={0.1} stroke="none" />
              <path d={linePath} fill="none" stroke="rgb(var(--primary-500))" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            </>
          )}

          {points.length > 0 && (
            <>
              <text x={points[0].x} y={HEIGHT - 6} textAnchor="start" fontSize={10} fill="rgb(var(--muted))">
                {new Date(points[0].date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </text>
              <text x={points[points.length - 1].x} y={HEIGHT - 6} textAnchor="end" fontSize={10} fill="rgb(var(--muted))">
                {new Date(points[points.length - 1].date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </text>
            </>
          )}

          {hovered && (
            <>
              <line
                x1={hovered.x}
                x2={hovered.x}
                y1={PAD_TOP}
                y2={HEIGHT - PAD_BOTTOM}
                stroke="rgb(var(--muted))"
                strokeWidth={1}
                strokeDasharray="2,2"
              />
              <circle cx={hovered.x} cy={hovered.y} r={4} fill="rgb(var(--primary-500))" stroke="rgb(var(--elimux-card))" strokeWidth={2} />
            </>
          )}
        </svg>

        {hovered && (
          <div
            className="absolute top-0 bg-elimux-dark border border-border rounded-lg px-3 py-2 text-xs pointer-events-none shadow-lg"
            style={{
              left: `${(hovered.x / WIDTH) * 100}%`,
              transform: hovered.x > WIDTH * 0.7 ? 'translateX(-100%)' : 'translateX(0)',
            }}
          >
            <div className="text-muted">{new Date(hovered.date).toLocaleDateString()}</div>
            <div className="text-foreground font-semibold">{hovered.value.toLocaleString()}</div>
          </div>
        )}
      </div>
    </div>
  )
}
