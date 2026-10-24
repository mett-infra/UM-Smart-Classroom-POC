import { FileText, FlaskConical, Link2, ListChecks, PlayCircle, Presentation } from 'lucide-react'
import type { ClassSlot, Course, MaterialType } from '../../data/types'
import { DEMO_DAY, dayNames } from '../../data/mock'

/** Download a CSV built in the browser. Nothing is sent anywhere. */
export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const esc = (v: string | number) => {
    const s = String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = rows.map((r) => r.map(esc).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export const materialLabel: Record<MaterialType, string> = {
  slides: 'Slides',
  pdf: 'Reading',
  video: 'Recording',
  quiz: 'Quiz',
  link: 'Link',
  lab: 'Lab sheet',
}

export function MaterialIcon({ type, size = 18 }: { type: MaterialType; size?: number }) {
  switch (type) {
    case 'slides':
      return <Presentation size={size} />
    case 'pdf':
      return <FileText size={size} />
    case 'video':
      return <PlayCircle size={size} />
    case 'quiz':
      return <ListChecks size={size} />
    case 'link':
      return <Link2 size={size} />
    default:
      return <FlaskConical size={size} />
  }
}

export const materialTint: Record<MaterialType, { bg: string; fg: string }> = {
  slides: { bg: 'var(--primary-50)', fg: 'var(--primary)' },
  pdf: { bg: 'var(--surface-2)', fg: 'var(--text-2)' },
  video: { bg: 'var(--red-50)', fg: 'var(--red)' },
  quiz: { bg: 'var(--gold-50)', fg: 'var(--gold-600)' },
  link: { bg: 'var(--teal-50)', fg: 'var(--teal)' },
  lab: { bg: 'var(--plum-50)', fg: 'var(--plum)' },
}

/** Next class after the demo clock (Wed 10:12). */
export function nextSlot(course: Course): { slot: ClassSlot; label: string } | null {
  if (!course.schedule.length) return null
  const nowKey = DEMO_DAY * 10000 + 1012
  const key = (s: ClassSlot) => s.day * 10000 + Number(s.start.replace(':', ''))
  const sorted = [...course.schedule].sort((a, b) => key(a) - key(b))
  const later = sorted.find((s) => key(s) > nowKey)
  const slot = later ?? sorted[0]
  const day = slot.day === DEMO_DAY && later ? 'Today' : later ? dayNames[slot.day] : `Next ${dayNames[slot.day]}`
  return { slot, label: `${day} ${slot.start}` }
}

/** Deterministic pseudo-random generator so sample data is stable between renders. */
export function seeded(seed: number) {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

export function hashStr(s: string) {
  let h = 2166136261
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return h >>> 0
}
