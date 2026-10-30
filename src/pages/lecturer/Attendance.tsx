import { useState } from 'react'
import { AlertTriangle, CheckCircle2, Download, Laptop, ScanFace, Search, UserCheck } from 'lucide-react'
import { PageHead, Panel, Badge, Avatar, Seg, Empty } from '../../components/ui'
import { FaceRecognitionModal, SCAN_SECONDS } from '../../components/FaceRecognitionModal'
import { fmtDay } from '../../data/attendance'
import { useDemo } from '../../store/DemoStore'
import { useFaces } from '../../store/faces'
import { downloadCsv } from './lecturerUtils'
import { classList, effectiveMarks, isToday, lecSessions, semesterRates } from './attendanceData'
import { RoomScanModal } from './RoomScanModal'
import { useLecAttendance, useNow } from './useLecAttendance'
import '../../styles/lecturer.css'
import '../../styles/smartcampus.css'

/*
  Attendance (lecturer). Two options per student: present or absent.
  1. Face recognition marks students present automatically (room camera, or this device's camera).
  2. The lecturer marks present anyone the camera missed, for example when 100 people are in the room
     but only 80 were recognised.
*/

type Filter = 'all' | 'present' | 'absent' | 'manual'

export default function Attendance() {
  const { state, toast } = useDemo()
  const faces = useFaces()
  const now = useNow()
  const [sid, setSid] = useState(lecSessions[0].id)
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [scanOpen, setScanOpen] = useState(false)
  const [deviceOpen, setDeviceOpen] = useState(false)
  const sess = lecSessions.find((s) => s.id === sid)!
  const { people, marks, scan, counter, present, byCamera, byLecturer, presentStudents, gap, today, mark, markPresent, applyScan, applyDeviceMatch } = useLecAttendance(sess, now)
  const rates = semesterRates(sess, now)

  const list = people.filter((p) => {
    const m = marks[p.id]
    const okFilter = filter === 'all' || (filter === 'present' && m?.s === 'present') || (filter === 'absent' && m?.s !== 'present') || (filter === 'manual' && m?.by === 'lecturer' && m.s === 'present')
    return okFilter && (!q || `${p.name} ${p.idNo}`.toLowerCase().includes(q.toLowerCase()))
  })

  const markPicked = () => {
    const n = markPresent([...picked])
    if (n) toast(`${n} student${n > 1 ? 's' : ''} marked present by you.`)
    setPicked(new Set())
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
          onFinish={(ids) => applyScan(ids)}
          onClose={() => setScanOpen(false)}
        />
      )}
      {deviceOpen && (
        <FaceRecognitionModal
          title="Scan with this device"
          sub={`Look at this device's camera for ${SCAN_SECONDS} seconds. A recognised student is marked present for ${sess.code}.`}
          onClose={() => setDeviceOpen(false)}
          onMatch={(id) => applyDeviceMatch(id)}
        />
      )}
    </>
  )
}
