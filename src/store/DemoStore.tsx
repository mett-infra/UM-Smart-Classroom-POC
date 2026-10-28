import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { announcements as seedAnnouncements, assignments as seedAssignments, roster, rooms as seedRooms, tickets as seedTickets } from '../data/mock'
import type { Announcement, Assignment, Material, Room, Ticket } from '../data/types'
import { seedAudit, seedAutoLog, seedAutoRules, seedDevices, seedDoorExceptions, seedDoorSchedules, seedIncidents, seedPolicies, seedSpaces, type AuditEntry, type AutoOutcome, type AutoRule, type Device, type DoorException, type DoorSchedule, type Incident, type NetPolicy, type Space } from '../data/smartcampus'

/*
  Frontend-only demo store.
  Everything lives in React state and is mirrored to localStorage so a demo survives a page refresh.
  There is no backend and nothing leaves the browser.
*/

export interface ActivityItem {
  id: string
  text: string
  sub: string
  time: string
  kind: 'live' | 'submit' | 'ticket' | 'announce' | 'grade' | 'room' | 'material' | 'network'
}

export interface DeviceState {
  on: boolean
  level: number // lights 0-100
  temp: number // air-con
  speed: number // fan 1-3
  input: string // display
  locked: boolean // door
}

export const defaultDeviceState = (): DeviceState => ({ on: true, level: 100, temp: 23, speed: 2, input: 'HDMI 1', locked: false })

export interface RoomControls {
  display: boolean
  audio: boolean
  lights: boolean
  camera: boolean
  mode: 'Teaching' | 'Presentation' | 'Hybrid' | 'Exam'
}

interface DemoState {
  assignments: Assignment[]
  submissionFiles: Record<string, string[]>
  extraMaterials: Record<string, (Material & { week: number })[]>
  completed: Record<string, boolean>
  announcements: Announcement[]
  tickets: Ticket[]
  rooms: Room[]
  roomControls: Record<string, RoomControls>
  attendance: Record<string, Record<string, 'present' | 'late' | 'absent'>>
  marks: Record<string, Record<string, number>> // assignmentId -> studentId -> mark
  activity: ActivityItem[]
  readNotifications: string[]
  pollsVoted: Record<string, number>
  // Day 1: smart campus management
  incidents: Incident[]
  netPolicies: NetPolicy[]
  netFeed: boolean
  dismissedIncidents: string[]
  spaces: Space[]
  devices: Device[]
  audit: AuditEntry[]
  deviceState: Record<string, DeviceState>
  // Day 2: doors and automation
  doorSchedules: DoorSchedule[]
  doorAssign: Record<string, string>
  doorExceptions: DoorException[]
  doorOverrides: Record<string, DoorOverride>
  fireAlarm: string[]
  autoRules: AutoRule[]
  autoLog: AutoOutcome[]
  // Review 2: door timers set per room in Smart rooms (door id -> times)
  doorTimers: Record<string, DoorTimer>
}

export interface DoorTimer {
  unlock: string // 'HH:MM'
  lock: string
  days: number[] // 1 Mon .. 5 Fri, 6 Sat, 0 Sun
}

export interface DoorOverride {
  locked: boolean
  untilMin: number // minutes since midnight on the demo day
  reason: string
}

// v2: Review 1 changed the room and incident structure, so older saved demo data is ignored.
const KEY = 'um-smart-classroom-poc:v2'

function seedMarks() {
  // Assignment 2 (a1): 61 of 142 submitted; lecturer roster shows first 28 with some marked
  const a1: Record<string, number> = {}
  roster.forEach((s, i) => {
    if (i > 2 && i % 3 === 0) a1[s.id] = Math.round(s.assignmentAvg * 0.95)
  })
  return { a1 }
}

function seedAttendance() {
  const rec: Record<string, 'present' | 'late' | 'absent'> = {}
  roster.forEach((s, i) => {
    rec[s.id] = s.attendance < 65 && i % 2 === 0 ? 'absent' : i % 11 === 5 ? 'late' : 'present'
  })
  return { 's-wia2004-14': rec }
}

const initialState = (): DemoState => ({
  assignments: seedAssignments,
  submissionFiles: { a3: ['aina_lab5_airquality.ipynb'] },
  extraMaterials: {},
  completed: {},
  announcements: seedAnnouncements,
  tickets: seedTickets,
  rooms: seedRooms,
  roomControls: {
    rm1: { display: true, audio: true, lights: true, camera: true, mode: 'Hybrid' },
    rm5: { display: true, audio: true, lights: false, camera: true, mode: 'Teaching' },
  },
  attendance: seedAttendance(),
  marks: seedMarks(),
  activity: [
    { id: 'ac1', text: 'WIA2004 Lecture 14 went live', sub: 'DK2, FSKTM, hybrid, 126 joined', time: '10:00', kind: 'live' },
    { id: 'ac2', text: 'Ticket SC-1042 reported', sub: 'Seminar Room C-12, ceiling microphone', time: '10:14', kind: 'ticket' },
    { id: 'ac3', text: 'Lecture recording published', sub: 'WIA2005 Lecture 13 with captions', time: '09:12', kind: 'material' },
    { id: 'ac4', text: '97 lab reports submitted', sub: 'WIE2003 Lab report 5', time: '08:30', kind: 'submit' },
  ],
  readNotifications: [],
  pollsVoted: {},
  incidents: seedIncidents,
  netPolicies: seedPolicies,
  netFeed: true,
  dismissedIncidents: [],
  spaces: seedSpaces,
  devices: seedDevices,
  audit: seedAudit,
  deviceState: {},
  doorSchedules: seedDoorSchedules,
  doorAssign: {},
  doorExceptions: seedDoorExceptions,
  doorOverrides: {},
  fireAlarm: [],
  autoRules: seedAutoRules,
  autoLog: seedAutoLog,
  // Example from the review: classroom DK1 unlocks at 08:00 and locks at 18:00 on weekdays.
  doorTimers: { 'DR-FS-DK1': { unlock: '08:00', lock: '18:00', days: [1, 2, 3, 4, 5] } },
})

function load(): DemoState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return initialState()
    return { ...initialState(), ...JSON.parse(raw) }
  } catch {
    return initialState()
  }
}

type Toast = { id: number; text: string; tone: 'ok' | 'info' | 'warn' }

interface Ctx {
  state: DemoState
  update: (fn: (s: DemoState) => DemoState) => void
  log: (a: Omit<ActivityItem, 'id' | 'time'>) => void
  audit: (a: Omit<AuditEntry, 'id' | 'time' | 'actor'> & { actor?: string }) => void
  toast: (text: string, tone?: Toast['tone']) => void
  toasts: Toast[]
  reset: () => void
}

const DemoCtx = createContext<Ctx | null>(null)

export function nowLabel() {
  // Demo clock starts at 10:12 and advances with real time so new events look fresh.
  const start = new Date(2026, 9, 21, 10, 12).getTime()
  const elapsed = Date.now() - bootTime
  const d = new Date(start + elapsed)
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

const bootTime = Date.now()

/** Minutes since midnight on the demo clock (starts 10:12, moves with real time). */
export function demoMinutes() {
  return Math.min(23 * 60 + 59, 10 * 60 + 12 + Math.floor((Date.now() - bootTime) / 60000))
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState>(load)
  const [toasts, setToasts] = useState<Toast[]>([])
  const tid = useRef(0)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      /* storage unavailable: demo still works in memory */
    }
  }, [state])

  const update = useCallback((fn: (s: DemoState) => DemoState) => setState(fn), [])

  const toast = useCallback((text: string, tone: Toast['tone'] = 'ok') => {
    const id = ++tid.current
    setToasts((t) => [...t.slice(-2), { id, text, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600)
  }, [])

  const log = useCallback((a: Omit<ActivityItem, 'id' | 'time'>) => {
    setState((s) => ({ ...s, activity: [{ ...a, id: `ac${Date.now()}`, time: nowLabel() }, ...s.activity].slice(0, 30) }))
  }, [])

  const audit = useCallback((a: Omit<AuditEntry, 'id' | 'time' | 'actor'> & { actor?: string }) => {
    setState((s) => ({ ...s, audit: [{ actor: 'Prof. Dr. Lim Mei Ling', ...a, id: `au${Date.now()}${Math.random().toString(36).slice(2, 5)}`, time: nowLabel() }, ...s.audit].slice(0, 200) }))
  }, [])

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(KEY)
    } catch {
      /* ignore */
    }
    setState(initialState())
    toast('Demo data reset to the starting story.', 'info')
  }, [toast])

  const value = useMemo(() => ({ state, update, log, audit, toast, toasts, reset }), [state, update, log, audit, toast, toasts, reset])
  return <DemoCtx.Provider value={value}>{children}</DemoCtx.Provider>
}

export function useDemo() {
  const ctx = useContext(DemoCtx)
  if (!ctx) throw new Error('useDemo must be used inside DemoProvider')
  return ctx
}
