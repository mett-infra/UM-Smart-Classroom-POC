import { useEffect, useMemo, useRef, useState } from 'react'
import { CheckCheck, Download, QrCode, Search } from 'lucide-react'
import { PageHead, Panel, Badge, Avatar, Modal, Seg, Empty } from '../../components/ui'
import { courseById, roster } from '../../data/mock'
import { useDemo } from '../../store/DemoStore'
import { downloadCsv, hashStr, seeded } from './lecturerUtils'
import '../../styles/lecturer.css'

type Mark = 'present' | 'late' | 'absent'

const attSessions = [
  { id: 's-wia2004-14', courseId: 'wia2004', label: 'Lecture 14: Deadlocks', when: 'Today, 10:00 to 11:00', room: 'DK2, FSKTM', today: true },
  { id: 's-wia2004-13', courseId: 'wia2004', label: 'Lecture 13: Deadlock characterisation', when: 'Mon 19 Oct, 10:00 to 11:00', room: 'DK2, FSKTM', today: false },
  { id: 's-wia2004-12', courseId: 'wia2004', label: 'Lecture 12: Classic synchronisation problems', when: 'Wed 14 Oct, 10:00 to 11:00', room: 'DK2, FSKTM', today: false },
  { id: 's-wix2002-t5', courseId: 'wix2002', label: 'Tutorial 5: Scheduling', when: 'Wed 14 Oct, 16:00 to 17:00', room: 'Online', today: false },
]

function derived(sessionId: string): Record<string, Mark> {
  const rnd = seeded(hashStr(sessionId))
  const rec: Record<string, Mark> = {}
  roster.forEach((s) => {
    const r = rnd() * 100
    rec[s.id] = r > s.attendance ? 'absent' : r > s.attendance - 6 ? 'late' : 'present'
  })
  return rec
}

/** QR-like code: deterministic modules plus three finder patterns. Visual only. */
function QrGrid({ seed, size = 200 }: { seed: number; size?: number }) {
  const n = 25
  const rnd = seeded(seed)
  const cells: boolean[][] = Array.from({ length: n }, () => Array.from({ length: n }, () => rnd() > 0.52))
  const finder = (r0: number, c0: number) => {
    for (let r = -1; r <= 7; r++)
      for (let c = -1; c <= 7; c++) {
        const rr = r0 + r
        const cc = c0 + c
        if (rr < 0 || cc < 0 || rr >= n || cc >= n) continue
        const ring = r === 0 || r === 6 || c === 0 || c === 6
        const core = r >= 2 && r <= 4 && c >= 2 && c <= 4
        cells[rr][cc] = r >= 0 && r <= 6 && c >= 0 && c <= 6 && (ring || core)
      }
  }
  finder(0, 0)
  finder(0, n - 7)
  finder(n - 7, 0)
  const u = size / n
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Attendance check-in code">
      <rect width={size} height={size} fill="#fff" />
      {cells.flatMap((row, r) => row.map((on, c) => (on ? <rect key={`${r}-${c}`} x={c * u} y={r * u} width={u + 0.3} height={u + 0.3} fill="#101c3b" /> : null)))}
      <rect x={size / 2 - 18} y={size / 2 - 18} width={36} height={36} rx={8} fill="#fff" />
      <path transform={`translate(${size / 2 - 12} ${size / 2 - 12}) scale(0.6)`} d="M20 2 L38 20 L20 38 L2 20 Z" fill="none" stroke="#C8952C" strokeWidth="3" />
      <path transform={`translate(${size / 2 - 12} ${size / 2 - 12}) scale(0.6)`} d="M20 12 L28 20 L20 28 L12 20 Z" fill="#C8952C" />
    </svg>
  )
}

export default function Attendance() {
  const { state, update, toast, log } = useDemo()
  const [sid, setSid] = useState(attSessions[0].id)
  const [q, setQ] = useState('')
  const [qrOpen, setQrOpen] = useState(false)
  const [tick, setTick] = useState(0)
  const [left, setLeft] = useState(30)
  const [feed, setFeed] = useState<{ id: string; name: string; time: string }[]>([])
  const sess = attSessions.find((s) => s.id === sid)!
  const course = courseById(sess.courseId)!
  const rec = useMemo(() => state.attendance[sid] ?? derived(sid), [state.attendance, sid])
  const recRef = useRef(rec)
  recRef.current = rec

  const setMark = (studentId: string, m: Mark) =>
    update((s) => ({ ...s, attendance: { ...s.attendance, [sid]: { ...(s.attendance[sid] ?? derived(sid)), [studentId]: m } } }))

  const counts = roster.reduce(
    (acc, s) => {
      acc[rec[s.id] ?? 'absent']++
      return acc
    },
    { present: 0, late: 0, absent: 0 } as Record<Mark, number>,
  )
  const rate = Math.round(((counts.present + counts.late) / roster.length) * 100)
  const list = roster.filter((s) => !q || `${s.name} ${s.matric}`.toLowerCase().includes(q.toLowerCase()))

  // QR countdown and simulated check-ins while the code is on screen
  useEffect(() => {
    if (!qrOpen) return
    const t = setInterval(() => {
      setLeft((l) => {
        if (l <= 1) {
          setTick((k) => k + 1)
          return 30
        }
        return l - 1
      })
    }, 1000)
    const c = setInterval(() => {
      const next = roster.find((s) => recRef.current[s.id] === 'absent')
      if (!next) return
      update((s) => ({ ...s, attendance: { ...s.attendance, [sid]: { ...(s.attendance[sid] ?? derived(sid)), [next.id]: 'present' } } }))
      setFeed((f) => [{ id: next.id + Date.now(), name: next.name, time: 'just now' }, ...f].slice(0, 8))
    }, 2600)
    return () => {
      clearInterval(t)
      clearInterval(c)
    }
  }, [qrOpen, sid, update])

  const markAll = () => {
    const all: Record<string, Mark> = {}
    roster.forEach((s) => (all[s.id] = 'present'))
    update((s) => ({ ...s, attendance: { ...s.attendance, [sid]: all } }))
    toast(`Marked all ${roster.length} students present.`)
  }

  const exportCsv = () => {
    downloadCsv(`attendance_${course.code}_${sid}.csv`, [
      ['Course', 'Session', 'Date', 'Matric', 'Name', 'Status'],
      ...roster.map((s) => [course.code, sess.label, sess.when, s.matric, s.name, rec[s.id] ?? 'absent']),
    ])
    toast('Attendance exported as CSV.')
  }

  return (
    <>
      <PageHead
        title="Attendance"
        sub="Take attendance in class with a rotating check-in code, or mark students yourself."
        actions={
          <>
            <button className="btn secondary" onClick={exportCsv}>
              <Download size={16} /> Export CSV
            </button>
            <button className="btn secondary" onClick={markAll}>
              <CheckCheck size={16} /> Mark all present
            </button>
            <button
              className="btn"
              onClick={() => {
                setFeed([])
                setLeft(30)
                setQrOpen(true)
              }}
            >
              <QrCode size={16} /> Show check-in code
            </button>
          </>
        }
      />

      <div className="grid g-side-main">
        <Panel title="Sessions" sub="Choose a class to take or review attendance" bodyClass="panel-body tight">
          <div className="list">
            {attSessions.map((s) => {
              const c = courseById(s.courseId)!
              const r = state.attendance[s.id] ?? derived(s.id)
              const pct = Math.round((roster.filter((st) => r[st.id] !== 'absent').length / roster.length) * 100)
              return (
                <div
                  key={s.id}
                  className="list-item clickable"
                  style={s.id === sid ? { background: 'var(--primary-50)' } : undefined}
                  onClick={() => setSid(s.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setSid(s.id)}
                  aria-pressed={s.id === sid}
                >
                  <div className="grow">
                    <div className="row" style={{ gap: 8 }}>
                      <strong className="small">{c.code}</strong>
                      {s.today && <Badge tone="gold">Today</Badge>}
                    </div>
                    <div className="title small truncate">{s.label}</div>
                    <div className="sub xs">{s.when}</div>
                  </div>
                  <span className="strong num small">{pct}%</span>
                </div>
              )
            })}
          </div>
        </Panel>

        <div className="stack">
          <div className="att-chips">
            <div className="att-chip">
              <strong>{counts.present}</strong> present
            </div>
            <div className="att-chip">
              <strong>{counts.late}</strong> late
            </div>
            <div className="att-chip">
              <strong>{counts.absent}</strong> absent
            </div>
            <div className="att-chip">
              <strong>{rate}%</strong> attendance rate
            </div>
          </div>

          <Panel
            title={`${course.code} ${sess.label}`}
            sub={`${sess.when}, ${sess.room}. Showing ${roster.length} of ${course.enrolled} students in this sample.`}
            action={
              <div className="search-field" style={{ width: 220 }}>
                <Search size={15} />
                <input className="input sm" placeholder="Search students" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search students" />
              </div>
            }
            bodyClass=""
          >
            <div className="table-wrap">
              <table className="table" style={{ minWidth: 560 }}>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th className="num">Semester attendance</th>
                    <th>This session</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((s) => {
                    const m = rec[s.id] ?? 'absent'
                    return (
                      <tr key={s.id}>
                        <td>
                          <div className="cell-person">
                            <Avatar name={s.name} color={s.color} size="sm" />
                            <div>
                              <strong>{s.name}</strong>
                              <span>{s.matric}</span>
                            </div>
                          </div>
                        </td>
                        <td className="num" style={{ color: s.attendance < 70 ? 'var(--red)' : undefined }}>
                          {s.attendance}%
                        </td>
                        <td>
                          <div className="att-seg">
                            <Seg<Mark>
                              value={m}
                              onChange={(v) => setMark(s.id, v)}
                              options={[
                                { id: 'present', label: <span style={{ color: m === 'present' ? 'var(--green)' : undefined }}>Present</span> },
                                { id: 'late', label: <span style={{ color: m === 'late' ? 'var(--amber)' : undefined }}>Late</span> },
                                { id: 'absent', label: <span style={{ color: m === 'absent' ? 'var(--red)' : undefined }}>Absent</span> },
                              ]}
                            />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {list.length === 0 && <Empty title="No students match your search" />}
            </div>
          </Panel>
        </div>
      </div>

      <Modal
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        title="Check-in code"
        sub={`${course.code} ${sess.label}`}
        foot={
          <button
            className="btn"
            onClick={() => {
              setQrOpen(false)
              log({ text: `Attendance taken for ${course.code}`, sub: `${counts.present + counts.late} of ${roster.length} checked in`, kind: 'room' })
              toast(`Check-in closed. ${counts.present + counts.late} students recorded.`)
            }}
          >
            Close check-in
          </button>
        }
      >
        <div className="qr-wrap">
          <div className="qr-box">
            <QrGrid seed={hashStr(sid) + tick * 7919} />
          </div>
          <div>
            <div className="qr-count" aria-live="polite">
              0:{String(left).padStart(2, '0')}
            </div>
            <p className="small muted mt-1">The code changes every 30 seconds, so a screenshot can’t be shared outside the room. Students scan it in the app to check in.</p>
            <div className="row mt-2" style={{ gap: 8 }}>
              <Badge tone="green">{counts.present + counts.late} checked in</Badge>
              <Badge>{counts.absent} not yet</Badge>
            </div>
            <div className="checkin-feed">
              {feed.length === 0 ? (
                <span className="xs muted">Waiting for students to scan</span>
              ) : (
                feed.map((f) => (
                  <div key={f.id}>
                    <Avatar name={f.name} size="sm" />
                    <span className="grow truncate">{f.name}</span>
                    <span className="xs muted">{f.time}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        <p className="xs muted mt-2">Simulated check-ins for this demo. In production the code would be signed and verified by the attendance service.</p>
      </Modal>
    </>
  )
}
