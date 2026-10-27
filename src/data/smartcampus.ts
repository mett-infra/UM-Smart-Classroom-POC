/*
  Smart campus sample data (Day 1: campus setup, device registry, network incidents, audit).
  Everything here is fictional sample data for the proof of concept. In production these records
  come from the university's timetable, student information system, network telemetry and IoT gateway.
*/

// ---------------- Campus hierarchy ----------------
export type SpaceType = 'Lecture hall' | 'Auditorium' | 'Smart room' | 'Seminar room' | 'Lab'
export type SpaceState = 'Operational' | 'Setup incomplete' | 'Under maintenance' | 'Deactivated'

export interface Building {
  id: string
  name: string
  short: string
  floors: string[]
}

export interface Space {
  id: string
  code: string
  name: string
  buildingId: string
  floor: string
  type: SpaceType
  capacity: number
  state: SpaceState
  occupancySource: string | null
  camera: string | null
  doorId: string | null
  timetable: boolean
  voice: boolean
}

export const CAMPUS = 'UM main campus, Kuala Lumpur'

export const buildings: Building[] = [
  { id: 'b-fsktm', name: 'Faculty of Computer Science & IT', short: 'FSKTM', floors: ['Ground floor', 'Level 1', 'Level 2'] },
  { id: 'b-enga', name: 'Engineering Block A', short: 'Eng A', floors: ['Level 1', 'Level 2'] },
  { id: 'b-engb', name: 'Engineering Block B', short: 'Eng B', floors: ['Ground floor', 'Level 1'] },
  { id: 'b-fbe', name: 'Faculty of Business and Economics', short: 'FBE', floors: ['Level 2'] },
  { id: 'b-ca', name: 'Central Auditorium', short: 'Auditorium', floors: ['Ground floor'] },
]

export const seedSpaces: Space[] = [
  { id: 'sp-dk1', code: 'FSKTM-DK1', name: 'DK1', buildingId: 'b-fsktm', floor: 'Ground floor', type: 'Lecture hall', capacity: 180, state: 'Operational', occupancySource: 'People counter PC-FS-01', camera: 'PTZ-FS-DK1', doorId: 'DR-FS-DK1', timetable: true, voice: true },
  { id: 'sp-dk2', code: 'FSKTM-DK2', name: 'DK2', buildingId: 'b-fsktm', floor: 'Ground floor', type: 'Lecture hall', capacity: 160, state: 'Operational', occupancySource: 'People counter PC-FS-02', camera: 'PTZ-FS-DK2', doorId: 'DR-FS-DK2', timetable: true, voice: true },
  { id: 'sp-mk1', code: 'FSKTM-MK1', name: 'Makmal 1', buildingId: 'b-fsktm', floor: 'Ground floor', type: 'Lab', capacity: 60, state: 'Under maintenance', occupancySource: 'Motion sensor MS-FS-11', camera: null, doorId: 'DR-FS-MK1', timetable: true, voice: false },
  { id: 'sp-dk3', code: 'FSKTM-DK3', name: 'DK3', buildingId: 'b-fsktm', floor: 'Level 1', type: 'Lecture hall', capacity: 140, state: 'Operational', occupancySource: 'People counter PC-FS-03', camera: 'PTZ-FS-DK3', doorId: 'DR-FS-DK3', timetable: true, voice: true },
  { id: 'sp-mk3', code: 'FSKTM-MK3', name: 'Makmal 3', buildingId: 'b-fsktm', floor: 'Level 1', type: 'Lab', capacity: 60, state: 'Operational', occupancySource: 'Motion sensor MS-FS-13', camera: null, doorId: 'DR-FS-MK3', timetable: true, voice: false },
  { id: 'sp-bk2', code: 'FSKTM-BK2', name: 'BK2', buildingId: 'b-fsktm', floor: 'Level 2', type: 'Seminar room', capacity: 40, state: 'Setup incomplete', occupancySource: null, camera: null, doorId: 'DR-FS-BK2', timetable: true, voice: false },
  { id: 'sp-ea1', code: 'ENG-EA-101', name: 'Lecture Hall EA-1', buildingId: 'b-enga', floor: 'Level 1', type: 'Lecture hall', capacity: 240, state: 'Operational', occupancySource: 'People counter PC-EA-01', camera: 'PTZ-EA-101', doorId: 'DR-EA-101', timetable: true, voice: true },
  { id: 'sp-c12', code: 'ENG-EA-112', name: 'Seminar Room C-12', buildingId: 'b-enga', floor: 'Level 1', type: 'Seminar room', capacity: 40, state: 'Operational', occupancySource: 'Motion sensor MS-EA-12', camera: 'PTZ-EA-112', doorId: 'DR-EA-112', timetable: true, voice: true },
  { id: 'sp-ea201', code: 'ENG-EA-201', name: 'Smart Room EA-201', buildingId: 'b-enga', floor: 'Level 2', type: 'Smart room', capacity: 48, state: 'Operational', occupancySource: 'People counter PC-EA-21', camera: 'PTZ-EA-201', doorId: 'DR-EA-201', timetable: true, voice: true },
  { id: 'sp-ea210', code: 'ENG-EA-210', name: 'Electronics Lab EA-210', buildingId: 'b-enga', floor: 'Level 2', type: 'Lab', capacity: 36, state: 'Operational', occupancySource: 'Motion sensor MS-EA-30', camera: null, doorId: 'DR-EA-210', timetable: true, voice: false },
  { id: 'sp-eaud', code: 'ENG-EB-001', name: 'Engineering Auditorium', buildingId: 'b-engb', floor: 'Ground floor', type: 'Auditorium', capacity: 420, state: 'Operational', occupancySource: 'People counter PC-EB-01', camera: 'PTZ-EB-001', doorId: 'DR-EB-001', timetable: true, voice: true },
  { id: 'sp-eb110', code: 'ENG-EB-110', name: 'Lecture Hall EB-110', buildingId: 'b-engb', floor: 'Level 1', type: 'Lecture hall', capacity: 200, state: 'Operational', occupancySource: 'People counter PC-EB-11', camera: 'PTZ-EB-110', doorId: 'DR-EB-110', timetable: true, voice: true },
  { id: 'sp-b204', code: 'FBE-B-204', name: 'Smart Room B-204', buildingId: 'b-fbe', floor: 'Level 2', type: 'Smart room', capacity: 48, state: 'Operational', occupancySource: 'People counter PC-FB-04', camera: 'PTZ-FB-204', doorId: 'DR-FB-204', timetable: true, voice: true },
  { id: 'sp-ca', code: 'CA-MAIN', name: 'Central Auditorium', buildingId: 'b-ca', floor: 'Ground floor', type: 'Auditorium', capacity: 1200, state: 'Operational', occupancySource: 'People counter PC-CA-01 to 04', camera: 'PTZ-CA-01', doorId: 'DR-CA-MAIN', timetable: false, voice: true },
]

// ---------------- Device registry ----------------
export type DeviceType = 'Interactive display' | 'Projector' | 'Lights' | 'Fan' | 'Air-conditioning' | 'PTZ camera' | 'People counter' | 'Motion sensor' | 'Door controller' | 'Ceiling microphone' | 'Room controller'
export type DeviceStatus = 'Online' | 'Offline' | 'Stale'

export interface Device {
  id: string
  type: DeviceType
  spaceId: string
  model: string
  status: DeviceStatus
  capabilities: string[]
  lastSeen: string
  maintenance: string
  autoOffEligible: boolean
}

const modelOf: Record<DeviceType, string> = {
  'Interactive display': '86-inch interactive display, generic',
  Projector: 'Laser projector 6000 lm',
  Lights: 'DALI lighting zone',
  Fan: 'Ceiling fan relay',
  'Air-conditioning': 'Split unit with IR bridge',
  'PTZ camera': 'Motion-tracking PTZ camera',
  'People counter': 'Overhead 3D people counter',
  'Motion sensor': 'PIR motion sensor',
  'Door controller': 'Access-control door controller',
  'Ceiling microphone': 'Beamforming ceiling mic',
  'Room controller': 'IoT room controller gateway',
}
const capsOf: Record<DeviceType, string[]> = {
  'Interactive display': ['On / off', 'Input select'],
  Projector: ['On / off'],
  Lights: ['On / off', 'Dim 0-100%'],
  Fan: ['On / off', 'Speed 1-3'],
  'Air-conditioning': ['On / off', 'Set temperature'],
  'PTZ camera': ['Track presenter', 'Presets', 'Video feed'],
  'People counter': ['Live count'],
  'Motion sensor': ['Motion events'],
  'Door controller': ['Lock / unlock', 'Status feedback'],
  'Ceiling microphone': ['Mute', 'Gain'],
  'Room controller': ['Scenes', 'Voice commands'],
}
const eligible: DeviceType[] = ['Interactive display', 'Projector', 'Lights', 'Fan', 'Air-conditioning']

function devicesFor(sp: Space, i: number): Device[] {
  const types: DeviceType[] = ['Room controller', 'Lights', 'Air-conditioning']
  if (sp.type !== 'Lab') types.push('Interactive display')
  if (sp.type === 'Lecture hall' || sp.type === 'Auditorium') types.push('Projector', 'Ceiling microphone')
  if (sp.type === 'Seminar room' || sp.type === 'Smart room') types.push('Fan', 'Ceiling microphone')
  if (sp.camera) types.push('PTZ camera')
  if (sp.occupancySource?.startsWith('People')) types.push('People counter')
  if (sp.occupancySource?.startsWith('Motion')) types.push('Motion sensor')
  if (sp.doorId) types.push('Door controller')
  return types.map((t, k) => {
    const offline = (sp.id === 'sp-c12' && t === 'Ceiling microphone') || (sp.id === 'sp-mk1' && t !== 'Door controller')
    const stale = sp.id === 'sp-b204' && t === 'Room controller'
    return {
      id: `${sp.code}-${t.split(' ').map((w) => w[0]).join('').toUpperCase()}${k}`,
      type: t,
      spaceId: sp.id,
      model: modelOf[t],
      status: offline ? 'Offline' : stale ? 'Stale' : 'Online',
      capabilities: capsOf[t],
      lastSeen: offline ? '3 h ago' : stale ? '18 min ago' : `${(i * 7 + k * 5) % 50 + 5} s ago`,
      maintenance: k % 4 === 0 ? 'Service due Dec 2026' : 'No action needed',
      autoOffEligible: eligible.includes(t),
    }
  })
}

export const seedDevices: Device[] = seedSpaces.flatMap(devicesFor)

// ---------------- Network telemetry, policies and incidents ----------------
export type IncidentStatus = 'New' | 'Acknowledged' | 'Investigating' | 'On hold' | 'Resolved' | 'False positive'
export type Severity = 'High' | 'Medium' | 'Low'

export interface NetPolicy {
  id: string
  name: string
  category: string
  examples: string
  scope: string
  schedule: string
  severity: Severity
  response: 'Log only' | 'Notify IT security' | 'Notify and request block'
  active: boolean
  hitsToday: number
}

export const seedPolicies: NetPolicy[] = [
  { id: 'pol-1', name: 'Video streaming during teaching hours', category: 'Video streaming', examples: 'netflix.com, primevideo.com, iq.com', scope: 'Faculty of Engineering, managed devices', schedule: 'Mon to Fri, 08:00 to 18:00', severity: 'Medium', response: 'Notify IT security', active: true, hitsToday: 6 },
  { id: 'pol-2', name: 'Online gaming', category: 'Online gaming', examples: 'store.steampowered.com, epicgames.com, Valorant client', scope: 'Faculty of Engineering, managed devices', schedule: 'Always', severity: 'Medium', response: 'Notify IT security', active: true, hitsToday: 3 },
  { id: 'pol-3', name: 'Peer-to-peer file sharing', category: 'Torrent / P2P', examples: 'BitTorrent and uTorrent clients, tracker domains', scope: 'All faculties, managed devices', schedule: 'Always', severity: 'High', response: 'Notify and request block', active: true, hitsToday: 1 },
  { id: 'pol-4', name: 'VPN or proxy to bypass campus filtering', category: 'VPN / proxy bypass', examples: 'Unapproved VPN apps, open proxies', scope: 'All faculties, managed devices', schedule: 'Always', severity: 'High', response: 'Notify and request block', active: true, hitsToday: 2 },
  { id: 'pol-5', name: 'Unapproved AI tools during assessments', category: 'Generative AI', examples: 'Public chatbots not approved for the course', scope: 'Exam and lab rooms in Engineering', schedule: 'During scheduled assessments only', severity: 'High', response: 'Notify IT security', active: true, hitsToday: 0 },
  { id: 'pol-6', name: 'Social media in exam rooms', category: 'Social media', examples: 'tiktok.com, instagram.com', scope: 'Exam rooms', schedule: 'During scheduled exams only', severity: 'Low', response: 'Log only', active: false, hitsToday: 0 },
]

export interface NetUser {
  name: string
  matric: string
  programme: string
}

export const engStudents: NetUser[] = [
  { name: 'Muhammad Irfan bin Rosli', matric: '22004531', programme: 'Mechanical Engineering, Year 3' },
  { name: 'Tan Wei Ling', matric: '22004877', programme: 'Electrical Engineering, Year 3' },
  { name: 'Haris Danish bin Kamarul', matric: '23005102', programme: 'Civil Engineering, Year 2' },
  { name: 'Kavya a/p Rajendran', matric: '23005266', programme: 'Chemical Engineering, Year 2' },
  { name: 'Lee Jun Hao', matric: '21003390', programme: 'Biomedical Engineering, Year 4' },
  { name: 'Nur Syafiqah binti Azlan', matric: '23005419', programme: 'Electrical Engineering, Year 2' },
  { name: 'Darren Ong Kah Meng', matric: '22004960', programme: 'Mechanical Engineering, Year 3' },
  { name: 'Aiman Hakimi bin Zulkarnain', matric: '24006013', programme: 'Civil Engineering, Year 1' },
]

export interface IncidentNote {
  time: string
  by: string
  text: string
  status?: IncidentStatus
}

export interface Incident {
  id: string
  detected: string
  policyId: string
  category: string
  destination: string
  device: string
  deviceKind: 'University laptop' | 'Lab PC' | 'Library kiosk'
  network: 'UM-WiFi (campus)' | 'eduroam (campus)' | 'Lab LAN (campus)' | 'Off-campus Wi-Fi (endpoint agent)'
  source: 'Campus firewall' | 'DNS filter' | 'Endpoint agent'
  location: string
  faculty: string
  user: NetUser
  volume: string
  severity: Severity
  status: IncidentStatus
  owner: string
  notes: IncidentNote[]
}

export const itStaff = ['Azlan (IT security)', 'Mei Fong (IT security)', 'Kumar (Network ops)', 'Unassigned']

export const seedIncidents: Incident[] = [
  {
    id: 'NET-2026-0141', detected: '09:52', policyId: 'pol-4', category: 'VPN / proxy bypass', destination: 'Unapproved VPN client', device: 'UM-ENG-LT-0412', deviceKind: 'University laptop',
    network: 'UM-WiFi (campus)', source: 'Campus firewall', location: 'Engineering Block A, Level 2, access point AP-EA2-07', faculty: 'Faculty of Engineering', user: engStudents[0], volume: '86 MB', severity: 'High', status: 'Investigating', owner: 'Azlan (IT security)',
    notes: [
      { time: '09:52', by: 'System', text: 'Incident opened from campus firewall event. Policy: VPN or proxy to bypass campus filtering.', status: 'New' },
      { time: '09:58', by: 'Azlan (IT security)', text: 'Acknowledged. Checking whether the VPN is required for an approved research project.', status: 'Acknowledged' },
      { time: '10:05', by: 'Azlan (IT security)', text: 'Contacted the department lab coordinator.', status: 'Investigating' },
    ],
  },
  {
    id: 'NET-2026-0140', detected: '09:31', policyId: 'pol-1', category: 'Video streaming', destination: 'netflix.com', device: 'ENG-EA210-PC14', deviceKind: 'Lab PC',
    network: 'Lab LAN (campus)', source: 'DNS filter', location: 'Electronics Lab EA-210', faculty: 'Faculty of Engineering', user: engStudents[1], volume: '1.2 GB', severity: 'Medium', status: 'On hold', owner: 'Mei Fong (IT security)',
    notes: [
      { time: '09:31', by: 'System', text: 'Incident opened from DNS filter event during a scheduled lab.', status: 'New' },
      { time: '09:40', by: 'Mei Fong (IT security)', text: 'Paused until the lab session ends at 11:00 so the lecturer can confirm.', status: 'On hold' },
    ],
  },
  {
    id: 'NET-2026-0138', detected: '08:47', policyId: 'pol-2', category: 'Online gaming', destination: 'store.steampowered.com', device: 'UM-ENG-LT-0388', deviceKind: 'University laptop',
    network: 'Off-campus Wi-Fi (endpoint agent)', source: 'Endpoint agent', location: 'Off campus (home network)', faculty: 'Faculty of Engineering', user: engStudents[2], volume: '3.4 GB', severity: 'Medium', status: 'Resolved', owner: 'Kumar (Network ops)',
    notes: [
      { time: '08:47', by: 'System', text: 'Incident opened from endpoint agent report on a university-issued laptop.', status: 'New' },
      { time: '09:10', by: 'Kumar (Network ops)', text: 'Reminder of acceptable-use policy sent to the student. No further action.', status: 'Resolved' },
    ],
  },
  {
    id: 'NET-2026-0135', detected: 'Yesterday 16:20', policyId: 'pol-3', category: 'Torrent / P2P', destination: 'BitTorrent client', device: 'UM-ENG-LT-0251', deviceKind: 'University laptop',
    network: 'eduroam (campus)', source: 'Campus firewall', location: 'Engineering Block B, Ground floor, AP-EB0-02', faculty: 'Faculty of Engineering', user: engStudents[4], volume: '6.8 GB', severity: 'High', status: 'False positive', owner: 'Azlan (IT security)',
    notes: [
      { time: '16:20', by: 'System', text: 'Incident opened from campus firewall event.', status: 'New' },
      { time: '16:55', by: 'Azlan (IT security)', text: 'Traffic was an approved Linux ISO mirror for a course lab. Exception proposed for the mirror domain.', status: 'False positive' },
    ],
  },
]

// Events the live feed draws from to raise new incidents.
export const liveEventPool: Omit<Incident, 'id' | 'detected' | 'status' | 'owner' | 'notes' | 'user'>[] = [
  { policyId: 'pol-1', category: 'Video streaming', destination: 'primevideo.com', device: 'UM-ENG-LT-0533', deviceKind: 'University laptop', network: 'UM-WiFi (campus)', source: 'Campus firewall', location: 'Lecture Hall EA-1, access point AP-EA1-03', faculty: 'Faculty of Engineering', volume: '640 MB', severity: 'Medium' },
  { policyId: 'pol-4', category: 'VPN / proxy bypass', destination: 'Open web proxy', device: 'UM-ENG-LT-0611', deviceKind: 'University laptop', network: 'Off-campus Wi-Fi (endpoint agent)', source: 'Endpoint agent', location: 'Off campus (cafe hotspot)', faculty: 'Faculty of Engineering', volume: '120 MB', severity: 'High' },
  { policyId: 'pol-2', category: 'Online gaming', destination: 'Valorant game client', device: 'ENG-EB110-PC03', deviceKind: 'Lab PC', network: 'Lab LAN (campus)', source: 'Campus firewall', location: 'Lecture Hall EB-110', faculty: 'Faculty of Engineering', volume: '310 MB', severity: 'Medium' },
  { policyId: 'pol-3', category: 'Torrent / P2P', destination: 'uTorrent client', device: 'UM-ENG-LT-0479', deviceKind: 'University laptop', network: 'eduroam (campus)', source: 'Campus firewall', location: 'Engineering Block A, Level 1, AP-EA1-09', faculty: 'Faculty of Engineering', volume: '2.1 GB', severity: 'High' },
  { policyId: 'pol-1', category: 'Video streaming', destination: 'iq.com', device: 'UM-ENG-LT-0702', deviceKind: 'University laptop', network: 'UM-WiFi (campus)', source: 'DNS filter', location: 'Engineering Auditorium, AP-EB0-01', faculty: 'Faculty of Engineering', volume: '480 MB', severity: 'Medium' },
]

export const usageByHour = [
  { hour: '07', down: 42, up: 6 },
  { hour: '08', down: 188, up: 31 },
  { hour: '09', down: 296, up: 54 },
  { hour: '10', down: 342, up: 61 },
  { hour: '11', down: 318, up: 57 },
  { hour: '12', down: 254, up: 40 },
  { hour: '13', down: 201, up: 33 },
  { hour: '14', down: 287, up: 49 },
  { hour: '15', down: 265, up: 46 },
  { hour: '16', down: 198, up: 35 },
  { hour: '17', down: 120, up: 19 },
]

export const usageByCategory = [
  { label: 'Learning platforms and library', value: 34 },
  { label: 'Cloud storage and collaboration', value: 21 },
  { label: 'Software updates', value: 14 },
  { label: 'Video conferencing', value: 12 },
  { label: 'Search and general web', value: 9 },
  { label: 'Video streaming', value: 6 },
  { label: 'Restricted categories', value: 4 },
]

export const usageByBuilding = [
  { label: 'Engineering Block A', value: 1240 },
  { label: 'Engineering Block B', value: 980 },
  { label: 'FSKTM', value: 1410 },
  { label: 'Business and Economics', value: 760 },
  { label: 'Central Auditorium', value: 210 },
]

export const telemetrySources = [
  { name: 'Campus firewall', kind: 'Firewall and secure web gateway', last: '12 s ago', state: 'Live' as const },
  { name: 'DNS filter', kind: 'DNS security service', last: '20 s ago', state: 'Live' as const },
  { name: 'Endpoint agent', kind: 'Managed-device agent, reports from any network', last: '18 min ago', state: 'Stale' as const },
  { name: 'Wi-Fi controller', kind: 'Access point and device location', last: '35 s ago', state: 'Live' as const },
]

// ---------------- Audit log ----------------
export interface AuditEntry {
  id: string
  time: string
  actor: string
  area: 'Rooms' | 'Devices' | 'Network' | 'Doors' | 'Attendance' | 'Automation' | 'Reports' | 'Access'
  action: string
  target: string
  detail?: string
}

export const seedAudit: AuditEntry[] = [
  { id: 'au5', time: '10:05', actor: 'Azlan (IT security)', area: 'Network', action: 'Changed incident status', target: 'NET-2026-0141', detail: 'Acknowledged to Investigating' },
  { id: 'au4', time: '09:40', actor: 'Mei Fong (IT security)', area: 'Network', action: 'Put incident on hold', target: 'NET-2026-0140', detail: 'Waiting for lab session to end' },
  { id: 'au3', time: '09:12', actor: 'System', area: 'Reports', action: 'Published lecture recording', target: 'WIA2005 lecture 13' },
  { id: 'au2', time: '08:55', actor: 'Prof. Dr. Lim Mei Ling', area: 'Reports', action: 'Exported report', target: 'Attendance by faculty, week 6' },
  { id: 'au1', time: '08:02', actor: 'Facilities admin', area: 'Rooms', action: 'Changed room state', target: 'FSKTM-MK1', detail: 'Operational to Under maintenance' },
]
