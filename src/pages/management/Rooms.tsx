import { useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Activity, AirVent, CalendarClock, DoorClosed, DoorOpen, Fan, Lightbulb, Link2, Lock, LockOpen, Mic, Monitor, Power, Projector, Router, Search, Settings2, Users, Video } from 'lucide-react'
import { Badge, Empty, Metric, Modal, Notice, PageHead, Panel, Seg, type Tone } from '../../components/ui'
import { buildings, DAY_SHORT, scheduleForType, type Device, type DeviceType, type Space } from '../../data/smartcampus'
import { demoMinutes, useDemo, type DeviceState, type DoorTimer } from '../../store/DemoStore'
import { capBand, liveHeadcount } from '../../data/attendance'
import { defaultsFor, isSwitch, sceneStates, SENSORS, type Scene } from './roomControl'
import { VoiceCommand } from '../../components/VoiceCommand'
import '../../styles/management.css'
import '../../styles/smartcampus.css'

const stateTone: Record<Space['state'], Tone> = { Operational: 'green', 'Setup incomplete': 'amber', 'Under maintenance': 'red', Deactivated: '' }

const iconFor = (t: DeviceType, size = 20): ReactNode => {
  switch (t) {
    case 'Interactive display':
      return <Monitor size={size} />
    case 'Projector':
      return <Projector size={size} />
    case 'Lights':
      return <Lightbulb size={size} />
    case 'Fan':
      return <Fan size={size} />
    case 'Air-conditioning':
      return <AirVent size={size} />
    case 'PTZ camera':
      return <Video size={size} />
    case 'Ceiling microphone':
      return <Mic size={size} />
    case 'Door controller':
      return <DoorClosed size={size} />
    case 'People counter':
      return <Users size={size} />
    case 'Motion sensor':
      return <Activity size={size} />
    default:
      return <Router size={size} />
  }
}

const DAY = 3 // the demo day is a Wednesday
const WEEKDAYS = [1, 2, 3, 4, 5]
const EVERY_DAY = [1, 2, 3, 4, 5, 6, 0]
const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}
const fmtTime = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}
const daysLabel = (days: number[]) => (days.length === 7 ? 'every day' : days.join() === WEEKDAYS.join() ? 'Monday to Friday' : days.map((d) => DAY_SHORT[d]).join(', '))

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
  const onNow = state.devices.filter((d) => isSwitch(d.type) && d.status === 'Online' && (state.deviceState[d.id] ?? defaultsFor(d.type)).on).length

  return (
    <>
      <PageHead
        title="Smart rooms"
        sub="Every room set up in Campus setup, with the devices paired to it. Pick a room, then switch each device on or off."
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
  const [confirmOff, setConfirmOff] = useState(false)
  const [voice, setVoice] = useState(false)
  const master = state.spaces.find((s) => s.id === room.parentId)
  const st = (d: Device) => state.deviceState[d.id] ?? defaultsFor(d.type)
  const people = liveHeadcount(room.id, demoMinutes())
  const band = capBand(people, room.capacity)
  const switches = devices.filter((d) => isSwitch(d.type))
  const door = devices.find((d) => d.type === 'Door controller')
  const sensors = devices.filter((d) => SENSORS.includes(d.type))
  const log = state.audit.filter((a) => a.target.includes(room.code) || a.target.startsWith(room.name) || a.detail?.includes(room.code) || (room.doorId && a.target === room.doorId)).slice(0, 6)

  const setDev = (d: Device, patch: Partial<DeviceState>, msg: string) => {
    if (d.status === 'Offline') return toast(`${d.name} is offline, so it can't be controlled. Check Maintenance.`, 'warn')
    update((s) => ({ ...s, deviceState: { ...s.deviceState, [d.id]: { ...(s.deviceState[d.id] ?? defaultsFor(d.type)), ...patch } } }))
    audit({ area: 'Automation', action: 'Controlled device', target: d.name, detail: `${msg}, ${room.code}` })
    toast(`${d.name}: ${msg}.`)
  }

  const power = (d: Device, on: boolean) => {
    if (st(d).on === on) return
    setDev(d, on ? { on, ...(d.type === 'Lights' ? { level: 100 } : {}) } : { on }, on ? 'switched on' : 'switched off')
  }

  const all = (id: Scene) => {
    const { next, live, skipped } = sceneStates(devices, state.deviceState, id)
    update((s) => ({ ...s, deviceState: { ...s.deviceState, ...next } }))
    audit({ area: 'Automation', action: id === 'on' ? 'Switched all devices on' : 'Switched all devices off', target: room.code, detail: `${live} devices${skipped ? `, ${skipped} offline skipped` : ''}` })
    toast(`${room.name}: ${live} devices switched ${id}${skipped ? `. ${skipped} offline device${skipped > 1 ? 's were' : ' was'} skipped` : ''}.`)
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

  return (
    <div className="stack">
      <Panel
        title={room.name}
        sub={`${master?.name ?? ''}, ${buildings.find((b) => b.id === room.buildingId)?.name}, ${room.floor}`}
        action={
          <div className="row wrap" style={{ gap: 8 }}>
            <Badge tone={band.tone === 'green' ? '' : band.tone}>
              <Users size={12} /> {people} of {room.capacity} people
            </Badge>
            <Badge tone={stateTone[room.state]}>{room.state}</Badge>
          </div>
        }
      >
        <div className="row wrap between" style={{ gap: 10, marginBottom: 14 }}>
          <span className="small muted">
            {switches.filter((d) => d.status !== 'Offline' && st(d).on).length} of {switches.length} devices on
          </span>
          <div className="row wrap" style={{ gap: 8 }}>
            <button className="btn secondary sm" onClick={() => setVoice(true)} title="Control this room by voice or typed command">
              <Mic size={15} /> Voice command
            </button>
            <button className="btn secondary sm" onClick={() => all('on')}>
              <Power size={15} /> All on
            </button>
            <button className="btn secondary sm danger-hover" onClick={() => setConfirmOff(true)}>
              <Power size={15} /> All off
            </button>
          </div>
        </div>

        <div className="dc-grid">
          {switches.map((d) => {
            const s = st(d)
            const off = d.status === 'Offline'
            return (
              <div key={d.id} className={`dc ${off ? 'dc-offline' : s.on ? 'dc-on' : ''}`}>
                <div className="dc-head">
                  <span className="dc-ico">{iconFor(d.type)}</span>
                  <div style={{ minWidth: 0 }}>
                    <strong className="truncate">{d.name}</strong>
                    <span className="truncate">{d.type}</span>
                  </div>
                </div>
                <div className="dc-state">
                  {off ? (
                    <span className="c-red">Offline</span>
                  ) : (
                    <>
                      <span className={`dc-dot ${s.on ? 'on' : ''}`} /> {s.on ? 'On' : 'Off'}
                      {d.type === 'Lights' && s.on && s.level < 100 && <span className="xs muted"> (dimmed to {s.level}%)</span>}
                    </>
                  )}
                </div>
                {off ? (
                  <p className="xs muted dc-note">
                    Last seen {d.lastSeen}. <Link to="/management/maintenance">Check Maintenance</Link>
                  </p>
                ) : (
                  <div className="onoff" role="group" aria-label={`${d.name} power`}>
                    <button className={s.on ? 'sel' : ''} aria-pressed={s.on} onClick={() => power(d, true)}>
                      On
                    </button>
                    <button className={!s.on ? 'sel' : ''} aria-pressed={!s.on} onClick={() => power(d, false)}>
                      Off
                    </button>
                  </div>
                )}
              </div>
            )
          })}
          {switches.length === 0 && <p className="small muted">No switchable devices in this room.</p>}
        </div>
      </Panel>

      <div className="grid g-main-side">
        <DoorPanel room={room} door={door} locked={door ? st(door).locked : false} onLock={(locked) => door && setDev(door, { locked }, locked ? 'locked' : 'unlocked')} />
        <div className="stack">
          <Panel title="Sensors" sub="Read only, updated by the devices">
            {sensors.length === 0 ? (
              <p className="small muted">No sensors paired.</p>
            ) : (
              <div className="sensor-list">
                {sensors.map((d) => (
                  <div key={d.id} className="sensor">
                    <span className="icon-tile sm tile-on">{iconFor(d.type, 16)}</span>
                    <div className="grow" style={{ minWidth: 0 }}>
                      <div className="small strong truncate">{d.name}</div>
                      <div className="xs muted">
                        {d.status === 'Offline' ? 'Offline' : d.type === 'People counter' ? `${people} people in the room now` : d.type === 'Motion sensor' ? (people ? 'Movement in the last minute' : 'No movement for 9 minutes') : d.status === 'Stale' ? 'Connected, last update 14 min ago' : 'Connected'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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

      {voice && <VoiceCommand roomId={room.id} onClose={() => setVoice(false)} />}
      <Modal
        open={confirmOff}
        onClose={() => setConfirmOff(false)}
        title={`Switch off everything in ${room.name}?`}
        sub="Switches off every display, light, fan, air-con unit, camera and microphone. The door and sensors are not changed."
        foot={
          <>
            <button className="btn secondary" onClick={() => setConfirmOff(false)}>
              Keep running
            </button>
            <button className="btn danger" onClick={() => all('off')}>
              Switch all off
            </button>
          </>
        }
      >
        <p className="small">Emergency exits and fire safety always stay in local control and are never affected.</p>
      </Modal>
    </div>
  )
}

function DoorPanel({ room, door, locked, onLock }: { room: Space; door?: Device; locked: boolean; onLock: (locked: boolean) => void }) {
  const { state, update, toast, audit } = useDemo()
  const doorId = room.doorId ?? ''
  const timer = state.doorTimers[doorId]
  const sched = state.doorSchedules.find((s) => s.id === (state.doorAssign[doorId] ?? scheduleForType(room.type))) ?? state.doorSchedules[0]
  const current: DoorTimer = timer ?? { unlock: sched.unlock, lock: sched.lock, days: sched.days }
  const [unlock, setUnlock] = useState(current.unlock)
  const [lock, setLock] = useState(current.lock)
  const [days, setDays] = useState<'wk' | 'all'>(current.days.length === 7 ? 'all' : 'wk')
  const dayList = days === 'all' ? EVERY_DAY : WEEKDAYS
  const dirty = !timer || unlock !== current.unlock || lock !== current.lock || dayList.join() !== current.days.join()

  if (!door) {
    return (
      <Panel title="Door" sub={doorId || 'No door linked'}>
        <Empty icon={<DoorClosed size={26} />} title="No door controller paired">
          Pair the door controller in Campus setup to lock, unlock and set a timer here.
        </Empty>
      </Panel>
    )
  }

  const offline = door.status === 'Offline'
  const now = demoMinutes()
  const todayOn = current.days.includes(DAY)
  const next = !todayOn ? `Next unlock on ${DAY_SHORT[current.days[0]]} at ${fmtTime(current.unlock)}.` : now < toMin(current.unlock) ? `Unlocks automatically at ${fmtTime(current.unlock)} today.` : now < toMin(current.lock) ? `Locks automatically at ${fmtTime(current.lock)} today.` : `Unlocks again tomorrow at ${fmtTime(current.unlock)}.`

  const save = () => {
    if (toMin(lock) <= toMin(unlock)) return toast('The lock time must be after the unlock time.', 'warn')
    update((s) => ({ ...s, doorTimers: { ...s.doorTimers, [doorId]: { unlock, lock, days: dayList } } }))
    audit({ area: 'Doors', action: timer ? 'Changed door timer' : 'Set door timer', target: doorId, detail: `${room.name}: unlock ${unlock}, lock ${lock}, ${daysLabel(dayList)}` })
    toast(`${room.name} door: unlocks at ${fmtTime(unlock)} and locks at ${fmtTime(lock)}, ${daysLabel(dayList)}.`)
  }

  const clear = () => {
    update((s) => {
      const rest = { ...s.doorTimers }
      delete rest[doorId]
      return { ...s, doorTimers: rest }
    })
    setUnlock(sched.unlock)
    setLock(sched.lock)
    setDays(sched.days.length === 7 ? 'all' : 'wk')
    audit({ area: 'Doors', action: 'Removed door timer', target: doorId, detail: `${room.name} back on ${sched.name}` })
    toast(`${room.name} door follows the ${sched.name} schedule again.`)
  }

  return (
    <Panel title="Door" sub={`${door.name}, ${doorId}`} action={<Badge tone={offline ? 'red' : locked ? 'blue' : 'green'}>{offline ? 'Offline' : locked ? 'Locked' : 'Unlocked'}</Badge>}>
      <div className={`door-now ${offline ? 'dc-offline' : ''}`}>
        <span className="dc-ico big">{locked ? <Lock size={24} /> : <LockOpen size={24} />}</span>
        <div className="grow">
          <strong>{offline ? 'State unknown' : locked ? 'Locked' : 'Unlocked'}</strong>
          <div className="xs muted">{offline ? `Controller offline since ${door.lastSeen}. Lock and unlock are paused.` : 'Changes are confirmed by the door controller.'}</div>
        </div>
        <div className="onoff" role="group" aria-label="Door">
          <button className={locked ? 'sel' : ''} aria-pressed={locked} disabled={offline} onClick={() => !locked && onLock(true)}>
            <Lock size={14} /> Lock
          </button>
          <button className={!locked ? 'sel' : ''} aria-pressed={!locked} disabled={offline} onClick={() => locked && onLock(false)}>
            <LockOpen size={14} /> Unlock
          </button>
        </div>
      </div>

      <div className="door-timer">
        <div className="row between wrap" style={{ gap: 8 }}>
          <strong className="small row" style={{ gap: 6 }}>
            <CalendarClock size={16} /> Door timer
          </strong>
          <span className="xs muted">{timer ? 'Own timer for this room' : `Using the ${sched.name} schedule`}</span>
        </div>
        <div className="timer-fields">
          <label className="field" style={{ marginBottom: 0 }}>
            <span>Unlock at</span>
            <input className="input" type="time" value={unlock} onChange={(e) => setUnlock(e.target.value)} />
          </label>
          <label className="field" style={{ marginBottom: 0 }}>
            <span>Lock at</span>
            <input className="input" type="time" value={lock} onChange={(e) => setLock(e.target.value)} />
          </label>
          <div className="field" style={{ marginBottom: 0 }}>
            <span>Days</span>
            <Seg value={days} onChange={setDays} options={[{ id: 'wk', label: 'Mon to Fri' }, { id: 'all', label: 'Every day' }]} />
          </div>
        </div>
        <div className="row wrap between" style={{ gap: 8, marginTop: 12 }}>
          <span className="small row" style={{ gap: 6 }}>
            <DoorOpen size={15} /> {next}
          </span>
          <div className="row" style={{ gap: 8 }}>
            {timer && (
              <button className="btn ghost sm" onClick={clear}>
                Use building schedule
              </button>
            )}
            <button className="btn sm" onClick={save} disabled={!dirty}>
              {timer ? 'Save timer' : 'Set timer'}
            </button>
          </div>
        </div>
        <p className="xs muted" style={{ marginTop: 8 }}>
          The timer also shows on <Link to="/management/doors">Door schedules</Link>. Fire alarms always release the door.
        </p>
      </div>
    </Panel>
  )
}
