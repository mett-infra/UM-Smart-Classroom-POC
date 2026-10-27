import { useMemo, useRef, useState } from 'react'
import { Building2, CheckCircle2, ChevronDown, ChevronRight, Circle, CircleAlert, Download, FileUp, Plus, Search, Upload, XCircle } from 'lucide-react'
import { Badge, Empty, Metric, Modal, Notice, PageHead, Panel, Switch, Tabs, type Tone } from '../../components/ui'
import { buildings, CAMPUS, type Device, type DeviceType, type Space, type SpaceState, type SpaceType } from '../../data/smartcampus'
import { useDemo } from '../../store/DemoStore'
import { downloadCsv } from './csv'
import '../../styles/management.css'
import '../../styles/smartcampus.css'

const SPACE_TYPES: SpaceType[] = ['Lecture hall', 'Auditorium', 'Smart room', 'Seminar room', 'Lab']
const STATES: SpaceState[] = ['Operational', 'Setup incomplete', 'Under maintenance', 'Deactivated']
const DEVICE_TYPES: DeviceType[] = ['Interactive display', 'Projector', 'Lights', 'Fan', 'Air-conditioning', 'PTZ camera', 'People counter', 'Motion sensor', 'Door controller', 'Ceiling microphone', 'Room controller']
const stateTone: Record<SpaceState, Tone> = { Operational: 'green', 'Setup incomplete': 'amber', 'Under maintenance': 'red', Deactivated: '' }
const devTone = { Online: 'green', Offline: 'red', Stale: 'amber' } as const
const CODE_RE = /^[A-Z0-9-]{3,20}$/

export function setupChecks(sp: Space, devices: Device[]) {
  const mine = devices.filter((d) => d.spaceId === sp.id)
  return [
    { label: 'Devices registered', ok: mine.length > 0, detail: `${mine.length} devices` },
    { label: 'Occupancy source linked', ok: !!sp.occupancySource, detail: sp.occupancySource ?? 'Not configured' },
    { label: 'Door controller linked', ok: !!sp.doorId, detail: sp.doorId ?? 'Not configured' },
    { label: 'Timetable linked', ok: sp.timetable, detail: sp.timetable ? 'Student information system timetable' : 'Not linked' },
    { label: 'All devices reporting', ok: mine.every((d) => d.status === 'Online'), detail: `${mine.filter((d) => d.status !== 'Online').length} offline or stale` },
  ]
}

export default function CampusSetup() {
  const { state } = useDemo()
  const [tab, setTab] = useState<'rooms' | 'devices'>('rooms')
  const [sel, setSel] = useState(state.spaces[1]?.id ?? '')
  const [adding, setAdding] = useState(false)
  const [importing, setImporting] = useState(false)

  const offline = state.devices.filter((d) => d.status !== 'Online').length
  const incomplete = state.spaces.filter((s) => s.state === 'Setup incomplete').length

  return (
    <>
      <PageHead
        title="Campus setup"
        sub="Set up buildings, rooms and the devices in them. Rooms become operational once their setup checks pass."
        actions={
          <>
            <button className="btn secondary" onClick={() => setImporting(true)}>
              <Upload size={16} /> Import rooms
            </button>
            <button className="btn" onClick={() => setAdding(true)}>
              <Plus size={16} /> Add room
            </button>
          </>
        }
      />
      <div className="metrics m-5">
        <Metric label="Buildings" value={buildings.length} foot={CAMPUS} />
        <Metric label="Rooms and spaces" value={state.spaces.filter((s) => s.state !== 'Deactivated').length} foot={`${state.spaces.filter((s) => s.type === 'Auditorium').length} auditoriums`} />
        <Metric label="Registered devices" value={state.devices.length} foot="Displays, lights, sensors, doors" />
        <Metric label="Offline or stale" value={offline} foot={<span className={offline ? 'delta-down' : ''}>Needs attention</span>} />
        <Metric label="Setup incomplete" value={incomplete} foot="Rooms not yet operational" />
      </div>
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'rooms', label: 'Rooms and spaces' },
          { id: 'devices', label: <>Device registry <Badge>{state.devices.length}</Badge></> },
        ]}
      />
      {tab === 'rooms' ? <RoomsTab sel={sel} setSel={setSel} /> : <DevicesTab />}
      <AddRoomModal open={adding} onClose={() => setAdding(false)} onAdded={(id) => { setSel(id); setTab('rooms') }} />
      <ImportModal open={importing} onClose={() => setImporting(false)} />
    </>
  )
}

/* ---------------- Rooms tab ---------------- */

function RoomsTab({ sel, setSel }: { sel: string; setSel: (id: string) => void }) {
  const { state } = useDemo()
  const [q, setQ] = useState('')
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const space = state.spaces.find((s) => s.id === sel)

  return (
    <div className="grid g-side-main">
      <Panel title={CAMPUS} sub="Campus, building, floor and room" bodyClass="panel-body tight">
        <div style={{ padding: '4px 16px 10px' }}>
          <div className="search-field">
            <Search size={16} />
            <input className="input sm" placeholder="Find a room or code" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Find a room" />
          </div>
        </div>
        <div className="tree">
          {buildings.map((b) => {
            const rooms = state.spaces.filter((s) => s.buildingId === b.id && `${s.name} ${s.code}`.toLowerCase().includes(q.toLowerCase()))
            if (q && rooms.length === 0) return null
            const open = !collapsed[b.id] || !!q
            return (
              <div key={b.id}>
                <button className="tree-b" onClick={() => setCollapsed((c) => ({ ...c, [b.id]: !c[b.id] }))} aria-expanded={open}>
                  {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                  <Building2 size={15} />
                  <span className="grow truncate">{b.name}</span>
                  <span className="xs muted">{rooms.length}</span>
                </button>
                {open &&
                  b.floors.map((f) => {
                    const fr = rooms.filter((r) => r.floor === f)
                    if (fr.length === 0) return null
                    return (
                      <div key={f} className="tree-f">
                        <div className="tree-fl">{f}</div>
                        {fr.map((r) => (
                          <button key={r.id} className={`tree-r ${r.id === sel ? 'on' : ''}`} onClick={() => setSel(r.id)}>
                            <span className={`dot st-${stateTone[r.state] || 'grey'}`} />
                            <span className="grow truncate">{r.name}</span>
                            <span className="xs muted">{r.code}</span>
                          </button>
                        ))}
                      </div>
                    )
                  })}
              </div>
            )
          })}
        </div>
      </Panel>
      {space ? <RoomEditor key={space.id} space={space} /> : <Panel><Empty title="Choose a room">Select a room on the left to see and edit its setup.</Empty></Panel>}
    </div>
  )
}

function RoomEditor({ space }: { space: Space }) {
  const { state, update, toast, audit } = useDemo()
  const [draft, setDraft] = useState<Space>(space)
  const [regOpen, setRegOpen] = useState(false)
  const [confirmDeact, setConfirmDeact] = useState(false)
  const devices = state.devices.filter((d) => d.spaceId === space.id)
  const checks = setupChecks(draft, state.devices)
  const passing = checks.filter((c) => c.ok).length
  const b = buildings.find((x) => x.id === space.buildingId)!
  const dirty = JSON.stringify(draft) !== JSON.stringify(space)

  const save = () => {
    const code = draft.code.trim().toUpperCase()
    if (!draft.name.trim()) return toast('Room name is required.', 'warn')
    if (!CODE_RE.test(code)) return toast('Room code must be 3 to 20 characters: capital letters, numbers and hyphens.', 'warn')
    if (state.spaces.some((s) => s.id !== space.id && s.code === code)) return toast(`Room code ${code} is already used by another room.`, 'warn')
    if (!(draft.capacity > 0 && draft.capacity <= 5000)) return toast('Capacity must be between 1 and 5000.', 'warn')
    const changes = (Object.keys(draft) as (keyof Space)[]).filter((k) => String(draft[k]) !== String(space[k])).map((k) => `${k}: ${String(space[k])} to ${String(k === 'code' ? code : draft[k])}`)
    update((s) => ({ ...s, spaces: s.spaces.map((x) => (x.id === space.id ? { ...draft, code } : x)) }))
    audit({ area: 'Rooms', action: 'Updated room', target: code, detail: changes.join('; ') || 'No field changes' })
    toast(`${draft.name} saved.`)
  }

  const deactivate = () => {
    update((s) => ({ ...s, spaces: s.spaces.map((x) => (x.id === space.id ? { ...x, state: 'Deactivated' } : x)) }))
    audit({ area: 'Rooms', action: 'Deactivated room', target: space.code })
    toast(`${space.name} deactivated. It no longer appears in schedules.`)
    setConfirmDeact(false)
  }

  const set = <K extends keyof Space>(k: K, v: Space[K]) => setDraft((d) => ({ ...d, [k]: v }))

  return (
    <div className="stack">
      <Panel
        title={space.name}
        sub={`${space.code}, ${b.name}, ${space.floor}`}
        action={<Badge tone={stateTone[space.state]}>{space.state}</Badge>}
        foot={
          <>
            <span>{dirty ? 'You have unsaved changes.' : 'All changes saved.'}</span>
            <div className="row" style={{ gap: 8 }}>
              {space.state !== 'Deactivated' && (
                <button className="btn secondary sm" onClick={() => setConfirmDeact(true)}>
                  Deactivate room
                </button>
              )}
              <button className="btn sm" onClick={save} disabled={!dirty}>
                Save changes
              </button>
            </div>
          </>
        }
      >
        <div className="grid g-2" style={{ gap: 12 }}>
          <div className="field">
            <label htmlFor="rm-name">Room name</label>
            <input id="rm-name" className="input" value={draft.name} onChange={(e) => set('name', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="rm-code">Room code</label>
            <input id="rm-code" className="input" value={draft.code} onChange={(e) => set('code', e.target.value.toUpperCase())} />
          </div>
          <div className="field">
            <label htmlFor="rm-type">Type</label>
            <select id="rm-type" className="select" value={draft.type} onChange={(e) => set('type', e.target.value as SpaceType)}>
              {SPACE_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="rm-cap">Capacity</label>
            <input id="rm-cap" className="input" type="number" min={1} value={draft.capacity} onChange={(e) => set('capacity', Number(e.target.value))} />
          </div>
          <div className="field">
            <label htmlFor="rm-state">State</label>
            <select id="rm-state" className="select" value={draft.state} onChange={(e) => set('state', e.target.value as SpaceState)}>
              {STATES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="rm-occ">Occupancy source</label>
            <select id="rm-occ" className="select" value={draft.occupancySource ?? ''} onChange={(e) => set('occupancySource', e.target.value || null)}>
              <option value="">Not configured</option>
              {[...new Set([space.occupancySource, `People counter PC-${space.code}`, `Motion sensor MS-${space.code}`].filter(Boolean) as string[])].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="rm-cam">Attendance camera</label>
            <select id="rm-cam" className="select" value={draft.camera ?? ''} onChange={(e) => set('camera', e.target.value || null)}>
              <option value="">None</option>
              {[...new Set([space.camera, `PTZ-${space.code}`].filter(Boolean) as string[])].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="rm-door">Door controller</label>
            <select id="rm-door" className="select" value={draft.doorId ?? ''} onChange={(e) => set('doorId', e.target.value || null)}>
              <option value="">Not configured</option>
              {[...new Set([space.doorId, `DR-${space.code}`].filter(Boolean) as string[])].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="row wrap" style={{ gap: 24, marginTop: 4 }}>
          <label className="row small" style={{ gap: 8 }}>
            <Switch on={draft.timetable} onChange={(v) => set('timetable', v)} label="Timetable linked" /> Linked to the timetable
          </label>
          <label className="row small" style={{ gap: 8 }}>
            <Switch on={draft.voice} onChange={(v) => set('voice', v)} label="Voice commands" /> Voice commands allowed
          </label>
        </div>
      </Panel>

      <div className="grid g-2">
        <Panel title="Setup checks" sub={passing === checks.length ? 'Ready to operate' : `${checks.length - passing} of ${checks.length} checks need attention`}>
          <div className="checks">
            {checks.map((c) => (
              <div key={c.label} className="check-row">
                {c.ok ? <CheckCircle2 size={18} color="var(--green)" /> : <CircleAlert size={18} color="var(--amber)" />}
                <div className="grow">
                  <strong className="small">{c.label}</strong>
                  <div className="xs muted">{c.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Devices in this room" sub={`${devices.length} registered`} action={<button className="btn xs secondary" onClick={() => setRegOpen(true)}><Plus size={13} /> Register device</button>} bodyClass="panel-body tight">
          <div className="list">
            {devices.length === 0 && <p className="small muted" style={{ padding: '8px 20px' }}>No devices registered yet.</p>}
            {devices.map((d) => (
              <div key={d.id} className="list-item" style={{ padding: '10px 20px' }}>
                <Circle size={9} fill={d.status === 'Online' ? 'var(--green)' : d.status === 'Stale' ? 'var(--amber)' : 'var(--red)'} color="transparent" />
                <div className="grow">
                  <div className="title small truncate">{d.type}</div>
                  <div className="sub xs truncate">
                    {d.id}, last seen {d.lastSeen}
                  </div>
                </div>
                <Badge tone={devTone[d.status]}>{d.status}</Badge>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <RegisterDeviceModal open={regOpen} onClose={() => setRegOpen(false)} space={space} />
      <Modal
        open={confirmDeact}
        onClose={() => setConfirmDeact(false)}
        title={`Deactivate ${space.name}?`}
        sub="The room is hidden from schedules and automation. Its devices and history are kept, and you can reactivate it later."
        foot={
          <>
            <button className="btn secondary" onClick={() => setConfirmDeact(false)}>
              Keep active
            </button>
            <button className="btn danger" onClick={deactivate}>
              Deactivate room
            </button>
          </>
        }
      >
        <p className="small">This change is recorded in the audit log.</p>
      </Modal>
    </div>
  )
}

function RegisterDeviceModal({ open, onClose, space }: { open: boolean; onClose: () => void; space: Space }) {
  const { state, update, toast, audit } = useDemo()
  const [type, setType] = useState<DeviceType>('Interactive display')
  const [model, setModel] = useState('')
  const save = () => {
    const n = state.devices.filter((d) => d.spaceId === space.id).length
    const id = `${space.code}-${type.split(' ').map((w) => w[0]).join('').toUpperCase()}${n}`
    if (state.devices.some((d) => d.id === id)) return toast(`Device ID ${id} already exists.`, 'warn')
    const dev: Device = { id, type, spaceId: space.id, model: model.trim() || `${type}, model to be confirmed`, status: 'Online', capabilities: ['On / off'], lastSeen: 'Just now', maintenance: 'No action needed', autoOffEligible: ['Interactive display', 'Projector', 'Lights', 'Fan', 'Air-conditioning'].includes(type) }
    update((s) => ({ ...s, devices: [...s.devices, dev] }))
    audit({ area: 'Devices', action: 'Registered device', target: id, detail: `${type} in ${space.code}` })
    toast(`${type} registered as ${id}. Connection test passed (simulated).`)
    setModel('')
    onClose()
  }
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Register a device"
      sub={`Adds the device to ${space.name} and runs a connection test through the IoT gateway.`}
      foot={
        <>
          <button className="btn secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn" onClick={save}>
            Register device
          </button>
        </>
      }
    >
      <div className="field">
        <label htmlFor="dv-type">Device type</label>
        <select id="dv-type" className="select" value={type} onChange={(e) => setType(e.target.value as DeviceType)}>
          {DEVICE_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="dv-model">Vendor and model</label>
        <input id="dv-model" className="input" value={model} onChange={(e) => setModel(e.target.value)} placeholder="Optional, e.g. existing university display model" />
      </div>
    </Modal>
  )
}

/* ---------------- Device registry ---------------- */

function DevicesTab() {
  const { state } = useDemo()
  const [q, setQ] = useState('')
  const [type, setType] = useState('all')
  const [status, setStatus] = useState('all')
  const [bld, setBld] = useState('all')
  const spaceOf = useMemo(() => Object.fromEntries(state.spaces.map((s) => [s.id, s])), [state.spaces])
  const list = state.devices.filter((d) => {
    const sp = spaceOf[d.spaceId]
    if (type !== 'all' && d.type !== type) return false
    if (status !== 'all' && d.status !== status) return false
    if (bld !== 'all' && sp?.buildingId !== bld) return false
    return `${d.id} ${d.type} ${sp?.name} ${d.model}`.toLowerCase().includes(q.toLowerCase())
  })
  return (
    <Panel bodyClass="">
      <div className="mg-filters">
        <div className="search-field">
          <Search size={16} />
          <input className="input" placeholder="Search device ID, type or room" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search devices" />
        </div>
        <select className="select" value={type} onChange={(e) => setType(e.target.value)} aria-label="Type">
          <option value="all">All types</option>
          {DEVICE_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <select className="select" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          <option value="all">Any status</option>
          <option>Online</option>
          <option>Stale</option>
          <option>Offline</option>
        </select>
        <select className="select" value={bld} onChange={(e) => setBld(e.target.value)} aria-label="Building">
          <option value="all">All buildings</option>
          {buildings.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Device</th>
              <th>Room</th>
              <th>Model</th>
              <th>Can do</th>
              <th>Auto-off</th>
              <th>Status</th>
              <th>Last seen</th>
            </tr>
          </thead>
          <tbody>
            {list.map((d) => (
              <tr key={d.id}>
                <td>
                  <strong className="small">{d.type}</strong>
                  <div className="xs muted">{d.id}</div>
                </td>
                <td className="small">{spaceOf[d.spaceId]?.name}</td>
                <td className="small">{d.model}</td>
                <td className="xs">{d.capabilities.join(', ')}</td>
                <td>{d.autoOffEligible ? <Badge tone="blue">Eligible</Badge> : <Badge>Excluded</Badge>}</td>
                <td>
                  <Badge tone={devTone[d.status]}>{d.status}</Badge>
                </td>
                <td className="small">{d.lastSeen}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="panel-foot">
        <span>
          Showing {list.length} of {state.devices.length} devices. Door controllers, cameras and sensors are always excluded from automatic switch-off.
        </span>
      </div>
    </Panel>
  )
}

/* ---------------- Add room ---------------- */

function AddRoomModal({ open, onClose, onAdded }: { open: boolean; onClose: () => void; onAdded: (id: string) => void }) {
  const { state, update, toast, audit } = useDemo()
  const [bid, setBid] = useState(buildings[0].id)
  const [floor, setFloor] = useState(buildings[0].floors[0])
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [type, setType] = useState<SpaceType>('Seminar room')
  const [cap, setCap] = useState(40)
  const [err, setErr] = useState('')
  const b = buildings.find((x) => x.id === bid)!

  const save = () => {
    const c = code.trim().toUpperCase()
    if (!name.trim()) return setErr('Enter a room name.')
    if (!CODE_RE.test(c)) return setErr('Room code must be 3 to 20 characters: capital letters, numbers and hyphens.')
    if (state.spaces.some((s) => s.code === c)) return setErr(`Room code ${c} already exists. Use a different code.`)
    if (!(cap > 0 && cap <= 5000)) return setErr('Capacity must be between 1 and 5000.')
    const sp: Space = { id: `sp-${Date.now()}`, code: c, name: name.trim(), buildingId: bid, floor, type, capacity: cap, state: 'Setup incomplete', occupancySource: null, camera: null, doorId: null, timetable: false, voice: false }
    update((s) => ({ ...s, spaces: [...s.spaces, sp] }))
    audit({ area: 'Rooms', action: 'Created room', target: c, detail: `${type}, ${b.name}, ${floor}, capacity ${cap}` })
    toast(`${sp.name} created. Finish its setup checks to make it operational.`)
    setName('')
    setCode('')
    setErr('')
    onClose()
    onAdded(sp.id)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add room"
      sub="New rooms start as Setup incomplete until devices, sensors and the door controller are linked."
      foot={
        <>
          <button className="btn secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn" onClick={save}>
            Create room
          </button>
        </>
      }
    >
      <div className="grid g-2" style={{ gap: 12 }}>
        <div className="field">
          <label htmlFor="ar-b">Building</label>
          <select
            id="ar-b"
            className="select"
            value={bid}
            onChange={(e) => {
              setBid(e.target.value)
              setFloor(buildings.find((x) => x.id === e.target.value)!.floors[0])
            }}
          >
            {buildings.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="ar-f">Floor</label>
          <select id="ar-f" className="select" value={floor} onChange={(e) => setFloor(e.target.value)}>
            {b.floors.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="ar-n">Room name</label>
          <input id="ar-n" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. BK3" />
        </div>
        <div className="field">
          <label htmlFor="ar-c">Room code</label>
          <input id="ar-c" className="input" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. FSKTM-BK3" />
        </div>
        <div className="field">
          <label htmlFor="ar-t">Type</label>
          <select id="ar-t" className="select" value={type} onChange={(e) => setType(e.target.value as SpaceType)}>
            {SPACE_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="ar-cap">Capacity</label>
          <input id="ar-cap" className="input" type="number" min={1} value={cap} onChange={(e) => setCap(Number(e.target.value))} />
        </div>
      </div>
      {err && (
        <p className="small c-red row" style={{ gap: 6 }}>
          <XCircle size={14} /> {err}
        </p>
      )}
    </Modal>
  )
}

/* ---------------- Bulk import ---------------- */

interface ImportRow {
  line: number
  building: string
  floor: string
  code: string
  name: string
  type: string
  capacity: string
  error?: string
}

function ImportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, update, toast, audit } = useDemo()
  const [rows, setRows] = useState<ImportRow[] | null>(null)
  const [file, setFile] = useState('')
  const input = useRef<HTMLInputElement>(null)

  const template = () => {
    downloadCsv('room-import-template.csv', [
      ['building', 'floor', 'room_code', 'room_name', 'type', 'capacity'],
      ['FSKTM', 'Level 2', 'FSKTM-BK3', 'BK3', 'Seminar room', 40],
      ['Eng A', 'Level 2', 'ENG-EA-205', 'Smart Room EA-205', 'Smart room', 48],
      ['Eng B', 'Level 1', 'ENG-EA-101', 'Duplicate code example', 'Lecture hall', 200],
    ])
    toast('Template downloaded. The last row shows what a validation error looks like.', 'info')
  }

  const parse = (text: string) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim())
    const seen = new Set<string>()
    const out: ImportRow[] = lines.slice(1).map((l, i) => {
      const [building = '', floor = '', code = '', name = '', type = '', capacity = ''] = l.split(',').map((x) => x.trim().replace(/^"|"$/g, ''))
      const r: ImportRow = { line: i + 2, building, floor, code: code.toUpperCase(), name, type, capacity }
      const b = buildings.find((x) => x.short.toLowerCase() === building.toLowerCase() || x.name.toLowerCase() === building.toLowerCase())
      const cap = Number(capacity)
      if (!b) r.error = `Unknown building "${building}"`
      else if (!b.floors.includes(floor)) r.error = `Floor "${floor}" not found in ${b.short}`
      else if (!CODE_RE.test(r.code)) r.error = 'Room code format is invalid'
      else if (state.spaces.some((s) => s.code === r.code) || seen.has(r.code)) r.error = `Room code ${r.code} already exists`
      else if (!name) r.error = 'Room name is missing'
      else if (!SPACE_TYPES.includes(type as SpaceType)) r.error = `Type "${type}" is not allowed`
      else if (!(cap > 0 && cap <= 5000)) r.error = 'Capacity must be 1 to 5000'
      seen.add(r.code)
      return r
    })
    setRows(out)
  }

  const valid = rows?.filter((r) => !r.error) ?? []

  const doImport = () => {
    const add: Space[] = valid.map((r, k) => {
      const b = buildings.find((x) => x.short.toLowerCase() === r.building.toLowerCase() || x.name.toLowerCase() === r.building.toLowerCase())!
      return { id: `sp-imp-${Date.now()}-${k}`, code: r.code, name: r.name, buildingId: b.id, floor: r.floor, type: r.type as SpaceType, capacity: Number(r.capacity), state: 'Setup incomplete', occupancySource: null, camera: null, doorId: null, timetable: false, voice: false }
    })
    update((s) => ({ ...s, spaces: [...s.spaces, ...add] }))
    audit({ area: 'Rooms', action: 'Imported rooms', target: file || 'CSV file', detail: `${add.length} imported, ${(rows?.length ?? 0) - add.length} rejected` })
    toast(`${add.length} rooms imported. ${(rows?.length ?? 0) - add.length} rows were skipped.`)
    setRows(null)
    setFile('')
    onClose()
  }

  const downloadErrors = () => {
    downloadCsv('room-import-errors.csv', [['line', 'room_code', 'error'], ...(rows ?? []).filter((r) => r.error).map((r) => [r.line, r.code, r.error ?? ''])])
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        setRows(null)
        onClose()
      }}
      wide
      title="Import rooms from a spreadsheet"
      sub="Upload a CSV file. Each row is checked before anything is saved."
      foot={
        rows ? (
          <>
            {rows.some((r) => r.error) && (
              <button className="btn secondary" onClick={downloadErrors}>
                <Download size={15} /> Download errors
              </button>
            )}
            <button className="btn" onClick={doImport} disabled={valid.length === 0}>
              Import {valid.length} valid rows
            </button>
          </>
        ) : (
          <button className="btn secondary" onClick={template}>
            <Download size={15} /> Download template
          </button>
        )
      }
    >
      {!rows ? (
        <>
          <div className="dropzone" role="button" tabIndex={0} onClick={() => input.current?.click()} onKeyDown={(e) => e.key === 'Enter' && input.current?.click()}>
            <FileUp size={26} />
            <strong style={{ color: 'var(--ink)' }}>Choose a CSV file</strong>
            <div className="xs">Columns: building, floor, room_code, room_name, type, capacity. The file is read in your browser only.</div>
            <input
              ref={input}
              type="file"
              accept=".csv,text/csv"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (!f) return
                setFile(f.name)
                f.text().then(parse)
                e.target.value = ''
              }}
            />
          </div>
          <p className="xs muted mt-2">Tip: download the template, then choose it here to see how validation works.</p>
        </>
      ) : (
        <>
          <Notice tone={rows.some((r) => r.error) ? '' : 'blue'}>
            {file}: {valid.length} of {rows.length} rows are valid.
          </Notice>
          <div className="table-wrap mt-2">
            <table className="table">
              <thead>
                <tr>
                  <th>Line</th>
                  <th>Room code</th>
                  <th>Name</th>
                  <th>Building</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.line}>
                    <td className="num">{r.line}</td>
                    <td>{r.code}</td>
                    <td>{r.name}</td>
                    <td>
                      {r.building}, {r.floor}
                    </td>
                    <td>{r.error ? <span className="small c-red">{r.error}</span> : <Badge tone="green">Ready to import</Badge>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Modal>
  )
}
