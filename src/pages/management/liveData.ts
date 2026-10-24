import type { Mode } from '../../data/types'

/* Sample campus-wide sessions running "now" (10:12, Wed 21 Oct 2026). Fictional data. */
export interface CampusSession {
  id: string
  code: string
  title: string
  faculty: string
  lecturer: string
  room: string
  mode: Mode
  started: string
  attendees: number
  enrolled: number
  health: 'Good' | 'Degraded'
  recording: boolean
  link?: string
}

export const campusSessions: CampusSession[] = [
  { id: 'cs1', code: 'WIA2004', title: 'Operating Systems, Lecture 14: Deadlocks', faculty: 'Computer Science & IT', lecturer: 'Dr. Farid Hakimi bin Zulkifli', room: 'DK2, FSKTM', mode: 'Hybrid', started: '10:00', attendees: 126, enrolled: 142, health: 'Good', recording: true, link: '/lecturer/live/s-wia2004-14' },
  { id: 'cs2', code: 'KIX1001', title: 'Engineering Mathematics I', faculty: 'Engineering', lecturer: 'Dr. Mohd Shahrul bin Ismail', room: 'Dewan Kuliah 1, Engineering', mode: 'Hybrid', started: '10:00', attendees: 188, enrolled: 214, health: 'Good', recording: true },
  { id: 'cs3', code: 'KIM2003', title: 'Thermodynamics tutorial', faculty: 'Engineering', lecturer: 'Ir. Dr. Wong Chee Keong', room: 'Seminar Room C-12', mode: 'Hybrid', started: '10:00', attendees: 25, enrolled: 40, health: 'Degraded', recording: true },
  { id: 'cs4', code: 'CEB2012', title: 'Digital Marketing Analytics', faculty: 'Business & Economics', lecturer: 'Dr. Aishah binti Mokhtar', room: 'Smart Room B-204', mode: 'Hybrid', started: '10:00', attendees: 42, enrolled: 48, health: 'Good', recording: true },
  { id: 'cs5', code: 'CIA1003', title: 'Principles of Accounting', faculty: 'Business & Economics', lecturer: 'Assoc. Prof. Dr. Ng Siew Lan', room: 'Online', mode: 'Online', started: '09:30', attendees: 231, enrolled: 260, health: 'Good', recording: true },
  { id: 'cs6', code: 'MBBS-Y3', title: 'Clinical Pharmacology', faculty: 'Medicine', lecturer: 'Prof. Dr. Ramesh a/l Pillai', room: 'Dewan Kuliah Perubatan 2', mode: 'Hybrid', started: '10:00', attendees: 207, enrolled: 248, health: 'Good', recording: true },
  { id: 'cs7', code: 'SIX1004', title: 'Statistics for Scientists', faculty: 'Science', lecturer: 'Dr. Lee Siew Mun', room: 'Online', mode: 'Online', started: '10:00', attendees: 164, enrolled: 190, health: 'Good', recording: false },
  { id: 'cs8', code: 'SIK2002', title: 'Organic Chemistry lab briefing', faculty: 'Science', lecturer: 'Dr. Nor Azura binti Hamid', room: 'Makmal Kimia 4', mode: 'In person', started: '10:00', attendees: 36, enrolled: 40, health: 'Good', recording: false },
  { id: 'cs9', code: 'AIA1005', title: 'Malaysian Studies tutorial', faculty: 'Arts & Social Sciences', lecturer: 'Dr. Zulkarnain bin Abdullah', room: 'Bilik Tutorial 3', mode: 'In person', started: '10:00', attendees: 32, enrolled: 35, health: 'Good', recording: false },
  { id: 'cs10', code: 'AKA2003', title: 'Introduction to Linguistics', faculty: 'Arts & Social Sciences', lecturer: 'Dr. Kamala a/p Devi', room: 'Online', mode: 'Online', started: '10:00', attendees: 98, enrolled: 132, health: 'Degraded', recording: true },
  { id: 'cs11', code: 'LIX2005', title: 'Moot court practice', faculty: 'Law', lecturer: 'Dr. Hanim binti Kamaruddin', room: 'Smart Room L-1', mode: 'Hybrid', started: '10:00', attendees: 35, enrolled: 50, health: 'Good', recording: true },
  { id: 'cs12', code: 'PXGM6101', title: 'Curriculum Design in Higher Education', faculty: 'Education', lecturer: 'Prof. Dr. Chua Yan Ping', room: 'Online', mode: 'Online', started: '10:00', attendees: 44, enrolled: 52, health: 'Good', recording: true },
  { id: 'cs13', code: 'WIX1003', title: 'Computer Systems and Organisation', faculty: 'Computer Science & IT', lecturer: 'Assoc. Prof. Dr. Tan Wei Jie', room: 'DK3, FSKTM', mode: 'Hybrid', started: '10:00', attendees: 151, enrolled: 170, health: 'Good', recording: true },
  { id: 'cs14', code: 'KXEX2244', title: 'Control Systems', faculty: 'Engineering', lecturer: 'Dr. Ahmad Faizal bin Yusof', room: 'Online', mode: 'Online', started: '09:30', attendees: 76, enrolled: 92, health: 'Good', recording: true },
]
