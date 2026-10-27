/*
  Smart campus sample data: campus setup (master rooms and sub rooms), device registry and pairing,
  automatically detected network incidents, and the audit log.
  Everything here is fictional sample data for the proof of concept. In production these records
  come from the university's timetable, network and security systems, and the IoT gateway.
*/

// ---------------- Campus hierarchy ----------------
export type SpaceType = 'Master room' | 'Lecture hall' | 'Auditorium' | 'Smart room' | 'Seminar room' | 'Lab' | 'Control room'
export type SubType = Exclude<SpaceType, 'Master room'>
export type SpaceState = 'Operational' | 'Setup incomplete' | 'Under maintenance' | 'Deactivated'

export interface Building {
  id: string
  name: string
  short: string
  floors: string[]
}

export interface Space {
  id: string
  kind: 'master' | 'sub'
  parentId: string | null
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

const master = (id: string, code: string, name: string, buildingId: string, floor: string): Space => ({
  id, kind: 'master', parentId: null, code, name, buildingId, floor, type: 'Master room', capacity: 0, state: 'Operational', occupancySource: null, camera: null, doorId: null, timetable: true, voice: false,
})
const sub = (s: Omit<Space, 'kind'>): Space => ({ kind: 'sub', ...s })

export const seedSpaces: Space[] = [
  master('m-fs-dk', 'FSKTM-DK', 'Lecture Complex DK', 'b-fsktm', 'Ground floor'),
  master('m-fs-lab', 'FSKTM-LAB', 'Computer Labs', 'b-fsktm', 'Ground floor'),
  master('m-fs-bk', 'FSKTM-BK', 'Tutorial Rooms', 'b-fsktm', 'Level 2'),
  master('m-ea', 'ENG-A-TS', 'Teaching Suite A', 'b-enga', 'Level 1'),
  master('m-ea-lab', 'ENG-A-LAB', 'Engineering Labs A', 'b-enga', 'Level 2'),
  master('m-eb', 'ENG-B-TS', 'Teaching Suite B', 'b-engb', 'Ground floor'),
  master('m-fbe', 'FBE-SR', 'Smart Rooms FBE', 'b-fbe', 'Level 2'),
  master('m-ca', 'CA', 'Central Auditorium', 'b-ca', 'Ground floor'),

  sub({ id: 'sp-dk1', parentId: 'm-fs-dk', code: 'FSKTM-DK1', name: 'DK1', buildingId: 'b-fsktm', floor: 'Ground floor', type: 'Lecture hall', capacity: 180, state: 'Operational', occupancySource: 'People counter PC-FS-01', camera: 'PTZ-FS-DK1', doorId: 'DR-FS-DK1', timetable: true, voice: true }),
  sub({ id: 'sp-dk2', parentId: 'm-fs-dk', code: 'FSKTM-DK2', name: 'DK2', buildingId: 'b-fsktm', floor: 'Ground floor', type: 'Lecture hall', capacity: 160, state: 'Operational', occupancySource: 'People counter PC-FS-02', camera: 'PTZ-FS-DK2', doorId: 'DR-FS-DK2', timetable: true, voice: true }),
  sub({ id: 'sp-dk3', parentId: 'm-fs-dk', code: 'FSKTM-DK3', name: 'DK3', buildingId: 'b-fsktm', floor: 'Level 1', type: 'Lecture hall', capacity: 140, state: 'Operational', occupancySource: 'People counter PC-FS-03', camera: 'PTZ-FS-DK3', doorId: 'DR-FS-DK3', timetable: true, voice: true }),
  sub({ id: 'sp-mk1', parentId: 'm-fs-lab', code: 'FSKTM-MK1', name: 'Makmal 1', buildingId: 'b-fsktm', floor: 'Ground floor', type: 'Lab', capacity: 60, state: 'Under maintenance', occupancySource: 'Motion sensor MS-FS-11', camera: null, doorId: 'DR-FS-MK1', timetable: true, voice: false }),
  sub({ id: 'sp-mk3', parentId: 'm-fs-lab', code: 'FSKTM-MK3', name: 'Makmal 3', buildingId: 'b-fsktm', floor: 'Level 1', type: 'Lab', capacity: 60, state: 'Operational', occupancySource: 'Motion sensor MS-FS-13', camera: null, doorId: 'DR-FS-MK3', timetable: true, voice: false }),
  sub({ id: 'sp-bk2', parentId: 'm-fs-bk', code: 'FSKTM-BK2', name: 'BK2', buildingId: 'b-fsktm', floor: 'Level 2', type: 'Seminar room', capacity: 40, state: 'Setup incomplete', occupancySource: null, camera: null, doorId: 'DR-FS-BK2', timetable: true, voice: false }),
  sub({ id: 'sp-ea1', parentId: 'm-ea', code: 'ENG-EA-101', name: 'Lecture Hall EA-1', buildingId: 'b-enga', floor: 'Level 1', type: 'Lecture hall', capacity: 240, state: 'Operational', occupancySource: 'People counter PC-EA-01', camera: 'PTZ-EA-101', doorId: 'DR-EA-101', timetable: true, voice: true }),
  sub({ id: 'sp-c12', parentId: 'm-ea', code: 'ENG-EA-112', name: 'Seminar Room C-12', buildingId: 'b-enga', floor: 'Level 1', type: 'Seminar room', capacity: 40, state: 'Operational', occupancySource: 'Motion sensor MS-EA-12', camera: 'PTZ-EA-112', doorId: 'DR-EA-112', timetable: true, voice: true }),
  sub({ id: 'sp-ea201', parentId: 'm-ea', code: 'ENG-EA-201', name: 'Smart Room EA-201', buildingId: 'b-enga', floor: 'Level 2', type: 'Smart room', capacity: 48, state: 'Operational', occupancySource: 'People counter PC-EA-21', camera: 'PTZ-EA-201', doorId: 'DR-EA-201', timetable: true, voice: true }),
  sub({ id: 'sp-ea210', parentId: 'm-ea-lab', code: 'ENG-EA-210', name: 'Electronics Lab EA-210', buildingId: 'b-enga', floor: 'Level 2', type: 'Lab', capacity: 36, state: 'Operational', occupancySource: 'Motion sensor MS-EA-30', camera: null, doorId: 'DR-EA-210', timetable: true, voice: false }),
  sub({ id: 'sp-eaud', parentId: 'm-eb', code: 'ENG-EB-001', name: 'Engineering Auditorium', buildingId: 'b-engb', floor: 'Ground floor', type: 'Auditorium', capacity: 420, state: 'Operational', occupancySource: 'People counter PC-EB-01', camera: 'PTZ-EB-001', doorId: 'DR-EB-001', timetable: true, voice: true }),
  sub({ id: 'sp-eb110', parentId: 'm-eb', code: 'ENG-EB-110', name: 'Lecture Hall EB-110', buildingId: 'b-engb', floor: 'Level 1', type: 'Lecture hall', capacity: 200, state: 'Operational', occupancySource: 'People counter PC-EB-11', camera: 'PTZ-EB-110', doorId: 'DR-EB-110', timetable: true, voice: true }),
  sub({ id: 'sp-b204', parentId: 'm-fbe', code: 'FBE-B-204', name: 'Smart Room B-204', buildingId: 'b-fbe', floor: 'Level 2', type: 'Smart room', capacity: 48, state: 'Operational', occupancySource: 'People counter PC-FB-04', camera: 'PTZ-FB-204', doorId: 'DR-FB-204', timetable: true, voice: true }),
  sub({ id: 'sp-ca', parentId: 'm-ca', code: 'CA-MAIN', name: 'Main hall', buildingId: 'b-ca', floor: 'Ground floor', type: 'Auditorium', capacity: 1200, state: 'Operational', occupancySource: 'People counter PC-CA-01 to 04', camera: 'PTZ-CA-01', doorId: 'DR-CA-MAIN', timetable: false, voice: true }),
  sub({ id: 'sp-ca-av', parentId: 'm-ca', code: 'CA-AV', name: 'AV control room', buildingId: 'b-ca', floor: 'Ground floor', type: 'Control room', capacity: 6, state: 'Setup incomplete', occupancySource: null, camera: null, doorId: 'DR-CA-AV', timetable: false, voice: false }),
]

// ---------------- Device registry ----------------
export type DeviceType = 'Interactive display' | 'Projector' | 'Lights' | 'Fan' | 'Air-conditioning' | 'PTZ camera' | 'People counter' | 'Motion sensor' | 'Door controller' | 'Ceiling microphone' | 'Room controller'
export type DeviceStatus = 'Online' | 'Offline' | 'Stale'

export interface Device {
  id: string
  name: string
  type: DeviceType
  spaceId: string
  model: string
  network: string
  pairing?: string
  status: DeviceStatus
  capabilities: string[]
  lastSeen: string
  maintenance: string
  autoOffEligible: boolean
}

export const IOT_NETWORK = 'UM-IoT (VLAN 120)'

const modelOf: Record<DeviceType, string> = {
  'Interactive display': '86-inch interactive display',
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
export const capsOf: Record<DeviceType, string[]> = {
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
export const AUTO_OFF_TYPES: DeviceType[] = ['Interactive display', 'Projector', 'Lights', 'Fan', 'Air-conditioning']
export const shortType = (t: DeviceType) => t.split(' ').map((w) => w[0]).join('').toUpperCase()

const friendly: Record<DeviceType, string> = {
  'Interactive display': 'front display',
  Projector: 'projector',
  Lights: 'lights',
  Fan: 'fans',
  'Air-conditioning': 'air-conditioning',
  'PTZ camera': 'tracking camera',
  'People counter': 'people counter',
  'Motion sensor': 'motion sensor',
  'Door controller': 'door',
  'Ceiling microphone': 'ceiling mic',
  'Room controller': 'room controller',
}
export const defaultDeviceName = (roomName: string, t: DeviceType) => `${roomName} ${friendly[t]}`

function devicesFor(sp: Space, i: number): Device[] {
  if (sp.kind === 'master' || sp.id === 'sp-ca-av' || sp.id === 'sp-bk2') return []
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
      id: `${sp.code}-${shortType(t)}${k}`,
      name: defaultDeviceName(sp.name, t),
      type: t,
      spaceId: sp.id,
      model: modelOf[t],
      network: IOT_NETWORK,
      status: offline ? 'Offline' : stale ? 'Stale' : 'Online',
      capabilities: capsOf[t],
      lastSeen: offline ? '3 h ago' : stale ? '18 min ago' : `${((i * 7 + k * 5) % 50) + 5} s ago`,
      maintenance: k % 4 === 0 ? 'Service due Dec 2026' : 'No action needed',
      autoOffEligible: AUTO_OFF_TYPES.includes(t),
    }
  })
}

export const seedDevices: Device[] = seedSpaces.flatMap(devicesFor)
export const modelFor = (t: DeviceType) => modelOf[t]

// Devices found on the network that are waiting to be paired (used by the pairing wizard).
export interface Discovered {
  key: string
  type: DeviceType
  label: string
  network: string
  ip: string
  pairing: string
}

export function discoveredFor(sp: Space): Discovered[] {
  const seed = sp.code.split('').reduce((n, c) => n + c.charCodeAt(0), 0)
  const hex = (n: number) => ((seed * 97 + n * 4099) % 65535).toString(16).toUpperCase().padStart(4, '0')
  const code = (n: number) => String(((seed * 7919 + n * 104729) % 900000) + 100000)
  return [
    { key: 'd1', type: 'Interactive display', label: `Display-${hex(1)}`, network: IOT_NETWORK, ip: `10.20.120.${(seed % 90) + 40}`, pairing: code(1) },
    { key: 'd2', type: 'Lights', label: `DALI-Gateway-${hex(2)}`, network: IOT_NETWORK, ip: `10.20.120.${(seed % 90) + 41}`, pairing: code(2) },
    { key: 'd3', type: 'Air-conditioning', label: `AC-Bridge-${hex(3)}`, network: IOT_NETWORK, ip: `10.20.120.${(seed % 90) + 42}`, pairing: code(3) },
    { key: 'd4', type: 'PTZ camera', label: `PTZ-Cam-${hex(4)}`, network: 'UM-Guest (Wi-Fi)', ip: `172.16.8.${(seed % 90) + 10}`, pairing: code(4) },
  ]
}

// ---------------- Network incidents (detected automatically) ----------------
export type IncidentStatus = 'New' | 'Acknowledged' | 'Investigating' | 'On hold' | 'Resolved' | 'False positive'
export type Severity = 'High' | 'Medium' | 'Low'
export type DetectionSource = 'Wireless intrusion detection' | 'Firewall (IPS)' | 'DNS security' | 'Network access control' | 'Wi-Fi sign-in (identity)' | 'Wi-Fi controller' | 'Endpoint agent'

export const detectionSources: DetectionSource[] = ['Wireless intrusion detection', 'Firewall (IPS)', 'DNS security', 'Network access control', 'Wi-Fi sign-in (identity)', 'Wi-Fi controller', 'Endpoint agent']

export interface NetPolicy {
  id: string
  name: string
  category: string
  detects: string
  source: DetectionSource
  scope: string
  schedule: string
  severity: Severity
  response: string
  active: boolean
  hitsToday: number
}

export const seedPolicies: NetPolicy[] = [
  { id: 'pol-rogue', name: 'Rogue or look-alike access points', category: 'Rogue access point', detects: 'Access points not owned by the university, or names copying UM-WiFi', source: 'Wireless intrusion detection', scope: 'All campus Wi-Fi', schedule: 'Always', severity: 'High', response: 'Record, alert security, locate access point', active: true, hitsToday: 1 },
  { id: 'pol-brute', name: 'Repeated failed Wi-Fi sign-ins', category: 'Credential attack', detects: '10 or more failed sign-ins on one account within 5 minutes', source: 'Wi-Fi sign-in (identity)', scope: 'UM-WiFi and eduroam', schedule: 'Always', severity: 'High', response: 'Record, alert security, request account lock', active: true, hitsToday: 2 },
  { id: 'pol-malware', name: 'Malware and command-and-control traffic', category: 'Malware', detects: 'Connections to known malicious or command-and-control domains', source: 'DNS security', scope: 'All campus networks', schedule: 'Always', severity: 'High', response: 'Record, block domain, request device isolation', active: true, hitsToday: 1 },
  { id: 'pol-unreg', name: 'Unregistered devices on campus networks', category: 'Unauthorised device', detects: 'Devices whose hardware address is not in the asset register', source: 'Network access control', scope: 'Lab LAN and UM-IoT', schedule: 'Always', severity: 'Medium', response: 'Record, move device to guest network', active: true, hitsToday: 3 },
  { id: 'pol-scan', name: 'Port scanning and spoofing', category: 'Network attack', detects: 'Port scans, ARP spoofing and lateral movement between devices', source: 'Firewall (IPS)', scope: 'All campus networks', schedule: 'Always', severity: 'High', response: 'Record, alert security', active: true, hitsToday: 1 },
  { id: 'pol-exfil', name: 'Unusual data transfers', category: 'Data exfiltration', detects: 'Uploads above 10 GB to unknown services, DNS tunnelling', source: 'Firewall (IPS)', scope: 'Managed devices', schedule: 'Always', severity: 'Medium', response: 'Record, alert security', active: true, hitsToday: 0 },
  { id: 'pol-policy', name: 'Restricted apps and bypass tools', category: 'Policy breach', detects: 'Peer-to-peer file sharing, VPNs or proxies that bypass campus filtering', source: 'Firewall (IPS)', scope: 'Managed devices, Faculty of Engineering first', schedule: 'Mon to Fri, 08:00 to 18:00', severity: 'Medium', response: 'Record, notify IT', active: true, hitsToday: 2 },
  { id: 'pol-drift', name: 'Network inconsistencies', category: 'Network inconsistency', detects: 'Access point settings that differ from the standard, address pools running out, access points offline', source: 'Wi-Fi controller', scope: 'All campus Wi-Fi', schedule: 'Always', severity: 'Low', response: 'Record, notify network operations', active: true, hitsToday: 2 },
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
  title: string
  evidence: string
  device: string
  deviceKind: string
  network: string
  source: DetectionSource
  location: string
  faculty: string
  user: NetUser | null
  severity: Severity
  status: IncidentStatus
  owner: string
  notes: IncidentNote[]
}

export const itStaff = ['Azlan (IT security)', 'Mei Fong (IT security)', 'Kumar (Network ops)', 'Unassigned']

const opened = (time: string, source: string): IncidentNote => ({ time, by: 'System', text: `Detected automatically by ${source.toLowerCase()} and recorded.`, status: 'New' })

export const seedIncidents: Incident[] = [
  {
    id: 'NET-2026-0141', detected: '09:52', policyId: 'pol-rogue', category: 'Rogue access point', title: 'Look-alike Wi-Fi network "UM-WiFi-Free" broadcasting',
    evidence: 'Unknown access point with hardware address 3C:84:6A:2F:91:0B, signal strongest near DK3. 14 devices tried to connect.', device: 'Unknown access point', deviceKind: 'Access point (not university-owned)',
    network: 'Campus Wi-Fi airspace', source: 'Wireless intrusion detection', location: 'FSKTM, Level 1, near DK3', faculty: 'Computer Science & IT', user: null, severity: 'High', status: 'Investigating', owner: 'Azlan (IT security)',
    notes: [opened('09:52', 'Wireless intrusion detection'), { time: '09:58', by: 'Azlan (IT security)', text: 'Acknowledged. Security guard sent to Level 1 to locate the device.', status: 'Acknowledged' }, { time: '10:05', by: 'Azlan (IT security)', text: 'Signal traced to a corridor socket. Checking with facilities.', status: 'Investigating' }],
  },
  {
    id: 'NET-2026-0140', detected: '09:31', policyId: 'pol-brute', category: 'Credential attack', title: '46 failed Wi-Fi sign-ins on one student account in 5 minutes',
    evidence: 'Failed sign-ins on account 22004531 from 3 different devices. Account locked automatically after 20 failures.', device: '3 devices (2 unknown)', deviceKind: 'Mixed',
    network: 'UM-WiFi', source: 'Wi-Fi sign-in (identity)', location: 'Engineering Block A, Level 2', faculty: 'Engineering', user: engStudents[0], severity: 'High', status: 'Acknowledged', owner: 'Mei Fong (IT security)',
    notes: [opened('09:31', 'Wi-Fi sign-in service'), { time: '09:36', by: 'Mei Fong (IT security)', text: 'Acknowledged. Contacting the student to reset the password.', status: 'Acknowledged' }],
  },
  {
    id: 'NET-2026-0139', detected: '08:47', policyId: 'pol-malware', category: 'Malware', title: 'Laptop contacted a known command-and-control domain',
    evidence: 'DNS request for a domain on the threat feed was blocked. Same device made 12 similar requests in an hour.', device: 'UM-ENG-LT-0412', deviceKind: 'University laptop',
    network: 'eduroam', source: 'DNS security', location: 'Engineering Block B, Ground floor', faculty: 'Engineering', user: engStudents[2], severity: 'High', status: 'On hold', owner: 'Kumar (Network ops)',
    notes: [opened('08:47', 'DNS security'), { time: '09:02', by: 'Kumar (Network ops)', text: 'Device isolated from the network. Waiting for the student to bring it to the ICT counter for cleaning.', status: 'On hold' }],
  },
  {
    id: 'NET-2026-0138', detected: '08:15', policyId: 'pol-unreg', category: 'Unauthorised device', title: 'Unregistered device joined the lab network',
    evidence: 'Hardware address not in the asset register. Device moved to the guest network automatically.', device: 'Unregistered laptop', deviceKind: 'Unknown device',
    network: 'Lab LAN', source: 'Network access control', location: 'Electronics Lab EA-210', faculty: 'Engineering', user: null, severity: 'Medium', status: 'Resolved', owner: 'Kumar (Network ops)',
    notes: [opened('08:15', 'Network access control'), { time: '08:40', by: 'Kumar (Network ops)', text: 'Visiting contractor laptop. Given temporary guest access for the day.', status: 'Resolved' }],
  },
  {
    id: 'NET-2026-0135', detected: 'Yesterday 16:20', policyId: 'pol-scan', category: 'Network attack', title: 'Port scan across the lab subnet',
    evidence: 'Lab PC probed 254 addresses on 22 ports in 90 seconds.', device: 'ENG-EB110-PC03', deviceKind: 'Lab PC',
    network: 'Lab LAN', source: 'Firewall (IPS)', location: 'Lecture Hall EB-110', faculty: 'Engineering', user: engStudents[4], severity: 'High', status: 'False positive', owner: 'Azlan (IT security)',
    notes: [opened('16:20', 'Firewall intrusion prevention'), { time: '16:55', by: 'Azlan (IT security)', text: 'Approved network security lab exercise (KEE4412). Exception added for lab sessions.', status: 'False positive' }],
  },
]

// Events the automatic monitoring draws from to record new incidents.
export const liveEventPool: Omit<Incident, 'id' | 'detected' | 'status' | 'owner' | 'notes'>[] = [
  { policyId: 'pol-scan', category: 'Network attack', title: 'ARP spoofing detected on the lab network', evidence: 'A device claimed the gateway address and redirected traffic from 8 lab PCs.', device: 'ENG-EA210-PC09', deviceKind: 'Lab PC', network: 'Lab LAN', source: 'Firewall (IPS)', location: 'Electronics Lab EA-210', faculty: 'Engineering', user: engStudents[1], severity: 'High' },
  { policyId: 'pol-unreg', category: 'Unauthorised device', title: 'Unregistered device on the IoT network', evidence: 'Unknown hardware address tried to reach room controllers on UM-IoT. Blocked and moved to guest network.', device: 'Unknown device', deviceKind: 'Unknown device', network: 'UM-IoT (VLAN 120)', source: 'Network access control', location: 'Lecture Hall EA-1', faculty: 'Engineering', user: null, severity: 'Medium' },
  { policyId: 'pol-exfil', category: 'Data exfiltration', title: 'Possible DNS tunnelling from a university laptop', evidence: 'Unusually long and frequent DNS queries to a newly registered domain, about 300 MB in 20 minutes.', device: 'UM-ENG-LT-0611', deviceKind: 'University laptop', network: 'UM-WiFi', source: 'DNS security', location: 'Engineering Auditorium', faculty: 'Engineering', user: engStudents[3], severity: 'High' },
  { policyId: 'pol-drift', category: 'Network inconsistency', title: 'Access point running outdated security settings', evidence: 'AP-EB0-02 is broadcasting with an older encryption mode that differs from the campus standard.', device: 'AP-EB0-02', deviceKind: 'University access point', network: 'UM-WiFi', source: 'Wi-Fi controller', location: 'Engineering Block B, Ground floor', faculty: 'Engineering', user: null, severity: 'Low' },
  { policyId: 'pol-brute', category: 'Credential attack', title: 'Sign-ins to one account from two countries within 10 minutes', evidence: 'Successful sign-in on campus, then a failed sign-in from overseas using the same account.', device: 'Student account 23005419', deviceKind: 'Account', network: 'eduroam', source: 'Wi-Fi sign-in (identity)', location: 'Engineering Block A, Level 1', faculty: 'Engineering', user: engStudents[5], severity: 'Medium' },
  { policyId: 'pol-policy', category: 'Policy breach', title: 'VPN used to bypass campus filtering', evidence: 'Unapproved VPN client connected during teaching hours on a university laptop.', device: 'UM-ENG-LT-0533', deviceKind: 'University laptop', network: 'UM-WiFi', source: 'Firewall (IPS)', location: 'Lecture Hall EB-110', faculty: 'Engineering', user: engStudents[2], severity: 'Medium' },
  { policyId: 'pol-drift', category: 'Network inconsistency', title: 'Wi-Fi address pool almost exhausted', evidence: '97% of addresses in use on the Engineering Block B pool. New devices may fail to connect.', device: 'DHCP pool ENG-B-WIFI', deviceKind: 'Network service', network: 'UM-WiFi', source: 'Wi-Fi controller', location: 'Engineering Block B', faculty: 'Engineering', user: null, severity: 'Low' },
  { policyId: 'pol-rogue', category: 'Rogue access point', title: 'Personal hotspot named "eduroam" detected', evidence: 'A phone hotspot is copying the eduroam name, which can capture sign-in details.', device: 'Unknown access point', deviceKind: 'Access point (not university-owned)', network: 'Campus Wi-Fi airspace', source: 'Wireless intrusion detection', location: 'Engineering Block A, Level 2', faculty: 'Engineering', user: null, severity: 'High' },
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
  { label: 'Blocked or suspicious', value: 4 },
]

export const usageByBuilding = [
  { label: 'Engineering Block A', value: 1240 },
  { label: 'Engineering Block B', value: 980 },
  { label: 'FSKTM', value: 1410 },
  { label: 'Business and Economics', value: 760 },
  { label: 'Central Auditorium', value: 210 },
]

export const telemetrySources = [
  { name: 'Wireless intrusion detection', kind: 'Scans campus airspace for rogue access points', last: '8 s ago', state: 'Live' as const },
  { name: 'Firewall (IPS)', kind: 'Intrusion prevention and traffic analysis', last: '12 s ago', state: 'Live' as const },
  { name: 'DNS security', kind: 'Blocks malicious and command-and-control domains', last: '20 s ago', state: 'Live' as const },
  { name: 'Network access control', kind: 'Checks every device against the asset register', last: '15 s ago', state: 'Live' as const },
  { name: 'Wi-Fi sign-in (identity)', kind: 'Sign-in attempts on UM-WiFi and eduroam', last: '6 s ago', state: 'Live' as const },
  { name: 'Endpoint agent', kind: 'University laptops, reports from any network', last: '18 min ago', state: 'Stale' as const },
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
  { id: 'au4', time: '09:02', actor: 'Kumar (Network ops)', area: 'Network', action: 'Put incident on hold', target: 'NET-2026-0139', detail: 'Device isolated, waiting for cleaning' },
  { id: 'au3', time: '08:55', actor: 'Prof. Dr. Lim Mei Ling', area: 'Reports', action: 'Exported report', target: 'Attendance by faculty, week 6' },
  { id: 'au2', time: '08:20', actor: 'Facilities admin', area: 'Devices', action: 'Paired device', target: 'FSKTM-DK2 front display', detail: 'Pairing number verified, UM-IoT (VLAN 120)' },
  { id: 'au1', time: '08:02', actor: 'Facilities admin', area: 'Rooms', action: 'Changed room state', target: 'FSKTM-MK1', detail: 'Operational to Under maintenance' },
]
