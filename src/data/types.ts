export type Role = 'student' | 'lecturer' | 'management'

export interface Persona {
  role: Role
  name: string
  short: string
  initials: string
  title: string
  unit: string
  id: string
  email: string
  color: string
}

export type MaterialType = 'slides' | 'pdf' | 'video' | 'quiz' | 'link' | 'lab'

export interface Material {
  id: string
  type: MaterialType
  title: string
  meta: string
  done?: boolean
}

export interface Module {
  id: string
  week: number
  title: string
  items: Material[]
}

export type Mode = 'Hybrid' | 'Online' | 'In person'

export interface ClassSlot {
  day: 1 | 2 | 3 | 4 | 5 // Mon..Fri
  start: string // HH:MM
  end: string
  room: string
  kind: 'Lecture' | 'Tutorial' | 'Lab'
  mode: Mode
}

export interface Course {
  id: string
  code: string
  title: string
  faculty: string
  department: string
  lecturerId: string
  credits: number
  color: string
  enrolled: number
  description: string
  schedule: ClassSlot[]
  modules: Module[]
  progress: number // student progress %
  attendance: number // class average %
  engagement: number // 0-100
  avgGrade: number
}

export type AssignmentStatus = 'Not started' | 'Draft' | 'Submitted' | 'Graded' | 'Overdue'

export interface Assignment {
  id: string
  courseId: string
  title: string
  kind: 'Assignment' | 'Quiz' | 'Lab report' | 'Project'
  due: string // ISO
  weight: number
  status: AssignmentStatus
  score?: number
  feedback?: string
  submitted: number
  graded: number
  brief: string
}

export interface LiveSession {
  id: string
  courseId: string
  title: string
  lectureNo: number
  start: string // HH:MM, demo day
  end: string
  room: string
  mode: Mode
  status: 'live' | 'upcoming' | 'ended'
  attendees: number
}

export interface Recording {
  id: string
  courseId: string
  title: string
  date: string
  duration: string
  views: number
  captions: boolean
}

export interface Announcement {
  id: string
  title: string
  body: string
  from: string
  audience: string
  date: string
  pinned?: boolean
  courseId?: string
}

export interface StudentRow {
  id: string
  name: string
  matric: string
  programme: string
  attendance: number
  quizAvg: number
  assignmentAvg: number
  lastActive: string
  risk: 'Low' | 'Medium' | 'High'
  color: string
}

export interface Lecturer {
  id: string
  name: string
  title: string
  department: string
  courses: number
  rating: number
  color: string
}

export interface Faculty {
  id: string
  name: string
  short: string
  students: number
  lecturers: number
  courses: number
  attendance: number
  completion: number
  liveNow: number
  utilisation: number
  satisfaction: number
}

export interface Room {
  id: string
  name: string
  building: string
  capacity: number
  kind: 'Lecture hall' | 'Smart room' | 'Seminar room' | 'Lab'
  status: 'In session' | 'Available' | 'Issue reported' | 'Offline'
  current?: string
  next?: string
  devices: number
  hybrid: boolean
  occupancy: number
}

export interface Ticket {
  id: string
  room: string
  device: string
  priority: 'High' | 'Medium' | 'Low'
  status: 'Open' | 'Assigned' | 'Scheduled' | 'Resolved'
  reported: string
  assignee: string
}

export interface Notification {
  id: string
  title: string
  body: string
  time: string
  unread: boolean
}
