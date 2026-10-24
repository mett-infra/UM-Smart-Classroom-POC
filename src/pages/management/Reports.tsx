import { useEffect, useRef, useState, type ReactNode } from 'react'
import { BarChart3, CalendarClock, CheckCircle2, Download, FileText, Loader2, ShieldCheck, Users, Video, Building2, Accessibility, Timer, GraduationCap } from 'lucide-react'
import { Badge, Bar, Notice, PageHead, Panel, Switch } from '../../components/ui'
import { faculties, rooms, weeklyTrend } from '../../data/mock'
import { useDemo } from '../../store/DemoStore'
import { campusSessions } from './liveData'
import { downloadCsv } from './csv'
import '../../styles/management.css'

type Row = (string | number)[]

interface ReportDef {
  id: string
  title: string
  desc: string
  last: string
  icon: ReactNode
  rows: () => Row[]
}

const reports: ReportDef[] = [
  {
    id: 'weekly',
    title: 'Weekly teaching and learning summary',
    desc: 'Attendance, engagement, live sessions and recordings by teaching week.',
    last: 'Mon 19 Oct, 07:00',
    icon: <BarChart3 size={18} />,
    rows: () => [['Week', 'Attendance %', 'Engagement score', 'Live sessions', 'Recordings published'], ...weeklyTrend.map((w) => [w.week, w.attendance, w.engagement, w.live, w.recordings])],
  },
  {
    id: 'attendance',
    title: 'Attendance by faculty',
    desc: 'Students, attendance and completion for each faculty.',
    last: 'Tue 20 Oct, 18:00',
    icon: <Users size={18} />,
    rows: () => [['Faculty', 'Students', 'Attendance %', 'Completion %'], ...faculties.map((f) => [f.name, f.students, f.attendance, f.completion])],
  },
  {
    id: 'hybrid',
    title: 'Hybrid session quality',
    desc: 'Stream health, participation and recording coverage for hybrid and online classes.',
    last: 'Tue 20 Oct, 18:00',
    icon: <Video size={18} />,
    rows: () => [['Code', 'Class', 'Mode', 'Joined', 'Enrolled', 'Stream', 'Recording'], ...campusSessions.map((s) => [s.code, s.title, s.mode, s.attendees, s.enrolled, s.mode === 'In person' ? 'n/a' : s.health, s.recording ? 'On' : 'Off'])],
  },
  {
    id: 'rooms',
    title: 'Room utilisation',
    desc: 'Occupancy, capacity and hybrid readiness for monitored rooms.',
    last: 'Sun 18 Oct, 23:00',
    icon: <Building2 size={18} />,
    rows: () => [['Room', 'Building', 'Type', 'Capacity', 'Occupancy %', 'Hybrid', 'Status'], ...rooms.map((r) => [r.name, r.building, r.kind, r.capacity, r.occupancy, r.hybrid ? 'Yes' : 'No', r.status])],
  },
  {
    id: 'mqa',
    title: 'Accreditation evidence pack (MQA)',
    desc: 'Course delivery, assessment and student feedback evidence grouped for programme accreditation.',
    last: 'Fri 9 Oct, 16:30',
    icon: <ShieldCheck size={18} />,
    rows: () => [['Faculty', 'Courses delivered', 'Lecturers', 'Completion %', 'Satisfaction (of 5)'], ...faculties.map((f) => [f.name, f.courses, f.lecturers, f.completion, f.satisfaction])],
  },
]

const measures = [
  { title: 'Classroom uptime', desc: 'Share of scheduled teaching time when room equipment works.', baseline: 95, icon: <Building2 size={16} />, tag: 'Operational' },
  { title: 'Lecturer adoption', desc: 'Lecturers using live classes, recordings or the gradebook each week, and training completed.', baseline: 68, icon: <GraduationCap size={16} />, tag: 'Adoption' },
  { title: 'Support resolution time', desc: 'Classroom incidents resolved within the agreed service level.', baseline: 92, icon: <Timer size={16} />, tag: 'Service' },
  { title: 'Learning accessibility', desc: 'Recordings published with captions and available to students within 24 hours.', baseline: 81, icon: <Accessibility size={16} />, tag: 'Learning' },
]

export default function Reports() {
  const { toast } = useDemo()
  const [state, setState] = useState<Record<string, { status: 'idle' | 'running' | 'ready'; progress: number; last: string }>>(() =>
    Object.fromEntries(reports.map((r) => [r.id, { status: 'idle', progress: 0, last: r.last }])),
  )
  const [schedules, setSchedules] = useState([
    { id: 'sc1', title: 'Weekly teaching and learning summary', when: 'Every Monday, 07:00, to the Academic Management Office', on: true },
    { id: 'sc2', title: 'Attendance by faculty', when: 'Every Friday, 17:00, to faculty deans', on: true },
    { id: 'sc3', title: 'Room utilisation', when: 'First day of each month, to Facilities', on: false },
  ])
  const timers = useRef<number[]>([])
  useEffect(() => () => timers.current.forEach((t) => clearTimeout(t)), [])

  const generate = (r: ReportDef) => {
    setState((s) => ({ ...s, [r.id]: { ...s[r.id], status: 'running', progress: 0 } }))
    const steps = [18, 41, 63, 86, 100]
    steps.forEach((p, i) => {
      const t = window.setTimeout(() => {
        if (p === 100) {
          setState((s) => ({ ...s, [r.id]: { status: 'ready', progress: 100, last: 'Wed 21 Oct, just now' } }))
          toast(`${r.title} is ready to download.`)
        } else {
          setState((s) => ({ ...s, [r.id]: { ...s[r.id], progress: p } }))
        }
      }, 380 * (i + 1))
      timers.current.push(t)
    })
  }

  const download = (r: ReportDef) => {
    downloadCsv(`um-${r.id}-report-sample.csv`, r.rows())
    toast(`Downloaded ${r.title} as CSV.`)
  }

  return (
    <>
      <PageHead title="Reports" sub="Generate and download reports for faculties, committees and accreditation. All figures are sample data." />

      <div className="grid g-main-side">
        <Panel title="Report library" sub="Generate a fresh copy, then download it as CSV" bodyClass="">
          {reports.map((r) => {
            const st = state[r.id]
            return (
              <div className="mg-report" key={r.id}>
                <div className="icon-tile">{r.icon}</div>
                <div className="grow">
                  <div className="strong">{r.title}</div>
                  <p>{r.desc}</p>
                  <div className="xs muted mt-1">Last generated {st.last}</div>
                </div>
                <div className="row wrap">
                  {st.status === 'running' ? (
                    <div className="mg-gen">
                      <div className="row xs muted" style={{ gap: 6, marginBottom: 4 }}>
                        <Loader2 size={13} className="spin" /> Generating {st.progress}%
                      </div>
                      <Bar thin value={st.progress} />
                    </div>
                  ) : (
                    <button className="btn sm secondary" onClick={() => generate(r)}>
                      {st.status === 'ready' ? <CheckCircle2 size={15} color="var(--green)" /> : <FileText size={15} />}
                      {st.status === 'ready' ? 'Generate again' : 'Generate'}
                    </button>
                  )}
                  <button className="btn sm" onClick={() => download(r)} disabled={st.status === 'running'}>
                    <Download size={15} /> Download CSV
                  </button>
                </div>
              </div>
            )
          })}
        </Panel>

        <div className="stack">
          <Panel title="Scheduled reports" sub="Sent automatically by email" bodyClass="">
            {schedules.map((s) => (
              <div className="mg-routine" key={s.id}>
                <div className="icon-tile sm">
                  <CalendarClock size={16} />
                </div>
                <div className="grow">
                  <div className="strong small">{s.title}</div>
                  <div className="xs muted">{s.when}</div>
                </div>
                <Switch
                  on={s.on}
                  label={s.title}
                  onChange={(v) => {
                    setSchedules((xs) => xs.map((x) => (x.id === s.id ? { ...x, on: v } : x)))
                    toast(`${s.title} schedule ${v ? 'turned on' : 'paused'}.`, 'info')
                  }}
                />
              </div>
            ))}
          </Panel>
          <Notice>Reports here are built in the browser from sample data. A production version would read from the university data warehouse with role-based access.</Notice>
        </div>
      </div>

      <Panel title="Proposed success measures" sub="Baselines and targets to agree with the university during discovery" className="mt-3" bodyClass="">
        {measures.map((m) => (
          <div className="mg-measure" key={m.title}>
            <div className="icon-tile sm">{m.icon}</div>
            <div className="grow">
              <div className="row wrap" style={{ gap: 8 }}>
                <span className="strong">{m.title}</span>
                <Badge tone="blue">{m.tag}</Badge>
              </div>
              <div className="small muted">{m.desc}</div>
              <div className="row mt-1" style={{ maxWidth: 420 }}>
                <div className="grow">
                  <Bar thin value={m.baseline} />
                </div>
                <span className="xs muted num">Sample baseline {m.baseline}%</span>
              </div>
            </div>
          </div>
        ))}
      </Panel>
    </>
  )
}
