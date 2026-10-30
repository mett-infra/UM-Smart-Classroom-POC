import { useEffect, useMemo, useState } from 'react'
import { demoMinutes, nowLabel, useDemo, type AttMark } from '../../store/DemoStore'
import { classList, effectiveMarks, inRoom, isToday, type LecSession } from './attendanceData'

/* Shared attendance state for one session, used by the Attendance page and the live class. */

export function useNow(every = 15000) {
  const [now, setNow] = useState(demoMinutes())
  useEffect(() => {
    const id = setInterval(() => setNow(demoMinutes()), every)
    return () => clearInterval(id)
  }, [every])
  return now
}

export function useLecAttendance(sess: LecSession, now: number) {
  const { state, update, log } = useDemo()
  const sid = sess.id
  const today = isToday(sess)
  const people = useMemo(() => classList(sess), [sess])
  const marks = effectiveMarks(sess, now, state.lecAttendance[sid])
  const scan = state.attScans[sid]
  const counter = today ? inRoom(sess, now).length : 0
  const present = people.filter((p) => marks[p.id]?.s === 'present')
  const byCamera = present.filter((p) => marks[p.id].by === 'camera').length
  const byLecturer = present.length - byCamera
  const presentStudents = present.filter((p) => !p.id.startsWith('fp-')).length
  const gap = counter - presentStudents

  const setMarks = (ids: string[], mark: AttMark | null) =>
    update((s) => {
      const cur = { ...(s.lecAttendance[sid] ?? {}) }
      ids.forEach((id) => {
        if (mark) cur[id] = mark
        else delete cur[id]
      })
      return { ...s, lecAttendance: { ...s.lecAttendance, [sid]: cur } }
    })

  /** The lecturer sets one student present or absent. */
  const mark = (id: string, v: 'present' | 'absent') => {
    if ((marks[id]?.s ?? 'absent') === v) return
    setMarks([id], { s: v, by: 'lecturer', at: nowLabel() })
  }

  /** The lecturer marks several students present. Returns how many changed. */
  const markPresent = (ids: string[]) => {
    const fresh = ids.filter((id) => marks[id]?.s !== 'present')
    if (!fresh.length) return 0
    setMarks(fresh, { s: 'present', by: 'lecturer', at: nowLabel() })
    log({ text: `Attendance updated for ${sess.code}`, sub: `${fresh.length} marked present manually`, kind: 'room' })
    return fresh.length
  }

  /** A room face scan finished: recognised students become present by face recognition. */
  const applyScan = (ids: string[]) => {
    const fresh = ids.filter((id) => !state.lecAttendance[sid]?.[id] || state.lecAttendance[sid][id].s !== 'present')
    setMarks(fresh, { s: 'present', by: 'camera', at: nowLabel() })
    update((s) => ({ ...s, attScans: { ...s.attScans, [sid]: { at: nowLabel(), recognised: ids.length } } }))
    log({ text: `Face scan in ${sess.room.split(',')[0]}`, sub: `${ids.length} students recognised for ${sess.code}`, kind: 'room' })
  }

  /** This device's camera recognised someone on the class list. */
  const applyDeviceMatch = (id: string) => {
    if (!people.some((p) => p.id === id)) return false
    setMarks([id], { s: 'present', by: 'camera', at: nowLabel() })
    log({ text: `Face recognised for ${sess.code}`, sub: `${people.find((p) => p.id === id)?.name} marked present`, kind: 'room' })
    return true
  }

  return { people, marks, scan, counter, present, byCamera, byLecturer, presentStudents, gap, today, mark, markPresent, applyScan, applyDeviceMatch }
}
