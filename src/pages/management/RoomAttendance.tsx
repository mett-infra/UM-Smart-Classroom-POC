import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertTriangle, CalendarDays, ChevronLeft, ChevronRight, Download, Radio, Search, ShieldCheck, Users } from 'lucide-react'
import { Avatar, Badge, Empty, Metric, Modal, Notice, PageHead, Panel, type Tone } from '../../components/ui'
import { buildings, type Space } from '../../data/smartcampus'
import { demoMinutes, useDemo } from '../../store/DemoStore'
import {
  ATT_TODAY,
  attendanceDates,
  capBand,
  dayRecord,
  fmtDay,
  fmtMin,
  headcountAt,
  peakOf,
  personById,
  personHistory,
  sessionsHeldFor,
  uniquePeople,
  weekdayOf,
  type DayRecord,
  type PersonRole,
  type Visit,
  type VisitStatus,
} from '../../data/attendance'
import { downloadCsv } from './csv'
import '../../styles/management.css'
import '../../styles/smartcampus.css'

/*
  Room attendance (Day 3): live headcount today and who attended each room on any of the last 60 days.
  Sample data from src/data/attendance.ts. In production this reads the attendance service.
*/

const statusTone: Record<VisitStatus, Tone> = { 'On time': 'green', Late: 'amber', 'Checked in': 'blue', 'On duty': 'plum' }
const PAGE = 25

function useNow() {
  const [now, setNow] = useState(demoMinutes())
  useEffect(() => {
    const id = setInterval(() => setNow(demoMinutes()), 10000)
    return () => clearInterval(id)
  }, [])
  return now
}

export default function RoomAttendance() {
  const { state } = useDemo()
  const now = useNow()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState('')
  const [bld, setBld] = useState('all')
  const dates = useMemo(() => attendanceDates(), [])
  const rooms = state.spaces.filter((s) => s.kind === 'sub' && s.state !== 'Deactivated')
  const roomId = rooms.some((r) => r.id === params.get('room')) ? params.get('room')! : 'sp-eaud'
  const date = dates.includes(params.get('date') ?? '') ? params.get('date')! : ATT_TODAY
  const room = rooms.find((r) => r.id === roomId) ?? rooms[0]
  const go = (next: { room?: string; date?: string }) => setParams({ room: next.room ?? roomId, date: next.date ?? date }, { replace: true })

  const live = rooms.map((r) => {
    const rec = dayRecord(r.id, ATT_TODAY, now)
    const count = headcountAt(rec, now)
    return { r, count, band: capBand(count, r.capacity), today: uniquePeople(rec), liveSession: rec.sessions.find((s) => s.state === 'Live') }
  })
  const shown = live.filter(({ r }) => (bld === 'all' || r.buildingId === bld) && `${r.name} ${r.code}`.toLowerCase().includes(q.toLowerCase()))
  const alerts = live.filter((x) => x.band.pct >= 80).sort((a, b) => b.band.pct - a.band.pct)

  return (
    <>
      <PageHead
        title="Attendance"
        sub="Live headcount in every room today, and who attended each room on any day in the last 60 days."
        actions={
          <span className="monitor-chip">
            <span className="live-dot" /> Live, updated {fmtMin(now)}
          </span>
        }
      />

      <div className="metrics">
        <Metric label="In rooms now" value={live.reduce((n, x) => n + x.count, 0).toLocaleString()} foot={`Across ${rooms.length} rooms`} icon={<Users size={18} />} />
        <Metric label="Rooms in use now" value={live.filter((x) => x.count > 0).length} foot="At least one person checked in" />
        <Metric label="Checked in today" value={live.reduce((n, x) => n + x.today, 0).toLocaleString()} foot="Students, staff and visitors" />
        <Metric label="Capacity alerts" value={alerts.length} foot={<span className={alerts.some((a) => a.band.tone === 'red') ? 'delta-down' : ''}>Rooms at 80% or more</span>} />
      </div>

      {alerts.length > 0 && (
        <div className="cap-alerts" role="status">
          <AlertTriangle size={17} />
          <strong className="small">Capacity alerts</strong>
          {alerts.map((a) => (
            <button key={a.r.id} className={`cap-alert ${a.band.tone}`} onClick={() => go({ room: a.r.id, date: ATT_TODAY })}>
              {a.r.name}: {a.count} of {a.r.capacity} ({a.band.pct}%, {a.band.label.toLowerCase()})
            </button>
          ))}
        </div>
      )}

      <div className="sr-layout">
        <Panel title="Rooms" sub="Live headcount now" bodyClass="panel-body tight" className="sr-list">
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
            {shown.map(({ r, count, band, liveSession }) => (
              <button key={r.id} className={`sr-room att-room ${r.id === room?.id ? 'on' : ''}`} onClick={() => go({ room: r.id })}>
                <div className="grow" style={{ minWidth: 0 }}>
                  <strong className="truncate">{r.name}</strong>
                  <span className="truncate">
                    {buildings.find((b) => b.id === r.buildingId)?.short}, {r.type.toLowerCase()}
                  </span>
                  <div className={`cap-mini ${band.tone}`}>
                    <i style={{ width: `${Math.min(100, band.pct)}%` }} />
                  </div>
                </div>
                <div className="sr-room-meta">
                  <span className="num strong small">
                    {count}
                    <span className="muted"> / {r.capacity}</span>
                  </span>
                  {liveSession ? (
                    <Badge tone={band.tone === 'green' ? 'live' : band.tone}>{band.tone === 'green' ? 'Live' : band.label}</Badge>
                  ) : (
                    <span className="xs muted">No session now</span>
                  )}
                </div>
              </button>
            ))}
            {shown.length === 0 && <p className="small muted" style={{ padding: 16 }}>No rooms match.</p>}
          </div>
        </Panel>

        {room ? <RoomDay key={`${room.id}-${date}`} room={room} date={date} dates={dates} now={now} onDate={(d) => go({ date: d })} /> : <Panel><Empty title="No rooms yet">Create sub rooms in Campus setup first.</Empty></Panel>}
      </div>
      <div className="mt-2">
        <Notice>
          Sample data. In production each check-in comes from face recognition at the room camera, a card tap at the door, or the lecturer’s QR check-in code, and the live headcount comes from the room’s people counter. Personal details are shown to authorised staff only and every view is logged.
        </Notice>
      </div>
    </>
  )
}

function RoomDay({ room, date, dates, now, onDate }: { room: Space; date: string; dates: string[]; now: number; onDate: (d: string) => void }) {
  const { audit, toast } = useDemo()
  const isToday = date === ATT_TODAY
  const rec = dayRecord(room.id, date, now)
  const [session, setSession] = useState('all')
  const [role, setRole] = useState<'all' | PersonRole>('all')
  const [q, setQ] = useState('')
  const [limit, setLimit] = useState(PAGE)
  const [person, setPerson] = useState<string | null>(null)
  const idx = dates.indexOf(date)

  const rows = rec.visits
    .map((v) => ({ v, p: personById(v.personId)!, s: rec.sessions.find((s) => s.id === v.sessionId)! }))
    .filter(({ v, p }) => (session === 'all' || v.sessionId === session) && (role === 'all' || p.role === role) && `${p.name} ${p.idNo}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (isToday ? b.v.inMin - a.v.inMin : a.v.inMin - b.v.inMin))

  const showSession = session === 'all' && rec.sessions.length > 1
  const count = isToday ? headcountAt(rec, now) : 0
  const band = capBand(count, room.capacity)
  const peak = peakOf(rec, isToday ? now : 24 * 60)
  const people = uniquePeople(rec)
  const late = rec.visits.filter((v) => v.status === 'Late').length
  const onTimeBase = rec.visits.filter((v) => v.status === 'Late' || v.status === 'On time').length

  const exportCsv = () => {
    downloadCsv(`attendance-${room.code}-${date}.csv`, [
      ['Room', 'Date', 'Name', 'ID', 'Role', 'Faculty or organisation', 'Programme or position', 'Session', 'Check-in', 'Check-out', 'Method', 'Status'],
      ...rows.map(({ v, p, s }) => [room.name, date, p.name, p.idNo, p.role, p.faculty, p.programme, `${s.start} ${s.code} ${s.title}`, fmtMin(v.inMin), v.outMin === null ? 'Still in room' : fmtMin(v.outMin), v.method, v.status]),
    ])
    audit({ area: 'Attendance', action: 'Exported attendance', target: room.code, detail: `${date}, ${rows.length} rows` })
    toast(`Downloaded ${rows.length} attendance rows for ${room.name}.`)
  }

  return (
    <div className="stack">
      <Panel
        title={room.name}
        sub={`${buildings.find((b) => b.id === room.buildingId)?.name}, ${room.floor}, ${room.type.toLowerCase()}, capacity ${room.capacity}`}
        action={
          <button className="btn secondary sm" onClick={exportCsv} disabled={rows.length === 0}>
            <Download size={15} /> Export CSV
          </button>
        }
      >
        <div className="att-datebar">
          <div className="row" style={{ gap: 6 }}>
            <button className="icon-btn sm" aria-label="Previous day" disabled={idx <= 0} onClick={() => onDate(dates[idx - 1])}>
              <ChevronLeft size={16} />
            </button>
            <label className="att-date">
              <CalendarDays size={16} />
              <input type="date" className="input sm" min={dates[0]} max={ATT_TODAY} value={date} onChange={(e) => e.target.value && dates.includes(e.target.value) && onDate(e.target.value)} aria-label="Pick a date" />
            </label>
            <button className="icon-btn sm" aria-label="Next day" disabled={idx >= dates.length - 1} onClick={() => onDate(dates[idx + 1])}>
              <ChevronRight size={16} />
            </button>
            <button className={`btn sm ${isToday ? '' : 'secondary'}`} onClick={() => onDate(ATT_TODAY)}>
              <Radio size={14} /> Today
            </button>
          </div>
          <strong className="small">{fmtDay(date)}</strong>
        </div>
        <Calendar room={room} dates={dates} date={date} now={now} onDate={onDate} />
      </Panel>

      {isToday ? (
        <Panel title="Live headcount" sub={`People in ${room.name} right now, from check-ins and the people counter`} action={<Badge tone={band.tone === 'green' ? 'green' : band.tone}>{band.label}</Badge>}>
          <div className="live-hc">
            <div className="live-hc-num">
              <strong className="num">{count}</strong>
              <span className="muted">of {room.capacity}</span>
            </div>
            <div className="grow">
              <div className={`cap-bar ${band.tone}`} aria-label={`${band.pct}% of capacity`}>
                <i style={{ width: `${Math.min(100, band.pct)}%` }} />
                <b style={{ left: '80%' }} title="Busy at 80%" />
                <b style={{ left: '90%' }} title="Near capacity at 90%" />
              </div>
              <div className="row between xs muted" style={{ marginTop: 6 }}>
                <span>{band.pct}% full</span>
                <span>Alerts at 80% and 90%</span>
              </div>
            </div>
          </div>
          <div className="att-stats">
            <div>
              <span>Checked in today</span>
              <strong>{people}</strong>
            </div>
            <div>
              <span>Peak so far</span>
              <strong>{peak.count ? `${peak.count} at ${fmtMin(peak.at)}` : 'None yet'}</strong>
            </div>
            <div>
              <span>Arrived late</span>
              <strong>{late}</strong>
            </div>
            <div>
              <span>Updated</span>
              <strong>{fmtMin(now)}</strong>
            </div>
          </div>
        </Panel>
      ) : (
        <div className="metrics">
          <Metric label="People" value={people} foot="Checked in that day" />
          <Metric label="Sessions" value={rec.sessions.length} foot={rec.sessions.length ? rec.sessions.map((s) => s.code).join(', ') : 'None held'} />
          <Metric label="Peak headcount" value={peak.count} foot={peak.count ? `At ${fmtMin(peak.at)}, ${capBand(peak.count, room.capacity).pct}% of capacity` : 'Room not used'} />
          <Metric label="On time" value={onTimeBase ? `${Math.round(((onTimeBase - late) / onTimeBase) * 100)}%` : 'n/a'} foot={`${late} arrived late`} />
        </div>
      )}

      <Panel title={isToday ? 'Who is here today' : 'Who attended'} sub={rec.note ? undefined : `${rows.length} of ${rec.visits.length} check-ins shown. Select a person for details.`} bodyClass="panel-body tight">
        {rec.note && rec.sessions.length === 0 ? (
          <Empty icon={<CalendarDays size={26} />} title="No attendance this day">
            {rec.note}
          </Empty>
        ) : (
          <>
            <div className="att-sessions">
              <button className={`att-sess ${session === 'all' ? 'on' : ''}`} onClick={() => (setSession('all'), setLimit(PAGE))}>
                <strong>All sessions</strong>
                <span>{rec.visits.length} check-ins</span>
              </button>
              {rec.sessions.map((s) => {
                const n = rec.visits.filter((v) => v.sessionId === s.id).length
                return (
                  <button key={s.id} className={`att-sess ${session === s.id ? 'on' : ''}`} onClick={() => (setSession(s.id), setLimit(PAGE))}>
                    <strong className="truncate">
                      {s.start} to {s.end}, {s.code === 'Event' || s.code === 'Duty' ? s.title : s.code}
                    </strong>
                    <span className="truncate">{s.code === 'Event' || s.code === 'Duty' ? personById(s.host)?.name : s.title}</span>
                    <span className="row" style={{ gap: 6 }}>
                      {s.state === 'Live' ? <Badge tone="live">Live</Badge> : s.state === 'Upcoming' ? <Badge>Upcoming</Badge> : null}
                      <span className="num">
                        {n}
                        {s.kind !== 'Event' && s.kind !== 'Duty' ? ` of ${s.expected} enrolled` : ''}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
            <div className="att-filters">
              <div className="search-field">
                <Search size={16} />
                <input className="input sm" placeholder="Search name or ID" value={q} onChange={(e) => (setQ(e.target.value), setLimit(PAGE))} aria-label="Search people" />
              </div>
              <select className="select sm" value={role} onChange={(e) => (setRole(e.target.value as typeof role), setLimit(PAGE))} aria-label="Role">
                <option value="all">Everyone</option>
                <option value="Student">Students</option>
                <option value="Lecturer">Lecturers</option>
                <option value="Staff">Staff</option>
                <option value="Visitor">Visitors</option>
              </select>
            </div>
            {rows.length === 0 ? (
              <p className="small muted" style={{ padding: '6px 20px 18px' }}>
                {rec.visits.length === 0 ? (isToday ? 'Nobody has checked in yet today.' : 'Nobody checked in.') : 'No one matches the filters.'}
              </p>
            ) : (
              <div className="table-wrap">
                <table className="table att-table">
                  <thead>
                    <tr>
                      <th>Person</th>
                      <th>Programme or position</th>
                      {showSession && <th>Session</th>}
                      <th>Time in room</th>
                      <th>Checked in by</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, limit).map(({ v, p, s }) => (
                      <tr key={`${v.personId}-${v.sessionId}`} className="clickable" onClick={() => setPerson(p.id)}>
                        <td style={{ minWidth: 210 }}>
                          <div className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
                            <Avatar name={p.name} size="sm" color={p.color} />
                            <div style={{ minWidth: 0 }}>
                              <button className="link-btn small strong att-name" onClick={(e) => (e.stopPropagation(), setPerson(p.id))}>
                                {p.name}
                              </button>
                              <div className="xs muted">
                                {p.role}, <span className="num">{p.idNo}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ minWidth: 170 }}>
                          <div className="small">
                            {p.programme}
                            {p.year ? `, year ${p.year}` : ''}
                          </div>
                          <div className="xs muted">{p.faculty}</div>
                        </td>
                        {showSession && <td className="small">{s.code === 'Event' || s.code === 'Duty' ? s.title : `${s.code}, ${s.start}`}</td>}
                        <td className="num small nowrap">
                          {fmtMin(v.inMin)} to {v.outMin === null ? <Badge tone="green">In room</Badge> : fmtMin(v.outMin)}
                        </td>
                        <td className="small nowrap">{v.method}</td>
                        <td>
                          <Badge tone={statusTone[v.status]}>{v.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {rows.length > limit && (
              <div className="row" style={{ padding: 14, gap: 10, justifyContent: 'center' }}>
                <span className="xs muted">
                  Showing {limit} of {rows.length}
                </span>
                <button className="btn secondary sm" onClick={() => setLimit((l) => l + 50)}>
                  Show 50 more
                </button>
              </div>
            )}
          </>
        )}
      </Panel>

      {person && <PersonModal room={room} rec={rec} personId={person} now={now} onClose={() => setPerson(null)} />}
    </div>
  )
}

function Calendar({ room, dates, date, now, onDate }: { room: Space; dates: string[]; date: string; now: number; onDate: (d: string) => void }) {
  const days = useMemo(
    () =>
      dates.map((iso) => {
        const rec = dayRecord(room.id, iso, now)
        return { iso, n: uniquePeople(rec), note: rec.note }
      }),
    // recompute when the minute changes so today's count stays current
    [room.id, dates, now],
  )
  const max = Math.max(1, ...days.map((d) => d.n))
  const lead = (weekdayOf(dates[0]) + 6) % 7 // Monday first
  const level = (n: number) => (n === 0 ? 0 : Math.min(4, 1 + Math.floor((n / max) * 3.999)))
  return (
    <div className="att-cal-wrap">
      <div className="att-cal" role="grid" aria-label="Last 60 days">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <span key={d} className="att-cal-h">
            {d}
          </span>
        ))}
        {Array.from({ length: lead }, (_, i) => (
          <span key={`b${i}`} />
        ))}
        {days.map((d) => {
          const day = Number(d.iso.slice(8))
          return (
            <button key={d.iso} className={`att-day l${level(d.n)} ${d.iso === date ? 'on' : ''} ${d.iso === ATT_TODAY ? 'today' : ''}`} onClick={() => onDate(d.iso)} title={`${fmtDay(d.iso)}: ${d.n ? `${d.n} people` : (d.note ?? 'No attendance')}`} aria-label={`${fmtDay(d.iso)}, ${d.n} people`}>
              <span className="att-day-n">{day === 1 ? fmtDay(d.iso, 'short').split(' ').slice(1).join(' ') : day}</span>
              {d.n > 0 && <span className="att-day-c num">{d.n}</span>}
            </button>
          )
        })}
      </div>
      <div className="att-legend xs muted">
        <span>Fewer people</span>
        {[0, 1, 2, 3, 4].map((l) => (
          <i key={l} className={`att-day l${l}`} />
        ))}
        <span>More</span>
        <span className="grow" />
        <span>Pick any day from {fmtDay(dates[0], 'short')} to today</span>
      </div>
    </div>
  )
}

function PersonModal({ room, rec, personId, now, onClose }: { room: Space; rec: DayRecord; personId: string; now: number; onClose: () => void }) {
  const { audit } = useDemo()
  const p = personById(personId)!
  const history = useMemo(() => personHistory(room.id, personId, now), [room.id, personId, now])
  const codes = [...new Set(history.map((h) => h.session.code))].filter((c) => c !== 'Event' && c !== 'Duty')
  const held = p.role === 'Student' && codes.length ? sessionsHeldFor(room.id, codes, now) : 0
  const lateCount = history.filter((h) => h.visit.status === 'Late').length
  const todayVisit: Visit | undefined = rec.visits.find((v) => v.personId === personId)

  useEffect(() => {
    audit({ area: 'Attendance', action: 'Viewed attendance record', target: p.name, detail: `${room.code}` })
    // log once when the record opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Modal open onClose={onClose} title={p.name} sub={`${p.role}, ${p.idNo}`} wide>
      <div className="person-head">
        <Avatar name={p.name} size="lg" color={p.color} />
        <dl className="kv grow">
          <dt>Role</dt>
          <dd>{p.role}</dd>
          <dt>{p.role === 'Visitor' ? 'Organisation' : 'Faculty'}</dt>
          <dd>{p.faculty}</dd>
          <dt>{p.role === 'Student' ? 'Programme' : 'Position'}</dt>
          <dd>
            {p.programme}
            {p.year ? `, year ${p.year}` : ''}
          </dd>
          <dt>{p.role === 'Student' ? 'Matric no.' : 'ID'}</dt>
          <dd className="num">{p.idNo}</dd>
          <dt>Email</dt>
          <dd>{p.email}</dd>
          {todayVisit && (
            <>
              <dt>This day</dt>
              <dd>
                In {fmtMin(todayVisit.inMin)}, {todayVisit.outMin === null ? 'still in the room' : `out ${fmtMin(todayVisit.outMin)}`}, by {todayVisit.method.toLowerCase()}
              </dd>
            </>
          )}
        </dl>
      </div>

      <div className="att-stats mt-2">
        <div>
          <span>Visits to {room.name}</span>
          <strong>{history.length}</strong>
        </div>
        {p.role === 'Student' && held > 0 && (
          <div>
            <span>Class attendance here</span>
            <strong>
              {history.filter((h) => codes.includes(h.session.code)).length} of {held} sessions
            </strong>
          </div>
        )}
        <div>
          <span>Late arrivals</span>
          <strong>{lateCount}</strong>
        </div>
      </div>

      <h3 className="small strong mt-2" style={{ marginBottom: 8 }}>
        Last 60 days in {room.name}
      </h3>
      <div className="table-wrap" style={{ maxHeight: 260 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Session</th>
              <th>In</th>
              <th>Out</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {history.map((h) => (
              <tr key={`${h.iso}-${h.session.id}`}>
                <td className="small nowrap">{fmtDay(h.iso, 'short')}</td>
                <td className="small">{h.session.code === 'Event' || h.session.code === 'Duty' ? h.session.title : `${h.session.code}, ${h.session.title}`}</td>
                <td className="num small">{fmtMin(h.visit.inMin)}</td>
                <td className="num small">{h.visit.outMin === null ? 'In room' : fmtMin(h.visit.outMin)}</td>
                <td>
                  <Badge tone={statusTone[h.visit.status]}>{h.visit.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="xs muted mt-2 row" style={{ gap: 6 }}>
        <ShieldCheck size={14} /> Viewing this record was added to the audit log.
      </p>
    </Modal>
  )
}

