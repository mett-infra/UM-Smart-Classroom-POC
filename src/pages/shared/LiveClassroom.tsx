import { useEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Circle,
  Eraser,
  Hand,
  Mic,
  MicOff,
  MonitorUp,
  Pencil,
  PhoneOff,
  Presentation,
  SmilePlus,
  Square,
  Trash2,
  Users,
  Video,
  VideoOff,
  Captions,
  LayoutGrid,
  X,
  FlaskConical,
  AudioLines,
} from 'lucide-react'
import { captionScript, courseById, lecturerName, personas, roster, sessions } from '../../data/mock'
import type { Role } from '../../data/types'
import { Avatar, Badge, Modal } from '../../components/ui'
import { BrandMark } from '../../components/Shell'
import { useDemo } from '../../store/DemoStore'
import { VoiceCommand } from '../../components/VoiceCommand'
import { lecSessions } from '../lecturer/attendanceData'
import { useLecAttendance, useNow } from '../lecturer/useLecAttendance'
import { LiveAssignmentSetup } from '../lecturer/LiveAssignmentSetup'
import { fmtLab, useLabActions, useLabClock } from '../lecturer/labClock'
import { limitOf, progressOf } from '../../data/labs'

type StageTab = 'slides' | 'board' | 'screen'

const fmtClock = (secs: number) => {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  return (h ? `${h}:` : '') + `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/* ---------------- Slides ---------------- */

function Slide({ index }: { index: number }) {
  switch (index) {
    case 0:
      return (
        <div className="slide slide-title">
          <span className="slide-kicker">WIA2004 Operating Systems, lecture 14</span>
          <h2>Deadlocks: detection and avoidance</h2>
          <p>Dr. Farid Hakimi bin Zulkifli, Department of Software Engineering</p>
          <div className="slide-band" />
        </div>
      )
    case 1:
      return (
        <div className="slide">
          <h3>Four conditions must hold at the same time</h3>
          <div className="slide-grid">
            {[
              ['Mutual exclusion', 'At least one resource is held in a non-shareable mode.'],
              ['Hold and wait', 'A process holds one resource while waiting for another.'],
              ['No preemption', 'A resource is released only voluntarily by the holder.'],
              ['Circular wait', 'P0 waits for P1, P1 for P2, and Pn waits for P0.'],
            ].map(([t, d], i) => (
              <div className="slide-cell" key={t}>
                <span className="slide-n">{i + 1}</span>
                <strong>{t}</strong>
                <p>{d}</p>
              </div>
            ))}
          </div>
        </div>
      )
    case 2:
      return (
        <div className="slide">
          <h3>Resource allocation graph with a cycle</h3>
          <div className="slide-split">
            <svg viewBox="0 0 360 220" className="rag" aria-label="Resource allocation graph: P1 holds R2 and requests R1, P2 holds R1 and requests R2">
              <defs>
                <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M0 0 L10 5 L0 10 z" fill="#c93c4a" />
                </marker>
                <marker id="arr2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M0 0 L10 5 L0 10 z" fill="#2f55d4" />
                </marker>
              </defs>
              <circle cx="80" cy="60" r="28" fill="#edf1fd" stroke="#2f55d4" strokeWidth="2" />
              <text x="80" y="66" textAnchor="middle" fontWeight="700" fill="#101c3b" fontSize="16">P1</text>
              <circle cx="280" cy="160" r="28" fill="#edf1fd" stroke="#2f55d4" strokeWidth="2" />
              <text x="280" y="166" textAnchor="middle" fontWeight="700" fill="#101c3b" fontSize="16">P2</text>
              <rect x="250" y="32" width="60" height="56" rx="6" fill="#fbf4e4" stroke="#c8952c" strokeWidth="2" />
              <circle cx="280" cy="60" r="5" fill="#c8952c" />
              <text x="318" y="40" fill="#64708a" fontSize="14" fontWeight="700">R1</text>
              <rect x="50" y="132" width="60" height="56" rx="6" fill="#fbf4e4" stroke="#c8952c" strokeWidth="2" />
              <circle cx="80" cy="160" r="5" fill="#c8952c" />
              <text x="42" y="140" textAnchor="end" fill="#64708a" fontSize="14" fontWeight="700">R2</text>
              <line x1="110" y1="60" x2="246" y2="60" stroke="#c93c4a" strokeWidth="2.5" markerEnd="url(#arr)" />
              <line x1="280" y1="90" x2="280" y2="128" stroke="#2f55d4" strokeWidth="2.5" markerEnd="url(#arr2)" />
              <line x1="250" y1="160" x2="114" y2="160" stroke="#c93c4a" strokeWidth="2.5" markerEnd="url(#arr)" />
              <line x1="80" y1="130" x2="80" y2="92" stroke="#2f55d4" strokeWidth="2.5" markerEnd="url(#arr2)" />
            </svg>
            <ul>
              <li>
                <b className="c-red">Request edge</b> from a process to a resource.
              </li>
              <li>
                <b className="c-blue">Assignment edge</b> from a resource to a process.
              </li>
              <li>With one instance per resource, a cycle means a deadlock.</li>
              <li>With several instances, a cycle means a deadlock is possible.</li>
            </ul>
          </div>
        </div>
      )
    case 3:
      return (
        <div className="slide">
          <h3>Safe state and the Banker’s algorithm</h3>
          <div className="slide-split">
            <table className="slide-table">
              <thead>
                <tr>
                  <th>Process</th>
                  <th>Allocation</th>
                  <th>Max</th>
                  <th>Need</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['P0', '0 1 0', '7 5 3', '7 4 3'],
                  ['P1', '2 0 0', '3 2 2', '1 2 2'],
                  ['P2', '3 0 2', '9 0 2', '6 0 0'],
                  ['P3', '2 1 1', '2 2 2', '0 1 1'],
                  ['P4', '0 0 2', '4 3 3', '4 3 1'],
                ].map((r) => (
                  <tr key={r[0]}>
                    {r.map((c, i) => (
                      <td key={i}>{c}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <ul>
              <li>Available resources: 3 3 2</li>
              <li>Grant a request only if the state stays safe.</li>
              <li>
                Safe sequence: <b className="c-gold">P1, P3, P4, P2, P0</b>
              </li>
              <li>You will build this check in Assignment 2.</li>
            </ul>
          </div>
        </div>
      )
    case 4:
      return (
        <div className="slide">
          <h3>Detection and recovery</h3>
          <div className="slide-steps">
            {[
              ['Let it happen', 'Allow deadlocks and check periodically.'],
              ['Detect', 'Search the wait-for graph for a cycle.'],
              ['Recover', 'Terminate a process or preempt its resources.'],
              ['Choose a victim', 'Minimise cost: priority, run time, resources held.'],
            ].map(([t, d], i) => (
              <div key={t} className="slide-step">
                <span>{i + 1}</span>
                <strong>{t}</strong>
                <p>{d}</p>
              </div>
            ))}
          </div>
        </div>
      )
    default:
      return (
        <div className="slide slide-title">
          <span className="slide-kicker">Check your understanding</span>
          <h2>Which condition does requesting all resources at once remove?</h2>
          <p>Discuss with the person next to you. Next up: the live lab.</p>
          <div className="slide-band" />
        </div>
      )
  }
}
const SLIDE_COUNT = 6

/* ---------------- Whiteboard ---------------- */

function Whiteboard({ canDraw }: { canDraw: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const last = useRef<{ x: number; y: number } | null>(null)
  const [color, setColor] = useState('#101c3b')
  const [eraser, setEraser] = useState(false)

  useEffect(() => {
    const ctx = ref.current?.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, 1600, 900)
    // a starter sketch so the board is not empty
    ctx.strokeStyle = '#2f55d4'
    ctx.lineWidth = 5
    ctx.lineCap = 'round'
    ctx.font = '600 44px Plus Jakarta Sans, sans-serif'
    ctx.fillStyle = '#101c3b'
    ctx.fillText('Wait-for graph', 90, 120)
    const nodes: [number, number, string][] = [
      [300, 330, 'P1'],
      [640, 230, 'P2'],
      [820, 520, 'P3'],
      [420, 620, 'P4'],
    ]
    nodes.forEach(([x, y, l]) => {
      ctx.beginPath()
      ctx.arc(x, y, 54, 0, Math.PI * 2)
      ctx.stroke()
      ctx.fillText(l, x - 26, y + 15)
    })
    ctx.strokeStyle = '#c93c4a'
    const arrow = (a: number, b: number) => {
      const [x1, y1] = nodes[a]
      const [x2, y2] = nodes[b]
      const ang = Math.atan2(y2 - y1, x2 - x1)
      const sx = x1 + Math.cos(ang) * 60
      const sy = y1 + Math.sin(ang) * 60
      const ex = x2 - Math.cos(ang) * 62
      const ey = y2 - Math.sin(ang) * 62
      ctx.beginPath()
      ctx.moveTo(sx, sy)
      ctx.lineTo(ex, ey)
      ctx.lineTo(ex - 22 * Math.cos(ang - 0.4), ey - 22 * Math.sin(ang - 0.4))
      ctx.moveTo(ex, ey)
      ctx.lineTo(ex - 22 * Math.cos(ang + 0.4), ey - 22 * Math.sin(ang + 0.4))
      ctx.stroke()
    }
    arrow(0, 1)
    arrow(1, 2)
    arrow(2, 3)
    arrow(3, 0)
    ctx.fillStyle = '#c93c4a'
    ctx.font = '600 36px Plus Jakarta Sans, sans-serif'
    ctx.fillText('cycle, so deadlock', 1000, 420)
  }, [])

  const pos = (e: RPointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    return { x: ((e.clientX - r.left) / r.width) * 1600, y: ((e.clientY - r.top) / r.height) * 900 }
  }
  const down = (e: RPointerEvent<HTMLCanvasElement>) => {
    if (!canDraw) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drawing.current = true
    last.current = pos(e)
  }
  const move = (e: RPointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || !last.current) return
    const ctx = ref.current?.getContext('2d')
    if (!ctx) return
    const p = pos(e)
    ctx.strokeStyle = eraser ? '#fff' : color
    ctx.lineWidth = eraser ? 40 : 6
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(last.current.x, last.current.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    last.current = p
  }
  const up = () => {
    drawing.current = false
    last.current = null
  }
  const clear = () => {
    const ctx = ref.current?.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, 1600, 900)
  }

  return (
    <div className="board">
      <canvas
        ref={ref}
        width={1600}
        height={900}
        className={canDraw ? 'can-draw' : ''}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerLeave={up}
        aria-label="Shared whiteboard"
      />
      <div className="board-tools">
        {canDraw ? (
          <>
            {['#101c3b', '#2f55d4', '#c93c4a', '#1e8a5a', '#c8952c'].map((c) => (
              <button key={c} className={`swatch-btn ${!eraser && color === c ? 'on' : ''}`} style={{ background: c }} aria-label={`Pen colour ${c}`} onClick={() => { setColor(c); setEraser(false) }} />
            ))}
            <button className={`tool-btn ${eraser ? 'on' : ''}`} onClick={() => setEraser((v) => !v)} aria-label="Eraser" title="Eraser">
              <Eraser size={16} />
            </button>
            <button className="tool-btn" onClick={clear} aria-label="Clear board" title="Clear board">
              <Trash2 size={16} />
            </button>
          </>
        ) : (
          <span className="xs" style={{ color: 'var(--muted)' }}>
            <Pencil size={13} style={{ display: 'inline', verticalAlign: -2 }} /> The lecturer is drawing. Ask to annotate from the hand button.
          </span>
        )}
      </div>
    </div>
  )
}

/* ---------------- Main ---------------- */

export default function LiveClassroom({ role }: { role: Role }) {
  const { sessionId = '' } = useParams()
  const nav = useNavigate()
  const { state, toast, log } = useDemo()
  const isHost = role === 'lecturer'
  const me = personas[role]
  const session = sessions.find((s) => s.id === sessionId) ?? sessions.find((s) => s.status === 'live')!
  const course = courseById(session.courseId)!
  const lecturer = lecturerName(course.lecturerId)

  const [joined, setJoined] = useState(false)
  const [mic, setMic] = useState(isHost)
  const [cam, setCam] = useState(false)
  const [camStream, setCamStream] = useState<MediaStream | null>(null)
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null)
  const [stage, setStage] = useState<StageTab>('slides')
  const [slide, setSlide] = useState(2)
  const [panelOpen, setPanelOpen] = useState(false)
  const [elapsed, setElapsed] = useState(12 * 60 + 4)
  const [joinedAt] = useState(() => Date.now())
  const [attendees, setAttendees] = useState(session.attendees || 126)
  const [recording, setRecording] = useState(isHost ? false : true)
  const [recSecs, setRecSecs] = useState(isHost ? 0 : 12 * 60)
  const [cc, setCc] = useState(() => typeof window === 'undefined' || window.innerWidth > 640)
  const [ccLang, setCcLang] = useState<'en' | 'bm'>('en')
  const [ccIdx, setCcIdx] = useState(0)
  const [hand, setHand] = useState(false)
  const [hands, setHands] = useState<string[]>(isHost ? ['Priya a/p Ramasamy'] : [])
  const [reactions, setReactions] = useState<{ id: number; emoji: string; x: number }[]>([])
  const [showReact, setShowReact] = useState(false)
  const [speaking, setSpeaking] = useState(0)
  const [mutedAll, setMutedAll] = useState(false)
  const [breakout, setBreakout] = useState(false)
  const [breakoutActive, setBreakoutActive] = useState(false)
  const [confirmEnd, setConfirmEnd] = useState(false)
  const [summary, setSummary] = useState(false)
  const [voiceOpen, setVoiceOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [assignStatus, setAssignStatus] = useState(false)

  // Day 4: attendance by face recognition and room control, for the lecturer's own session
  const attSess = lecSessions.find((x) => x.id === session.id)
  const hasAtt = isHost && !!attSess
  const now = useNow(10000)
  const att = useLecAttendance(attSess ?? lecSessions[0], now)
  const roomId = attSess?.roomId ?? 'sp-dk2'
  const la = state.liveAssignments.find((x) => x.sessionId === session.id && x.status === 'running') ?? state.liveAssignments.find((x) => x.sessionId === session.id && x.status === 'ended')
  const labT = useLabClock(la)
  const labActions = useLabActions()
  const monitorUrl = la ? `${import.meta.env.BASE_URL}lecturer/live-assignments/${la.id}` : ''


  const camRef = useRef<HTMLVideoElement>(null)
  const screenRef = useRef<HTMLVideoElement>(null)
  const lobbyRef = useRef<HTMLVideoElement>(null)

  const people = useMemo(() => roster.slice(1, 13), [])

  // class clock
  useEffect(() => {
    const id = setInterval(() => {
      setElapsed((e) => e + 1)
      setRecSecs((r) => r + 1)
    }, 1000)
    return () => clearInterval(id)
  }, [])

  // attendee drift, speaking indicator, captions
  useEffect(() => {
    const a = setInterval(() => setAttendees((n) => Math.max(110, Math.min(134, n + (Math.random() < 0.6 ? 1 : -1)))), 5000)
    const s = setInterval(() => setSpeaking(Math.random() < 0.7 ? 0 : 1 + Math.floor(Math.random() * 5)), 2600)
    const c = setInterval(() => setCcIdx((i) => (i + 1) % captionScript.length), 6500)
    return () => {
      clearInterval(a)
      clearInterval(s)
      clearInterval(c)
    }
  }, [])

  // media streams into video elements
  useEffect(() => {
    if (camRef.current) camRef.current.srcObject = camStream
    if (lobbyRef.current) lobbyRef.current.srcObject = camStream
  }, [camStream, joined])
  useEffect(() => {
    if (screenRef.current) screenRef.current.srcObject = screenStream
  }, [screenStream, stage])

  // stop media on leave
  const streamsRef = useRef<MediaStream[]>([])
  useEffect(() => {
    streamsRef.current = [camStream, screenStream].filter(Boolean) as MediaStream[]
  }, [camStream, screenStream])
  useEffect(() => () => streamsRef.current.forEach((s) => s.getTracks().forEach((tr) => tr.stop())), [])

  const toggleCam = async () => {
    if (cam) {
      camStream?.getTracks().forEach((tr) => tr.stop())
      setCamStream(null)
      setCam(false)
      return
    }
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('unsupported')
      const s = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 360 }, audio: false })
      setCamStream(s)
      setCam(true)
    } catch {
      setCam(true)
      toast('Camera preview isn’t available here, so your initials are shown instead.', 'info')
    }
  }

  const toggleShare = async () => {
    if (screenStream) {
      screenStream.getTracks().forEach((tr) => tr.stop())
      setScreenStream(null)
      setStage('slides')
      toast('You stopped sharing your screen.', 'info')
      return
    }
    try {
      if (!navigator.mediaDevices?.getDisplayMedia) throw new Error('unsupported')
      const s = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false })
      s.getVideoTracks()[0].addEventListener('ended', () => {
        setScreenStream(null)
        setStage('slides')
      })
      setScreenStream(s)
      setStage('screen')
      toast('You are sharing your screen with the class.')
    } catch {
      toast('Screen sharing was cancelled or isn’t supported in this browser.', 'warn')
    }
  }

  const react = (emoji: string) => {
    const id = Date.now() + Math.random()
    setReactions((r) => [...r, { id, emoji, x: 10 + Math.random() * 70 }])
    setTimeout(() => setReactions((r) => r.filter((x) => x.id !== id)), 2600)
    setShowReact(false)
  }

  const toggleHand = () => {
    setHand((h) => {
      const next = !h
      toast(next ? 'Hand raised. The lecturer can see it.' : 'Hand lowered.', 'info')
      return next
    })
  }

  const toggleRecording = () => {
    if (recording) {
      setRecording(false)
      toast(`Recording stopped at ${fmtClock(recSecs)}. It will be published after class.`, 'info')
    } else {
      setRecording(true)
      setRecSecs(0)
      toast('Recording started. Captions are generated in English and Malay.')
    }
  }

  const finish = () => {
    setConfirmEnd(false)
    setSummary(true)
    camStream?.getTracks().forEach((tr) => tr.stop())
    screenStream?.getTracks().forEach((tr) => tr.stop())
    setCamStream(null)
    setScreenStream(null)
    if (isHost) log({ text: `${course.code} lecture ${session.lectureNo} ended`, sub: `${attendees} attended`, kind: 'live' })
  }

  const publishRecording = () => {
    log({ text: 'Lecture recording published', sub: `${course.code} lecture ${session.lectureNo} with captions`, kind: 'material' })
    toast('Recording published to the course page.')
    nav('/lecturer')
  }

  const backTo = `/${role}`
  const minsAttended = Math.max(1, Math.round((Date.now() - joinedAt) / 60000))

  /* ---------- Lobby ---------- */
  if (!joined) {
    return (
      <div className="lc lc-lobby">
        <div className="lobby-card">
          <Link to={backTo} className="lobby-back">
            <ArrowLeft size={16} /> Back to {isHost ? 'teaching home' : 'home'}
          </Link>
          <div className="lobby-grid">
            <div className="lobby-preview">
              {camStream ? <video ref={lobbyRef} autoPlay muted playsInline /> : <Avatar name={me.name} color={me.color} size="xl" />}
              <div className="lobby-preview-controls">
                <button className={`ctl ${mic ? '' : 'off'}`} onClick={() => setMic((m) => !m)} aria-label={mic ? 'Turn microphone off' : 'Turn microphone on'}>
                  {mic ? <Mic size={18} /> : <MicOff size={18} />}
                </button>
                <button className={`ctl ${cam ? '' : 'off'}`} onClick={toggleCam} aria-label={cam ? 'Turn camera off' : 'Turn camera on'}>
                  {cam ? <Video size={18} /> : <VideoOff size={18} />}
                </button>
              </div>
            </div>
            <div className="lobby-info">
              <span className="badge live">
                <span className="live-dot" /> Live since 10:00
              </span>
              <h1>
                {course.code} {course.title}
              </h1>
              <p className="lobby-sub">
                Lecture {session.lectureNo}: {session.title}
              </p>
              <dl className="lobby-dl">
                <dt>Lecturer</dt>
                <dd>{lecturer}</dd>
                <dt>Where</dt>
                <dd>{session.room}, hybrid. Students in the hall and online join the same class.</dd>
                <dt>In class now</dt>
                <dd>{attendees} people</dd>
              </dl>
              <button
                className="btn gold lobby-join"
                onClick={() => {
                  setJoined(true)
                  toast(isHost ? 'You are back in your class.' : 'You joined the class. Your attendance is recorded as present.')
                }}
              >
                {isHost ? 'Return to class' : 'Join class'}
              </button>
              <p className="xs" style={{ color: '#9aa7c4', marginTop: 10 }}>
                Camera and screen sharing use your own device and stay in this browser. Nothing is recorded or sent anywhere in this demo.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ---------- Class ---------- */
  const tiles = [
    { name: isHost ? me.name : lecturer, label: isHost ? 'You, host' : 'Lecturer, in the hall', host: true, me: isHost },
    ...(isHost ? [] : [{ name: me.name, label: 'You, online', host: false, me: true }]),
    ...people.slice(0, isHost ? 5 : 4).map((p, i) => ({ name: p.name, label: i % 2 ? 'Online' : 'In the hall', host: false, me: false })),
  ]

  return (
    <div className="lc">
      <header className="lc-top">
        <Link to={backTo} className="lc-brand" aria-label="Leave to home">
          <BrandMark size={30} />
        </Link>
        <div className="lc-title">
          <strong className="truncate">
            {course.code} {course.title}
          </strong>
          <span className="truncate">
            Lecture {session.lectureNo}: {session.title}
          </span>
        </div>
        <div className="lc-meta">
          <span className="badge live">
            <span className="live-dot" /> {fmtClock(elapsed)}
          </span>
          {recording && (
            <span className="lc-rec">
              <Circle size={10} fill="currentColor" /> Recording {fmtClock(recSecs)}
            </span>
          )}
          {breakoutActive && <Badge tone="gold">Breakout rooms open</Badge>}
          {isHost && (
            <button className={`lc-assign-chip ${la?.status === 'running' ? 'running' : ''}`} onClick={() => (la ? setAssignStatus(true) : setAssignOpen(true))} title="Live assignment for the students in this class">
              <FlaskConical size={14} />
              {la?.status === 'running' ? (
                <>
                  Live assignment <span className="num">{fmtLab(limitOf(la) - labT)}</span>
                </>
              ) : la?.status === 'ended' ? (
                'Live assignment: to mark'
              ) : (
                'Live assignment'
              )}
            </button>
          )}
          <span className="lc-count">
            <Users size={15} /> {attendees}
          </span>
        </div>
      </header>

      <div className="lc-body">
        <section className="lc-main">
          <div className="lc-stage-tabs">
            <div className="seg dark">
              <button className={stage === 'slides' ? 'on' : ''} onClick={() => setStage('slides')}>
                <Presentation size={14} /> Slides
              </button>
              <button className={stage === 'board' ? 'on' : ''} onClick={() => setStage('board')}>
                <Pencil size={14} /> Whiteboard
              </button>
              {screenStream && (
                <button className={stage === 'screen' ? 'on' : ''} onClick={() => setStage('screen')}>
                  <MonitorUp size={14} /> Shared screen
                </button>
              )}
            </div>
            {stage === 'slides' && (
              <div className="lc-slide-nav">
                <button className="tool-btn dark" onClick={() => setSlide((s) => Math.max(0, s - 1))} disabled={slide === 0} aria-label="Previous slide">
                  <ChevronLeft size={16} />
                </button>
                <span className="num">
                  {slide + 1} of {SLIDE_COUNT}
                </span>
                <button className="tool-btn dark" onClick={() => setSlide((s) => Math.min(SLIDE_COUNT - 1, s + 1))} disabled={slide === SLIDE_COUNT - 1} aria-label="Next slide">
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>

          <div className="lc-stage">
            <div className="lc-screen">
              {stage === 'slides' && <Slide index={slide} />}
              {stage === 'board' && <Whiteboard canDraw={isHost || hand} />}
              {stage === 'screen' && <video ref={screenRef} autoPlay muted playsInline className="lc-screen-video" />}
              {cc && (
                <div className="lc-captions" aria-live="polite">
                  <span className="lc-cc-who">{lecturer.split(' bin')[0]}</span>
                  {captionScript[ccIdx][ccLang]}
                </div>
              )}
              <div className="lc-reactions" aria-hidden>
                {reactions.map((r) => (
                  <span key={r.id} style={{ left: `${r.x}%` }}>
                    {r.emoji}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="lc-strip">
            {tiles.map((tl, i) => (
              <div key={tl.name} className={`lc-tile ${(tl.host && speaking === 0) || (!tl.host && !tl.me && speaking === i) ? 'speaking' : ''}`}>
                {tl.me && cam && camStream ? <video ref={camRef} autoPlay muted playsInline /> : <Avatar name={tl.name} color={tl.me ? me.color : undefined} size="lg" />}
                <div className="lc-tile-name">
                  {tl.me ? (mic ? <Mic size={12} /> : <MicOff size={12} className="c-red" />) : tl.host || !mutedAll ? <Mic size={12} /> : <MicOff size={12} className="c-red" />}
                  <span className="truncate">{tl.me ? 'You' : tl.name.split(' ').slice(0, 2).join(' ')}</span>
                </div>
                <span className="lc-tile-tag">{tl.label}</span>
                {tl.me && hand && (
                  <span className="lc-hand">
                    <Hand size={14} />
                  </span>
                )}
              </div>
            ))}
            <div className="lc-tile more">
              <strong>+{attendees - tiles.length}</strong>
              <span>
                {hasAtt ? att.counter : 85} in the hall, {attendees - (hasAtt ? att.counter : 85)} online
              </span>
            </div>
          </div>
        </section>

        <aside className={`lc-panel ${panelOpen ? 'open' : ''}`} aria-label="People in this class">
          <div className="lc-panel-head">
            <strong>
              <Users size={15} /> People
            </strong>
            <span>{attendees} in this class</span>
            <button className="lc-panel-x" onClick={() => setPanelOpen(false)} aria-label="Close people list">
              <X size={16} />
            </button>
          </div>
          {(
            <div className="lc-pane">
              <div className="lc-chat">
                {isHost && (
                  <div className="row" style={{ gap: 8, marginBottom: 12 }}>
                    <button
                      className="btn secondary sm"
                      onClick={() => {
                        setMutedAll(true)
                        toast('Everyone except you is muted.')
                      }}
                    >
                      <MicOff size={14} /> Mute everyone
                    </button>
                    <button className="btn secondary sm" onClick={() => setBreakout(true)}>
                      <LayoutGrid size={14} /> Breakout rooms
                    </button>
                  </div>
                )}
                {hands.length > 0 && isHost && (
                  <>
                    <div className="lc-people-head">Raised hands</div>
                    {hands.map((h) => (
                      <div key={h} className="lc-person">
                        <Avatar name={h} size="sm" />
                        <span className="grow truncate">{h}</span>
                        <button
                          className="btn xs secondary"
                          onClick={() => {
                            setHands((hs) => hs.filter((x) => x !== h))
                            toast(`${h.split(' ')[0]} can speak now.`)
                          }}
                        >
                          Let them speak
                        </button>
                      </div>
                    ))}
                  </>
                )}
                <div className="lc-people-head">In this class ({attendees})</div>
                <div className="lc-person">
                  <Avatar name={lecturer} size="sm" />
                  <span className="grow truncate">{isHost ? 'You' : lecturer}</span>
                  <Badge tone="teal">Host</Badge>
                </div>
                {!isHost && (
                  <div className="lc-person">
                    <Avatar name={me.name} size="sm" color={me.color} />
                    <span className="grow truncate">You</span>
                    {hand && <Hand size={14} className="c-gold" />}
                    {mic ? <Mic size={14} /> : <MicOff size={14} className="c-red" />}
                  </div>
                )}
                {people.map((p, i) => (
                  <div key={p.id} className="lc-person">
                    <Avatar name={p.name} size="sm" />
                    <span className="grow truncate">{p.name}</span>
                    <span className="xs" style={{ color: '#9aa7c4' }}>
                      {i % 2 ? 'Online' : 'Hall'}
                    </span>
                    {mutedAll || i % 3 ? <MicOff size={14} className="c-red" /> : <Mic size={14} />}
                  </div>
                ))}
                <p className="xs" style={{ color: '#9aa7c4', padding: '10px 0' }}>
                  and {attendees - people.length - 2} more
                </p>
              </div>
            </div>
          )}
        </aside>
      </div>

      <footer className="lc-controls">
        <div className="lc-controls-group">
          <button className={`ctl ${mic ? '' : 'off'}`} onClick={() => setMic((m) => !m)} aria-label={mic ? 'Mute microphone' : 'Unmute microphone'}>
            {mic ? <Mic size={18} /> : <MicOff size={18} />}
            <span>{mic ? 'Mute' : 'Unmute'}</span>
          </button>
          <button className={`ctl ${cam ? '' : 'off'}`} onClick={toggleCam} aria-label={cam ? 'Stop camera' : 'Start camera'}>
            {cam ? <Video size={18} /> : <VideoOff size={18} />}
            <span>Camera</span>
          </button>
          {isHost && (
            <button className={`ctl ${screenStream ? 'active' : ''}`} onClick={toggleShare}>
              <MonitorUp size={18} />
              <span>{screenStream ? 'Stop share' : 'Share'}</span>
            </button>
          )}
          {!isHost && (
            <button className={`ctl ${hand ? 'active' : ''}`} onClick={toggleHand}>
              <Hand size={18} />
              <span>{hand ? 'Lower' : 'Raise'}</span>
            </button>
          )}
          <div style={{ position: 'relative' }}>
            <button className="ctl" onClick={() => setShowReact((v) => !v)} aria-expanded={showReact}>
              <SmilePlus size={18} />
              <span>React</span>
            </button>
            {showReact && (
              <div className="lc-react-pop">
                {['👏', '👍', '💡', '😂', '❓'].map((e) => (
                  <button key={e} onClick={() => react(e)} aria-label={`React ${e}`}>
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className={`ctl ${cc ? 'active' : ''}`} onClick={() => setCc((v) => !v)}>
            <Captions size={18} />
            <span>Captions</span>
          </button>
          {cc && (
            <button className="ctl" onClick={() => setCcLang((l) => (l === 'en' ? 'bm' : 'en'))} title="Switch caption language">
              <span className="ctl-lang">{ccLang === 'en' ? 'EN' : 'BM'}</span>
              <span>Language</span>
            </button>
          )}
          {isHost && (
            <button className={`ctl ${recording ? 'rec' : ''}`} onClick={toggleRecording}>
              {recording ? <Square size={16} fill="currentColor" /> : <Circle size={18} />}
              <span>{recording ? 'Stop rec' : 'Record'}</span>
            </button>
          )}
          {hasAtt && (
            <button className="ctl" onClick={() => setVoiceOpen(true)} title="Control the room by voice">
              <AudioLines size={18} />
              <span>Room voice</span>
            </button>
          )}
          <button className="ctl lc-panel-toggle" onClick={() => setPanelOpen(true)}>
            <Users size={18} />
            <span>People</span>
            {isHost && hands.length > 0 && <span className="lc-dot">{hands.length}</span>}
          </button>
        </div>
        <button className="btn danger lc-leave" onClick={() => (isHost ? setConfirmEnd(true) : finish())}>
          <PhoneOff size={16} /> {isHost ? 'End class' : 'Leave'}
        </button>
      </footer>

      {voiceOpen && <VoiceCommand roomId={roomId} onClose={() => setVoiceOpen(false)} />}

      {assignOpen && attSess && (
        <LiveAssignmentSetup
          sessionId={attSess.id}
          courseCode={attSess.code}
          studentIds={att.present.map((p) => p.id)}
          names={Object.fromEntries(att.people.map((p) => [p.id, p.name]))}
          onClose={() => setAssignOpen(false)}
          onTakeAttendance={() => window.open(`${import.meta.env.BASE_URL}lecturer/attendance`, '_blank')}
          onStarted={() => {
            setAssignOpen(false)
            setAssignStatus(true)
          }}
        />
      )}
      {assignStatus && la && (
        <Modal
          open
          onClose={() => setAssignStatus(false)}
          title={la.template.title}
          sub={la.status === 'running' ? `Running for ${la.studentIds.length} students. Started ${la.startedAt}.` : `Ended ${la.endedAt ?? ''}. Every lab was submitted automatically.`}
          foot={
            <>
              {la.status === 'running' && (
                <button
                  className="btn danger"
                  onClick={() => {
                    labActions.end(la)
                  }}
                >
                  End and submit all
                </button>
              )}
              <a className="btn" href={monitorUrl} target="_blank" rel="noreferrer">
                {la.status === 'running' ? 'Open the live monitor' : 'Review and mark'}
              </a>
            </>
          }
        >
          {(() => {
            const n = la.template.steps.length
            const ps = la.studentIds.map((id) => progressOf(la, id, labT))
            const finished = ps.filter((p) => p.done >= n).length
            const help = ps.filter((p) => p.state === 'Needs help').length
            const avg = Math.round((ps.reduce((x, p) => x + p.done, 0) / Math.max(1, ps.length * n)) * 100)
            return (
              <div className="att-stats" style={{ marginTop: 0 }}>
                <div>
                  <span>{la.status === 'running' ? 'Time left' : 'Submitted'}</span>
                  <strong className="num">{la.status === 'running' ? fmtLab(limitOf(la) - labT) : la.studentIds.length}</strong>
                </div>
                <div>
                  <span>Average progress</span>
                  <strong>{avg}%</strong>
                </div>
                <div>
                  <span>Finished every step</span>
                  <strong>{finished}</strong>
                </div>
                <div>
                  <span>Need help</span>
                  <strong className={help ? 'c-gold' : ''}>{la.status === 'running' ? help : 'n/a'}</strong>
                </div>
              </div>
            )
          })()}
          <p className="xs muted mt-2">The live monitor opens in a new tab, so the class keeps running here.</p>
        </Modal>
      )}

      <Modal
        open={breakout}
        onClose={() => setBreakout(false)}
        title="Open breakout rooms"
        sub="Split the online students into small groups for a 10 minute activity."
        foot={
          <>
            <button className="btn secondary" onClick={() => setBreakout(false)}>
              Cancel
            </button>
            <button
              className="btn"
              onClick={() => {
                setBreakout(false)
                setBreakoutActive(true)
                toast('4 breakout rooms opened for 10 minutes.')
              }}
            >
              Open 4 rooms
            </button>
          </>
        }
      >
        <div className="grid g-2">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="panel" style={{ padding: 12 }}>
              <strong className="small">Room {n}</strong>
              <div className="avatar-stack mt-1">
                {people.slice((n - 1) * 3, n * 3).map((p) => (
                  <Avatar key={p.id} name={p.name} size="sm" />
                ))}
              </div>
              <p className="xs muted mt-1">10 students, assigned automatically</p>
            </div>
          ))}
        </div>
        <p className="small muted mt-2">Task: trace the Banker’s algorithm for request (1, 0, 2) from P1 and decide whether to grant it.</p>
      </Modal>

      <Modal
        open={confirmEnd}
        onClose={() => setConfirmEnd(false)}
        title="End class for everyone?"
        sub="Students will leave the session. The recording and attendance are saved to the course."
        foot={
          <>
            <button className="btn secondary" onClick={() => setConfirmEnd(false)}>
              Keep teaching
            </button>
            <button className="btn danger" onClick={finish}>
              End class
            </button>
          </>
        }
      >
        <p className="small">You have been teaching for {fmtClock(elapsed)} with {attendees} people in class.</p>
        {hasAtt && att.gap > 0 && (
          <p className="small c-red">
            Attendance: {att.gap} {att.gap === 1 ? 'person' : 'people'} in the hall {att.gap === 1 ? 'is' : 'are'} not marked present yet. You can still mark them in Attendance after class.
          </p>
        )}
      </Modal>

      <Modal
        open={summary}
        onClose={() => nav(backTo)}
        title={isHost ? 'Class ended' : 'You left the class'}
        sub={`${course.code} lecture ${session.lectureNo}: ${session.title}`}
        foot={
          isHost ? (
            <>
              <button className="btn secondary" onClick={() => nav('/lecturer/attendance')}>
                Review attendance
              </button>
              <button className="btn" onClick={publishRecording}>
                Publish recording
              </button>
            </>
          ) : (
            <>
              <button className="btn secondary" onClick={() => nav('/student/recordings')}>
                Go to recordings
              </button>
              <button className="btn" onClick={() => nav('/student')}>
                Back to home
              </button>
            </>
          )
        }
      >
        {isHost ? (
          <dl className="kv">
            <dt>Duration</dt>
            <dd>{fmtClock(elapsed)}</dd>
            <dt>Attendance</dt>
            <dd>
              {hasAtt
                ? att.present.length
                  ? `${att.present.length} marked present in the hall (${att.byCamera} by face recognition, ${att.byLecturer} by you), ${Math.max(0, attendees - att.counter)} joined online`
                  : `${att.counter} in the hall and ${Math.max(0, attendees - att.counter)} online. Attendance not taken yet: use Review attendance.`
                : `${attendees} students, 85 in the hall and ${attendees - 85} online`}
            </dd>
            <dt>Recording</dt>
            <dd>{recording || recSecs > 0 ? 'Ready to publish with English and Malay captions' : 'Not recorded'}</dd>
          </dl>
        ) : (
          <dl className="kv">
            <dt>Attendance</dt>
            <dd>Recorded as present</dd>
            <dt>Time in class</dt>
            <dd>{minsAttended} min in this demo</dd>
            <dt>Recording</dt>
            <dd>Available with captions after the lecturer publishes it</dd>
            <dt>Next class</dt>
            <dd>WIE2003 lab at 14:00, Makmal 3</dd>
          </dl>
        )}
      </Modal>
    </div>
  )
}
