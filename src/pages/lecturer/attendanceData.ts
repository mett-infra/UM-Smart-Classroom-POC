import { ATT_TODAY, attendanceDates, cohortFor, dayRecord, fmtMin, personById, toMin, type Person } from '../../data/attendance'
import { facePeople } from '../../data/faces'
import type { AttMark } from '../../store/DemoStore'

/*
  Lecturer attendance (Dr. Farid's classes).
  Two ways a student becomes present:
  1. Face recognition: the room camera (or this device's camera) recognises the student.
  2. Marked by the lecturer: for anyone the camera missed.
  Past sessions come from the same room records the management Attendance page uses.
*/

export interface LecSession {
  id: string
  code: string
  title: string
  label: string
  date: string // ISO
  start: string
  end: string
  roomId: string
  room: string
}

export const lecSessions: LecSession[] = [
  { id: 's-wia2004-14', code: 'WIA2004', title: 'Operating Systems', label: 'Lecture 14: Deadlocks', date: ATT_TODAY, start: '10:00', end: '11:00', roomId: 'sp-dk2', room: 'DK2, FSKTM' },
  { id: 's-wia2004-13', code: 'WIA2004', title: 'Operating Systems', label: 'Lecture 13: Deadlock characterisation', date: '2026-10-19', start: '10:00', end: '11:00', roomId: 'sp-dk2', room: 'DK2, FSKTM' },
  { id: 's-wia2004-12', code: 'WIA2004', title: 'Operating Systems', label: 'Lecture 12: Classic synchronisation problems', date: '2026-10-14', start: '10:00', end: '11:00', roomId: 'sp-dk2', room: 'DK2, FSKTM' },
  { id: 's-wia2004-11', code: 'WIA2004', title: 'Operating Systems', label: 'Lecture 11: Synchronisation tools', date: '2026-10-12', start: '10:00', end: '11:00', roomId: 'sp-dk2', room: 'DK2, FSKTM' },
  { id: 's-wia3003-11', code: 'WIA3003', title: 'Cloud Computing', label: 'Lecture 11: Container orchestration', date: '2026-10-14', start: '12:00', end: '13:00', roomId: 'sp-dk3', room: 'DK3, FSKTM' },
]

/** The demo participant from Face sign-up joins today's live session, so the device camera can recognise him. */
export const demoParticipants: Person[] = facePeople.map((p) => ({ id: p.id, name: p.name, role: 'Student', idNo: p.idNo, faculty: p.organisation, programme: 'Demo participant', email: p.email, color: p.color, rel: 1 }))

export const isToday = (s: LecSession) => s.date === ATT_TODAY

/** The class list for a session (today's session also lists the demo participant). */
export function classList(s: LecSession): Person[] {
  return [...(isToday(s) ? demoParticipants : []), ...cohortFor(s.code)]
}

const hash = (t: string) => {
  let h = 2166136261
  for (let i = 0; i < t.length; i++) {
    h ^= t.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function roomSession(s: LecSession, nowMin: number) {
  const rec = dayRecord(s.roomId, s.date, nowMin)
  const sess = rec.sessions.find((x) => x.code === s.code && x.start === s.start)
  return { rec, sess }
}

/** Students physically in the room (from the people counter and door records). */
export function inRoom(s: LecSession, nowMin: number) {
  const { rec, sess } = roomSession(s, nowMin)
  if (!sess) return []
  return rec.visits.filter((v) => v.sessionId === sess.id && personById(v.personId)?.role === 'Student' && (isToday(s) ? v.outMin === null : true))
}

/** Records before the lecturer changes anything. Past sessions: camera and lecturer marks from the room records. Today: nothing until a face scan runs. */
export function baseMarks(s: LecSession, nowMin: number): Record<string, AttMark> {
  if (isToday(s)) return {}
  const out: Record<string, AttMark> = {}
  const st = toMin(s.start)
  inRoom(s, nowMin).forEach((v) => {
    out[v.personId] = v.method === 'Added by lecturer' ? { s: 'present', by: 'lecturer', at: fmtMin(st + 15 + (hash(v.personId) % 20)) } : { s: 'present', by: 'camera', at: fmtMin(Math.max(st - 10, v.inMin)) }
  })
  return out
}

/** Who the room camera recognises in a scan now: most people in the room, but never everyone (faces turned away, covered or not signed up). */
export function roomScan(s: LecSession, nowMin: number) {
  const people = inRoom(s, nowMin)
  const recognised = people.filter((v) => hash(`${s.id}|${v.personId}`) % 100 < 80).map((v) => v.personId)
  return { inRoom: people.length, recognised }
}

/** Marks with the lecturer's and today's scan changes applied. */
export function effectiveMarks(s: LecSession, nowMin: number, changes: Record<string, AttMark> | undefined) {
  return { ...baseMarks(s, nowMin), ...(changes ?? {}) }
}

/** Share of held sessions each student attended in this course and room over the last 60 days. */
const rateCache = new Map<string, Map<string, number>>()
export function semesterRates(s: LecSession, nowMin: number) {
  const key = `${s.code}|${s.roomId}`
  const hit = rateCache.get(key)
  if (hit) return hit
  let held = 0
  const seen = new Map<string, number>()
  attendanceDates()
    .filter((d) => d !== ATT_TODAY)
    .forEach((d) => {
      const rec = dayRecord(s.roomId, d, nowMin)
      rec.sessions
        .filter((x) => x.code === s.code)
        .forEach((x) => {
          held++
          rec.visits.filter((v) => v.sessionId === x.id).forEach((v) => seen.set(v.personId, (seen.get(v.personId) ?? 0) + 1))
        })
    })
  const rates = new Map<string, number>()
  cohortFor(s.code).forEach((p) => rates.set(p.id, held ? Math.round(((seen.get(p.id) ?? 0) / held) * 100) : 0))
  rateCache.set(key, rates)
  return rates
}
