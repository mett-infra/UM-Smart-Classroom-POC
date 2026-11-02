import { useEffect, useState } from 'react'
import { labMinutes, limitOf, type LiveAssignment } from '../../data/labs'
import { personById } from '../../data/attendance'
import { facePersonById } from '../../data/faces'
import { nowLabel, useDemo } from '../../store/DemoStore'

/* Clock and controls for a running live assignment, shared by the live class and the monitor page. */

export function useLabClock(a: LiveAssignment | undefined) {
  const { update, log } = useDemo()
  const [, tick] = useState(0)
  useEffect(() => {
    if (!a || a.status !== 'running') return
    const id = setInterval(() => tick((x) => x + 1), 1000)
    return () => clearInterval(id)
  }, [a?.id, a?.status]) // eslint-disable-line react-hooks/exhaustive-deps
  const t = a ? labMinutes(a) : 0
  const timeUp = !!a && a.status === 'running' && t >= limitOf(a)
  useEffect(() => {
    if (!a || !timeUp) return
    update((s) => ({ ...s, liveAssignments: s.liveAssignments.map((x) => (x.id === a.id && x.status === 'running' ? { ...x, status: 'ended', endedAtLabMin: limitOf(x), endedBy: 'time', endedAt: nowLabel() } : x)) }))
    log({ text: `Live assignment ended: ${a.template.title}`, sub: `Time up. ${a.studentIds.length} labs submitted automatically`, kind: 'submit' })
  }, [timeUp]) // eslint-disable-line react-hooks/exhaustive-deps
  return t
}

export function useLabActions() {
  const { update, log, toast } = useDemo()
  const patch = (id: string, fn: (a: LiveAssignment) => LiveAssignment) => update((s) => ({ ...s, liveAssignments: s.liveAssignments.map((x) => (x.id === id ? fn(x) : x)) }))
  return {
    end: (a: LiveAssignment) => {
      patch(a.id, (x) => (x.status === 'running' ? { ...x, status: 'ended', endedAtLabMin: labMinutes(x), endedBy: 'lecturer', endedAt: nowLabel() } : x))
      log({ text: `Live assignment ended: ${a.template.title}`, sub: `${a.studentIds.length} labs submitted automatically`, kind: 'submit' })
      toast(`Assignment ended. All ${a.studentIds.length} labs were submitted automatically.`)
    },
    addTime: (a: LiveAssignment, min: number) => {
      patch(a.id, (x) => ({ ...x, extraMin: x.extraMin + min }))
      toast(`${min} minutes added. Students see the new end time in their lab.`)
    },
    setSpeed: (a: LiveAssignment, speed: number) => patch(a.id, (x) => ({ ...x, labMinAtMark: labMinutes(x), markTs: Date.now(), speed })),
    setMark: (a: LiveAssignment, studentId: string, mark: number, feedback?: string) =>
      patch(a.id, (x) => ({ ...x, marks: { ...x.marks, [studentId]: { mark, feedback: feedback ?? x.marks[studentId]?.feedback ?? '' } } })),
    setMarks: (a: LiveAssignment, marks: Record<string, { mark: number; feedback: string }>) => patch(a.id, (x) => ({ ...x, marks: { ...x.marks, ...marks } })),
    release: (a: LiveAssignment) => {
      patch(a.id, (x) => ({ ...x, status: 'released' }))
      log({ text: `Marks released: ${a.template.title}`, sub: `${Object.keys(a.marks).length} students can see their marks`, kind: 'grade' })
      toast('Marks released. Students can see their marks and feedback.')
    },
  }
}

export const nameOf = (id: string) => personById(id)?.name ?? facePersonById(id)?.name ?? id
export const idNoOf = (id: string) => personById(id)?.idNo ?? facePersonById(id)?.idNo ?? ''
export const colorOf = (id: string) => personById(id)?.color ?? facePersonById(id)?.color

export const fmtLab = (min: number) => {
  const s = Math.max(0, Math.round(min * 60))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
