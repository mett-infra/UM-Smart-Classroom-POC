import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Cctv, MonitorPlay, Wifi, WifiOff } from 'lucide-react'
import { Badge, LiveBadge, Metric, Notice, PageHead, Panel, Bar } from '../../components/ui'
import { faculties } from '../../data/mock'
import type { Mode } from '../../data/types'
import { campusSessions, type CampusSession } from './liveData'
import '../../styles/management.css'

export default function LiveOps() {
  const navigate = useNavigate()
  const [rows, setRows] = useState<CampusSession[]>(campusSessions)
  const [faculty, setFaculty] = useState('All faculties')
  const [mode, setMode] = useState<'All modes' | Mode>('All modes')

  // Simulate attendee counts moving as students join and leave.
  useEffect(() => {
    const t = setInterval(() => {
      setRows((rs) =>
        rs.map((r) => {
          if (r.mode === 'In person') return r
          const delta = Math.round((Math.random() - 0.45) * 4)
          return { ...r, attendees: Math.max(1, Math.min(r.enrolled, r.attendees + delta)) }
        }),
      )
    }, 3000)
    return () => clearInterval(t)
  }, [])

  const filtered = useMemo(
    () => rows.filter((r) => (faculty === 'All faculties' || r.faculty === faculty) && (mode === 'All modes' || r.mode === mode)),
    [rows, faculty, mode],
  )

  const liveTotal = faculties.reduce((s, f) => s + f.liveNow, 0)
  const joined = rows.reduce((s, r) => s + r.attendees, 0)
  const degraded = rows.filter((r) => r.health === 'Degraded').length
  const withCamera = rows.filter((r) => r.mode !== 'Online').length

  return (
    <>
      <PageHead
        title="Live operations"
        sub="Every class running on the platform right now, with stream health. Observe a room through its classroom cameras."
        actions={<LiveBadge label={`${liveTotal} live now`} />}
      />

      <div className="metrics">
        <Metric label="Live sessions" value={liveTotal} foot={`Showing ${rows.length} monitored sessions below`} />
        <Metric label="Participants in monitored sessions" value={<span className="mg-tick">{joined.toLocaleString()}</span>} foot="Updates every few seconds" />
        <Metric label="Streams with issues" value={degraded} foot={degraded ? 'ICT support notified' : 'All streams healthy'} />
        <Metric label="Rooms with live cameras" value={withCamera} foot="Hybrid and in-person classes" />
      </div>

      <Panel
        title="Sessions in progress"
        sub="Sample data, Wednesday 21 October, 10:12"
        bodyClass=""
      >
        <div className="mg-filters">
          <select className="select sm" value={faculty} onChange={(e) => setFaculty(e.target.value)} aria-label="Filter by faculty">
            <option>All faculties</option>
            {faculties.map((f) => (
              <option key={f.id}>{f.short}</option>
            ))}
          </select>
          <select className="select sm" value={mode} onChange={(e) => setMode(e.target.value as Mode | 'All modes')} aria-label="Filter by mode">
            <option>All modes</option>
            <option>Hybrid</option>
            <option>Online</option>
            <option>In person</option>
          </select>
          <span className="small muted">{filtered.length} sessions</span>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Class</th>
                <th>Faculty</th>
                <th>Room</th>
                <th>Mode</th>
                <th className="num">Joined</th>
                <th>Stream</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td style={{ minWidth: 220 }}>
                    <strong style={{ display: 'block' }}>{r.code}</strong>
                    <span className="small muted">{r.title}</span>
                  </td>
                  <td className="small">{r.faculty}</td>
                  <td className="small">{r.room}</td>
                  <td>
                    <Badge tone={r.mode === 'Hybrid' ? 'blue' : r.mode === 'Online' ? 'teal' : ''}>{r.mode}</Badge>
                  </td>
                  <td className="num" style={{ minWidth: 110 }}>
                    <strong>{r.attendees}</strong>
                    <span className="xs muted"> of {r.enrolled}</span>
                    <div className="mt-1">
                      <Bar thin value={(r.attendees / r.enrolled) * 100} />
                    </div>
                  </td>
                  <td>
                    {r.mode === 'In person' ? (
                      <span className="xs muted">No stream</span>
                    ) : r.health === 'Good' ? (
                      <Badge tone="green">
                        <Wifi size={12} /> Good
                      </Badge>
                    ) : (
                      <Badge tone="amber">
                        <WifiOff size={12} /> Degraded
                      </Badge>
                    )}
                  </td>
                  <td>
                    {r.mode === 'Online' ? (
                      <button className="btn xs secondary" onClick={() => navigate(`/management/live/${r.id}/observe`)} title="Online class: no room camera">
                        <MonitorPlay size={13} /> View stream
                      </button>
                    ) : (
                      <button className="btn xs secondary" onClick={() => navigate(`/management/live/${r.id}/observe`)}>
                        <Cctv size={13} /> Observe
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="mt-2">
        <Notice>Observe opens the classroom cameras for that room in view-only mode. In production, camera access follows university policy on classroom observation, and only authorised staff can view footage.</Notice>
      </div>

    </>
  )
}
