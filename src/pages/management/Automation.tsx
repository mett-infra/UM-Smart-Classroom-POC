import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Ban, CheckCircle2, DoorClosed, Leaf, LogIn, LogOut, PauseCircle, PlayCircle, Power, Timer, Users, XCircle } from 'lucide-react'
import { Badge, Bar, Metric, Notice, PageHead, Panel, Seg, Switch } from '../../components/ui'
import { AUTO_OFF_TYPES, type AutoRule, type Device, type DeviceType } from '../../data/smartcampus'
import { nowLabel, useDemo } from '../../store/DemoStore'
import { ALWAYS_EXCLUDED, stateOf } from './roomControl'
import '../../styles/management.css'
import '../../styles/smartcampus.css'

/*
  Inactivity automation (spec SC-08 to SC-13).
  When the occupancy sensor shows a room empty for the configured time, only the selected eligible devices
  are switched off. Safety, network, access and sensing equipment is always excluded. Each run is logged with
  the evidence used, what was switched off and anything that failed.
  In production the timer runs on the IoT gateway, not in the browser.
*/

const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1)
const fmtSecs = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`
const friendly = (t: DeviceType) => (t === 'Interactive display' ? 'Displays' : t === 'Air-conditioning' ? 'Air-con' : t === 'Lights' ? 'Lights' : t === 'Projector' ? 'Projectors' : t === 'Fan' ? 'Fans' : t)

export default function Automation() {
  const { state } = useDemo()
  const active = state.autoRules.filter((r) => r.active && !r.paused)
  const covered = state.spaces.filter((s) => s.kind === 'sub' && s.state !== 'Deactivated' && active.some((r) => r.appliesTo.includes(s.type as never))).length
  const today = state.autoLog.filter((o) => !o.time.startsWith('Yesterday')).length

  return (
    <>
      <PageHead title="Automation" sub="Switch off selected equipment when a room has been empty for a set time. Safety, network and door equipment is never switched off." />
      <div className="metrics">
        <Metric label="Active rules" value={active.length} foot={`${state.autoRules.length - active.length} paused or off`} />
        <Metric label="Rooms covered" value={covered} foot="Sub rooms with an occupancy sensor" />
        <Metric label="Automatic switch-offs today" value={today} foot="Each one is logged below" />
        <Metric label="Energy saved today" value="41" unit="kWh" foot="Estimate from sample data" icon={<Leaf size={14} color="var(--green)" />} />
      </div>
      <div className="grid g-main-side">
        <div className="stack">
          <Simulation />
          <RulesPanel />
        </div>
        <div className="stack">
          <Panel title="Never switched off" sub="Always excluded from automation">
            <div className="chips">
              {ALWAYS_EXCLUDED.map((t) => (
                <span key={t} className="chip static">
                  <Ban size={12} /> {t}
                </span>
              ))}
              <span className="chip static">
                <Ban size={12} /> Fire and life-safety systems
              </span>
              <span className="chip static">
                <Ban size={12} /> Network equipment
              </span>
            </div>
          </Panel>
          <Panel title="Automation history" sub="What was switched off, when and why" bodyClass="panel-body tight">
            <div className="list">
              {state.autoLog.map((o) => (
                <div key={o.id} className="list-item" style={{ alignItems: 'flex-start' }}>
                  <span className="icon-tile sm" style={{ background: o.failed.length ? 'var(--amber-50)' : 'var(--green-50)', color: o.failed.length ? 'var(--amber)' : 'var(--green)' }}>
                    <Power size={15} />
                  </span>
                  <div className="grow">
                    <div className="title small">{o.room}</div>
                    <div className="sub xs">{o.evidence}</div>
                    <div className="xs mt-1">
                      Switched off: {o.off.join(', ') || 'nothing was on'}
                      {o.failed.length > 0 && <span className="c-red">. Did not confirm: {o.failed.join(', ')}</span>}
                    </div>
                  </div>
                  <span className="xs muted num">{o.time}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
      <div className="mt-2">
        <Notice>Simulation only. In production the room gateway runs the timer using the people counter or motion sensor, waits for each device to confirm, and reports failures.</Notice>
      </div>
    </>
  )
}

function Simulation() {
  const { state, update, toast, audit } = useDemo()
  const rooms = useMemo(() => state.spaces.filter((s) => s.kind === 'sub' && s.state !== 'Deactivated' && s.occupancySource && state.devices.some((d) => d.spaceId === s.id)), [state.spaces, state.devices])
  const [roomId, setRoomId] = useState(rooms.find((r) => r.id === 'sp-ea201')?.id ?? rooms[0]?.id)
  const room = rooms.find((r) => r.id === roomId) ?? rooms[0]
  const rule = state.autoRules.find((r) => r.active && r.appliesTo.includes(room?.type as never))
  const devices = state.devices.filter((d) => d.spaceId === room?.id)
  const [people, setPeople] = useState(31)
  const [empty, setEmpty] = useState<number | null>(null)
  const [fired, setFired] = useState(false)
  const [speed, setSpeed] = useState<'1' | '10' | '60'>('60')
  const fire = useRef<() => void>(() => {})

  const limit = (rule?.minutes ?? 15) * 60
  const paused = !rule || rule.paused

  const reset = (n: number) => {
    setPeople(n)
    setEmpty(n === 0 ? 0 : null)
    setFired(false)
  }

  useEffect(() => reset(Math.round((room?.capacity ?? 40) * 0.6)), [roomId]) // eslint-disable-line react-hooks/exhaustive-deps

  fire.current = () => {
    if (!room || !rule) return
    const targets = devices.filter((d) => rule.devices.includes(d.type))
    const offNow: Device[] = []
    const failed: Device[] = []
    const next: Record<string, ReturnType<typeof stateOf>> = {}
    targets.forEach((d) => {
      const st = stateOf(state.deviceState, d)
      if (!st.on) return
      if (d.status === 'Offline') return failed.push(d)
      next[d.id] = { ...st, on: false }
      offNow.push(d)
    })
    update((s) => ({
      ...s,
      deviceState: { ...s.deviceState, ...next },
      autoLog: [{ id: `ao${Date.now()}`, time: nowLabel(), room: room.name, rule: rule.name, evidence: `${room.occupancySource} at 0 for ${rule.minutes} min`, off: offNow.map((d) => d.name.replace(`${room.name} `, '')), failed: failed.map((d) => d.name.replace(`${room.name} `, '')) }, ...s.autoLog].slice(0, 30),
    }))
    audit({ actor: 'System', area: 'Automation', action: 'Switched off idle room', target: room.code, detail: `${rule.name}: ${offNow.length} devices off${failed.length ? `, ${failed.length} did not confirm` : ''}. Evidence: empty for ${rule.minutes} min` })
    toast(offNow.length ? `${room.name} empty for ${rule.minutes} min: ${offNow.length} devices switched off automatically.` : `${room.name} empty for ${rule.minutes} min, but everything was already off.`, failed.length ? 'warn' : 'ok')
    setFired(true)
  }

  useEffect(() => {
    if (empty === null || fired || paused) return
    const id = setInterval(() => {
      setEmpty((e) => {
        if (e === null) return e
        const n = e + 0.25 * Number(speed)
        if (n >= limit) {
          setTimeout(() => fire.current(), 0)
          return limit
        }
        return n
      })
    }, 250)
    return () => clearInterval(id)
  }, [empty === null, fired, paused, speed, limit]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!room) return null
  const pct = empty === null ? 0 : Math.min(100, (empty / limit) * 100)

  return (
    <Panel title="Try it: room inactivity" sub="Pretend everyone leaves and watch the rule switch the room off" action={<Seg value={speed} onChange={setSpeed} options={[{ id: '1', label: 'Real time' }, { id: '10', label: '10x' }, { id: '60', label: '60x' }]} />}>
      <div className="row wrap" style={{ gap: 12, alignItems: 'flex-end', marginBottom: 14 }}>
        <div className="field" style={{ marginBottom: 0, minWidth: 220, flex: 1 }}>
          <label htmlFor="sim-room">Room</label>
          <select id="sim-room" className="select" value={room.id} onChange={(e) => setRoomId(e.target.value)}>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.type.toLowerCase()})
              </option>
            ))}
          </select>
        </div>
        <button className="btn secondary" onClick={() => reset(0)} disabled={people === 0}>
          <LogOut size={15} /> Everyone leaves
        </button>
        <button className="btn secondary" onClick={() => reset(Math.round(room.capacity * 0.3) || 4)}>
          <LogIn size={15} /> Someone walks in
        </button>
      </div>

      <div className="sim-grid">
        <div className="sim-sensor">
          <Users size={20} />
          <strong className="num">{people}</strong>
          <span className="xs muted">people now</span>
          <span className="xs">{room.occupancySource}</span>
        </div>
        <div className="sim-timer">
          {!rule ? (
            <p className="small muted">No active rule covers {room.type.toLowerCase()}s.</p>
          ) : rule.paused ? (
            <p className="small">
              <PauseCircle size={15} style={{ display: 'inline', verticalAlign: -3 }} /> The rule “{rule.name}” is paused, so nothing will switch off.
            </p>
          ) : fired ? (
            <p className="small c-green">
              <CheckCircle2 size={15} style={{ display: 'inline', verticalAlign: -3 }} /> Room switched off after {rule.minutes} minutes empty. Waiting for someone to return.
            </p>
          ) : empty === null ? (
            <p className="small">
              Room in use. The timer starts when the sensor shows nobody for a while. Rule: <strong>{rule.name}</strong>, after {rule.minutes} min.
            </p>
          ) : (
            <>
              <div className="row between small">
                <span>
                  <Timer size={14} style={{ display: 'inline', verticalAlign: -2 }} /> Empty for <strong className="num">{fmtSecs(empty)}</strong>
                </span>
                <span className="muted">
                  switches off at <span className="num">{fmtSecs(limit)}</span>
                </span>
              </div>
              <Bar value={pct} color={pct > 80 ? 'var(--amber)' : 'var(--primary)'} />
              <span className="xs muted">Someone walking in resets the timer.</span>
            </>
          )}
        </div>
      </div>

      <div className="sim-devices">
        {devices.map((d) => {
          const st = stateOf(state.deviceState, d)
          const inRule = !!rule && rule.devices.includes(d.type)
          const excluded = ALWAYS_EXCLUDED.includes(d.type)
          return (
            <div key={d.id} className={`sim-dev ${excluded ? 'ex' : inRule ? 'in' : ''}`}>
              <span className={`dot ${d.status === 'Offline' ? 'st-red' : (d.type === 'Door controller' ? !st.locked : st.on) ? 'st-green' : ''}`} />
              <div className="grow" style={{ minWidth: 0 }}>
                <div className="small strong truncate">{cap(d.name.replace(`${room.name} `, ''))}</div>
                <div className="xs muted">{d.status === 'Offline' ? 'Offline' : d.type === 'Door controller' ? (st.locked ? 'Locked' : 'Unlocked') : ALWAYS_EXCLUDED.includes(d.type) || ['People counter', 'Motion sensor', 'Room controller'].includes(d.type) ? 'Running' : st.on ? 'On' : 'Off'}</div>
              </div>
              {excluded ? <Badge>Never off</Badge> : inRule ? <Badge tone="blue">In rule</Badge> : <Badge>Not in rule</Badge>}
            </div>
          )
        })}
      </div>
      <p className="xs muted mt-1">
        <DoorClosed size={12} style={{ display: 'inline', verticalAlign: -2 }} /> Device states here are the same as in{' '}
        <Link to={`/management/rooms?room=${room.id}`}>Smart rooms</Link>.
      </p>
    </Panel>
  )
}

function RulesPanel() {
  const { state, update, toast, audit } = useDemo()
  const patch = (r: AutoRule, p: Partial<AutoRule>, action: string, detail?: string) => {
    update((s) => ({ ...s, autoRules: s.autoRules.map((x) => (x.id === r.id ? { ...x, ...p } : x)) }))
    audit({ area: 'Automation', action, target: r.name, detail })
  }
  return (
    <Panel title="Inactivity rules" sub="Which equipment switches off, and after how long" bodyClass="panel-body tight">
      <div className="list">
        {state.autoRules.map((r) => (
          <div key={r.id} className="rule">
            <div className="row between wrap" style={{ gap: 10 }}>
              <div>
                <strong className="small">{r.name}</strong>
                <div className="xs muted">
                  {r.appliesTo.join(', ')}. {r.window}.
                </div>
              </div>
              <div className="row" style={{ gap: 10 }}>
                {r.paused ? (
                  <button
                    className="btn xs secondary"
                    onClick={() => {
                      patch(r, { paused: false }, 'Resumed rule')
                      toast(`${r.name} resumed.`)
                    }}
                  >
                    <PlayCircle size={13} /> Resume
                  </button>
                ) : (
                  <button
                    className="btn xs secondary"
                    disabled={!r.active}
                    onClick={() => {
                      patch(r, { paused: true }, 'Paused rule', 'Override for an event, until resumed')
                      toast(`${r.name} paused. Resume it when the event is over.`, 'info')
                    }}
                  >
                    <PauseCircle size={13} /> Pause
                  </button>
                )}
                <Switch
                  on={r.active}
                  label={`Activate ${r.name}`}
                  onChange={(v) => {
                    patch(r, { active: v }, v ? 'Activated rule' : 'Deactivated rule')
                    toast(`${r.name} ${v ? 'on' : 'off'}.`)
                  }}
                />
              </div>
            </div>
            <div className="row wrap" style={{ gap: 8, marginTop: 10 }}>
              <span className="xs muted">After</span>
              <select
                className="select sm"
                style={{ width: 'auto' }}
                value={r.minutes}
                onChange={(e) => {
                  patch(r, { minutes: Number(e.target.value) }, 'Changed inactivity time', `${r.minutes} to ${e.target.value} min`)
                  toast(`${r.name}: switch off after ${e.target.value} minutes empty.`)
                }}
                aria-label={`Minutes for ${r.name}`}
              >
                {[5, 10, 15, 30].map((m) => (
                  <option key={m} value={m}>
                    {m} min empty
                  </option>
                ))}
              </select>
              <span className="xs muted">switch off</span>
              {AUTO_OFF_TYPES.map((t) => {
                const on = r.devices.includes(t)
                return (
                  <button
                    key={t}
                    className={`chip ${on ? 'on' : ''}`}
                    onClick={() => {
                      const devices = on ? r.devices.filter((x) => x !== t) : [...r.devices, t]
                      patch(r, { devices }, on ? 'Removed device type from rule' : 'Added device type to rule', friendly(t))
                    }}
                    aria-pressed={on}
                  >
                    {on ? <CheckCircle2 size={12} /> : <XCircle size={12} />} {friendly(t)}
                  </button>
                )
              })}
            </div>
            {r.paused && <div className="xs mt-1" style={{ color: 'var(--amber)' }}>Paused: rooms in this group will not switch off until resumed.</div>}
          </div>
        ))}
      </div>
    </Panel>
  )
}
