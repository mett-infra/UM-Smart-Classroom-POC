import type { ReactElement } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart3,
  BookOpen,
  Building2,
  ClipboardCheck,
  GraduationCap,
  Briefcase,
  QrCode,
  Radio,
  Sparkles,
  Users,
  MonitorPlay,
} from 'lucide-react'
import { BrandMark } from '../components/Shell'
import { Avatar } from '../components/ui'
import { personas } from '../data/mock'
import type { Role } from '../data/types'

const roles: { role: Role; label: string; icon: ReactElement; color: string; tint: string; points: string[] }[] = [
  {
    role: 'student',
    label: 'Student',
    icon: <GraduationCap size={18} />,
    color: 'var(--role-student)',
    tint: 'var(--primary-50)',
    points: ['Join a live hybrid lecture with chat, polls and captions', 'Pick up course materials and recordings by week', 'Submit assignments and track grades', 'Ask the AI study assistant about a lecture'],
  },
  {
    role: 'lecturer',
    label: 'Lecturer',
    icon: <BookOpen size={18} />,
    color: 'var(--role-lecturer)',
    tint: 'var(--teal-50)',
    points: ['Run the class: slides, whiteboard, polls, breakout rooms', 'Take attendance with face recognition, and mark anyone the camera misses', 'Share materials and assessments week by week', 'Turn a lecture transcript into a quiz'],
  },
  {
    role: 'management',
    label: 'Management',
    icon: <Briefcase size={18} />,
    color: 'var(--role-management)',
    tint: 'var(--plum-50)',
    points: ['See every live session and observe rooms through their cameras', 'Get network incidents recorded automatically', 'Set up rooms, pair devices and control smart rooms', 'Track maintenance and generate reports'],
  },
]

const modules = [
  { icon: <Radio size={18} />, title: 'Live virtual classroom', text: 'Hybrid lectures for students in the hall and at home.' },
  { icon: <BookOpen size={18} />, title: 'Courses and content', text: 'Weekly modules, slides, readings and labs in one place.' },
  { icon: <MonitorPlay size={18} />, title: 'Lecture recordings', text: 'Every session captured with English and Malay captions.' },
  { icon: <ClipboardCheck size={18} />, title: 'Assignments and grading', text: 'Submission, marking and feedback without email.' },
  { icon: <QrCode size={18} />, title: 'Attendance', text: 'QR check-in for the room, automatic for online students.' },
  { icon: <Sparkles size={18} />, title: 'AI assistants', text: 'Summaries, questions and quiz drafts from lecture content.' },
  { icon: <Building2 size={18} />, title: 'Smart rooms', text: 'Room status, one-touch controls and device health.' },
  { icon: <BarChart3 size={18} />, title: 'Analytics and reports', text: 'Faculty-level insight for academic management.' },
]

function SongketField() {
  // Geometric diamond lattice inspired by songket weaving. Original artwork for this POC.
  const cells = []
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const x = c * 56 + (r % 2) * 28
      const y = r * 28
      const strong = (r + c) % 4 === 0
      cells.push(
        <g key={`${r}-${c}`} transform={`translate(${x} ${y})`}>
          <path d="M28 0 L56 28 L28 56 L0 28 Z" fill="none" stroke="#C8952C" strokeOpacity={strong ? 0.75 : 0.32} strokeWidth="1.2" />
          <path d="M28 14 L42 28 L28 42 L14 28 Z" fill="#C8952C" fillOpacity={strong ? 0.55 : 0.14} />
          {strong && <circle cx="28" cy="28" r="3" fill="#101c3b" />}
        </g>,
      )
    }
  }
  return (
    <svg className="songket-field" viewBox="0 0 504 280" preserveAspectRatio="xMidYMid slice" aria-hidden>
      {cells}
    </svg>
  )
}

export default function Landing() {
  return (
    <div className="landing">
      <header className="landing-top">
        <div className="row" style={{ gap: 12 }}>
          <BrandMark size={40} />
          <div>
            <div className="landing-brand">UM Smart Classroom</div>
            <div className="xs" style={{ color: '#9aa7c4' }}>
              A proof of concept by METGABB for Universiti Malaya
            </div>
          </div>
        </div>
        <span className="landing-tag">Sample data, runs in your browser</span>
      </header>

      <section className="landing-hero">
        <div className="hero-copy">
          <h1>Teach, learn and run the university from one classroom.</h1>
          <p>
            A single place where students join lectures and hand in work, lecturers teach in the hall and online at the same time, and management sees how
            teaching is going across every faculty.
          </p>
          <p className="hero-hint">Choose a role below to walk through the demo. You can switch roles at any time from the top bar.</p>
        </div>
        <div className="hero-visual">
          <SongketField />
          <div className="hero-live">
            <div className="row between">
              <span className="badge live">
                <span className="live-dot" /> Live now
              </span>
              <span className="xs" style={{ color: '#b9c3db' }}>
                DK2, FSKTM, hybrid
              </span>
            </div>
            <strong>WIA2004 Operating Systems</strong>
            <span className="small" style={{ color: '#d5dcec' }}>
              Lecture 14: Deadlocks, detection and avoidance
            </span>
            <div className="row between mt-1">
              <div className="avatar-stack">
                {['Tan Jia Hui', 'Arjun Krishnan', 'Nur Aisyah', 'Lee Wen Hao'].map((n) => (
                  <Avatar key={n} name={n} size="sm" />
                ))}
              </div>
              <span className="small" style={{ color: '#fff' }}>
                <Users size={14} style={{ display: 'inline', verticalAlign: -2 }} /> 126 joined, 41 online
              </span>
            </div>
            <Link to="/student/live/s-wia2004-14" className="btn gold sm mt-1">
              Join as Aina, a student
            </Link>
          </div>
        </div>
      </section>

      <section className="landing-roles" aria-label="Choose a role">
        {roles.map((r) => {
          const p = personas[r.role]
          return (
            <article className="role-card" key={r.role} style={{ ['--rc' as string]: r.color, ['--rt' as string]: r.tint }}>
              <div className="role-card-top">
                <span className="role-chip">
                  {r.icon}
                  {r.label}
                </span>
              </div>
              <div className="row" style={{ gap: 12 }}>
                <Avatar name={p.name} color={p.color} size="lg" />
                <div className="grow">
                  <strong className="role-name">{p.name}</strong>
                  <span className="xs muted">{p.title}</span>
                </div>
              </div>
              <ul className="role-points">
                {r.points.map((pt) => (
                  <li key={pt}>{pt}</li>
                ))}
              </ul>
              <Link to={`/${r.role}`} className="btn role-btn">
                Enter as {r.label.toLowerCase()}
              </Link>
            </article>
          )
        })}
      </section>

      <section className="landing-modules">
        <h2>What the proof of concept covers</h2>
        <div className="module-grid">
          {modules.map((m) => (
            <div className="module" key={m.title}>
              <span className="icon-tile sm">{m.icon}</span>
              <div>
                <strong>{m.title}</strong>
                <p>{m.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="landing-foot">
        <span>Frontend-only demonstration. Names, courses and figures are fictional sample data, not university records.</span>
        <span>Integrations with SPeCTRUM, the student information system and conferencing tools would be scoped during discovery.</span>
      </footer>
    </div>
  )
}
