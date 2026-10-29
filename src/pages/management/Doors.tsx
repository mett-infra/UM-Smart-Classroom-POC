import { useEffect, useMemo, useRef, useState } from 'react'
import { CalendarX2, DoorOpen, Pause, Play, Plus, TimerReset } from 'lucide-react'
import { Badge, Metric, Modal, Notice, PageHead, Panel, Seg } from '../../components/ui'
import { buildings, DAY_SHORT, scheduleForType, type DoorSchedule, type Space } from '../../data/smartcampus'
import { useDemo, type DoorOverride } from '../../store/DemoStore'
import '../../styles/management.css'
import '../../styles/smartcampus.css'

/*
  Door schedule simulation (spec DR-01 to DR-10).
  A simulated campus clock drives the schedules. At each boundary the platform "requests" the state from the
  access-control system and only shows the result once the controller confirms it. Offline controllers are shown
  as unknown, never as locked.
*/

const DAY = 3 // Wednesday, the demo day
const START_MIN = 10 * 60 + 12
const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}
const fmt = (min: number) => {
  const m = Math.floor(min) % 1440
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

type DoorState = 'open' | 'locked' | 'unknown' | 'unpaired' | 'override-open' | 'override-locked' | 'pending'

interface Door {
  id: string
  space: Space
  scheduleId: string
  controller: 'Online' | 'Offline' | 'Stale' | 'Not paired'
}

interface EventRow {
  id: number
  time: string
  text: string
  tone: 'ok' | 'warn' | 'bad' | 'info'
}

export default function Doors() {
  const { state, update, toast, audit } = useDemo()
  const [sim, setSim] = useState(START_MIN)
  const [running, setRunning] = useState(false)
  const [speed, setSpeed] = useState<'1' | '60' | '600'>('60')
  const [events, setEvents] = useState<EventRow[]>([{ id: 1, time: '08:00', text: 'Teaching rooms: unlock confirmed by 10 of 11 controllers. Electronics Lab EA-210 did not reply.', tone: 'warn' }])
  const [pending, setPending] = useState<Record<string, boolean>>({})
  const [overrideFor, setOverrideFor] = useState<Door | null>(null)
  const [addEx, setAddEx] = useState(false)
  const simRef = useRef(sim)
  simRef.current = sim

  const doors: Door[] = useMemo(
    () =>
      state.spaces
        .filter((s) => s.kind === 'sub' && s.doorId && s.state !== 'Deactivated')
        .map((s) => {
          const ctl = state.devices.find((d) => d.spaceId === s.id && d.type === 'Door controller')
          const own = state.doorTimers[s.doorId!]
          return { id: s.doorId!, space: s, scheduleId: own ? `timer-${s.doorId}` : (state.doorAssign[s.doorId!] ?? scheduleForType(s.type)), controller: ctl ? ctl.status : 'Not paired' }
        }),
    [state.spaces, state.devices, state.doorAssign, state.doorTimers],
  )

  // Door timers set per room in Smart rooms act as one-door schedules.
  const allSchedules: DoorSchedule[] = useMemo(
    () => [
      ...state.doorSchedules,
      ...Object.entries(state.doorTimers).map(([doorId, t]) => {
        const sp = state.spaces.find((s) => s.doorId === doorId)
        return { id: `timer-${doorId}`, name: `${sp?.name ?? doorId} timer`, unlock: t.unlock, lock: t.lock, days: t.days } as DoorSchedule
      }),
    ],
    [state.doorSchedules, state.doorTimers, state.spaces],
  )

  const sched = (id: string) => allSchedules.find((d) => d.id === id) ?? state.doorSchedules[0]
  const inWindow = (s: DoorSchedule, m: number) => s.days.includes(DAY) && m >= toMin(s.unlock) && m < toMin(s.lock)

  const doorState = (d: Door): DoorState => {
    if (d.controller === 'Not paired') return 'unpaired'
    if (d.controller !== 'Online') return 'unknown'
    const o = state.doorOverrides[d.id]
    if (o && o.untilMin > sim) return o.locked ? 'override-locked' : 'override-open'
    if (pending[d.scheduleId]) return 'pending'
    return inWindow(sched(d.scheduleId), sim) ? 'open' : 'locked'
  }

  const addEvent = (time: string, text: string, tone: EventRow['tone']) => setEvents((e) => [{ id: Date.now() + Math.random(), time, text, tone }, ...e].slice(0, 30))

  // Clock tick and boundary detection
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      const prev = simRef.current
      const step = Number(speed) / 240 // simulated minutes per 250 ms tick
      const nxt = Math.min(prev + step, 23 * 60 + 59)
      allSchedules.forEach((s) => {
        if (!s.days.includes(DAY)) return
        for (const [kind, at] of [
          ['unlock', toMin(s.unlock)],
          ['lock', toMin(s.lock)],
        ] as const) {
          if (prev < at && nxt >= at) boundary(s, kind, at)
        }
      })
      Object.entries(state.doorOverrides).forEach(([doorId, o]) => {
        if (prev < o.untilMin && nxt >= o.untilMin) {
          addEvent(fmt(o.untilMin), `Override on ${doorId} ended. Door is back on its schedule.`, 'info')
          update((st) => {
            const rest = { ...st.doorOverrides }
            delete rest[doorId]
            return { ...st, doorOverrides: rest }
          })
        }
      })
      setSim(nxt)
      if (nxt >= 23 * 60 + 59) setRunning(false)
    }, 250)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, speed, allSchedules, state.doorOverrides, doors])

  const boundary = (s: DoorSchedule, kind: 'unlock' | 'lock', at: number) => {
    const targets = doors.filter((d) => d.scheduleId === s.id && !(state.doorOverrides[d.id]?.untilMin > at))
    if (targets.length === 0) return
    const ok = targets.filter((d) => d.controller === 'Online')
    const bad = targets.filter((d) => d.controller !== 'Online')
    addEvent(fmt(at), `${s.name}: ${kind} requested for ${targets.length} doors.`, 'info')
    setPending((p) => ({ ...p, [s.id]: true }))
    setTimeout(() => {
      setPending((p) => ({ ...p, [s.id]: false }))
      const off = bad.filter((b) => b.controller !== 'Not paired').map((b) => b.space.name)
      const none = bad.filter((b) => b.controller === 'Not paired').map((b) => b.space.name)
      addEvent(fmt(at), `${s.name}: ${kind} confirmed by ${ok.length} of ${targets.length} controllers.${off.length ? ` No reply from ${off.join(', ')}: shown as unknown, team alerted.` : ''}${none.length ? ` ${none.join(', ')}: no door controller paired yet.` : ''}`, bad.length ? 'warn' : 'ok')
      audit({ actor: 'System', area: 'Doors', action: `Scheduled ${kind}`, target: s.name, detail: `${fmt(at)}, ${ok.length} confirmed, ${bad.length} not confirmed` })
      toast(`${fmt(at)} ${kind === 'unlock' ? 'unlock' : 'lock'}: ${ok.length} doors confirmed${bad.length ? `, ${bad.length} could not be confirmed` : ''}.`, bad.length ? 'warn' : 'ok')
    }, 1300)
  }

  const watch = (at: string) => {
    setSim(toMin(at) - 1.5)
    setSpeed('60')
    setRunning(true)
  }

  const stateCounts = doors.reduce<Record<string, number>>((acc, d) => {
    const s = doorState(d)
    acc[s] = (acc[s] ?? 0) + 1
    return acc
  }, {})
  const overrides = doors.filter((d) => state.doorOverrides[d.id]?.untilMin > sim).length

  const setSchedule = (d: Door, id: string) => {
    if (id === d.scheduleId) return
    update((s) => {
      const timers = { ...s.doorTimers }
      delete timers[d.id]
      return { ...s, doorTimers: timers, doorAssign: { ...s.doorAssign, [d.id]: id } }
    })
    audit({ area: 'Doors', action: 'Changed door schedule', target: d.id, detail: `${sched(d.scheduleId).name} to ${sched(id).name}` })
    toast(`${d.space.name} now follows ${sched(id).name}.`)
  }

  const clearOverride = (d: Door) => {
    update((s) => {
      const rest = { ...s.doorOverrides }
      delete rest[d.id]
      return { ...s, doorOverrides: rest }
    })
    audit({ area: 'Doors', action: 'Cancelled override', target: d.id })
    addEvent(fmt(sim), `Override on ${d.space.name} cancelled. Back on schedule.`, 'info')
    toast(`${d.space.name} is back on its schedule.`)
  }

  return (
    <>
      <PageHead
        title="Door schedules"
        sub="Doors switch to normal access at opening time and lock at closing time through the access-control system. Emergency systems always take priority."
        actions={
          <button className="btn" onClick={() => setAddEx(true)}>
            <Plus size={16} /> Add exception
          </button>
        }
      />


      <Panel className="clock-panel" bodyClass="panel-body">
        <div className="clock-row">
          <div className="clock-face">
            <span className="xs muted">Campus clock, simulation</span>
            <strong className="num">{fmt(sim)}</strong>
            <span className="small muted">{DAY_SHORT[DAY]}nesday, 21 October 2026</span>
          </div>
          <div className="clock-ctl">
            <div className="row wrap" style={{ gap: 8 }}>
              <button className="btn sm" onClick={() => setRunning((r) => !r)}>
                {running ? <Pause size={15} /> : <Play size={15} />} {running ? 'Pause' : 'Play'}
              </button>
              <Seg value={speed} onChange={setSpeed} options={[{ id: '1', label: 'Real time' }, { id: '60', label: '1 min per sec' }, { id: '600', label: '10 min per sec' }]} />
            </div>
            <div className="row wrap" style={{ gap: 8 }}>
              <button className="btn secondary sm" onClick={() => watch('08:00')}>
                Watch the 08:00 unlock
              </button>
              <button className="btn secondary sm" onClick={() => watch('17:00')}>
                Watch the 17:00 lock
              </button>
              <button className="btn secondary sm" onClick={() => watch('18:00')}>
                Watch the 18:00 lock
              </button>
              <button
                className="btn ghost sm"
                onClick={() => {
                  setRunning(false)
                  setSim(START_MIN)
                }}
              >
                <TimerReset size={15} /> Back to now
              </button>
            </div>
          </div>
        </div>
        <div className="dayline">
          {allSchedules.map((s) => (
            <div key={s.id} className={`dayline-row ${s.id.startsWith('timer-') ? 'is-timer' : ''}`}>
              <span className="dayline-label truncate">{s.name}</span>
              <div className="dayline-track">
                <span className="dayline-win" style={{ left: `${((toMin(s.unlock) - 360) / 960) * 100}%`, width: `${((toMin(s.lock) - toMin(s.unlock)) / 960) * 100}%` }}>
                  {s.unlock} to {s.lock}
                </span>
              </div>
            </div>
          ))}
          <div className="dayline-axis">
            {['06:00', '10:00', '14:00', '18:00', '22:00'].map((h) => (
              <span key={h}>{h}</span>
            ))}
          </div>
          <span className="dayline-now" style={{ left: `calc(var(--dl) + (100% - var(--dl)) * ${Math.max(0, Math.min(1, (sim - 360) / 960))})` }} />
        </div>
      </Panel>

      <div className="metrics m-5">
        <Metric label="Doors" value={doors.length} foot="Linked to sub rooms" />
        <Metric label="Normal access now" value={(stateCounts.open ?? 0) + (stateCounts['override-open'] ?? 0)} foot="Within opening hours" />
        <Metric label="Locked" value={(stateCounts.locked ?? 0) + (stateCounts['override-locked'] ?? 0)} foot="Confirmed by controller" />
        <Metric label="Can’t confirm" value={stateCounts.unknown ?? 0} foot={<span className={stateCounts.unknown ? 'delta-down' : ''}>Controller offline</span>} />
        <Metric label="Overrides active" value={overrides} foot="Expire automatically" />
      </div>

      <div className="grid g-main-side">
        <Panel title="Doors" sub="State is shown only after the controller confirms it" bodyClass="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Door</th>
                <th>Schedule</th>
                <th>Controller</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {doors.map((d) => {
                const st = doorState(d)
                const o = state.doorOverrides[d.id]
                return (
                  <tr key={d.id} className={`door-row ds-${st}`}>
                    <td style={{ minWidth: 170 }}>
                      <strong className="small">{d.space.name}</strong>
                      <div className="xs muted">
                        {d.id}, {buildings.find((b) => b.id === d.space.buildingId)?.short}
                      </div>
                      {o && o.untilMin > sim && (
                        <div className="xs c-gold mt-1">
                          {o.locked ? 'Locked' : 'Unlocked'} by override until {fmt(o.untilMin)}: {o.reason}
                        </div>
                      )}
                    </td>
                    <td>
                      <select className="select sm" style={{ minWidth: 150 }} value={d.scheduleId} onChange={(e) => setSchedule(d, e.target.value)} aria-label={`Schedule for ${d.space.name}`}>
                        {d.scheduleId.startsWith('timer-') && (
                          <option value={d.scheduleId}>
                            Own timer ({sched(d.scheduleId).unlock} to {sched(d.scheduleId).lock})
                          </option>
                        )}
                        {state.doorSchedules.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.unlock} to {s.lock})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <Badge tone={d.controller === 'Online' ? 'green' : d.controller === 'Not paired' ? '' : 'red'}>{d.controller}</Badge>
                    </td>
                    <td>
                      {o && o.untilMin > sim ? (
                        <button className="btn xs secondary" onClick={() => clearOverride(d)}>
                          End override
                        </button>
                      ) : (
                        <button className="btn xs secondary" onClick={() => setOverrideFor(d)} disabled={d.controller !== 'Online'} title={d.controller !== 'Online' ? 'Controller offline' : undefined}>
                          Override
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Panel>

        <div className="stack">
          <SchedulesPanel />
          <Panel title="Holidays and exceptions" sub="Approved changes to the normal schedule" bodyClass="panel-body tight">
            <div className="list">
              {state.doorExceptions.map((x) => (
                <div key={x.id} className="list-item" style={{ alignItems: 'flex-start' }}>
                  <span className="icon-tile sm" style={{ background: 'var(--gold-50)', color: 'var(--gold-600)' }}>
                    <CalendarX2 size={16} />
                  </span>
                  <div className="grow">
                    <div className="title small">{x.name}</div>
                    <div className="sub xs">
                      {x.dates}, {x.scope}
                    </div>
                    <div className="xs">
                      {x.behaviour}. Approved by {x.approvedBy}.
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Door events" sub="Requests and confirmations from the controllers" bodyClass="panel-body tight">
            <div className="ev-list">
              {events.map((e) => (
                <div key={e.id} className={`ev ev-${e.tone}`}>
                  <span className="num xs">{e.time}</span>
                  <span className="small">{e.text}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
      <div className="mt-2">
        <Notice>Simulation only. In production the platform sends schedule requests to the university access-control system and shows each door’s state only after the controller confirms it. Manual keys and emergency exits are never blocked.</Notice>
      </div>

      {overrideFor && (
        <OverrideModal
          door={overrideFor}
          sched={sched(overrideFor.scheduleId)}
          now={sim}
          onClose={() => setOverrideFor(null)}
          onDone={(o) => addEvent(fmt(sim), `${overrideFor.space.name}: ${o.locked ? 'locked' : 'unlocked'} by override until ${fmt(o.untilMin)}. Confirmed by controller.`, 'info')}
        />
      )}
      {addEx && <ExceptionModal onClose={() => setAddEx(false)} />}
    </>
  )
}

function OverrideModal({ door, sched, now, onClose, onDone }: { door: Door; sched: DoorSchedule; now: number; onClose: () => void; onDone: (o: DoorOverride) => void }) {
  const { update, toast, audit } = useDemo()
  const [choice, setChoice] = useState<'u30' | 'u60' | 'lock'>('u30')
  const [reason, setReason] = useState('')
  const save = () => {
    if (!reason.trim()) return toast('Add a reason. Overrides are recorded in the audit log.', 'warn')
    const nextUnlock = toMin(sched.unlock) > now ? toMin(sched.unlock) : 23 * 60 + 59
    const o: DoorOverride = choice === 'lock' ? { locked: true, untilMin: nextUnlock, reason: reason.trim() } : { locked: false, untilMin: now + (choice === 'u30' ? 30 : 60), reason: reason.trim() }
    update((s) => ({ ...s, doorOverrides: { ...s.doorOverrides, [door.id]: o } }))
    audit({ area: 'Doors', action: o.locked ? 'Locked door by override' : 'Unlocked door by override', target: door.id, detail: `Until ${fmt(o.untilMin)}. Reason: ${o.reason}` })
    toast(`${door.space.name} ${o.locked ? 'locked' : 'unlocked'} until ${fmt(o.untilMin)}.`)
    onDone(o)
    onClose()
  }
  return (
    <Modal
      open
      onClose={onClose}
      title={`Override ${door.space.name}`}
      sub={`${door.id}. Normal schedule: ${sched.name}, ${sched.unlock} to ${sched.lock}.`}
      foot={
        <>
          <button className="btn secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn" onClick={save}>
            <DoorOpen size={15} /> Apply override
          </button>
        </>
      }
    >
      <div className="stack" style={{ gap: 8 }}>
        {(
          [
            ['u30', 'Unlock for 30 minutes', 'For a late class or an event set-up'],
            ['u60', 'Unlock for 1 hour', 'Then the door returns to its schedule'],
            ['lock', 'Lock now until the next opening time', 'For a security concern or maintenance'],
          ] as const
        ).map(([id, label, hint]) => (
          <label key={id} className={`opt ${choice === id ? 'on' : ''}`}>
            <input type="radio" name="ovr" checked={choice === id} onChange={() => setChoice(id)} />
            <div>
              <strong className="small">{label}</strong>
              <div className="xs muted">{hint}</div>
            </div>
          </label>
        ))}
      </div>
      <div className="field mt-2">
        <label htmlFor="ovr-r">Reason</label>
        <input id="ovr-r" className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Guest lecture runs until 17:45" />
      </div>
      <p className="xs muted">Overrides end automatically. Emergency exits always stay in local control.</p>
    </Modal>
  )
}

function SchedulesPanel() {
  const { state, update, toast, audit } = useDemo()
  const [edit, setEdit] = useState<Record<string, { unlock: string; lock: string }>>({})
  return (
    <Panel title="Schedules" sub="Opening and closing times by room group. A room can also have its own door timer, set in Smart rooms.">
      <div className="stack" style={{ gap: 12 }}>
        {state.doorSchedules.map((s) => {
          const e = edit[s.id] ?? { unlock: s.unlock, lock: s.lock }
          const dirty = e.unlock !== s.unlock || e.lock !== s.lock
          return (
            <div key={s.id} className="sched">
              <div className="row between">
                <strong className="small">{s.name}</strong>
                <span className="xs muted">{s.days.map((d) => DAY_SHORT[d]).join(', ')}</span>
              </div>
              <div className="row wrap" style={{ gap: 8, marginTop: 6 }}>
                <label className="xs muted">
                  Opens
                  <input className="input sm" type="time" value={e.unlock} onChange={(ev) => setEdit((x) => ({ ...x, [s.id]: { ...e, unlock: ev.target.value } }))} />
                </label>
                <label className="xs muted">
                  Locks
                  <input className="input sm" type="time" value={e.lock} onChange={(ev) => setEdit((x) => ({ ...x, [s.id]: { ...e, lock: ev.target.value } }))} />
                </label>
                {dirty && (
                  <button
                    className="btn xs"
                    style={{ alignSelf: 'flex-end' }}
                    onClick={() => {
                      if (toMin(e.lock) <= toMin(e.unlock)) return toast('Locking time must be after opening time.', 'warn')
                      update((st) => ({ ...st, doorSchedules: st.doorSchedules.map((x) => (x.id === s.id ? { ...x, ...e } : x)) }))
                      audit({ area: 'Doors', action: 'Changed door schedule times', target: s.name, detail: `${s.unlock} to ${s.lock} changed to ${e.unlock} to ${e.lock}` })
                      toast(`${s.name}: opens ${e.unlock}, locks ${e.lock}.`)
                    }}
                  >
                    Save
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </Panel>
  )
}

const DEMO_TODAY = '2026-10-21'
const isoDate = (iso: string) => new Date(`${iso}T00:00:00Z`)
const fmtIso = (iso: string, opts: Intl.DateTimeFormatOptions) => isoDate(iso).toLocaleDateString('en-GB', { ...opts, timeZone: 'UTC' })

/** "Mon 9 Nov 2026" for one day, "26 Oct to 1 Nov 2026" for a range. */
function describeDates(kind: 'single' | 'range', from: string, to: string) {
  if (kind === 'single' || from === to) return fmtIso(from, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).replace(',', '')
  const sameYear = from.slice(0, 4) === to.slice(0, 4)
  return `${fmtIso(from, sameYear ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short', year: 'numeric' })} to ${fmtIso(to, { day: 'numeric', month: 'short', year: 'numeric' })}`
}

function ExceptionModal({ onClose }: { onClose: () => void }) {
  const { update, toast, audit } = useDemo()
  const [name, setName] = useState('')
  const [kind, setKind] = useState<'single' | 'range'>('single')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const rangeBad = kind === 'range' && !!from && !!to && to < from
  const days = kind === 'range' && from && to && !rangeBad ? Math.round((isoDate(to).getTime() - isoDate(from).getTime()) / 86400000) + 1 : 1
  const dates = from && (kind === 'single' || (to && !rangeBad)) ? describeDates(kind, from, to) : ''
  const [scope, setScope] = useState('All doors')
  const [behaviour, setBehaviour] = useState('Stay locked all day')
  const save = () => {
    if (rangeBad) return toast('The end date must be on or after the start date.', 'warn')
    if (!name.trim() || !dates) return toast(kind === 'range' ? 'Add a name and pick the start and end dates.' : 'Add a name and pick the date.', 'warn')
    update((s) => ({ ...s, doorExceptions: [{ id: `ex${Date.now()}`, name: name.trim(), dates: dates.trim(), scope, behaviour, approvedBy: 'Prof. Dr. Lim Mei Ling' }, ...s.doorExceptions] }))
    audit({ area: 'Doors', action: 'Added schedule exception', target: name.trim(), detail: `${dates.trim()}, ${scope}, ${behaviour}` })
    toast(`Exception "${name.trim()}" added and approved.`)
    onClose()
  }
  return (
    <Modal
      open
      onClose={onClose}
      title="Add holiday or exception"
      sub="Changes the normal door schedule for specific dates."
      foot={
        <>
          <button className="btn secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn" onClick={save}>
            Add exception
          </button>
        </>
      }
    >
      <div className="field">
        <label htmlFor="ex-n">Name</label>
        <input id="ex-n" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Public holiday" />
      </div>
      <div className="field">
        <div className="row between wrap" style={{ gap: 8, marginBottom: 6 }}>
          <label htmlFor="ex-from" style={{ margin: 0 }}>
            Dates
          </label>
          <Seg
            value={kind}
            onChange={(v) => {
              setKind(v)
              if (v === 'single') setTo('')
            }}
            options={[
              { id: 'single', label: 'Single day' },
              { id: 'range', label: 'Date range' },
            ]}
          />
        </div>
        <div className={`ex-dates ${kind}`}>
          <label className="ex-date">
            <span>{kind === 'range' ? 'From' : 'Date'}</span>
            <input
              id="ex-from"
              className="input"
              type="date"
              min={DEMO_TODAY}
              value={from}
              onChange={(e) => {
                setFrom(e.target.value)
                if (to && e.target.value > to) setTo(e.target.value)
              }}
            />
          </label>
          {kind === 'range' && (
            <label className="ex-date">
              <span>To</span>
              <input className="input" type="date" min={from || DEMO_TODAY} value={to} onChange={(e) => setTo(e.target.value)} />
            </label>
          )}
        </div>
        <p className={`xs mt-1 ${rangeBad ? 'c-red' : 'muted'}`}>{rangeBad ? 'The end date must be on or after the start date.' : dates ? `${dates}${kind === 'range' ? `, ${days} day${days > 1 ? 's' : ''}` : ''}` : kind === 'range' ? 'Pick the first and last day.' : 'Pick the day.'}</p>
      </div>
      <div className="grid g-2" style={{ gap: 12 }}>
        <div className="field">
          <label htmlFor="ex-s">Applies to</label>
          <select id="ex-s" className="select" value={scope} onChange={(e) => setScope(e.target.value)}>
            <option>All doors</option>
            <option>Teaching rooms</option>
            <option>Labs</option>
            {buildings.map((b) => (
              <option key={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="ex-b">Doors should</label>
          <select id="ex-b" className="select" value={behaviour} onChange={(e) => setBehaviour(e.target.value)}>
            <option>Stay locked all day</option>
            <option>Open 07:00 to 22:00</option>
            <option>Open 09:00 to 13:00</option>
          </select>
        </div>
      </div>
    </Modal>
  )
}
