import { useMemo, useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Activity, AirVent, DoorClosed, DoorOpen, Fan, Lightbulb, Link2, Mic, MicOff, Minus, Monitor, Plus, Power, Projector, Router, Search, Settings2, Users, Video } from 'lucide-react'
import { Badge, Empty, Metric, Modal, Notice, PageHead, Panel, Seg, Switch, type Tone } from '../../components/ui'
import { buildings, type Device, type DeviceType, type Space } from '../../data/smartcampus'
import { defaultDeviceState, useDemo, type DeviceState } from '../../store/DemoStore'
import '../../styles/management.css'
import '../../styles/smartcampus.css'

const stateTone: Record<Space['state'], Tone> = { Operational: 'green', 'Setup incomplete': 'amber', 'Under maintenance': 'red', Deactivated: '' }

const iconFor = (d: Device, st: DeviceState, size = 18): ReactNode => {
  switch (d.type) {
    case 'Interactive display':
      return <Monitor size={size} />
    case 'Projector':
      return <Projector size={size} />
    case 'Lights':
      return <Lightbulb size={size} />
    case 'Fan':
      return <Fan size={size} className={st.on ? 'spin-slow' : ''} />
    case 'Air-conditioning':
      return <AirVent size={size} />
    case 'PTZ camera':
      return <Video size={size} />
    case 'Ceiling microphone':
      return st.on ? <Mic size={size} /> : <MicOff size={size} />
    case 'Door controller':
      return st.locked ? <DoorClosed size={size} /> : <DoorOpen size={size} />
    case 'People counter':
      return <Users size={size} />
    case 'Motion sensor':
      return <Activity size={size} />
    default:
      return <Router size={size} />
  }
}

// Where each device type sits on the room layout (percent of width, height).
const spot: Record<DeviceType, [number, number]> = {
  'Interactive display': [36, 9],
  Projector: [62, 24],
  Lights: [16, 38],
  Fan: [80, 50],
  'Air-conditioning': [93, 30],
  'PTZ camera': [7, 9],
  'Ceiling microphone': [50, 52],
  'Door controller': [9, 90],
  'People counter': [24, 90],
  'Motion sensor': [91, 10],
  'Room controller': [80, 90],
}

const SENSORS: DeviceType[] = ['People counter', 'Motion sensor', 'Room controller']

function defaultsFor(t: DeviceType): DeviceState {
  const d = defaultDeviceState()
  if (t === 'Projector') d.on = false
  if (t === 'Door controller') d.locked = false
  return d
}

function describe(d: Device, st: DeviceState, occupancy: number) {
  if (d.status === 'Offline') return 'Offline'
  switch (d.type) {
    case 'Lights':
      return st.on ? `On, ${st.level}%` : 'Off'
    case 'Air-conditioning':
      return st.on ? `On, ${st.temp}°C` : 'Off'
    case 'Fan':
      return st.on ? `On, speed ${st.speed}` : 'Off'
    case 'Interactive display':
      return st.on ? `On, ${st.input}` : 'Off'
    case 'Door controller':
      return st.locked ? 'Locked' : 'Unlocked'
    case 'Ceiling microphone':
      return st.on ? 'Live' : 'Muted'
    case 'PTZ camera':
      return st.on ? 'Tracking presenter' : 'Paused'
    case 'People counter':
      return `${occupancy} people now`
    case 'Motion sensor':
      return 'Motion 1 min ago'
    case 'Room controller':
      return 'Connected'
    default:
      return st.on ? 'On' : 'Off'
  }
}

type Scene = 'start' | 'present' | 'hybrid' | 'exam' | 'off'
const SCENES: { id: Scene; label: string; hint: string }[] = [
  { id: 'start', label: 'Start class', hint: 'Lights 80%, display and audio on, door unlocked' },
  { id: 'present', label: 'Presentation', hint: 'Lights dimmed to 35%, projector and display on' },
  { id: 'hybrid', label: 'Hybrid', hint: 'Camera tracking, microphones live, display on' },
  { id: 'exam', label: 'Exam', hint: 'Full lights, displays and microphones off' },
  { id: 'off', label: 'Shut down room', hint: 'Switch everything off and lock the door' },
]

export default function Rooms() {
  const { state } = useDemo()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState('')
  const [bld, setBld] = useState('all')
  const rooms = state.spaces.filter((s) => s.kind === 'sub' && s.state !== 'Deactivated')
  const devicesIn = (id: string) => state.devices.filter((d) => d.spaceId === id)
  const shown = rooms.filter((r) => (bld === 'all' || r.buildingId === bld) && `${r.name} ${r.code}`.toLowerCase().includes(q.toLowerCase()))
  const sel = params.get('room') && rooms.some((r) => r.id === params.get('room')) ? params.get('room')! : 'sp-dk2'
  const room = rooms.find((r) => r.id === sel) ?? rooms[0]
  const withDevices = rooms.filter((r) => devicesIn(r.id).length > 0).length
  const online = state.devices.filter((d) => d.status === 'Online').length
  const onNow = state.devices.filter((d) => !SENSORS.includes(d.type) && d.status === 'Online' && (state.deviceState[d.id] ?? defaultsFor(d.type)).on).length

  return (
    <>
      <PageHead
        title="Smart rooms"
        sub="Every room set up in Campus setup, with the devices paired to it. Pick a room, then tap a device on the layout to control it."
        actions={
          <Link to="/management/campus" className="btn secondary">
            <Settings2 size={16} /> Campus setup
          </Link>
        }
      />
      <div className="metrics">
        <Metric label="Rooms with devices" value={withDevices} foot={`Of ${rooms.length} active sub rooms`} />
        <Metric label="Devices online" value={online} foot={`Of ${state.devices.length} paired`} />
        <Metric label="Switched on now" value={onNow} foot="Displays, lights, air-con, fans" />
        <Metric label="Need attention" value={state.devices.length - online} foot="Offline or stale devices" />
      </div>

      <div className="sr-layout">
        <Panel title="Rooms" sub={`${shown.length} shown`} bodyClass="panel-body tight" className="sr-list">
          <div className="sr-filters">
            <div className="search-field">
              <Search size={16} />
              <input className="input sm" placeholder="Find a room" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Find a room" />
            </div>
            <select className="select sm" value={bld} onChange={(e) => setBld(e.target.value)} aria-label="Building">
              <option value="all">All buildings</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.short}
                </option>
              ))}
            </select>
          </div>
          <div className="sr-rooms">
            {shown.map((r) => {
              const ds = devicesIn(r.id)
              const bad = ds.filter((d) => d.status !== 'Online').length
              return (
                <button key={r.id} className={`sr-room ${r.id === room?.id ? 'on' : ''}`} onClick={() => setParams({ room: r.id }, { replace: true })}>
                  <div className="grow" style={{ minWidth: 0 }}>
                    <strong className="truncate">{r.name}</strong>
                    <span className="truncate">
                      {buildings.find((b) => b.id === r.buildingId)?.short}, {r.type.toLowerCase()}
                    </span>
                  </div>
                  <div className="sr-room-meta">
                    <span className="num">{ds.length} devices</span>
                    {ds.length === 0 ? <Badge tone="amber">Not paired</Badge> : bad ? <Badge tone="red">{bad} offline</Badge> : <Badge tone="green">All online</Badge>}
                  </div>
                </button>
              )
            })}
            {shown.length === 0 && <p className="small muted" style={{ padding: 16 }}>No rooms match.</p>}
          </div>
        </Panel>
        {room ? <RoomControl key={room.id} room={room} devices={devicesIn(room.id)} /> : <Panel><Empty title="No rooms yet">Create sub rooms in Campus setup first.</Empty></Panel>}
      </div>
      <div className="mt-2">
        <Notice>Controls change the demo only. In production each command goes through the room IoT gateway and the device confirms it before the screen updates.</Notice>
      </div>
    </>
  )
}

function RoomControl({ room, devices }: { room: Space; devices: Device[] }) {
  const { state, update, toast, audit } = useDemo()
  const [picked, setPicked] = useState<string | null>(null)
  const [confirmOff, setConfirmOff] = useState(false)
  const master = state.spaces.find((s) => s.id === room.parentId)
  const st = (d: Device) => state.deviceState[d.id] ?? defaultsFor(d.type)
  const occupancy = useMemo(() => Math.round(room.capacity * (room.id === 'sp-dk2' ? 0.53 : 0.4)), [room])
  const lights = devices.filter((d) => d.type === 'Lights')
  const lightLevel = lights.length && st(lights[0]).on && lights[0].status !== 'Offline' ? st(lights[0]).level : 0
  const display = devices.find((d) => d.type === 'Interactive display')
  const displayOn = !!display && st(display).on && display.status !== 'Offline'
  const log = state.audit.filter((a) => a.target.includes(room.code) || a.target.startsWith(room.name) || a.detail?.includes(room.code)).slice(0, 5)

  const setDev = (d: Device, patch: Partial<DeviceState>, msg: string) => {
    if (d.status === 'Offline') return toast(`${d.name} is offline, so it can't be controlled. Check Maintenance.`, 'warn')
    update((s) => ({ ...s, deviceState: { ...s.deviceState, [d.id]: { ...(s.deviceState[d.id] ?? defaultsFor(d.type)), ...patch } } }))
    audit({ area: 'Automation', action: 'Controlled device', target: d.name, detail: `${msg}, ${room.code}` })
    toast(`${d.name}: ${msg}.`)
  }

  const tap = (d: Device) => {
    setPicked(d.id)
    if (SENSORS.includes(d.type)) return
    if (d.type === 'Door controller') return setDev(d, { locked: !st(d).locked }, st(d).locked ? 'unlocked' : 'locked')
    if (d.type === 'Ceiling microphone') return setDev(d, { on: !st(d).on }, st(d).on ? 'muted' : 'live')
    if (d.type === 'PTZ camera') return setDev(d, { on: !st(d).on }, st(d).on ? 'tracking paused' : 'tracking presenter')
    setDev(d, { on: !st(d).on }, st(d).on ? 'switched off' : 'switched on')
  }

  const scene = (id: Scene) => {
    const live = devices.filter((d) => d.status !== 'Offline')
    const skipped = devices.length - live.length
    const next: Record<string, DeviceState> = {}
    live.forEach((d) => {
      const cur = { ...st(d) }
      const t = d.type
      if (id === 'start') Object.assign(cur, t === 'Lights' ? { on: true, level: 80 } : t === 'Door controller' ? { locked: false } : t === 'Projector' ? { on: false } : { on: true })
      if (id === 'present') Object.assign(cur, t === 'Lights' ? { on: true, level: 35 } : t === 'Projector' || t === 'Interactive display' ? { on: true } : {})
      if (id === 'hybrid') Object.assign(cur, t === 'PTZ camera' || t === 'Ceiling microphone' || t === 'Interactive display' ? { on: true } : t === 'Lights' ? { on: true, level: 70 } : {})
      if (id === 'exam') Object.assign(cur, t === 'Lights' ? { on: true, level: 100 } : t === 'Interactive display' || t === 'Projector' || t === 'Ceiling microphone' ? { on: false } : {})
      if (id === 'off') Object.assign(cur, t === 'Door controller' ? { locked: true } : SENSORS.includes(t) ? {} : { on: false })
      next[d.id] = cur
    })
    update((s) => ({ ...s, deviceState: { ...s.deviceState, ...next } }))
    const label = SCENES.find((x) => x.id === id)!.label
    audit({ area: 'Automation', action: `Ran scene: ${label}`, target: room.code, detail: `${live.length} devices${skipped ? `, ${skipped} offline skipped` : ''}` })
    toast(`${label} applied to ${room.name}${skipped ? `. ${skipped} offline device${skipped > 1 ? 's were' : ' was'} skipped` : ''}.`)
    setConfirmOff(false)
  }

  if (devices.length === 0) {
    return (
      <Panel title={room.name} sub={`${master?.name ?? ''}, ${room.type}, capacity ${room.capacity}`} action={<Badge tone={stateTone[room.state]}>{room.state}</Badge>}>
        <Empty icon={<Link2 size={28} />} title="No devices paired yet">
          Pair this room's display, lights and sensors in Campus setup, and they will appear here.
          <div className="mt-2">
            <Link to={`/management/campus?room=${room.id}`} className="btn sm">
              Pair devices in Campus setup
            </Link>
          </div>
        </Empty>
      </Panel>
    )
  }

  const pickedDev = devices.find((d) => d.id === picked)

  return (
    <div className="stack">
      <Panel
        title={room.name}
        sub={`${master?.name ?? ''}, ${buildings.find((b) => b.id === room.buildingId)?.name}, ${room.floor}`}
        action={
          <div className="row" style={{ gap: 8 }}>
            <Badge>
              <Users size={12} /> {occupancy} of {room.capacity}
            </Badge>
            <Badge tone={stateTone[room.state]}>{room.state}</Badge>
          </div>
        }
      >
        <div className="scene-row">
          {SCENES.map((s) => (
            <button key={s.id} className={`scene ${s.id === 'off' ? 'danger' : ''}`} title={s.hint} onClick={() => (s.id === 'off' ? setConfirmOff(true) : scene(s.id))}>
              {s.id === 'off' ? <Power size={15} /> : null}
              {s.label}
            </button>
          ))}
        </div>

        <div className="room-plan" style={{ ['--glow' as string]: lightLevel / 100 }} aria-label={`Layout of ${room.name}`}>
          <div className="plan-front">
            <span>Front of room</span>
            <div className={`plan-screen ${displayOn ? 'on' : ''}`} />
          </div>
          <div className="plan-lights" aria-hidden>
            {Array.from({ length: 12 }, (_, i) => (
              <i key={i} />
            ))}
          </div>
          <div className="plan-seats" aria-hidden>
            {Array.from({ length: 5 }, (_, i) => (
              <span key={i} style={{ width: `${62 + i * 6}%` }} />
            ))}
          </div>
          <div className="plan-door" aria-hidden />
          {devices.map((d, k) => {
            const s = st(d)
            const [x, y] = spot[d.type]
            const sameType = devices.filter((o) => o.type === d.type)
            const idx = sameType.indexOf(d)
            const active = d.type === 'Door controller' ? !s.locked : SENSORS.includes(d.type) ? true : s.on
            return (
              <button
                key={d.id}
                className={`hot ${d.status === 'Offline' ? 'off-line' : active ? 'active' : ''} ${picked === d.id ? 'picked' : ''} ${SENSORS.includes(d.type) ? 'sensor' : ''}`}
                style={{ left: `${x + idx * 7}%`, top: `${y + (idx % 2) * 10}%`, zIndex: 5 + k }}
                onClick={() => tap(d)}
                title={`${d.name}: ${describe(d, s, occupancy)}`}
                aria-label={`${d.name}, ${describe(d, s, occupancy)}`}
              >
                <span className="hot-ico">{iconFor(d, s)}</span>
                <span className="hot-label">{describe(d, s, occupancy)}</span>
              </button>
            )
          })}
        </div>
        <p className="xs muted mt-1">Tap a device to switch it on or off. Doors lock and unlock. Sensors show their latest reading.</p>
      </Panel>

      <div className="grid g-main-side">
        <Panel title="Devices in this room" sub={`${devices.length} paired`} bodyClass="panel-body tight">
          <div className="list">
            {devices.map((d) => {
              const s = st(d)
              const off = d.status === 'Offline'
              return (
                <div key={d.id} className={`list-item dev-row ${picked === d.id ? 'picked' : ''}`} onClick={() => setPicked(d.id)}>
                  <span className={`icon-tile sm ${off ? 'tile-off' : (d.type === 'Door controller' ? !s.locked : s.on) || SENSORS.includes(d.type) ? 'tile-on' : ''}`}>{iconFor(d, s, 16)}</span>
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div className="title small truncate">{d.name}</div>
                    <div className="sub xs">{off ? <span className="c-red">Offline, last seen {d.lastSeen}</span> : describe(d, s, occupancy)}</div>
                    {!off && d.type === 'Lights' && s.on && (
                      <input type="range" min={5} max={100} step={5} value={s.level} className="dim" aria-label="Brightness" onChange={(e) => update((x) => ({ ...x, deviceState: { ...x.deviceState, [d.id]: { ...s, level: Number(e.target.value) } } }))} onMouseUp={() => audit({ area: 'Automation', action: 'Dimmed lights', target: d.name, detail: `${s.level}%, ${room.code}` })} />
                    )}
                  </div>
                  {!off && d.type === 'Air-conditioning' && s.on && (
                    <div className="stepper">
                      <button aria-label="Cooler" onClick={(e) => (e.stopPropagation(), setDev(d, { temp: Math.max(16, s.temp - 1) }, `set to ${Math.max(16, s.temp - 1)}°C`))}>
                        <Minus size={13} />
                      </button>
                      <span className="num">{s.temp}°</span>
                      <button aria-label="Warmer" onClick={(e) => (e.stopPropagation(), setDev(d, { temp: Math.min(30, s.temp + 1) }, `set to ${Math.min(30, s.temp + 1)}°C`))}>
                        <Plus size={13} />
                      </button>
                    </div>
                  )}
                  {!off && d.type === 'Fan' && s.on && (
                    <Seg value={String(s.speed) as '1' | '2' | '3'} onChange={(v) => setDev(d, { speed: Number(v) }, `speed ${v}`)} options={[{ id: '1', label: '1' }, { id: '2', label: '2' }, { id: '3', label: '3' }]} />
                  )}
                  {!off && d.type === 'Interactive display' && s.on && (
                    <select className="select sm" style={{ width: 'auto' }} value={s.input} onClick={(e) => e.stopPropagation()} onChange={(e) => setDev(d, { input: e.target.value }, `input ${e.target.value}`)} aria-label="Display input">
                      <option>HDMI 1</option>
                      <option>Wireless share</option>
                      <option>Room PC</option>
                    </select>
                  )}
                  {!SENSORS.includes(d.type) && (
                    <span onClick={(e) => e.stopPropagation()}>
                      <Switch on={d.type === 'Door controller' ? s.locked : s.on} label={d.type === 'Door controller' ? `Lock ${d.name}` : `Power ${d.name}`} onChange={() => tap(d)} />
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </Panel>
        <div className="stack">
          <Panel title={pickedDev ? pickedDev.name : 'Device details'} sub={pickedDev ? pickedDev.type : 'Tap a device to see its details'}>
            {pickedDev ? (
              <dl className="kv">
                <dt>Status</dt>
                <dd>{pickedDev.status}</dd>
                <dt>Now</dt>
                <dd>{describe(pickedDev, st(pickedDev), occupancy)}</dd>
                <dt>Device ID</dt>
                <dd>{pickedDev.id}</dd>
                <dt>Network</dt>
                <dd>{pickedDev.network}</dd>
                <dt>Can do</dt>
                <dd>{pickedDev.capabilities.join(', ')}</dd>
                <dt>Auto-off</dt>
                <dd>{pickedDev.autoOffEligible ? 'Eligible' : 'Always excluded'}</dd>
              </dl>
            ) : (
              <p className="small muted">The layout and the list are linked. Pick a device in either to see it here.</p>
            )}
          </Panel>
          <Panel title="Recent actions" sub="From the audit log" bodyClass="panel-body tight">
            {log.length === 0 ? (
              <p className="small muted" style={{ padding: '8px 20px 14px' }}>
                No actions in this room yet.
              </p>
            ) : (
              <div className="list">
                {log.map((a) => (
                  <div key={a.id} className="list-item" style={{ padding: '10px 20px' }}>
                    <div className="grow">
                      <div className="small strong">{a.action}</div>
                      <div className="xs muted">
                        {a.target}, {a.actor}
                      </div>
                    </div>
                    <span className="xs muted num">{a.time}</span>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>

      <Modal
        open={confirmOff}
        onClose={() => setConfirmOff(false)}
        title={`Shut down ${room.name}?`}
        sub="Switches off every display, light, fan and air-con unit and locks the door. Sensors stay on."
        foot={
          <>
            <button className="btn secondary" onClick={() => setConfirmOff(false)}>
              Keep running
            </button>
            <button className="btn danger" onClick={() => scene('off')}>
              Shut down room
            </button>
          </>
        }
      >
        <p className="small">Emergency exits and fire safety always stay in local control and are never affected.</p>
      </Modal>
    </div>
  )
}
