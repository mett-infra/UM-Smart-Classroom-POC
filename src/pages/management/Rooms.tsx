import { useState, type ReactNode } from 'react'
import { AlertTriangle, Camera, Clock, Lightbulb, Monitor, Power, PowerOff, Volume2, Zap, Wifi, Users } from 'lucide-react'
import { Badge, Bar, Metric, Notice, PageHead, Panel, Switch, statusTone } from '../../components/ui'
import { useDemo, type RoomControls } from '../../store/DemoStore'
import type { Room } from '../../data/types'
import '../../styles/management.css'

const defaults: RoomControls = { display: true, audio: true, lights: true, camera: true, mode: 'Teaching' }
const statuses: (Room['status'] | 'All rooms')[] = ['All rooms', 'In session', 'Available', 'Issue reported', 'Offline']

const controlDefs: { key: keyof Omit<RoomControls, 'mode'>; label: string; on: string; off: string; icon: ReactNode }[] = [
  { key: 'display', label: 'Interactive display', on: 'Powered on', off: 'Powered off', icon: <Monitor size={17} /> },
  { key: 'audio', label: 'Room audio', on: 'Microphones and speakers on', off: 'Muted', icon: <Volume2 size={17} /> },
  { key: 'lights', label: 'Lights', on: 'Normal lighting', off: 'Dimmed', icon: <Lightbulb size={17} /> },
  { key: 'camera', label: 'Tracking camera', on: 'Following the lecturer', off: 'Disabled', icon: <Camera size={17} /> },
]

export default function Rooms() {
  const { state, update, toast, log } = useDemo()
  const [filter, setFilter] = useState<(typeof statuses)[number]>('All rooms')
  const [selectedId, setSelectedId] = useState(state.rooms[0]?.id)
  const [routines, setRoutines] = useState([
    { id: 'r1', title: 'Scheduled room start-up', sub: '10 minutes before the first class in the timetable', on: true, icon: <Clock size={16} /> },
    { id: 'r2', title: 'Energy-saving shutdown', sub: 'Turn equipment off 15 minutes after the room is confirmed empty', on: false, icon: <Zap size={16} /> },
    { id: 'r3', title: 'Device offline alert', sub: 'Notify ICT support when a display, microphone or controller goes offline', on: true, icon: <Wifi size={16} /> },
    { id: 'r4', title: 'Hybrid mode preset', sub: 'Camera tracking, ceiling microphones and display profile for hybrid classes', on: true, icon: <Users size={16} /> },
  ])

  const rooms = state.rooms.filter((r) => filter === 'All rooms' || r.status === filter)
  const room = state.rooms.find((r) => r.id === selectedId)
  const ctl = (room && state.roomControls[room.id]) || defaults
  const roomOn = ctl.display || ctl.audio || ctl.lights || ctl.camera

  const setCtl = (patch: Partial<RoomControls>) => {
    if (!room) return
    update((s) => ({ ...s, roomControls: { ...s.roomControls, [room.id]: { ...(s.roomControls[room.id] ?? defaults), ...patch } } }))
  }

  const power = (on: boolean) => {
    if (!room) return
    setCtl({ display: on, audio: on, lights: on, camera: on })
    log({ kind: 'room', text: on ? `${room.name} started` : `${room.name} shut down`, sub: `${room.building}, from the smart rooms console` })
    toast(on ? `${room.name} start-up routine run. Display, audio, lights and camera are on.` : `${room.name} shut down. All equipment is off.`, on ? 'ok' : 'info')
  }

  const counts = {
    session: state.rooms.filter((r) => r.status === 'In session').length,
    available: state.rooms.filter((r) => r.status === 'Available').length,
    issue: state.rooms.filter((r) => r.status === 'Issue reported' || r.status === 'Offline').length,
    hybrid: state.rooms.filter((r) => r.hybrid).length,
  }

  return (
    <>
      <PageHead title="Smart rooms" sub="See which teaching rooms are in use and control classroom equipment from one place." />

      <div className="metrics">
        <Metric label="In session" value={counts.session} foot="Classes running now" />
        <Metric label="Available" value={counts.available} foot="Free for the next hour" />
        <Metric label="Need attention" value={counts.issue} foot="Issue reported or offline" />
        <Metric label="Hybrid-ready rooms" value={counts.hybrid} foot={`Of ${state.rooms.length} monitored rooms`} />
      </div>

      <div className="grid g-main-side">
        <Panel
          title="Rooms"
          sub="Sample of monitored teaching spaces"
          action={
            <select className="select sm" style={{ width: 'auto' }} value={filter} onChange={(e) => setFilter(e.target.value as (typeof statuses)[number])} aria-label="Filter rooms by status">
              {statuses.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          }
        >
          <div className="mg-room-grid">
            {rooms.map((r) => (
              <button key={r.id} className={`mg-room ${r.id === selectedId ? 'on' : ''}`} onClick={() => setSelectedId(r.id)} aria-pressed={r.id === selectedId}>
                <div className="row between" style={{ alignItems: 'flex-start' }}>
                  <div>
                    <div className="name">{r.name}</div>
                    <div className="where">{r.building}</div>
                  </div>
                  <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                </div>
                <div className="small muted truncate">{r.current ?? `Next: ${r.next ?? 'nothing scheduled'}`}</div>
                <div>
                  <div className="row between xs muted" style={{ marginBottom: 4 }}>
                    <span>Occupancy</span>
                    <span className="num">
                      {r.occupancy}% of {r.capacity}
                    </span>
                  </div>
                  <Bar thin value={r.occupancy} color={r.occupancy > 85 ? 'var(--gold)' : undefined} />
                </div>
                <div className="row xs muted">
                  {r.hybrid ? <Badge tone="blue">Hybrid</Badge> : <Badge>In person only</Badge>}
                  <span>{r.devices} devices</span>
                </div>
              </button>
            ))}
          </div>
        </Panel>

        <div className="stack">
          {room && (
            <Panel title={`${room.name} controls`} sub={`${room.kind}, ${room.building}`} action={<Badge tone={roomOn ? 'green' : ''}>{roomOn ? 'Room on' : 'Room off'}</Badge>}>
              {(room.status === 'Issue reported' || room.status === 'Offline') && (
                <div className="notice" style={{ marginBottom: 14 }}>
                  <AlertTriangle size={16} />
                  <div>{room.status === 'Offline' ? 'This room is offline for maintenance. Controls may not respond.' : 'A device in this room has an open maintenance ticket.'}</div>
                </div>
              )}
              <div className="mg-controls">
                {controlDefs.map((c) => (
                  <div key={c.key} className={`mg-control ${ctl[c.key] ? 'on' : ''}`}>
                    <div className="icon-tile">{c.icon}</div>
                    <div className="grow">
                      <strong>{c.label}</strong>
                      <span>{ctl[c.key] ? c.on : c.off}</span>
                    </div>
                    <Switch
                      on={ctl[c.key]}
                      label={c.label}
                      onChange={(v) => {
                        setCtl({ [c.key]: v } as Partial<RoomControls>)
                        toast(`${c.label} ${v ? 'turned on' : 'turned off'} in ${room.name}.`, 'info')
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="field mt-2">
                <label htmlFor="room-mode">Room mode</label>
                <select
                  id="room-mode"
                  className="select"
                  value={ctl.mode}
                  onChange={(e) => {
                    setCtl({ mode: e.target.value as RoomControls['mode'] })
                    toast(`${room.name} switched to ${e.target.value.toLowerCase()} mode.`)
                  }}
                >
                  <option>Teaching</option>
                  <option>Presentation</option>
                  <option>Hybrid</option>
                  <option>Exam</option>
                </select>
              </div>
              <div className="row wrap">
                <button className="btn" onClick={() => power(true)}>
                  <Power size={16} /> Start room
                </button>
                <button className="btn secondary" onClick={() => power(false)}>
                  <PowerOff size={16} /> Shut down room
                </button>
              </div>
            </Panel>
          )}

          <Panel title="Automation routines" sub="Proposed behaviours for deployment" bodyClass="">
            {routines.map((r) => (
              <div className="mg-routine" key={r.id}>
                <div className="icon-tile sm">{r.icon}</div>
                <div className="grow">
                  <div className="strong small">{r.title}</div>
                  <div className="xs muted">{r.sub}</div>
                </div>
                <Switch
                  on={r.on}
                  label={r.title}
                  onChange={(v) => {
                    setRoutines((rs) => rs.map((x) => (x.id === r.id ? { ...x, on: v } : x)))
                    toast(`${r.title} ${v ? 'enabled' : 'paused'}.`, 'info')
                  }}
                />
              </div>
            ))}
          </Panel>
        </div>
      </div>

      <div className="mt-2">
        <Notice>Controls on this page change the demo interface only. Real displays, lights, cameras and AV equipment need compatible room controllers, network access and integration testing.</Notice>
      </div>
    </>
  )
}
