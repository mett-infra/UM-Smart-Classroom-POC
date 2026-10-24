import type {
  Announcement,
  Assignment,
  Course,
  Faculty,
  Lecturer,
  LiveSession,
  Material,
  Module,
  Notification,
  Persona,
  Recording,
  Role,
  Room,
  StudentRow,
  Ticket,
} from './types'

/*
  All data in this file is fictional sample data for a proof of concept.
  Names, IDs and figures do not represent real people or measured performance.
*/

// Fixed demo clock so the story is consistent in every demo.
export const DEMO_NOW = new Date(2026, 9, 21, 10, 12) // Wed 21 Oct 2026, 10:12
export const DEMO_DAY = 3 // Wednesday
export const SEMESTER = 'Semester 1, Session 2026/2027'
export const TEACHING_WEEK = 7

export const personas: Record<Role, Persona> = {
  student: {
    role: 'student',
    name: 'Aina Sofea binti Rahman',
    short: 'Aina',
    initials: 'AS',
    title: 'Bachelor of Computer Science (Software Engineering), Year 2',
    unit: 'Faculty of Computer Science & Information Technology',
    id: '23055871',
    email: 'aina.sofea@siswa.example.edu.my',
    color: '#2f55d4',
  },
  lecturer: {
    role: 'lecturer',
    name: 'Dr. Farid Hakimi bin Zulkifli',
    short: 'Dr. Farid',
    initials: 'FH',
    title: 'Senior Lecturer, Department of Software Engineering',
    unit: 'Faculty of Computer Science & Information Technology',
    id: 'STAF-10482',
    email: 'farid.hakimi@example.edu.my',
    color: '#0e8a7e',
  },
  management: {
    role: 'management',
    name: 'Prof. Dr. Lim Mei Ling',
    short: 'Prof. Lim',
    initials: 'LM',
    title: 'Director, Academic Quality & Digital Learning',
    unit: 'Academic Management Office',
    id: 'STAF-00217',
    email: 'lim.meiling@example.edu.my',
    color: '#6b3fa0',
  },
}

export const lecturers: Lecturer[] = [
  { id: 'L1', name: 'Dr. Farid Hakimi bin Zulkifli', title: 'Senior Lecturer', department: 'Software Engineering', courses: 3, rating: 4.6, color: '#0e8a7e' },
  { id: 'L2', name: 'Dr. Nurul Izzah binti Ahmad', title: 'Senior Lecturer', department: 'Artificial Intelligence', courses: 2, rating: 4.7, color: '#7a4bc2' },
  { id: 'L3', name: 'Dr. Rajesh Kumar a/l Subramaniam', title: 'Associate Professor', department: 'Information Systems', courses: 2, rating: 4.4, color: '#c0601f' },
  { id: 'L4', name: 'Dr. Hafiz Rahim', title: 'Lecturer', department: 'Centre for Co-Curricular Studies', courses: 4, rating: 4.2, color: '#2f7d32' },
  { id: 'L5', name: 'Assoc. Prof. Dr. Tan Wei Jie', title: 'Associate Professor', department: 'Computer System & Technology', courses: 2, rating: 4.5, color: '#b2365f' },
  { id: 'L6', name: 'Dr. Siti Khadijah binti Omar', title: 'Senior Lecturer', department: 'Software Engineering', courses: 3, rating: 4.8, color: '#1f6fb2' },
]

export const lecturerName = (id: string) => lecturers.find((l) => l.id === id)?.name ?? 'Lecturer'

// ---------- Modules ----------
let mid = 0
function buildModules(topics: string[], doneUntil: number): Module[] {
  return topics.map((topic, i) => {
    const week = i + 1
    const items: Material[] = [
      { id: `m${++mid}`, type: 'slides', title: `Lecture ${week}: ${topic}`, meta: `${18 + ((i * 7) % 14)} slides`, done: week < doneUntil },
      { id: `m${++mid}`, type: 'video', title: `Recording: ${topic}`, meta: `${38 + ((i * 11) % 20)} min, captions EN/BM`, done: week < doneUntil },
      { id: `m${++mid}`, type: i % 2 === 0 ? 'quiz' : 'pdf', title: i % 2 === 0 ? `Quick check: ${topic}` : `Reading: ${topic} notes`, meta: i % 2 === 0 ? '10 questions, 15 min' : `PDF, ${(1.2 + i * 0.3).toFixed(1)} MB`, done: week < doneUntil - 1 },
    ]
    if (i % 3 === 1) items.push({ id: `m${++mid}`, type: 'lab', title: `Lab sheet ${Math.ceil(week / 3)}`, meta: 'Hands-on exercise', done: week < doneUntil - 1 })
    return { id: `mod${mid}`, week, title: topic, items }
  })
}

export const courses: Course[] = [
  {
    id: 'wia2004',
    code: 'WIA2004',
    title: 'Operating Systems',
    faculty: 'Faculty of Computer Science & Information Technology',
    department: 'Software Engineering',
    lecturerId: 'L1',
    credits: 4,
    color: '#2f55d4',
    enrolled: 142,
    description: 'Process management, concurrency, scheduling, deadlocks, memory and storage management in modern operating systems.',
    schedule: [
      { day: 1, start: '10:00', end: '11:00', room: 'DK2, FSKTM', kind: 'Lecture', mode: 'Hybrid' },
      { day: 3, start: '10:00', end: '11:00', room: 'DK2, FSKTM', kind: 'Lecture', mode: 'Hybrid' },
      { day: 4, start: '14:00', end: '16:00', room: 'Makmal 2, FSKTM', kind: 'Lab', mode: 'In person' },
    ],
    modules: buildModules(['Introduction to operating systems', 'Processes', 'Threads and concurrency', 'CPU scheduling', 'Synchronisation tools', 'Classic synchronisation problems', 'Deadlocks', 'Main memory', 'Virtual memory'], 7),
    progress: 68,
    attendance: 88,
    engagement: 81,
    avgGrade: 71,
  },
  {
    id: 'wia2005',
    code: 'WIA2005',
    title: 'Algorithm Design and Analysis',
    faculty: 'Faculty of Computer Science & Information Technology',
    department: 'Artificial Intelligence',
    lecturerId: 'L2',
    credits: 4,
    color: '#7a4bc2',
    enrolled: 156,
    description: 'Asymptotic analysis, divide and conquer, greedy methods, dynamic programming and graph algorithms.',
    schedule: [
      { day: 1, start: '08:00', end: '09:00', room: 'DK1, FSKTM', kind: 'Lecture', mode: 'In person' },
      { day: 3, start: '08:00', end: '09:00', room: 'DK1, FSKTM', kind: 'Lecture', mode: 'In person' },
      { day: 5, start: '09:00', end: '10:00', room: 'BK3, FSKTM', kind: 'Tutorial', mode: 'In person' },
    ],
    modules: buildModules(['Analysing algorithms', 'Divide and conquer', 'Sorting in linear time', 'Greedy algorithms', 'Dynamic programming I', 'Dynamic programming II', 'Graph search', 'Shortest paths'], 7),
    progress: 74,
    attendance: 91,
    engagement: 77,
    avgGrade: 68,
  },
  {
    id: 'wie2003',
    code: 'WIE2003',
    title: 'Introduction to Data Science',
    faculty: 'Faculty of Computer Science & Information Technology',
    department: 'Information Systems',
    lecturerId: 'L3',
    credits: 3,
    color: '#c0601f',
    enrolled: 118,
    description: 'Data wrangling, exploratory analysis, visualisation and an introduction to machine learning with Python.',
    schedule: [
      { day: 2, start: '11:00', end: '12:00', room: 'DK3, FSKTM', kind: 'Lecture', mode: 'Hybrid' },
      { day: 3, start: '14:00', end: '16:00', room: 'Makmal 3, FSKTM', kind: 'Lab', mode: 'In person' },
    ],
    modules: buildModules(['What is data science', 'Python for data', 'Data wrangling with pandas', 'Exploratory data analysis', 'Visualisation', 'Statistics refresher', 'Regression', 'Classification'], 6),
    progress: 59,
    attendance: 84,
    engagement: 86,
    avgGrade: 74,
  },
  {
    id: 'wix2002',
    code: 'WIX2002',
    title: 'Project Management',
    faculty: 'Faculty of Computer Science & Information Technology',
    department: 'Software Engineering',
    lecturerId: 'L1',
    credits: 3,
    color: '#0e8a7e',
    enrolled: 96,
    description: 'Planning, estimating, scheduling and controlling software projects, with agile and traditional approaches.',
    schedule: [
      { day: 2, start: '09:00', end: '10:00', room: 'Online', kind: 'Lecture', mode: 'Online' },
      { day: 3, start: '16:00', end: '17:00', room: 'Online', kind: 'Tutorial', mode: 'Online' },
    ],
    modules: buildModules(['Project management fundamentals', 'Project initiation', 'Scope and WBS', 'Estimation', 'Scheduling', 'Risk management', 'Agile delivery'], 6),
    progress: 63,
    attendance: 79,
    engagement: 72,
    avgGrade: 70,
  },
  {
    id: 'gig1012',
    code: 'GIG1012',
    title: 'Philosophy and Current Issues',
    faculty: 'Centre for Co-Curricular Studies',
    department: 'University courses',
    lecturerId: 'L4',
    credits: 2,
    color: '#2f7d32',
    enrolled: 310,
    description: 'Philosophical thinking applied to current national and global issues, delivered in a blended format.',
    schedule: [{ day: 4, start: '20:00', end: '21:00', room: 'Online', kind: 'Lecture', mode: 'Online' }],
    modules: buildModules(['Introduction to philosophy', 'Philosophy and knowledge', 'Ethics in society', 'National philosophy', 'Current issues I', 'Current issues II'], 6),
    progress: 81,
    attendance: 93,
    engagement: 69,
    avgGrade: 77,
  },
  {
    id: 'wia3003',
    code: 'WIA3003',
    title: 'Cloud Computing',
    faculty: 'Faculty of Computer Science & Information Technology',
    department: 'Software Engineering',
    lecturerId: 'L1',
    credits: 3,
    color: '#1f6fb2',
    enrolled: 88,
    description: 'Cloud service models, virtualisation, containers, serverless and designing for scale and resilience.',
    schedule: [
      { day: 1, start: '15:00', end: '16:00', room: 'BK2, FSKTM', kind: 'Tutorial', mode: 'In person' },
      { day: 3, start: '12:00', end: '13:00', room: 'DK3, FSKTM', kind: 'Lecture', mode: 'Hybrid' },
    ],
    modules: buildModules(['Cloud fundamentals', 'Virtualisation', 'Containers', 'Orchestration', 'Serverless', 'Cloud storage', 'Cloud security'], 7),
    progress: 0,
    attendance: 86,
    engagement: 83,
    avgGrade: 73,
  },
]

export const studentCourseIds = ['wia2004', 'wia2005', 'wie2003', 'wix2002', 'gig1012']
export const lecturerCourseIds = ['wia2004', 'wix2002', 'wia3003']
export const courseById = (id: string) => courses.find((c) => c.id === id)

// ---------- Live sessions today ----------
export const sessions: LiveSession[] = [
  { id: 's-wia2005-13', courseId: 'wia2005', title: 'Dynamic programming II', lectureNo: 13, start: '08:00', end: '09:00', room: 'DK1, FSKTM', mode: 'In person', status: 'ended', attendees: 141 },
  { id: 's-wia2004-14', courseId: 'wia2004', title: 'Deadlocks: detection and avoidance', lectureNo: 14, start: '10:00', end: '11:00', room: 'DK2, FSKTM', mode: 'Hybrid', status: 'live', attendees: 126 },
  { id: 's-wia3003-12', courseId: 'wia3003', title: 'Containers in production', lectureNo: 12, start: '12:00', end: '13:00', room: 'DK3, FSKTM', mode: 'Hybrid', status: 'upcoming', attendees: 0 },
  { id: 's-wie2003-l6', courseId: 'wie2003', title: 'Lab 6: Regression with scikit-learn', lectureNo: 6, start: '14:00', end: '16:00', room: 'Makmal 3, FSKTM', mode: 'In person', status: 'upcoming', attendees: 0 },
  { id: 's-wix2002-t6', courseId: 'wix2002', title: 'Tutorial 6: Risk registers', lectureNo: 6, start: '16:00', end: '17:00', room: 'Online', mode: 'Online', status: 'upcoming', attendees: 0 },
]

export const liveSessionId = 's-wia2004-14'

export const recordings: Recording[] = [
  { id: 'r1', courseId: 'wia2004', title: 'Lecture 13: Deadlock characterisation', date: '2026-10-19', duration: '52 min', views: 118, captions: true },
  { id: 'r2', courseId: 'wia2004', title: 'Lecture 12: Classic synchronisation problems', date: '2026-10-14', duration: '57 min', views: 131, captions: true },
  { id: 'r3', courseId: 'wia2005', title: 'Lecture 12: Dynamic programming I', date: '2026-10-19', duration: '49 min', views: 102, captions: true },
  { id: 'r4', courseId: 'wie2003', title: 'Lecture 6: Statistics refresher', date: '2026-10-20', duration: '44 min', views: 87, captions: false },
  { id: 'r5', courseId: 'wix2002', title: 'Lecture 6: Risk management', date: '2026-10-20', duration: '55 min', views: 64, captions: true },
  { id: 'r6', courseId: 'wia2004', title: 'Lecture 11: Synchronisation tools', date: '2026-10-12', duration: '54 min', views: 136, captions: true },
]

// ---------- Assignments ----------
export const assignments: Assignment[] = [
  { id: 'a1', courseId: 'wia2004', title: 'Assignment 2: Banker’s algorithm simulator', kind: 'Assignment', due: '2026-10-24T23:59', weight: 15, status: 'Draft', submitted: 61, graded: 0, brief: 'Implement the Banker’s algorithm in C or Python. Your program should read the allocation, max and available matrices, report whether the system is in a safe state and print a safe sequence.' },
  { id: 'a2', courseId: 'wia2005', title: 'Problem set 4: Dynamic programming', kind: 'Assignment', due: '2026-10-23T17:00', weight: 10, status: 'Not started', submitted: 48, graded: 0, brief: 'Solve five dynamic programming problems. For each problem, give the recurrence, the table you fill and its time complexity.' },
  { id: 'a3', courseId: 'wie2003', title: 'Lab report 5: Exploratory analysis of KL air quality data', kind: 'Lab report', due: '2026-10-22T23:59', weight: 5, status: 'Submitted', submitted: 97, graded: 12, brief: 'Explore the sample air quality dataset. Submit a notebook with at least four visualisations and a short written interpretation.' },
  { id: 'a4', courseId: 'wix2002', title: 'Group project: Project charter', kind: 'Project', due: '2026-10-30T23:59', weight: 20, status: 'Not started', submitted: 9, graded: 0, brief: 'With your group, write a project charter for your chosen campus improvement project: objectives, scope, stakeholders, milestones and risks.' },
  { id: 'a5', courseId: 'wia2004', title: 'Quiz 3: CPU scheduling', kind: 'Quiz', due: '2026-10-10T23:59', weight: 5, status: 'Graded', score: 86, feedback: 'Strong answers on round robin. Review the SJF preemption example.', submitted: 139, graded: 139, brief: 'Online quiz, 20 minutes.' },
  { id: 'a6', courseId: 'wia2005', title: 'Problem set 3: Greedy algorithms', kind: 'Assignment', due: '2026-10-09T17:00', weight: 10, status: 'Graded', score: 78, feedback: 'Correct proofs for Q1 and Q3. Q4 exchange argument is incomplete.', submitted: 151, graded: 151, brief: 'Four greedy algorithm problems with proofs of correctness.' },
  { id: 'a7', courseId: 'gig1012', title: 'Reflection essay 2', kind: 'Assignment', due: '2026-10-16T23:59', weight: 15, status: 'Graded', score: 81, feedback: 'Clear argument and good use of local examples.', submitted: 298, graded: 298, brief: '1,000-word reflection on a current issue.' },
  { id: 'a8', courseId: 'wie2003', title: 'Quiz 2: pandas basics', kind: 'Quiz', due: '2026-10-06T23:59', weight: 5, status: 'Graded', score: 92, feedback: 'Excellent.', submitted: 116, graded: 116, brief: 'Online quiz, 15 minutes.' },
  { id: 'a9', courseId: 'wia3003', title: 'Lab 4: Deploy a container to a managed service', kind: 'Lab report', due: '2026-10-25T23:59', weight: 10, status: 'Not started', submitted: 31, graded: 0, brief: 'Containerise the sample app and deploy it. Submit the URL and a short report.' },
  { id: 'a10', courseId: 'wix2002', title: 'Quiz 2: Estimation techniques', kind: 'Quiz', due: '2026-10-13T23:59', weight: 5, status: 'Graded', score: 74, feedback: 'Review three-point estimation.', submitted: 92, graded: 92, brief: 'Online quiz, 20 minutes.' },
]

// ---------- Announcements ----------
export const announcements: Announcement[] = [
  { id: 'an1', title: 'Mid-semester break: 26 Oct to 1 Nov', body: 'There will be no classes during the mid-semester break. Online resources and the library remain available.', from: 'Academic Management Office', audience: 'All students and staff', date: '2026-10-20', pinned: true },
  { id: 'an2', title: 'Lab 6 moved to Makmal 3', body: 'This week’s WIE2003 lab will be held in Makmal 3 because of maintenance in Makmal 1.', from: 'Dr. Rajesh Kumar a/l Subramaniam', audience: 'WIE2003 students', date: '2026-10-20', courseId: 'wie2003' },
  { id: 'an3', title: 'Assignment 2 clarification', body: 'You may use either C or Python. Please include a README explaining how to run your simulator.', from: 'Dr. Farid Hakimi bin Zulkifli', audience: 'WIA2004 students', date: '2026-10-19', courseId: 'wia2004' },
  { id: 'an4', title: 'Student feedback survey is open', body: 'Tell us about your teaching and learning experience this semester. The survey closes on 7 November.', from: 'Academic Management Office', audience: 'All students', date: '2026-10-17' },
]

// ---------- Class roster ----------
const firstNames = [
  'Aina Sofea binti Rahman', 'Muhammad Haziq bin Azman', 'Tan Jia Hui', 'Priya a/p Ramasamy', 'Nur Aisyah binti Kamal', 'Lee Wen Hao', 'Arjun a/l Krishnan', 'Siti Nurhaliza binti Yusof', 'Wong Kai Xuan', 'Amirul Hakim bin Ismail', 'Chong Mei Yee', 'Deepa a/p Muthu', 'Ahmad Danial bin Roslan', 'Lim Zi Xuan', 'Nurul Iman binti Hassan', 'Vikram a/l Selvam', 'Ooi Shu Ting', 'Hafiz Syahmi bin Ahmad', 'Teoh Jun Wei', 'Farah Nadia binti Othman', 'Kavitha a/p Ganesan', 'Ng Yong Sheng', 'Irfan Hakimi bin Salleh', 'Yap Hui Min', 'Puteri Balqis binti Zainal', 'Ravi a/l Suppiah', 'Goh Xin Yi', 'Khairul Anwar bin Mohd Noor',
]
const palette = ['#2f55d4', '#0e8a7e', '#7a4bc2', '#c0601f', '#b2365f', '#2f7d32', '#1f6fb2', '#8a5a00']

export const roster: StudentRow[] = firstNames.map((name, i) => {
  const seed = (i * 37 + 11) % 100
  const attendance = i === 0 ? 92 : Math.max(48, Math.min(100, 70 + ((seed * 7) % 31) - (i % 9 === 4 ? 26 : 0)))
  const quizAvg = i === 0 ? 86 : Math.max(38, Math.min(98, 58 + ((seed * 3) % 40) - (i % 9 === 4 ? 18 : 0)))
  const assignmentAvg = i === 0 ? 80 : Math.max(40, Math.min(97, 60 + ((seed * 5) % 36) - (i % 7 === 3 ? 20 : 0)))
  const score = attendance * 0.4 + quizAvg * 0.3 + assignmentAvg * 0.3
  const risk = score < 64 ? 'High' : score < 74 ? 'Medium' : 'Low'
  return {
    id: `st${i + 1}`,
    name,
    matric: `2305${(5871 + i * 13).toString().padStart(4, '0')}`,
    programme: i % 4 === 3 ? 'BCS (Artificial Intelligence)' : 'BCS (Software Engineering)',
    attendance,
    quizAvg,
    assignmentAvg,
    lastActive: ['Today', 'Today', 'Yesterday', '2 days ago', 'Today', '5 days ago'][i % 6],
    risk,
    color: palette[i % palette.length],
  }
})

// ---------- Faculties (management) ----------
export const faculties: Faculty[] = [
  { id: 'f1', name: 'Faculty of Computer Science & Information Technology', short: 'Computer Science & IT', students: 2840, lecturers: 132, courses: 214, attendance: 88, completion: 71, liveNow: 9, utilisation: 84, satisfaction: 4.4 },
  { id: 'f2', name: 'Faculty of Engineering', short: 'Engineering', students: 4120, lecturers: 236, courses: 388, attendance: 85, completion: 68, liveNow: 14, utilisation: 81, satisfaction: 4.2 },
  { id: 'f3', name: 'Faculty of Business and Economics', short: 'Business & Economics', students: 3560, lecturers: 168, courses: 262, attendance: 82, completion: 74, liveNow: 11, utilisation: 86, satisfaction: 4.3 },
  { id: 'f4', name: 'Faculty of Medicine', short: 'Medicine', students: 2980, lecturers: 410, courses: 176, attendance: 94, completion: 79, liveNow: 7, utilisation: 77, satisfaction: 4.5 },
  { id: 'f5', name: 'Faculty of Science', short: 'Science', students: 3310, lecturers: 254, courses: 341, attendance: 83, completion: 66, liveNow: 12, utilisation: 72, satisfaction: 4.1 },
  { id: 'f6', name: 'Faculty of Arts and Social Sciences', short: 'Arts & Social Sciences', students: 3870, lecturers: 221, courses: 402, attendance: 79, completion: 63, liveNow: 10, utilisation: 65, satisfaction: 4.0 },
  { id: 'f7', name: 'Faculty of Law', short: 'Law', students: 1240, lecturers: 74, courses: 96, attendance: 90, completion: 76, liveNow: 3, utilisation: 69, satisfaction: 4.3 },
  { id: 'f8', name: 'Faculty of Education', short: 'Education', students: 2150, lecturers: 118, courses: 188, attendance: 87, completion: 72, liveNow: 6, utilisation: 70, satisfaction: 4.4 },
]

export const weeklyTrend = [
  { week: 'W1', attendance: 93, engagement: 71, live: 412, recordings: 380 },
  { week: 'W2', attendance: 91, engagement: 74, live: 436, recordings: 401 },
  { week: 'W3', attendance: 89, engagement: 76, live: 441, recordings: 415 },
  { week: 'W4', attendance: 88, engagement: 75, live: 452, recordings: 429 },
  { week: 'W5', attendance: 86, engagement: 78, live: 447, recordings: 436 },
  { week: 'W6', attendance: 86, engagement: 79, live: 463, recordings: 450 },
  { week: 'W7', attendance: 85, engagement: 81, live: 471, recordings: 458 },
]

export const hourlyLoad = [
  { hour: '08', sessions: 46, users: 5200 },
  { hour: '09', sessions: 61, users: 7400 },
  { hour: '10', sessions: 72, users: 9100 },
  { hour: '11', sessions: 68, users: 8600 },
  { hour: '12', sessions: 39, users: 4300 },
  { hour: '13', sessions: 22, users: 2800 },
  { hour: '14', sessions: 64, users: 7900 },
  { hour: '15', sessions: 58, users: 7100 },
  { hour: '16', sessions: 44, users: 5200 },
  { hour: '17', sessions: 21, users: 2400 },
  { hour: '20', sessions: 18, users: 3900 },
]

// ---------- Rooms & devices (from the first prototype, extended) ----------
export const rooms: Room[] = [
  { id: 'rm1', name: 'DK2', building: 'FSKTM', capacity: 160, kind: 'Lecture hall', status: 'In session', current: 'WIA2004 Operating Systems', next: '12:00 WIA2101', devices: 9, hybrid: true, occupancy: 74 },
  { id: 'rm2', name: 'DK1', building: 'FSKTM', capacity: 180, kind: 'Lecture hall', status: 'Available', next: '11:00 WIA1002', devices: 9, hybrid: true, occupancy: 0 },
  { id: 'rm3', name: 'Makmal 3', building: 'FSKTM', capacity: 60, kind: 'Lab', status: 'Available', next: '14:00 WIE2003 Lab', devices: 64, hybrid: false, occupancy: 0 },
  { id: 'rm4', name: 'Makmal 1', building: 'FSKTM', capacity: 60, kind: 'Lab', status: 'Offline', next: 'Maintenance until Fri', devices: 64, hybrid: false, occupancy: 0 },
  { id: 'rm5', name: 'Smart Room B-204', building: 'Faculty of Business and Economics', capacity: 48, kind: 'Smart room', status: 'In session', current: 'Digital Marketing Analytics', next: '14:00', devices: 7, hybrid: true, occupancy: 88 },
  { id: 'rm6', name: 'Seminar Room C-12', building: 'Faculty of Engineering', capacity: 40, kind: 'Seminar room', status: 'Issue reported', current: 'Thermodynamics tutorial', next: '13:00', devices: 6, hybrid: true, occupancy: 62 },
  { id: 'rm7', name: 'Lecture Theatre D', building: 'Faculty of Science', capacity: 220, kind: 'Lecture hall', status: 'Available', next: '13:00 Organic Chemistry', devices: 11, hybrid: true, occupancy: 0 },
  { id: 'rm8', name: 'Bilik Tutorial 3', building: 'Faculty of Arts and Social Sciences', capacity: 35, kind: 'Seminar room', status: 'In session', current: 'Malaysian Studies tutorial', next: '12:00', devices: 4, hybrid: false, occupancy: 91 },
  { id: 'rm9', name: 'Smart Room L-1', building: 'Faculty of Law', capacity: 50, kind: 'Smart room', status: 'In session', current: 'Moot court practice', next: '15:00', devices: 8, hybrid: true, occupancy: 70 },
  { id: 'rm10', name: 'Dewan Kuliah Perubatan 2', building: 'Faculty of Medicine', capacity: 250, kind: 'Lecture hall', status: 'In session', current: 'Clinical Pharmacology', next: '14:00', devices: 12, hybrid: true, occupancy: 83 },
]

export const tickets: Ticket[] = [
  { id: 'SC-1042', room: 'Seminar Room C-12', device: 'Ceiling microphone not picking up audio', priority: 'High', status: 'Open', reported: '10:14 today', assignee: 'Unassigned' },
  { id: 'SC-1041', room: 'DK1, FSKTM', device: 'Wireless display adapter drops connection', priority: 'Medium', status: 'Assigned', reported: '09:02 today', assignee: 'Azlan (ICT)' },
  { id: 'SC-1038', room: 'Smart Room B-204', device: 'Room controller loses network', priority: 'Medium', status: 'Open', reported: 'Yesterday', assignee: 'Unassigned' },
  { id: 'SC-1035', room: 'Lecture Theatre D', device: 'Display firmware update', priority: 'Low', status: 'Scheduled', reported: '19 Oct', assignee: 'Mei Fong (ICT)' },
  { id: 'SC-1031', room: 'Makmal 1, FSKTM', device: '12 workstations need reimaging', priority: 'High', status: 'Assigned', reported: '18 Oct', assignee: 'Kumar (ICT)' },
  { id: 'SC-1027', room: 'Dewan Kuliah Perubatan 2', device: 'Tracking camera preset drift', priority: 'Low', status: 'Resolved', reported: '16 Oct', assignee: 'Azlan (ICT)' },
]

// ---------- Notifications ----------
export const notificationsByRole: Record<Role, Notification[]> = {
  student: [
    { id: 'n1', title: 'WIA2004 is live now', body: 'Dr. Farid started Lecture 14: Deadlocks.', time: '10:00', unread: true },
    { id: 'n2', title: 'Lab report 5 received', body: 'Your WIE2003 submission was received at 21:47.', time: 'Yesterday', unread: true },
    { id: 'n3', title: 'Quiz 3 graded', body: 'You scored 86% in WIA2004 Quiz 3.', time: '11 Oct', unread: false },
  ],
  lecturer: [
    { id: 'n4', title: '61 submissions for Assignment 2', body: 'WIA2004, due Saturday 23:59.', time: '09:40', unread: true },
    { id: 'n5', title: '4 students flagged at risk', body: 'Attendance below 70% in WIA2004.', time: 'Yesterday', unread: true },
    { id: 'n6', title: 'Room DK2 ready', body: 'Display, microphones and camera checked.', time: '09:50', unread: false },
  ],
  management: [
    { id: 'n7', title: 'High priority ticket SC-1042', body: 'Seminar Room C-12 microphone issue.', time: '10:14', unread: true },
    { id: 'n8', title: 'Weekly report ready', body: 'Teaching week 6 summary is available.', time: 'Mon', unread: true },
    { id: 'n9', title: 'Arts & Social Sciences attendance dipped', body: 'Down 3 points compared with last week.', time: 'Mon', unread: false },
  ],
}

// ---------- Live class script ----------
export const liveChatScript = [
  { from: 'Tan Jia Hui', text: 'Is the safe state check the same as in the slides from Monday?' },
  { from: 'Muhammad Haziq bin Azman', text: 'Can you go back one slide please?' },
  { from: 'Priya a/p Ramasamy', text: 'So circular wait alone is not enough for a deadlock?' },
  { from: 'Lee Wen Hao', text: 'Joining from home today, audio is clear 👍' },
  { from: 'Nur Aisyah binti Kamal', text: 'Will this be in the mid-term?' },
  { from: 'Wong Kai Xuan', text: 'The resource allocation graph example makes sense now' },
  { from: 'Arjun a/l Krishnan', text: 'What happens if a process requests more than its max?' },
]

export const captionScript = [
  { en: 'A deadlock happens when every process in a set is waiting for an event that only another process in the set can cause.', bm: 'Kebuntuan berlaku apabila setiap proses dalam satu set menunggu peristiwa yang hanya boleh dicetuskan oleh proses lain dalam set itu.' },
  { en: 'Four conditions must hold at the same time: mutual exclusion, hold and wait, no preemption, and circular wait.', bm: 'Empat syarat mesti berlaku serentak: saling eksklusif, pegang dan tunggu, tiada pendahuluan, dan tunggu bulat.' },
  { en: 'Avoidance means we only grant a request if the system stays in a safe state afterwards.', bm: 'Pengelakan bermaksud kita hanya meluluskan permintaan jika sistem kekal dalam keadaan selamat selepas itu.' },
  { en: 'The Banker’s algorithm checks whether there is at least one safe sequence for all processes.', bm: 'Algoritma Banker menyemak sama ada wujud sekurang-kurangnya satu jujukan selamat untuk semua proses.' },
  { en: 'Detection lets deadlocks happen, then finds them using a wait-for graph and recovers.', bm: 'Pengesanan membenarkan kebuntuan berlaku, kemudian mengesannya menggunakan graf tunggu dan memulihkannya.' },
]

export const transcript = [
  { t: '00:00', text: 'Good morning everyone, and welcome to those joining online. Today we continue with deadlocks.' },
  { t: '03:20', text: 'A deadlock happens when every process in a set is waiting for an event that only another process in the set can cause.' },
  { t: '07:45', text: 'Four conditions must hold at the same time: mutual exclusion, hold and wait, no preemption, and circular wait.' },
  { t: '14:10', text: 'We can prevent deadlocks by making sure at least one of these conditions can never hold.' },
  { t: '21:30', text: 'Avoidance is different. We only grant a request if the system stays in a safe state afterwards.' },
  { t: '28:05', text: 'The Banker’s algorithm checks whether there is at least one safe sequence for all processes.' },
  { t: '39:40', text: 'Detection lets deadlocks happen, then finds them using a wait-for graph, and recovers by terminating or preempting processes.' },
  { t: '48:15', text: 'For Assignment 2 you will implement the safety algorithm and test it on the three scenarios provided.' },
]

export const initialsOf = (name: string) =>
  name
    .replace(/(Assoc\.|Prof\.|Dr\.|Ts\.)\s*/g, '')
    .replace(/(^|\s)(bin|binti|a\/l|a\/p)(?=\s|$)/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

export const colorFor = (name: string) => {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 997
  return palette[h % palette.length]
}

export const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const weekDates = ['19 Oct', '20 Oct', '21 Oct', '22 Oct', '23 Oct'] // Mon..Fri
