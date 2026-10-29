import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Download, Laptop, ScanFace, Search, UserCheck, Users } from 'lucide-react'
import { PageHead, Panel, Badge, Avatar, Modal, Seg, Empty } from '../../components/ui'
import { FaceRecognitionModal, SCAN_SECONDS } from '../../components/FaceRecognitionModal'
import { fmtDay } from '../../data/attendance'
import { demoMinutes, nowLabel, useDemo, type AttMark } from '../../store/DemoStore'
import { useFaces } from '../../store/faces'
import { downloadCsv } from './lecturerUtils'
import { classList, effectiveMarks, inRoom, isToday, lecSessions, roomScan, semesterRates, type LecSession } from './attendanceData'
import '../../styles/lecturer.css'
import '../../styles/smartcampus.css'

/*
  Attendance (lecturer). Two options per student: present or absent.
  1. Face recognition marks students present automatically (room camera, or this device's camera).
  2. The lecturer marks present anyone the camera missed, for example when 100 people are in the room
     but only 80 were recognised.
*/

type Filter = 'all' | 'present' | 'absent' | 'manual'

function useNow() {
  const [now, setNow] = useState(demoMinutes())
  useEffect(() => {
    const id = setInterval(() => setNow(demoMinutes()), 15000)
    return () => clearInterval(id)
  }, [])
  return now
}

export default function Attendance() {
  const { state, update, toast, log } = useDemo()
  const faces = useFaces()
  const now = useNow()
  const [sid, setSid] = useState(lecSessions[0].id)
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [scanOpen, setScanOpen] = useState(false)
  const [deviceOpen, setDeviceOpen] = useState(false)
  const sess = lecSessions.find((s) => s.id === sid)!
  const today = isToday(sess)
  const people = useMemo(() => classList(sess), [sess])
  const marks = effectiveMarks(sess, now, state.lecAttendance[sid])
  const rates = semesterRates(sess, now)
  const scan = state.attScans[sid]
  const counter = today ? inRoom(sess, now).length : 0

  const present = people.filter((p) => marks[p.id]?.s === 'present')
  const byCamera = present.filter((p) => marks[p.id].by === 'camera').length
  const byLecturer = present.length - byCamera
  const presentStudents = present.filter((p) => !p.id.startsWith('fp-')).length
  const gap = counter - presentStudents

  const list = people.filter((p) => {
    const m = marks[p.id]
    const okFilter = filter === 'all' || (filter === 'present' && m?.s === 'present') || (filter === 'absent' && m?.s !== 'present') || (filter === 'manual' && m?.by === 'lecturer' && m.s === 'present')
    return okFilter && (!q || `${p.name} ${p.idNo}`.toLowerCase().includes(q.toLowerCase()))
  })

  const setMarks = (ids: string[], mark: AttMark | null) =>
    update((s) => {
      const cur = { ...(s.lecAttendance[sid] ?? {}) }
      ids.forEach((id) => {
        if (mark) cur[id] = mark
        else delete cur[id]
      })
      return { ...s, lecAttendance: { ...s.lecAttendance, [sid]: cur } }
    })

  const mark = (id: string, v: 'present' | 'absent') => {
    if ((marks[id]?.s ?? 'absent') === v) return
    setMarks([id], { s: v, by: 'lecturer', at: nowLabel() })
  }

  const markPicked = () => {
    const ids = [...picked].filter((id) => marks[id]?.s !== 'present')
    if (!ids.length) return
    setMarks(ids, { s: 'present', by: 'lecturer', at: nowLabel() })
    toast(`${ids.length} student${ids.length > 1 ? 's' : ''} marked present by you.`)
    log({ text: `Attendance updated for ${sess.code}`, sub: `${ids.length} marked present manually`, kind: 'room' })
    setPicked(new Set())
  }

  const applyScan = (ids: string[], recognised: number) => {
    const fresh = ids.filter((id) => !state.lecAttendance[sid]?.[id] || state.lecAttendance[sid][id].s !== 'present')
    setMarks(fresh, { s: 'present', by: 'camera', at: nowLabel() })
    update((s) => ({ ...s, attScans: { ...s.attScans, [sid]: { at: nowLabel(), recognised } } }))
    log({ text: `Face scan in ${sess.room.split(',')[0]}`, sub: `${recognised} students recognised for ${sess.code}`, kind: 'room' })
  }

  const exportCsv = () => {
    downloadCsv(`attendance_${sess.code}_${sess.date}.csv`, [
      ['Course', 'Session', 'Date', 'ID', 'Name', 'Status', 'How', 'Time'],
      ...people.map((p) => {
        const m = marks[p.id]
        return [sess.code, sess.label, sess.date, p.idNo, p.name, m?.s === 'present' ? 'Present' : 'Absent', m?.s === 'present' ? (m.by === 'camera' ? 'Face recognition' : 'Marked by lecturer') : '', m?.s === 'present' ? m.at : '']
      }),
    ])
    toast('Attendance exported as CSV.')
  }

  const visibleAbsent = list.filter((p) => marks[p.id]?.s !== 'present').map((p) => p.id)
  const allPicked = visibleAbsent.length > 0 && visibleAbsent.every((id) => picked.has(id))

  return (
    <>
      <PageHead
        title="Attendance"
        sub="Face recognition marks students present automatically. Mark anyone the camera missed yourself."
        actions={
          <>
            <button className="btn secondary" onClick={exportCsv}>
              <Download size={16} /> Export CSV
            </button>
            {today && (
              <>
                <button className="btn secondary" onClick={() => setDeviceOpen(true)}>
                  <Laptop size={16} /> Scan with this device
                </button>
                <button className="btn" onClick={() => setScanOpen(true)}>
                  <ScanFace size={16} /> {scan ? 'Scan the room again' : 'Start face scan'}
                </button>
              </>
            )}
          </>
        }
      />

      <div className="grid g-side-main">
        <Panel title="Sessions" sub="Choose a class to take or review attendance" bodyClass="panel-body tight">
          <div className="list">
            {lecSessions.map((s) => {
              const m = effectiveMarks(s, now, state.lecAttendance[s.id])
              const total = classList(s).length
              const n = classList(s).filter((p) => m[p.id]?.s === 'present').length
              return (
                <div
                  key={s.id}
                  className="list-item clickable"
                  style={s.id === sid ? { background: 'var(--primary-50)' } : undefined}
                  onClick={() => {
                    setSid(s.id)
                    setPicked(new Set())
                    setFilter('all')
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setSid(s.id)}
                  aria-pressed={s.id === sid}
                >
                  <div className="grow">
                    <div className="row" style={{ gap: 8 }}>
                      <strong className="small">{s.code}</strong>
                      {isToday(s) && <Badge tone="live">Live now</Badge>}
                    </div>
                    <div className="title small truncate">{s.label}</div>
                    <div className="sub xs">
                      {isToday(s) ? 'Today' : fmtDay(s.date, 'short')}, {s.start} to {s.end}, {s.room.split(',')[0]}
                    </div>
                  </div>
                  <span className="strong num small">
                    {n}
                    <span className="muted"> / {total}</span>
                  </span>
                </div>
              )
            })}
          </div>
        </Panel>

        <div className="stack">
          <div className="att-chips">
            <div className="att-chip">
              <strong>{people.length}</strong> on the class list
            </div>
            <div className="att-chip">
              <strong className="c-green">{present.length}</strong> present
            </div>
            <div className="att-chip">
              <strong>{byCamera}</strong> by face recognition
            </div>
            <div className="att-chip">
              <strong>{byLecturer}</strong> marked by you
            </div>
            <div className="att-chip">
              <strong className="c-red">{people.length - present.length}</strong> absent
            </div>
          </div>

          {today && !scan && (
            <div className="att-banner info">
              <ScanFace size={18} />
              <div className="grow">
                <strong>No face scan yet for this session.</strong> Start a face scan: the room camera recognises the students in {sess.room.split(',')[0]} and marks them present. Then mark anyone it misses.
              </div>
              <button className="btn sm" onClick={() => setScanOpen(true)}>
                Start face scan
              </button>
            </div>
          )}
          {today && scan && gap > 0 && (
            <div className="att-banner warn">
              <AlertTriangle size={18} />
              <div className="grow">
                <strong>
                  The people counter shows {counter} students in the room, but {presentStudents} are marked present.
                </strong>{' '}
                {gap} {gap === 1 ? 'person was' : 'people were'} not recognised by the camera. Find them in the list and mark them present.
              </div>
              <button className="btn sm secondary" onClick={() => setFilter('absent')}>
                Show absent
              </button>
            </div>
          )}
          {today && scan && gap <= 0 && (
            <div className="att-banner ok">
              <CheckCircle2 size={18} />
              <div className="grow">
                <strong>Everyone counted in the room is marked present.</strong> Last face scan at {scan.at}: {scan.recognised} recognised.
              </div>
            </div>
          )}

          <Panel
            title={`${sess.code} ${sess.label}`}
            sub={`${today ? 'Today' : fmtDay(sess.date)}, ${sess.start} to ${sess.end}, ${sess.room}${today ? `. People counter: ${counter} students in the room now.` : '.'}`}
            bodyClass=""
          >
            <div className="lat-tools">
              <div className="search-field">
                <Search size={15} />
                <input className="input sm" placeholder="Search name or matric number" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search students" />
              </div>
              <Seg<Filter>
                value={filter}
                onChange={(v) => {
                  setFilter(v)
                  setPicked(new Set())
                }}
                options={[
                  { id: 'all', label: 'All' },
                  { id: 'present', label: 'Present' },
                  { id: 'absent', label: 'Absent' },
                  { id: 'manual', label: 'Marked by you' },
                ]}
              />
            </div>
            {picked.size > 0 && (
              <div className="lat-bulk">
                <span className="small">
                  <strong>{picked.size}</strong> selected
                </span>
                <button className="btn sm" onClick={markPicked}>
                  <UserCheck size={15} /> Mark selected present
                </button>
                <button className="btn ghost sm" onClick={() => setPicked(new Set())}>
                  Clear
                </button>
              </div>
            )}
            <div className="table-wrap">
              <table className="table lat-table">
                <thead>
                  <tr>
                    <th style={{ width: 36 }}>
                      <input
                        type="checkbox"
                        aria-label="Select all absent students shown"
                        checked={allPicked}
                        disabled={visibleAbsent.length === 0}
                        onChange={(e) => setPicked(e.target.checked ? new Set(visibleAbsent) : new Set())}
                      />
                    </th>
                    <th>Student</th>
                    <th className="num col-rate">In-room attendance</th>
                    <th>This session</th>
                    <th>Mark</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((p) => {
                    const m = marks[p.id]
                    const isPresent = m?.s === 'present'
                    const rate = rates.get(p.id)
                    const demo = p.id.startsWith('fp-')
                    return (
                      <tr key={p.id} className={demo ? 'lat-demo' : ''}>
                        <td>
                          <input
                            type="checkbox"
                            aria-label={`Select ${p.name}`}
                            disabled={isPresent}
                            checked={picked.has(p.id)}
                            onChange={(e) =>
                              setPicked((cur) => {
                                const n = new Set(cur)
                                if (e.target.checked) n.add(p.id)
                                else n.delete(p.id)
                                return n
                              })
                            }
                          />
                        </td>
                        <td>
                          <div className="cell-person">
                            {demo && faces[p.id] ? <img className="face-thumb sm" src={faces[p.id].photo} alt="" /> : <Avatar name={p.name} color={p.color} size="sm" />}
                            <div>
                              <strong>{p.name}</strong>
                              <span>{demo ? 'Demo participant' : p.idNo}</span>
                            </div>
                          </div>
                        </td>
                        <td className="num small col-rate" style={{ color: rate !== undefined && rate < 50 ? 'var(--red)' : undefined }}>
                          {rate === undefined ? 'n/a' : `${rate}%`}
                        </td>
                        <td style={{ minWidth: 190 }}>
                          {isPresent ? (
                            <>
                              <Badge tone="green">Present</Badge>
                              <div className="xs muted" style={{ marginTop: 3 }}>
                                {m.by === 'camera' ? `Face recognition, ${m.at}` : `Marked by you, ${m.at}`}
                              </div>
                            </>
                          ) : (
                            <>
                              <Badge tone="red">Absent</Badge>
                              {demo && today && (
                                <div className="xs muted" style={{ marginTop: 3 }}>
                                  {faces[p.id] ? 'Use “Scan with this device”' : 'Sign up in Management, Face sign-up'}
                                </div>
                              )}
                            </>
                          )}
                        </td>
                        <td>
                          <div className="att-seg">
                            <Seg<'present' | 'absent'>
                              value={isPresent ? 'present' : 'absent'}
                              onChange={(v) => mark(p.id, v)}
                              options={[
                                { id: 'present', label: <span style={{ color: isPresent ? 'var(--green)' : undefined }}>Present</span> },
                                { id: 'absent', label: <span style={{ color: !isPresent ? 'var(--red)' : undefined }}>Absent</span> },
                              ]}
                            />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {list.length === 0 && <Empty title="No students match" />}
            </div>
          </Panel>
        </div>
      </div>

      {scanOpen && (
        <RoomScanModal
          session={sess}
          now={now}
          onFinish={(ids) => applyScan(ids, ids.length)}
          onClose={() => setScanOpen(false)}
        />
      )}
      {deviceOpen && (
        <FaceRecognitionModal
          title="Scan with this device"
          sub={`Look at this device's camera for ${SCAN_SECONDS} seconds. A recognised student is marked present for ${sess.code}.`}
          onClose={() => setDeviceOpen(false)}
          onMatch={(id) => {
            if (!classList(sess).some((p) => p.id === id)) return
            setMarks([id], { s: 'present', by: 'camera', at: nowLabel() })
            log({ text: `Face recognised for ${sess.code}`, sub: `${classList(sess).find((p) => p.id === id)?.name} marked present`, kind: 'room' })
          }}
        />
      )}
    </>
  )
}

// ---------- room camera scan (simulated room camera, 15 seconds) ----------
const STAGES: [number, string][] = [
  [0, 'Looking for faces'],
  [3, 'Reading facial features'],
  [7, 'Matching with the class list'],
  [12, 'Confirming matches'],
]

// Where recognition boxes appear on the classroom camera image (percent).
const BOXES = Array.from({ length: 26 }, (_, i) => {
  const row = Math.floor(i / 7)
  const col = i % 7
  return { x: 10 + col * 12.2 + (row % 2) * 5, y: 44 + row * 11, s: 6.5 - row * 0.4 }
})

function RoomScanModal({ session, now, onFinish, onClose }: { session: LecSession; now: number; onFinish: (ids: string[]) => void; onClose: () => void }) {
  const [t, setT] = useState(0)
  const [done, setDone] = useState(false)
  const result = useMemo(() => roomScan(session, now), [session, now])

  useEffect(() => {
    const t0 = performance.now()
    const id = setInterval(() => {
      const e = (performance.now() - t0) / 1000
      if (e >= SCAN_SECONDS) {
        clearInterval(id)
        setT(SCAN_SECONDS)
        setDone(true)
        onFinish(result.recognised)
      } else setT(e)
    }, 100)
    return () => clearInterval(id)
    // run once when the scan opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const k = t / SCAN_SECONDS
  const count = Math.round(result.recognised.length * Math.min(1, k * 1.15))
  const stage = [...STAGES].reverse().find(([s]) => t >= s)?.[1] ?? STAGES[0][1]
  const missed = result.inRoom - result.recognised.length

  return (
    <Modal open wide onClose={onClose} title={`Face scan, ${session.room.split(',')[0]}`} sub={`The room camera scans the class for ${SCAN_SECONDS} seconds and marks recognised students present.`}>
      {!done ? (
        <div className="stack" style={{ gap: 12 }}>
          <div className="face-video scan scanning room-scan">
            <img src={`${import.meta.env.BASE_URL}cctv/lecture-hall.jpg`} alt="Classroom camera view" />
            <span className="scan-line" />
            {BOXES.slice(0, Math.floor(BOXES.length * Math.min(1, k * 1.2))).map((b, i) => (
              <span key={i} className="face-box live" style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.s}%`, height: `${b.s * 1.5}%` }} />
            ))}
            <div className="room-scan-count">
              <Users size={16} /> <strong className="num">{count}</strong> recognised
            </div>
          </div>
          <div className="scan-progress">
            <div className="row between small">
              <strong>{stage}</strong>
              <span className="num muted">{Math.max(0, Math.ceil(SCAN_SECONDS - t))} s</span>
            </div>
            <div className="cap-bar">
              <i style={{ width: `${k * 100}%`, background: 'var(--primary)', transition: 'width 0.1s linear' }} />
            </div>
            <ol className="scan-stages">
              {STAGES.map(([s, label], i) => (
                <li key={label} className={t >= (STAGES[i + 1]?.[0] ?? SCAN_SECONDS) ? 'done' : t >= s ? 'on' : ''}>
                  {label}
                </li>
              ))}
            </ol>
          </div>
        </div>
      ) : (
        <div className="face-result match">
          <h3>
            <CheckCircle2 size={22} /> {result.recognised.length} students recognised and marked present
          </h3>
          <div className="att-stats" style={{ width: '100%' }}>
            <div>
              <span>People counter</span>
              <strong>{result.inRoom} students in the room</strong>
            </div>
            <div>
              <span>Recognised by the camera</span>
              <strong>{result.recognised.length}</strong>
            </div>
            <div>
              <span>Not recognised</span>
              <strong className={missed > 0 ? 'c-red' : ''}>{missed}</strong>
            </div>
          </div>
          {missed > 0 && <p className="small" style={{ marginTop: 10 }}>Some faces were turned away or covered. Mark the {missed} missing {missed === 1 ? 'student' : 'students'} present yourself from the list.</p>}
          <div className="row" style={{ gap: 8, justifyContent: 'center', marginTop: 14 }}>
            <button className="btn" onClick={onClose}>
              {missed > 0 ? 'Mark the rest myself' : 'Done'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
