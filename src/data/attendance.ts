import { lecturers, roster } from './mock'
import { seedSpaces } from './smartcampus'

/*
  Room attendance sample data (Day 3).
  Fictional people and check-ins for every sub room over the last 60 days, generated from a fixed seed so the
  same date always shows the same people. Today (Wed 21 Oct 2026) is "live": only check-ins up to the demo
  clock are shown, and people who have not left yet are counted in the live headcount.
  In production this comes from the attendance service (face recognition, card taps, QR check-in, people counters).
*/

export const ATT_TODAY = '2026-10-21'
export const ATT_DAYS = 60
const SEMESTER_START = '2026-09-07' // teaching week 1
const MAINT_FROM: Record<string, string> = { 'sp-mk1': '2026-10-12' }

export const HOLIDAYS: Record<string, string> = {
  '2026-08-31': 'Merdeka Day (public holiday)',
  '2026-09-16': 'Malaysia Day (public holiday)',
}

// ---------- helpers ----------
const hash = (s: string) => {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
const rngOf = (seed: number) => {
  let a = seed || 1
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const pick = <T,>(r: () => number, xs: readonly T[]) => xs[Math.floor(r() * xs.length)]
const between = (r: () => number, a: number, b: number) => a + Math.floor(r() * (b - a + 1))

export const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}
export const fmtMin = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

const isoToDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}
const dateToIso = (d: Date) => d.toISOString().slice(0, 10)
export const weekdayOf = (iso: string) => isoToDate(iso).getUTCDay() // 0 Sun .. 6 Sat

/** The last 60 days, oldest first, ending today. */
export function attendanceDates(): string[] {
  const end = isoToDate(ATT_TODAY)
  return Array.from({ length: ATT_DAYS }, (_, i) => dateToIso(new Date(end.getTime() - (ATT_DAYS - 1 - i) * 86400000)))
}

export function fmtDay(iso: string, style: 'long' | 'short' = 'long') {
  return isoToDate(iso).toLocaleDateString('en-GB', style === 'long' ? { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' } : { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
}

// ---------- people ----------
export type PersonRole = 'Student' | 'Lecturer' | 'Staff' | 'Visitor'

export interface Person {
  id: string
  name: string
  role: PersonRole
  idNo: string
  faculty: string
  programme: string
  year?: number
  email: string
  color: string
  rel: number // how reliably a student attends, used to pick who comes each day
}

const FAC = {
  fsktm: 'Faculty of Computer Science & IT',
  eng: 'Faculty of Engineering',
  fbe: 'Faculty of Business and Economics',
} as const
type Fac = keyof typeof FAC

const PROGRAMMES: Record<Fac, string[]> = {
  fsktm: ['BCS (Software Engineering)', 'BCS (Artificial Intelligence)', 'BCS (Computer System & Network)', 'BCS (Information Systems)', 'BCS (Data Science)'],
  eng: ['BEng (Electrical)', 'BEng (Mechanical)', 'BEng (Civil)', 'BEng (Chemical)', 'BEng (Biomedical)'],
  fbe: ['BBA (Marketing)', 'Bachelor of Accounting', 'Bachelor of Economics', 'BBA (Finance)'],
}

const MALAY_M = ['Muhammad Haziq', 'Ahmad Danial', 'Amirul Hakim', 'Muhammad Faris', 'Aiman', 'Irfan Hakimi', 'Hafiz Syahmi', 'Khairul Anwar', 'Muhammad Adam', 'Izzat', 'Syafiq', 'Luqman Hakim', 'Harith', 'Danish', 'Afiq', 'Nabil', 'Muhammad Aqil', 'Firdaus', 'Zharif', 'Hakim']
const MALAY_F = ['Nur Aisyah', 'Siti Nurhaliza', 'Nurul Iman', 'Farah Nadia', 'Puteri Balqis', 'Nur Insyirah', 'Alya Maisarah', 'Nur Amirah', 'Syazwani', 'Hani Sofia', 'Iman Nadhirah', 'Nurul Huda', 'Aqilah', 'Sofea Irdina', 'Nur Batrisyia', 'Athirah', 'Dayana', 'Nur Syahirah']
const MALAY_FATHER = ['Azman', 'Roslan', 'Ismail', 'Salleh', 'Ahmad', 'Mohd Noor', 'Rahman', 'Yusof', 'Hassan', 'Othman', 'Zainal', 'Kamal', 'Abdullah', 'Ibrahim', 'Hamid', 'Razak', 'Sulaiman', 'Mansor', 'Jamil', 'Aziz']
const CN_SUR = ['Tan', 'Lee', 'Wong', 'Lim', 'Chong', 'Ooi', 'Teoh', 'Ng', 'Yap', 'Goh', 'Chan', 'Lau', 'Ho', 'Koh', 'Cheah', 'Low', 'Chin', 'Foo', 'Loh', 'Khoo']
const CN_A = ['Jia', 'Wen', 'Kai', 'Mei', 'Zi', 'Shu', 'Jun', 'Yong', 'Hui', 'Xin', 'Wei', 'Zhi', 'Yi', 'Kah', 'Jing', 'Chee', 'Pei', 'Hong', 'Li', 'Siew', 'Kok', 'Boon', 'Yee', 'Zhen']
const CN_B = ['Hui', 'Hao', 'Xuan', 'Yee', 'Ting', 'Wei', 'Sheng', 'Min', 'Yi', 'Ling', 'Le', 'Xin', 'Mun', 'Seng', 'Shan', 'Ying', 'Han', 'Jie', 'Qi', 'Yan']
const MALAY_M2 = ['Irfan', 'Hakimi', 'Danish', 'Aiman', 'Haikal', 'Rayyan', 'Zafran', 'Iskandar', 'Fahmi', 'Arif']
const MALAY_F2 = ['Sofea', 'Batrisyia', 'Qistina', 'Amani', 'Natasha', 'Damia', 'Husna', 'Aleeya', 'Syuhada', 'Najwa']
const IN_M = ['Arjun', 'Vikram', 'Ravi', 'Sanjay', 'Kumaresan', 'Naveen', 'Dinesh', 'Thiban', 'Hareesh', 'Prakash', 'Ganesh', 'Kishen', 'Surendran', 'Mugilan', 'Darshan', 'Rajiv']
const IN_F = ['Priya', 'Deepa', 'Kavitha', 'Shalini', 'Anusha', 'Thivya', 'Meera', 'Nisha', 'Yamini', 'Sharmila', 'Revathi']
const IN_FATHER = ['Krishnan', 'Selvam', 'Suppiah', 'Ramasamy', 'Muthu', 'Ganesan', 'Raman', 'Subramaniam', 'Nair', 'Arumugam', 'Perumal', 'Velu']
const COLORS = ['#2f55d4', '#0e8a7e', '#7a4bc2', '#c0601f', '#b2365f', '#2f7d32', '#1f6fb2', '#8a5a00']

function makeName(r: () => number) {
  const g = r()
  const female = r() < 0.52
  const two = r() < 0.45
  if (g < 0.55) return female ? `${pick(r, MALAY_F)}${two ? ` ${pick(r, MALAY_F2)}` : ''} binti ${pick(r, MALAY_FATHER)}` : `${pick(r, MALAY_M)}${two ? ` ${pick(r, MALAY_M2)}` : ''} bin ${pick(r, MALAY_FATHER)}`
  if (g < 0.85) return `${pick(r, CN_SUR)} ${pick(r, CN_A)} ${pick(r, CN_B)}`
  return female ? `${pick(r, IN_F)} a/p ${pick(r, IN_FATHER)}` : `${pick(r, IN_M)} a/l ${pick(r, IN_FATHER)}`
}

const FAC_SIZE: Record<Fac, number> = { fsktm: 1100, eng: 1300, fbe: 600 }
const FAC_CODE: Record<Fac, string> = { fsktm: '05', eng: '03', fbe: '07' }

let PEOPLE: Person[] | null = null
let BY_ID: Map<string, Person> | null = null

function people(): Person[] {
  if (PEOPLE) return PEOPLE
  const r = rngOf(20261021)
  const used = new Set<string>()
  const list: Person[] = []

  // The class roster from the lecturer portal (including the student persona) is part of FSKTM year 2.
  roster.forEach((s) => {
    used.add(s.name)
    list.push({ id: s.id, name: s.name, role: 'Student', idNo: s.matric, faculty: FAC.fsktm, programme: s.programme, year: 2, email: `${s.matric}@siswa.example.edu.my`, color: s.color, rel: Math.max(0.35, Math.min(1, s.attendance / 100)) })
  })

  ;(Object.keys(FAC_SIZE) as Fac[]).forEach((f) => {
    for (let i = 0; i < FAC_SIZE[f]; i++) {
      let name = makeName(r)
      for (let k = 0; k < 30 && used.has(name); k++) name = makeName(r)
      used.add(name)
      const year = 1 + (i % 4)
      const matric = `${27 - year}${FAC_CODE[f]}${String(1000 + i * 7 + year).padStart(4, '0')}`
      list.push({
        id: `p-${f}-${i}`,
        name,
        role: 'Student',
        idNo: matric,
        faculty: FAC[f],
        programme: PROGRAMMES[f][i % PROGRAMMES[f].length],
        year,
        email: `${matric}@siswa.example.edu.my`,
        color: COLORS[i % COLORS.length],
        rel: 0.55 + r() * 0.45,
      })
    }
  })

  const staff = (id: string, name: string, role: PersonRole, idNo: string, faculty: string, programme: string, color: string): Person => ({
    id,
    name,
    role,
    idNo,
    faculty,
    programme,
    email: `${name.toLowerCase().replace(/^(dr|ir|prof|assoc|encik|puan|cik|mr|ms)\.?\s+/g, '').replace(/^(dr|ir|prof)\.?\s+/g, '').split(' ')[0]}.${idNo.slice(-3)}@example.edu.my`,
    color,
    rel: 1,
  })
  lecturers.forEach((l, i) => list.push(staff(l.id, l.name, 'Lecturer', `STAF-${String(1201 + i * 37).padStart(5, '0')}`, FAC.fsktm, `${l.title}, ${l.department}`, l.color)))
  ;[
    ['E1', 'Dr. Mohd Shahrul bin Ismail', 'Senior Lecturer, Engineering Mathematics'],
    ['E2', 'Ir. Dr. Wong Chee Keong', 'Senior Lecturer, Mechanical Engineering'],
    ['E3', 'Dr. Ahmad Faizal bin Yusof', 'Senior Lecturer, Electrical Engineering'],
    ['E4', 'Dr. Kavitha a/p Raman', 'Lecturer, Electrical Engineering'],
    ['E5', 'Prof. Ir. Dr. Lee Chun Hong', 'Professor, Civil Engineering'],
  ].forEach(([id, n, p], i) => list.push(staff(id, n, 'Lecturer', `STAF-${String(2311 + i * 41).padStart(5, '0')}`, FAC.eng, p, COLORS[(i + 2) % 8])))
  ;[
    ['B1', 'Dr. Aishah binti Mokhtar', 'Senior Lecturer, Marketing'],
    ['B2', 'Assoc. Prof. Dr. Ng Siew Lan', 'Associate Professor, Accounting'],
    ['B3', 'Dr. Faridah binti Yaacob', 'Senior Lecturer, Finance'],
  ].forEach(([id, n, p], i) => list.push(staff(id, n, 'Lecturer', `STAF-${String(3407 + i * 29).padStart(5, '0')}`, FAC.fbe, p, COLORS[(i + 5) % 8])))
  ;[
    ['T1', 'Encik Azlan bin Hashim', 'AV technician', 'Central Auditorium'],
    ['T2', 'Mr. Daniel Lim Kok Wai', 'AV technician', 'Central Auditorium'],
    ['T3', 'Puan Rosnah binti Ali', 'Event coordinator', 'Student Affairs Division'],
    ['T4', 'Mr. Suresh a/l Manickam', 'Lab assistant', FAC.fsktm],
    ['T5', 'Cik Nadia binti Ramli', 'Lab assistant', FAC.eng],
  ].forEach(([id, n, p, f], i) => list.push(staff(id, n, 'Staff', `STAF-${String(5102 + i * 23).padStart(5, '0')}`, f, p, COLORS[(i + 1) % 8])))

  PEOPLE = list
  BY_ID = new Map(list.map((p) => [p.id, p]))
  return list
}

export const personById = (id: string) => {
  people()
  return BY_ID!.get(id) ?? VISITORS.get(id)
}

// Visitors are created per event (fixed seed), for example employers at the career fair.
const VISITORS = new Map<string, Person>()
const ORGS = ['Nusantara Digital Sdn Bhd', 'Kinabalu Engineering Group', 'Selat Analytics', 'Harimau Robotics', 'Bayu Energy Sdn Bhd', 'Teras Consulting', 'Gemilang Semiconductor', 'Pelangi FinTech', 'Rimba Infrastructure', 'Seri Logistics']
function visitors(key: string, n: number): Person[] {
  const r = rngOf(hash(`v-${key}`))
  return Array.from({ length: n }, (_, i) => {
    const id = `v-${key}-${i}`
    const existing = VISITORS.get(id)
    if (existing) return existing
    const org = pick(r, ORGS)
    const p: Person = { id, name: makeName(r), role: 'Visitor', idNo: `VIS-${String(hash(id) % 90000 + 10000)}`, faculty: org, programme: pick(r, ['Talent acquisition', 'Engineering manager', 'Guest speaker', 'Industry partner', 'HR executive']), email: 'Registered through the event page', color: COLORS[i % 8], rel: 1 }
    VISITORS.set(id, p)
    return p
  })
}

// ---------- room timetables ----------
type Kind = 'Lecture' | 'Tutorial' | 'Lab' | 'Event' | 'Duty'
interface Slot {
  days: number[]
  start: string
  end: string
  code: string
  title: string
  kind: Kind
  host: string // person id of the lecturer
  fac: Fac
  year: number
  size: number // enrolled
  rate: number // share who attend in the room (hybrid classes also have online attendees)
  today?: number // exact in-room attendance for the demo day
  until?: string
}

const SLOTS: Record<string, Slot[]> = {
  'sp-dk1': [
    { days: [1, 3], start: '08:00', end: '09:00', code: 'WIA2005', title: 'Algorithm Design and Analysis', kind: 'Lecture', host: 'L2', fac: 'fsktm', year: 2, size: 156, rate: 0.86, today: 141 },
    { days: [2], start: '10:00', end: '12:00', code: 'WIX1001', title: 'Computing Mathematics I', kind: 'Lecture', host: 'L5', fac: 'fsktm', year: 1, size: 168, rate: 0.84 },
    { days: [4], start: '14:00', end: '16:00', code: 'WIA2001', title: 'Database', kind: 'Lecture', host: 'L3', fac: 'fsktm', year: 2, size: 150, rate: 0.8 },
  ],
  'sp-dk2': [
    { days: [1, 3], start: '10:00', end: '11:00', code: 'WIA2004', title: 'Operating Systems', kind: 'Lecture', host: 'L1', fac: 'fsktm', year: 2, size: 142, rate: 0.66, today: 89 },
    { days: [2], start: '14:00', end: '16:00', code: 'WIA2003', title: 'Probability and Statistics', kind: 'Lecture', host: 'L6', fac: 'fsktm', year: 2, size: 130, rate: 0.82 },
    { days: [5], start: '10:00', end: '12:00', code: 'WIX1002', title: 'Fundamentals of Programming', kind: 'Lecture', host: 'L6', fac: 'fsktm', year: 1, size: 155, rate: 0.85 },
  ],
  'sp-dk3': [
    { days: [3], start: '10:00', end: '11:00', code: 'WIX1003', title: 'Computer Systems and Organisation', kind: 'Lecture', host: 'L5', fac: 'fsktm', year: 1, size: 170, rate: 0.7, today: 124 },
    { days: [3], start: '12:00', end: '13:00', code: 'WIA3003', title: 'Cloud Computing', kind: 'Lecture', host: 'L1', fac: 'fsktm', year: 3, size: 96, rate: 0.78 },
    { days: [1], start: '14:00', end: '16:00', code: 'WIA3002', title: 'Software Testing', kind: 'Lecture', host: 'L6', fac: 'fsktm', year: 3, size: 110, rate: 0.8 },
  ],
  'sp-mk1': [
    { days: [2], start: '10:00', end: '12:00', code: 'WIE2003', title: 'Introduction to Data Science, lab group 1', kind: 'Lab', host: 'L3', fac: 'fsktm', year: 2, size: 58, rate: 0.93, until: '2026-10-11' },
    { days: [4], start: '14:00', end: '16:00', code: 'WIA2004', title: 'Operating Systems, lab', kind: 'Lab', host: 'L1', fac: 'fsktm', year: 2, size: 56, rate: 0.92, until: '2026-10-11' },
  ],
  'sp-mk3': [
    { days: [3], start: '14:00', end: '16:00', code: 'WIE2003', title: 'Introduction to Data Science, lab', kind: 'Lab', host: 'L3', fac: 'fsktm', year: 2, size: 58, rate: 0.93 },
    { days: [1], start: '14:00', end: '16:00', code: 'WIX1002', title: 'Fundamentals of Programming, lab', kind: 'Lab', host: 'L6', fac: 'fsktm', year: 1, size: 55, rate: 0.9 },
    { days: [4], start: '10:00', end: '12:00', code: 'WIA2001', title: 'Database, lab', kind: 'Lab', host: 'L3', fac: 'fsktm', year: 2, size: 54, rate: 0.9 },
  ],
  'sp-bk2': [
    { days: [5], start: '09:00', end: '10:00', code: 'WIA2005', title: 'Algorithm Design and Analysis, tutorial', kind: 'Tutorial', host: 'L2', fac: 'fsktm', year: 2, size: 38, rate: 0.86 },
    { days: [2], start: '11:00', end: '12:00', code: 'WIX2002', title: 'Project Management, tutorial', kind: 'Tutorial', host: 'L1', fac: 'fsktm', year: 2, size: 36, rate: 0.84 },
  ],
  'sp-ea1': [
    { days: [1, 3], start: '10:00', end: '12:00', code: 'KIX1001', title: 'Engineering Mathematics I', kind: 'Lecture', host: 'E1', fac: 'eng', year: 1, size: 214, rate: 0.78, today: 196 },
    { days: [2], start: '08:00', end: '10:00', code: 'KIE1004', title: 'Electrical Circuits', kind: 'Lecture', host: 'E4', fac: 'eng', year: 1, size: 220, rate: 0.8 },
    { days: [4], start: '14:00', end: '16:00', code: 'KIM1001', title: 'Statics', kind: 'Lecture', host: 'E2', fac: 'eng', year: 1, size: 200, rate: 0.79 },
  ],
  'sp-c12': [
    { days: [3], start: '10:00', end: '11:00', code: 'KIM2003', title: 'Thermodynamics tutorial', kind: 'Tutorial', host: 'E2', fac: 'eng', year: 2, size: 40, rate: 0.7, today: 23 },
    { days: [1], start: '15:00', end: '16:00', code: 'KIX2001', title: 'Engineering Mathematics III tutorial', kind: 'Tutorial', host: 'E1', fac: 'eng', year: 2, size: 38, rate: 0.82 },
    { days: [5], start: '09:00', end: '11:00', code: 'KIE3002', title: 'Power Systems seminar', kind: 'Tutorial', host: 'E3', fac: 'eng', year: 3, size: 30, rate: 0.86 },
  ],
  'sp-ea201': [
    { days: [3], start: '08:00', end: '10:00', code: 'KIE2005', title: 'Digital Systems design studio', kind: 'Tutorial', host: 'E4', fac: 'eng', year: 2, size: 46, rate: 0.9, today: 44 },
    { days: [2], start: '14:00', end: '16:00', code: 'KXEX2244', title: 'Control Systems', kind: 'Lecture', host: 'E3', fac: 'eng', year: 3, size: 44, rate: 0.84 },
    { days: [4], start: '10:00', end: '12:00', code: 'KIX3001', title: 'Final year project workshop', kind: 'Tutorial', host: 'E5', fac: 'eng', year: 4, size: 40, rate: 0.82 },
  ],
  'sp-ea210': [
    { days: [3], start: '14:00', end: '17:00', code: 'KIE2008', title: 'Electronics lab, group A', kind: 'Lab', host: 'E4', fac: 'eng', year: 2, size: 36, rate: 0.94 },
    { days: [1], start: '09:00', end: '12:00', code: 'KIE2008', title: 'Electronics lab, group B', kind: 'Lab', host: 'E4', fac: 'eng', year: 2, size: 34, rate: 0.93 },
  ],
  'sp-eaud': [
    { days: [1], start: '14:00', end: '16:00', code: 'KIX1002', title: 'Engineering Ethics', kind: 'Lecture', host: 'E5', fac: 'eng', year: 1, size: 400, rate: 0.82 },
    { days: [4], start: '10:00', end: '12:00', code: 'KIX2004', title: 'Engineering Economics', kind: 'Lecture', host: 'E1', fac: 'eng', year: 2, size: 380, rate: 0.8 },
  ],
  'sp-eb110': [
    { days: [3], start: '11:00', end: '13:00', code: 'KIX2003', title: 'Numerical Methods', kind: 'Lecture', host: 'E1', fac: 'eng', year: 2, size: 190, rate: 0.83 },
    { days: [2], start: '10:00', end: '12:00', code: 'KIC2001', title: 'Fluid Mechanics', kind: 'Lecture', host: 'E5', fac: 'eng', year: 2, size: 180, rate: 0.81 },
    { days: [5], start: '08:00', end: '10:00', code: 'KIM2001', title: 'Mechanics of Materials', kind: 'Lecture', host: 'E2', fac: 'eng', year: 2, size: 186, rate: 0.78 },
  ],
  'sp-b204': [
    { days: [3], start: '10:00', end: '12:00', code: 'CEB2012', title: 'Digital Marketing Analytics', kind: 'Lecture', host: 'B1', fac: 'fbe', year: 2, size: 48, rate: 0.85, today: 41 },
    { days: [1], start: '14:00', end: '16:00', code: 'CEB2001', title: 'Consumer Behaviour', kind: 'Lecture', host: 'B1', fac: 'fbe', year: 2, size: 46, rate: 0.84 },
    { days: [4], start: '09:00', end: '11:00', code: 'CIA2003', title: 'Management Accounting', kind: 'Lecture', host: 'B2', fac: 'fbe', year: 2, size: 44, rate: 0.86 },
  ],
}

interface EventDef {
  date: string
  room: string
  start: string
  end: string
  title: string
  host: string
  size: number
  mix: 'fresh' | 'all' | 'eng' | 'final'
  visitors?: number
  stay: 'whole' | 'browse' // a talk (people stay) or a fair (people come and go)
}

const EVENTS: EventDef[] = [
  ...['2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04'].map((date, i): EventDef => ({ date, room: 'sp-ca', start: '08:30', end: '17:00', title: `Orientation week, day ${i + 1}`, host: 'T3', size: 980 - i * 60, mix: 'fresh', stay: 'browse' })),
  { date: '2026-09-02', room: 'sp-eaud', start: '09:00', end: '12:00', title: 'Faculty of Engineering welcome', host: 'E5', size: 372, mix: 'fresh', stay: 'whole' },
  { date: '2026-09-24', room: 'sp-ca', start: '14:00', end: '16:30', title: 'Public lecture: AI and the future of work', host: 'T3', size: 610, mix: 'all', visitors: 40, stay: 'whole' },
  { date: '2026-10-08', room: 'sp-ca', start: '09:00', end: '16:00', title: 'Innovation Day showcase', host: 'T3', size: 880, mix: 'all', visitors: 60, stay: 'browse' },
  { date: '2026-10-14', room: 'sp-eaud', start: '09:00', end: '11:00', title: 'Engineering Week opening', host: 'E5', size: 396, mix: 'eng', stay: 'whole' },
  { date: '2026-10-17', room: 'sp-ca', start: '08:00', end: '13:00', title: 'Convocation briefing for graduands', host: 'T3', size: 760, mix: 'final', stay: 'whole' },
  { date: '2026-10-21', room: 'sp-ca', start: '09:00', end: '17:00', title: 'UM Career Fair 2026', host: 'T3', size: 2150, mix: 'all', visitors: 140, stay: 'browse' },
  { date: '2026-10-21', room: 'sp-eaud', start: '09:30', end: '12:00', title: 'Industry talk: Smart manufacturing', host: 'E3', size: 384, mix: 'eng', visitors: 12, stay: 'whole' },
]

// ---------- day records ----------
export type Method = 'Face recognition' | 'Card tap' | 'QR check-in' | 'Event ticket' | 'Added by lecturer'
export type VisitStatus = 'On time' | 'Late' | 'Checked in' | 'On duty'

export interface Visit {
  personId: string
  sessionId: string
  inMin: number
  outMin: number | null // null while still in the room (today only)
  method: Method
  status: VisitStatus
}

export interface DaySession {
  id: string
  start: string
  end: string
  code: string
  title: string
  kind: Kind
  host: string
  expected: number
  state: 'Ended' | 'Live' | 'Upcoming'
}

export interface DayRecord {
  sessions: DaySession[]
  visits: Visit[]
  note?: string
}

const cohortCache = new Map<string, Person[]>()
function cohort(code: string, fac: Fac, year: number, size: number): Person[] {
  const key = `${code}-${fac}-${year}-${size}`
  const hit = cohortCache.get(key)
  if (hit) return hit
  const pool = people().filter((p) => p.role === 'Student' && p.faculty === FAC[fac] && p.year === year)
  const r = rngOf(hash(key))
  const shuffled = [...pool].sort(() => r() - 0.5)
  let list = shuffled.slice(0, size)
  if (code === 'WIA2004') {
    const rosterIds = new Set(roster.map((s) => s.id))
    list = [...pool.filter((p) => rosterIds.has(p.id)), ...shuffled.filter((p) => !rosterIds.has(p.id))].slice(0, size)
  }
  cohortCache.set(key, list)
  return list
}

/** Pick exactly n people, favouring the ones who attend reliably (weighted sampling). */
function choose(r: () => number, from: Person[], n: number) {
  return from
    .map((p) => ({ p, k: p.rel >= 1 ? 1 + r() : Math.pow(r(), 1 / p.rel) })) // rel 1 means never misses a class
    .sort((a, b) => b.k - a.k)
    .slice(0, Math.min(n, from.length))
    .map((x) => x.p)
}

const hasCamera = (roomId: string) => !!seedSpaces.find((s) => s.id === roomId)?.camera

function methodFor(r: () => number, roomId: string, kind: Kind): Method {
  if (kind === 'Event') return r() < 0.8 ? 'Event ticket' : 'Card tap'
  const x = r()
  if (hasCamera(roomId)) return x < 0.82 ? 'Face recognition' : x < 0.95 ? 'Card tap' : 'Added by lecturer'
  return x < 0.78 ? 'Card tap' : x < 0.96 ? 'QR check-in' : 'Added by lecturer'
}

const fullCache = new Map<string, DayRecord>()

function buildDay(roomId: string, iso: string): DayRecord {
  const key = `${roomId}|${iso}`
  const hit = fullCache.get(key)
  if (hit) return hit
  const wd = weekdayOf(iso)
  const sessions: DaySession[] = []
  const visits: Visit[] = []
  let note: string | undefined
  const events = EVENTS.filter((e) => e.room === roomId && e.date === iso)
  const known = SLOTS[roomId] || roomId === 'sp-ca' || roomId === 'sp-ca-av'

  if (!known) note = 'No timetable or events are linked to this room yet, so there is no attendance.'
  else if (HOLIDAYS[iso]) note = `${HOLIDAYS[iso]}. No classes.`
  else if (MAINT_FROM[roomId] && iso >= MAINT_FROM[roomId]) note = 'Room under maintenance since 12 October. Its classes moved to Makmal 3.'

  const slots = !note && iso >= SEMESTER_START ? (SLOTS[roomId] ?? []).filter((s) => s.days.includes(wd) && (!s.until || iso <= s.until)) : []
  if (!note && !slots.length && !events.length && known) note = wd === 0 || wd === 6 ? 'Weekend. No classes were scheduled.' : iso < SEMESTER_START ? 'Semester break. Teaching week 1 starts on 7 September.' : 'No classes or events were scheduled in this room.'

  slots.forEach((s) => {
    const r = rngOf(hash(`${key}|${s.code}|${s.start}`))
    const id = `${s.code}-${s.start}`
    const st = toMin(s.start)
    const en = toMin(s.end)
    const friday = wd === 5 ? 0.93 : 1
    const n = iso === ATT_TODAY && s.today ? s.today : Math.round(s.size * s.rate * friday * (0.88 + r() * 0.12))
    sessions.push({ id, start: s.start, end: s.end, code: s.code, title: s.title, kind: s.kind, host: s.host, expected: s.size, state: 'Ended' })
    visits.push({ personId: s.host, sessionId: id, inMin: st - between(r, 6, 14), outMin: en + between(r, 3, 12), method: 'Card tap', status: 'On time' })
    if (s.kind === 'Lab') visits.push({ personId: s.fac === 'eng' ? 'T5' : 'T4', sessionId: id, inMin: st - 20, outMin: en + 15, method: 'Card tap', status: 'On duty' })
    choose(r, cohort(s.code, s.fac, s.year, s.size), n).forEach((p) => {
      const late = r() < 0.13
      const inMin = late ? st + between(r, 6, 28) : st - between(r, 0, 13)
      const early = r() < 0.04
      const outMin = early ? between(r, inMin + 20, en - 8) : en + between(r, -2, 9)
      visits.push({ personId: p.id, sessionId: id, inMin, outMin, method: methodFor(r, roomId, s.kind), status: late ? 'Late' : 'On time' })
    })
  })

  events.forEach((e) => {
    const r = rngOf(hash(`${key}|${e.title}`))
    const id = `EV-${e.start}`
    const st = toMin(e.start)
    const en = toMin(e.end)
    sessions.push({ id, start: e.start, end: e.end, code: 'Event', title: e.title, kind: 'Event', host: e.host, expected: e.size + (e.visitors ?? 0), state: 'Ended' })
    visits.push({ personId: e.host, sessionId: id, inMin: st - 45, outMin: en + 30, method: 'Card tap', status: 'On duty' })
    const pool = people().filter((p) => p.role === 'Student' && (e.mix === 'all' || (e.mix === 'fresh' && p.year === 1) || (e.mix === 'final' && (p.year ?? 0) >= 3) || (e.mix === 'eng' && p.faculty === FAC.eng)))
    const guests = visitors(`${iso}-${roomId}`, e.visitors ?? 0)
    ;[...choose(r, pool, e.size), ...guests].forEach((p) => {
      let inMin: number
      let outMin: number
      if (e.stay === 'whole') {
        inMin = r() < 0.9 ? st - between(r, 0, 30) : st + between(r, 5, 30)
        outMin = r() < 0.07 ? between(r, inMin + 25, en - 10) : en + between(r, 0, 12)
      } else {
        const span = en - st - 40
        const x = r()
        inMin = st + Math.floor(span * (x < 0.5 ? x * 0.9 : 0.45 + (x - 0.5) * 1.1)) - 10
        outMin = Math.min(en + 10, inMin + between(r, 35, 170))
      }
      visits.push({ personId: p.id, sessionId: id, inMin, outMin, method: p.role === 'Visitor' ? 'Event ticket' : methodFor(r, roomId, 'Event'), status: 'Checked in' })
    })
  })

  // AV control room: technicians on duty on teaching days and for events in the hall.
  if (roomId === 'sp-ca-av' && !note?.startsWith('No timetable')) {
    const hall = EVENTS.filter((e) => e.room === 'sp-ca' && e.date === iso)
    if ((wd >= 1 && wd <= 5 && !HOLIDAYS[iso] && iso >= '2026-08-31') || hall.length) {
      note = undefined
      const r = rngOf(hash(key))
      const start = hall.length ? Math.min(...hall.map((h) => toMin(h.start))) - 60 : toMin('08:00')
      const end = hall.length ? Math.max(...hall.map((h) => toMin(h.end))) + 45 : toMin('17:00')
      sessions.push({ id: 'DUTY', start: fmtMin(start), end: fmtMin(end), code: 'Duty', title: hall.length ? `AV support: ${hall[0].title}` : 'AV control room shift', kind: 'Duty', host: 'T1', expected: hall.length ? 3 : 2, state: 'Ended' })
      ;(hall.length ? ['T1', 'T2', 'T3'] : ['T1', 'T2']).forEach((pid) => visits.push({ personId: pid, sessionId: 'DUTY', inMin: start + between(r, -5, 10), outMin: end + between(r, -10, 5), method: 'Card tap', status: 'On duty' }))
    }
  }

  sessions.sort((a, b) => toMin(a.start) - toMin(b.start))
  visits.sort((a, b) => a.inMin - b.inMin)
  const rec = { sessions, visits, note }
  fullCache.set(key, rec)
  return rec
}

/** A room's attendance for a date. For today, only check-ins up to `nowMin` are included. */
export function dayRecord(roomId: string, iso: string, nowMin: number): DayRecord {
  const full = buildDay(roomId, iso)
  if (iso !== ATT_TODAY) return full
  return {
    note: full.note,
    sessions: full.sessions.map((s) => ({ ...s, state: toMin(s.start) > nowMin ? 'Upcoming' : toMin(s.end) > nowMin ? 'Live' : 'Ended' })),
    visits: full.visits.filter((v) => v.inMin <= nowMin).map((v) => (v.outMin !== null && v.outMin > nowMin ? { ...v, outMin: null } : v)),
  }
}

/** People in the room right now (today) or at a minute of a past day. */
export function headcountAt(rec: DayRecord, minute: number) {
  return rec.visits.filter((v) => v.inMin <= minute && (v.outMin === null || v.outMin > minute)).length
}

export const liveHeadcount = (roomId: string, nowMin: number) => headcountAt(dayRecord(roomId, ATT_TODAY, nowMin), nowMin)

/** Highest headcount in the day, checked every 5 minutes. */
export function peakOf(rec: DayRecord, upTo = 24 * 60) {
  let best = 0
  let at = 0
  for (let m = 6 * 60; m <= Math.min(upTo, 23 * 60); m += 5) {
    const c = headcountAt(rec, m)
    if (c > best) {
      best = c
      at = m
    }
  }
  return { count: best, at }
}

export const uniquePeople = (rec: DayRecord) => new Set(rec.visits.map((v) => v.personId)).size

/** Capacity bands used for alerts: normal, busy (80% or more), near capacity (90% or more). */
export function capBand(count: number, capacity: number): { pct: number; tone: 'green' | 'amber' | 'red'; label: string } {
  const pct = capacity ? Math.round((count / capacity) * 100) : 0
  if (pct >= 90) return { pct, tone: 'red', label: pct >= 100 ? 'Over capacity' : 'Near capacity' }
  if (pct >= 80) return { pct, tone: 'amber', label: 'Busy' }
  return { pct, tone: 'green', label: count ? 'Normal' : 'Empty' }
}

/** Every visit by one person to one room over the 60 days (today up to now). */
export function personHistory(roomId: string, personId: string, nowMin: number) {
  return attendanceDates()
    .flatMap((iso) => {
      const rec = dayRecord(roomId, iso, nowMin)
      return rec.visits.filter((v) => v.personId === personId).map((v) => ({ iso, visit: v, session: rec.sessions.find((s) => s.id === v.sessionId)! }))
    })
    .reverse()
}

/** How many sessions of the person's classes in this room were held in the 60 days, to show "attended x of y". */
export function sessionsHeldFor(roomId: string, codes: string[], nowMin: number) {
  return attendanceDates().reduce((n, iso) => n + dayRecord(roomId, iso, nowMin).sessions.filter((s) => codes.includes(s.code) && s.state !== 'Upcoming').length, 0)
}
