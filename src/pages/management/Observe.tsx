import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Camera, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Expand, EyeOff, MonitorPlay, Radio, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react'
import { Badge, Notice, PageHead, Panel } from '../../components/ui'
import { useDemo } from '../../store/DemoStore'
import { campusSessions } from './liveData'
import NotFound from '../NotFound'
import '../../styles/management.css'
import '../../styles/smartcampus.css'

interface Cam {
  id: string
  label: string
  img: string
  origin: string
  zoom: number
  pos: string
}

const base = import.meta.env.BASE_URL
const HALL = `${base}cctv/lecture-hall.jpg`
const MEET = `${base}cctv/meeting-room.jpg`

function camsFor(room: string, code: string): Cam[] {
  const small = /smart room|seminar|tutorial|moot|bilik/i.test(room)
  const tag = code.replace(/[^A-Z0-9]/gi, '').slice(0, 6).toUpperCase()
  return small
    ? [
        { id: `${tag}-C1`, label: 'Wide, whole room', img: MEET, origin: '50% 55%', zoom: 1, pos: '50% 58%' },
        { id: `${tag}-C2`, label: 'Display wall', img: MEET, origin: '58% 42%', zoom: 1.7, pos: '50% 40%' },
        { id: `${tag}-C3`, label: 'Meeting table', img: MEET, origin: '45% 80%', zoom: 1.6, pos: '50% 75%' },
      ]
    : [
        { id: `${tag}-C1`, label: 'Front, facing the audience', img: HALL, origin: '50% 50%', zoom: 1, pos: '50% 45%' },
        { id: `${tag}-C2`, label: 'Left tiers', img: HALL, origin: '28% 48%', zoom: 1.8, pos: '50% 45%' },
        { id: `${tag}-C3`, label: 'Right tiers', img: HALL, origin: '78% 50%', zoom: 1.8, pos: '50% 45%' },
      ]
}

const pad = (n: number) => String(n).padStart(2, '0')

// Which Campus setup sub room each sample live session runs in.
const sessionRoom: Record<string, string> = { cs1: 'sp-dk2', cs2: 'sp-ea1', cs3: 'sp-c12', cs4: 'sp-b204', cs13: 'sp-dk3' }

export default function Observe() {
  const { sessionId = '' } = useParams()
  const navigate = useNavigate()
  const { state, toast, audit } = useDemo()
  const s = campusSessions.find((x) => x.id === sessionId)
  const frame = useRef<HTMLDivElement>(null)
  const [cam, setCam] = useState(0)
  const [z, setZ] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [now, setNow] = useState(() => new Date(2026, 9, 21, 10, 12, 4))
  const [motion, setMotion] = useState(false)
  const logged = useRef(false)

  useEffect(() => {
    const t = setInterval(() => setNow((d) => new Date(d.getTime() + 1000)), 1000)
    const m = setInterval(() => setMotion((v) => !v && Math.random() < 0.5), 2200)
    return () => {
      clearInterval(t)
      clearInterval(m)
    }
  }, [])

  useEffect(() => {
    if (s && !logged.current) {
      logged.current = true
      audit({ area: 'Access', action: 'Viewed classroom cameras', target: `${s.code}, ${s.room}` })
    }
  }, [s, audit])

  if (!s) return <NotFound />

  const cams = camsFor(s.room, s.code)
  const c = cams[cam]
  const roomName = s.room.split(',')[0].trim()
  const space = state.spaces.find((x) => x.id === sessionRoom[s.id]) ?? state.spaces.find((x) => x.kind === 'sub' && x.name.toLowerCase() === roomName.toLowerCase())
  const devices = space ? state.devices.filter((d) => d.spaceId === space.id) : []
  const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`

  const move = (dx: number, dy: number) => setPan((p) => ({ x: Math.max(-18, Math.min(18, p.x + dx)), y: Math.max(-14, Math.min(14, p.y + dy)) }))
  const reset = () => {
    setZ(1)
    setPan({ x: 0, y: 0 })
  }
  const pick = (i: number) => {
    setCam(i)
    reset()
  }

  const snapshot = () => {
    audit({ area: 'Access', action: 'Saved camera snapshot', target: `${c.id}, ${s.room}`, detail: stamp })
    toast(`Snapshot from ${c.id} saved to the evidence log (simulated).`)
  }

  const full = () => {
    const el = frame.current
    if (!el) return
    if (document.fullscreenElement) document.exitFullscreen()
    else el.requestFullscreen?.().catch(() => toast('Full screen isn’t available in this browser.', 'warn'))
  }

  return (
    <>
      <PageHead
        crumbs={
          <>
            <Link to="/management/live">Live operations</Link> <span>/</span> <span>Observe</span>
          </>
        }
        title={`${s.code} ${s.title}`}
        sub={`${s.room}, ${s.lecturer}, started ${s.started}`}
        actions={
          <>
            <button className="btn secondary" onClick={() => navigate('/management/live')}>
              <ArrowLeft size={16} /> Back to live operations
            </button>
            {s.link && (
              <Link to={s.link} className="btn">
                <Radio size={16} /> Join the live class as observer
              </Link>
            )}
          </>
        }
      />

      {s.mode === 'Online' ? (
        <Panel title="Class stream" sub="Online class, observed in view-only mode. You are not visible or audible to the class.">
          <div className="ostream">
            <div className="ostream-stage">
              <div className="ostream-slide">
                <span className="xs">{s.code}</span>
                <strong>{s.title}</strong>
                <span className="small">{s.lecturer}</span>
              </div>
              <div className="cctv-tr">
                <span className="cctv-rec" /> LIVE <span className="num">{stamp}</span>
              </div>
              <div className="ostream-pip">
                <MonitorPlay size={18} />
                <span className="xs">{s.lecturer}</span>
              </div>
            </div>
            <div className="ostream-meta">
              <Badge tone="teal">Online</Badge>
              <span className="small">
                <strong>{s.attendees}</strong> of {s.enrolled} joined
              </span>
              <Badge tone={s.health === 'Good' ? 'green' : 'amber'}>Stream {s.health.toLowerCase()}</Badge>
            </div>
          </div>
        </Panel>
      ) : (
        <div className="grid g-main-side">
          <div className="stack">
            <div className="cctv" ref={frame}>
              <div className="cctv-feed" style={{ backgroundImage: `url(${c.img})`, backgroundPosition: c.pos, transformOrigin: c.origin, transform: `translate(${pan.x}%, ${pan.y}%) scale(${c.zoom * z})` }} />
              <div className="cctv-noise" />
              <div className="cctv-scan" />
              <div className="cctv-tl">
                <strong>{c.id}</strong>
                <span>
                  {c.label}, {s.room}
                </span>
              </div>
              <div className="cctv-tr">
                <span className="cctv-rec" /> LIVE <span className="num">{stamp}</span>
              </div>
              <div className="cctv-bl num">
                PTZ {(c.zoom * z).toFixed(1)}x{motion ? <span className="cctv-motion">Motion</span> : null}
              </div>
              <div className="cctv-br">
                <EyeOff size={12} /> Faces blurred
              </div>
            </div>
            <div className="cctv-controls">
              <div className="cctv-ptz" aria-label="Pan and tilt">
                <button onClick={() => move(0, 4)} aria-label="Tilt up">
                  <ChevronUp size={16} />
                </button>
                <div>
                  <button onClick={() => move(4, 0)} aria-label="Pan left">
                    <ChevronLeft size={16} />
                  </button>
                  <button onClick={reset} aria-label="Reset view">
                    <RotateCcw size={14} />
                  </button>
                  <button onClick={() => move(-4, 0)} aria-label="Pan right">
                    <ChevronRight size={16} />
                  </button>
                </div>
                <button onClick={() => move(0, -4)} aria-label="Tilt down">
                  <ChevronDown size={16} />
                </button>
              </div>
              <div className="row wrap" style={{ gap: 8 }}>
                <button className="btn secondary sm" onClick={() => setZ((v) => Math.min(2.4, +(v + 0.2).toFixed(1)))}>
                  <ZoomIn size={15} /> Zoom in
                </button>
                <button className="btn secondary sm" onClick={() => setZ((v) => Math.max(1, +(v - 0.2).toFixed(1)))}>
                  <ZoomOut size={15} /> Zoom out
                </button>
                <button className="btn secondary sm" onClick={snapshot}>
                  <Camera size={15} /> Snapshot
                </button>
                <button className="btn secondary sm" onClick={full}>
                  <Expand size={15} /> Full screen
                </button>
              </div>
            </div>
            <div className="cctv-thumbs">
              {cams.map((k, i) => (
                <button key={k.id} className={`cctv-thumb ${i === cam ? 'on' : ''}`} onClick={() => pick(i)}>
                  <span className="cctv-thumb-img" style={{ backgroundImage: `url(${k.img})`, backgroundPosition: k.pos, transformOrigin: k.origin, transform: `scale(${k.zoom})` }} />
                  <span className="cctv-thumb-label">
                    <span className="cctv-rec" /> {k.id}
                    <em>{k.label}</em>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="stack">
            <Panel title="Session">
              <dl className="kv">
                <dt>Class</dt>
                <dd>
                  {s.code} {s.title}
                </dd>
                <dt>Lecturer</dt>
                <dd>{s.lecturer}</dd>
                <dt>Faculty</dt>
                <dd>{s.faculty}</dd>
                <dt>Mode</dt>
                <dd>{s.mode}</dd>
                <dt>Participants</dt>
                <dd>
                  {s.attendees} of {s.enrolled} enrolled
                </dd>
                <dt>Stream</dt>
                <dd>{s.mode === 'In person' ? 'Not streamed' : s.health}</dd>
              </dl>
            </Panel>
            <Panel title="Room devices" sub={space ? `${devices.length} paired in ${space.name}` : 'Room not set up in Campus setup'} bodyClass="panel-body tight">
              {space && devices.length > 0 ? (
                <>
                  <div className="list">
                    {devices.slice(0, 6).map((d) => (
                      <div key={d.id} className="list-item" style={{ padding: '9px 20px' }}>
                        <div className="grow">
                          <div className="small strong truncate">{d.name}</div>
                          <div className="xs muted">{d.type}</div>
                        </div>
                        <Badge tone={d.status === 'Online' ? 'green' : d.status === 'Stale' ? 'amber' : 'red'}>{d.status}</Badge>
                      </div>
                    ))}
                  </div>
                  <div className="panel-foot">
                    <Link to={`/management/rooms?room=${space.id}`} className="link-btn">
                      Open {space.name} in Smart rooms
                    </Link>
                  </div>
                </>
              ) : (
                <p className="small muted" style={{ padding: '8px 20px 14px' }}>
                  This room has not been set up in Campus setup yet, so its devices aren’t listed.
                </p>
              )}
            </Panel>
            <Notice>Simulated camera view built from sample photos of a lecture hall and a meeting room. Faces are blurred. Every camera view and snapshot is recorded in the audit log.</Notice>
          </div>
        </div>
      )}
    </>
  )
}
