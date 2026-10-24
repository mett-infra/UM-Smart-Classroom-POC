import type { ReactNode } from 'react'

/* Shared chart styling for Recharts so every chart reads as one system. */

export const chartColors = {
  primary: '#2f55d4',
  gold: '#c8952c',
  teal: '#0e8a7e',
  plum: '#6b3fa0',
  red: '#c93c4a',
  green: '#1e8a5a',
  grid: '#e8ecf3',
  axis: '#95a0b4',
}

export const axisProps = {
  tick: { fill: chartColors.axis, fontSize: 12 },
  axisLine: false,
  tickLine: false,
} as const

export const gridProps = {
  stroke: chartColors.grid,
  vertical: false,
} as const

export const tooltipProps = {
  contentStyle: {
    background: '#101c3b',
    border: 0,
    borderRadius: 10,
    color: '#fff',
    fontSize: 13,
    boxShadow: '0 12px 30px rgba(16,28,59,.25)',
  },
  labelStyle: { color: '#b9c3db', marginBottom: 4 },
  itemStyle: { color: '#fff', padding: 0 },
  cursor: { fill: 'rgba(47,85,212,0.06)' },
} as const

export function Legend({ items }: { items: { label: ReactNode; color: string }[] }) {
  return (
    <div className="chart-legend">
      {items.map((i, k) => (
        <span key={k}>
          <i style={{ background: i.color }} />
          {i.label}
        </span>
      ))}
    </div>
  )
}

export function HBars({ rows, max = 100, unit = '%', color = chartColors.primary }: { rows: { label: string; value: number; color?: string }[]; max?: number; unit?: string; color?: string }) {
  return (
    <div>
      {rows.map((r) => (
        <div className="hbar-row" key={r.label}>
          <span className="truncate" title={r.label}>
            {r.label}
          </span>
          <div className="bar">
            <span style={{ width: `${(r.value / max) * 100}%`, background: r.color ?? color }} />
          </div>
          <strong>
            {r.value}
            {unit}
          </strong>
        </div>
      ))}
    </div>
  )
}
