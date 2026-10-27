import { useEffect, useRef, useState, type ReactNode } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  CalendarDays,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Home,
  LayoutDashboard,
  Megaphone,
  Menu,
  Radio,
  Search,
  Sparkles,
  Table2,
  Users,
  Wrench,
  PlayCircle,
  Briefcase,
  UserRound,
  ShieldAlert,
  Network,
  ScrollText,
} from 'lucide-react'
import { liveSessionId, notificationsByRole, personas } from '../data/mock'
import type { Role } from '../data/types'
import { useDemo } from '../store/DemoStore'
import { Avatar } from './ui'
import { IncidentWatch } from './IncidentWatch'

export function BrandMark({ size = 38 }: { size?: number }) {
  return (
    <svg className="brand-mark" width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      <rect width="40" height="40" rx="10" fill="#1b2a52" />
      <path d="M20 6 L34 20 L20 34 L6 20 Z" fill="none" stroke="#C8952C" strokeWidth="2.2" />
      <path d="M20 13 L27 20 L20 27 L13 20 Z" fill="#C8952C" />
      <circle cx="20" cy="20" r="2.2" fill="#1b2a52" />
    </svg>
  )
}

interface NavItem {
  to: string
  label: string
  icon: ReactNode
  end?: boolean
  live?: boolean
  count?: number
}

function useNav(role: Role): { heading: string; items: NavItem[] }[] {
  const { state } = useDemo()
  const pending = state.assignments.filter((a) => ['wia2004', 'wia2005', 'wie2003', 'wix2002', 'gig1012'].includes(a.courseId) && (a.status === 'Not started' || a.status === 'Draft')).length
  const openTickets = state.tickets.filter((t) => t.status !== 'Resolved').length
  const openIncidents = state.incidents.filter((i) => !['Resolved', 'False positive'].includes(i.status)).length
  const s = 18
  if (role === 'student')
    return [
      {
        heading: 'Learning',
        items: [
          { to: '/student', label: 'Home', icon: <Home size={s} />, end: true },
          { to: `/student/live/${liveSessionId}`, label: 'Live class', icon: <Radio size={s} />, live: true },
          { to: '/student/courses', label: 'My courses', icon: <BookOpen size={s} /> },
          { to: '/student/assignments', label: 'Assignments', icon: <ClipboardCheck size={s} />, count: pending },
          { to: '/student/timetable', label: 'Timetable', icon: <CalendarDays size={s} /> },
          { to: '/student/recordings', label: 'Lecture recordings', icon: <PlayCircle size={s} /> },
        ],
      },
      {
        heading: 'Progress and support',
        items: [
          { to: '/student/grades', label: 'Grades and progress', icon: <GraduationCap size={s} /> },
          { to: '/student/assistant', label: 'AI study assistant', icon: <Sparkles size={s} /> },
          { to: '/student/announcements', label: 'Announcements', icon: <Megaphone size={s} /> },
        ],
      },
    ]
  if (role === 'lecturer')
    return [
      {
        heading: 'Teaching',
        items: [
          { to: '/lecturer', label: 'Home', icon: <Home size={s} />, end: true },
          { to: `/lecturer/live/${liveSessionId}`, label: 'Live class', icon: <Radio size={s} />, live: true },
          { to: '/lecturer/courses', label: 'My courses', icon: <BookOpen size={s} /> },
          { to: '/lecturer/timetable', label: 'Teaching timetable', icon: <CalendarDays size={s} /> },
          { to: '/lecturer/attendance', label: 'Attendance', icon: <UserRound size={s} /> },
        ],
      },
      {
        heading: 'Assessment and insight',
        items: [
          { to: '/lecturer/gradebook', label: 'Gradebook', icon: <Table2 size={s} /> },
          { to: '/lecturer/insights', label: 'Class insights', icon: <BarChart3 size={s} /> },
          { to: '/lecturer/assistant', label: 'AI teaching assistant', icon: <Sparkles size={s} /> },
          { to: '/lecturer/announcements', label: 'Announcements', icon: <Megaphone size={s} /> },
        ],
      },
    ]
  return [
    {
      heading: 'University',
      items: [
        { to: '/management', label: 'Overview', icon: <LayoutDashboard size={s} />, end: true },
        { to: '/management/live', label: 'Live operations', icon: <Radio size={s} />, live: true },
        { to: '/management/academics', label: 'Academic performance', icon: <GraduationCap size={s} /> },
        { to: '/management/people', label: 'Students and staff', icon: <Users size={s} /> },
      ],
    },
    {
      heading: 'Campus',
      items: [
        { to: '/management/campus', label: 'Campus setup', icon: <Network size={s} /> },
        { to: '/management/rooms', label: 'Smart rooms', icon: <Building2 size={s} /> },
        { to: '/management/maintenance', label: 'Maintenance', icon: <Wrench size={s} />, count: openTickets },
      ],
    },
    {
      heading: 'Security',
      items: [{ to: '/management/network', label: 'Network incidents', icon: <ShieldAlert size={s} />, count: openIncidents }],
    },
    {
      heading: 'Communication',
      items: [
        { to: '/management/announcements', label: 'Announcements', icon: <Megaphone size={s} /> },
        { to: '/management/reports', label: 'Reports', icon: <FileText size={s} /> },
        { to: '/management/audit', label: 'Audit log', icon: <ScrollText size={s} /> },
      ],
    },
  ]
}

export function RoleSwitch({ role }: { role: Role }) {
  const nav = useNavigate()
  const opts: { id: Role; label: string; icon: ReactNode; color: string }[] = [
    { id: 'student', label: 'Student', icon: <GraduationCap size={15} />, color: 'var(--role-student)' },
    { id: 'lecturer', label: 'Lecturer', icon: <BookOpen size={15} />, color: 'var(--role-lecturer)' },
    { id: 'management', label: 'Management', icon: <Briefcase size={15} />, color: 'var(--role-management)' },
  ]
  return (
    <div className="role-switch" role="group" aria-label="View the portal as">
      {opts.map((o) => (
        <button key={o.id} className={role === o.id ? 'on' : ''} onClick={() => nav('/' + o.id)} title={`View as ${o.label.toLowerCase()}`}>
          <span className="swatch" style={{ background: o.color }} />
          <span className="lbl">{o.label}</span>
        </button>
      ))}
    </div>
  )
}

function Notifications({ role }: { role: Role }) {
  const { state, update } = useDemo()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const list = notificationsByRole[role]
  const unread = list.filter((n) => n.unread && !state.readNotifications.includes(n.id)).length
  useEffect(() => {
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])
  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button className="icon-btn" aria-label={`Notifications, ${unread} unread`} onClick={() => setOpen((o) => !o)}>
        <Bell size={18} />
        {unread > 0 && <span className="badge-dot" />}
      </button>
      {open && (
        <div className="popover">
          <div className="popover-head">
            Notifications
            <button className="link-btn" onClick={() => update((s) => ({ ...s, readNotifications: [...new Set([...s.readNotifications, ...list.map((n) => n.id)])] }))}>
              Mark all as read
            </button>
          </div>
          <div className="popover-list">
            {list.map((n) => (
              <div key={n.id} className={`notif ${n.unread && !state.readNotifications.includes(n.id) ? 'unread' : ''}`}>
                <div className="grow">
                  <strong>{n.title}</strong>
                  <p>{n.body}</p>
                </div>
                <span className="xs muted">{n.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function Shell({ role }: { role: Role }) {
  const groups = useNav(role)
  const p = personas[role]
  const { reset } = useDemo()
  const [open, setOpen] = useState(false)
  const loc = useLocation()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  useEffect(() => {
    setOpen(false)
    window.scrollTo(0, 0)
  }, [loc.pathname])

  const searchTarget = role === 'student' ? '/student/courses' : role === 'lecturer' ? '/lecturer/courses' : '/management/people'

  return (
    <div className="shell">
      <aside className={`sidebar ${open ? 'open' : ''}`} aria-label="Main navigation">
        <NavLink to="/" className="sidebar-brand">
          <BrandMark />
          <span>
            <span className="brand-name">UM Smart Classroom</span>
            <span className="brand-sub">Universiti Malaya</span>
          </span>
        </NavLink>
        <div className="songket-band" />
        <div className="sidebar-role">
          <Avatar name={p.name} color={p.color} />
          <div className="who">
            <strong>{p.name}</strong>
            <span>{role === 'student' ? `Matric ${p.id}` : p.title.split(',')[0]}</span>
          </div>
        </div>
        {groups.map((g) => (
          <nav className="nav-group" key={g.heading}>
            <div className="nav-heading">{g.heading}</div>
            {g.items.map((it) => (
              <NavLink key={it.to} to={it.to} end={it.end} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                {it.icon}
                {it.label}
                {it.live && <span className="live-dot" aria-label="live now" />}
                {!!it.count && <span className="count">{it.count}</span>}
              </NavLink>
            ))}
          </nav>
        ))}
        <div className="sidebar-foot">
          <div className="poc-note">
            <strong>Proof of concept</strong>
            Sample data only. Not connected to university systems.
            <br />
            <button onClick={reset}>Reset demo data</button>
          </div>
        </div>
      </aside>
      {open && <div className="scrim" onClick={() => setOpen(false)} />}
      <div className="main">
        <header className="topbar">
          <button className="icon-btn menu-btn" aria-label="Open menu" onClick={() => setOpen(true)}>
            <Menu size={18} />
          </button>
          <form
            className="topbar-search"
            role="search"
            onSubmit={(e) => {
              e.preventDefault()
              nav(`${searchTarget}?q=${encodeURIComponent(q)}`)
            }}
          >
            <Search size={16} />
            <input aria-label="Search" placeholder={role === 'management' ? 'Search students, staff or courses' : 'Search courses and materials'} value={q} onChange={(e) => setQ(e.target.value)} />
          </form>
          <div className="topbar-right">
            <span className="clock">Wed, 21 Oct 2026, teaching week 7</span>
            <RoleSwitch role={role} />
            <Notifications role={role} />
          </div>
        </header>
        {role === 'management' && <IncidentWatch />}
        <main className="content" id="main">
          <Outlet />
        </main>
        <footer className="app-footer">
          <span>UM Smart Classroom, a proof of concept prepared by METGABB for Universiti Malaya</span>
          <span>Sample data for demonstration. Figures are not measured university performance.</span>
        </footer>
      </div>
    </div>
  )
}
