import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Area, CartesianGrid, ComposedChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Bar as RBar } from 'recharts'
import { Activity, AlertTriangle, Building2, CheckCircle2, ClipboardCheck, Download, FileSpreadsheet, Megaphone, Radio, Users, Wrench, BookOpen, ShieldAlert } from 'lucide-react'
import { PageHead, Panel, Badge, LiveBadge, Metric, Empty } from '../../components/ui'
import { axisProps, chartColors, gridProps, HBars, Legend, tooltipProps } from '../../components/charts'
import { faculties, hourlyLoad, weeklyTrend } from '../../data/mock'
import { useDemo, type ActivityItem } from '../../store/DemoStore'
import { campusSessions } from './liveData'
import { downloadCsv } from './csv'
import '../../styles/management.css'

const activityIcon: Record<ActivityItem['kind'], ReactNode> = {
  live: <Radio size={16} />,
  submit: <ClipboardCheck size={16} />,
  ticket: <Wrench size={16} />,
  announce: <Megaphone size={16} />,
  grade: <CheckCircle2 size={16} />,
  room: <Building2 size={16} />,
  material: <BookOpen size={16} />,
  network: <ShieldAlert size={16} />,
}

export default function MgmtOverview() {
  const { state, toast } = useDemo()
  const liveNow = faculties.reduce((s, f) => s + f.liveNow, 0)
  const totalStudents = faculties.reduce((s, f) => s + f.students, 0)
  const avgAttendance = Math.round(faculties.reduce((s, f) => s + f.attendance * f.students, 0) / totalStudents)
  const avgCompletion = Math.round(faculties.reduce((s, f) => s + f.completion * f.students, 0) / totalStudents)
  const subRooms = state.spaces.filter((r) => r.kind === 'sub' && r.state !== 'Deactivated')
  const available = subRooms.filter((r) => r.state === 'Operational').length
  const roomPct = Math.round((available / Math.max(1, subRooms.length)) * 100)
  const openInc = state.incidents.filter((i) => !['Resolved', 'False positive'].includes(i.status))
  const highTickets = state.tickets.filter((t) => t.priority === 'High' && t.status !== 'Resolved')

  const exportCsv = () => {
    downloadCsv('um-overview-week7-sample.csv', [
      ['Faculty', 'Students', 'Lecturers', 'Courses', 'Attendance %', 'Completion %', 'Live now', 'Room utilisation %'],
      ...faculties.map((f) => [f.name, f.students, f.lecturers, f.courses, f.attendance, f.completion, f.liveNow, f.utilisation]),
    ])
    toast('Overview exported as CSV with sample data.')
  }

  return (
    <>
      <p className="mg-print-note">UM Smart Classroom overview, teaching week 7. Sample data prepared for a proof of concept.</p>
      <PageHead
        title="Good morning, Prof. Lim"
        sub={`Teaching week 7 is on track. Attendance is steady and ${liveNow} classes are live across campus right now.`}
        actions={
          <>
            <button className="btn secondary" onClick={exportCsv}>
              <FileSpreadsheet size={16} /> Export CSV
            </button>
            <button
              className="btn"
              onClick={() => {
                toast('Opening the print dialog. Choose "Save as PDF" to download.', 'info')
                setTimeout(() => window.print(), 300)
              }}
            >
              <Download size={16} /> Download overview (PDF)
            </button>
          </>
        }
      />

      <div className="metrics m-5">
        <Metric label="Students active today" value="18,642" foot={<><span className="delta-up">+4.1%</span> on last Wednesday</>} />
        <Metric label="Live sessions now" value={liveNow} foot="Across 8 faculties" />
        <Metric label="Average attendance" value={avgAttendance} unit="%" foot={<><span className="delta-down">-1 pt</span> on week 6</>} />
        <Metric label="Course completion" value={avgCompletion} unit="%" foot="Semester to date" />
        <Metric label="Smart rooms available" value={roomPct} unit="%" foot={`${available} of ${subRooms.length} rooms operational`} />
      </div>

      <div className="grid g-main-side">
        <div className="stack">
          <Panel title="Platform usage today" sub="Live sessions and signed-in users by hour, sample data" action={<Legend items={[{ label: 'Live sessions', color: chartColors.primary }, { label: 'Users', color: chartColors.gold }]} />}>
            <div className="chart-box">
              <ResponsiveContainer>
                <ComposedChart data={hourlyLoad} margin={{ top: 8, right: 4, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="usersFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chartColors.gold} stopOpacity={0.28} />
                      <stop offset="100%" stopColor={chartColors.gold} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="hour" {...axisProps} tickFormatter={(h) => `${h}:00`} />
                  <YAxis yAxisId="s" {...axisProps} />
                  <YAxis yAxisId="u" orientation="right" {...axisProps} tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip {...tooltipProps} labelFormatter={(h) => `${h}:00`} />
                  <Area yAxisId="u" type="monotone" dataKey="users" name="Users" stroke={chartColors.gold} strokeWidth={2} fill="url(#usersFill)" />
                  <RBar yAxisId="s" dataKey="sessions" name="Live sessions" fill={chartColors.primary} radius={[4, 4, 0, 0]} barSize={18} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <div className="grid g-2">
            <Panel title="Attendance by faculty" sub="Teaching week 7">
              <HBars rows={[...faculties].sort((a, b) => b.attendance - a.attendance).map((f) => ({ label: f.short, value: f.attendance, color: f.attendance < 82 ? chartColors.gold : chartColors.primary }))} />
            </Panel>
            <Panel title="Attendance and engagement" sub="Weeks 1 to 7, sample data">
              <div className="chart-box" style={{ height: 230 }}>
                <ResponsiveContainer>
                  <LineChart data={weeklyTrend} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                    <CartesianGrid {...gridProps} />
                    <XAxis dataKey="week" {...axisProps} />
                    <YAxis domain={[60, 100]} {...axisProps} />
                    <Tooltip {...tooltipProps} />
                    <Line type="monotone" dataKey="attendance" name="Attendance %" stroke={chartColors.primary} strokeWidth={2.5} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="engagement" name="Engagement score" stroke={chartColors.teal} strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-1">
                <Legend items={[{ label: 'Attendance %', color: chartColors.primary }, { label: 'Engagement score', color: chartColors.teal }]} />
              </div>
            </Panel>
          </div>
        </div>

        <div className="stack">
          <Panel
            title="Network incidents"
            sub={`${openInc.length} open, recorded automatically`}
            action={<Link to="/management/network" className="btn secondary sm">Open incidents</Link>}
            bodyClass="panel-body tight"
          >
            {openInc.length === 0 ? (
              <Empty icon={<ShieldAlert size={26} />} title="No open incidents">New policy events from the campus network will appear here.</Empty>
            ) : (
              <div className="list">
                {openInc.slice(0, 3).map((i) => (
                  <Link key={i.id} to={`/management/network?open=${i.id}`} className="list-item clickable" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <span className="icon-tile sm" style={{ background: i.severity === 'High' ? 'var(--red-50)' : 'var(--amber-50)', color: i.severity === 'High' ? 'var(--red)' : 'var(--amber)' }}>
                      <ShieldAlert size={16} />
                    </span>
                    <div className="grow">
                      <div className="title truncate">
                        {i.id}: {i.title}
                      </div>
                      <div className="sub truncate">
                        {i.network}, {i.detected}
                      </div>
                    </div>
                    <Badge tone={i.status === 'New' ? 'red' : i.status === 'On hold' ? '' : 'amber'}>{i.status}</Badge>
                  </Link>
                ))}
              </div>
            )}
          </Panel>
          <Panel
            title="Live now"
            sub={`${liveNow} sessions across campus`}
            action={<Link to="/management/live" className="btn secondary sm">Open live operations</Link>}
            bodyClass="panel-body tight"
          >
            <div className="list">
              {campusSessions.slice(0, 5).map((s) => (
                <div className="list-item" key={s.id}>
                  <div className="icon-tile sm">
                    <Radio size={16} />
                  </div>
                  <div className="grow">
                    <div className="title truncate">{s.code} {s.title.split(',')[0]}</div>
                    <div className="sub truncate">{s.room}, {s.attendees} joined</div>
                  </div>
                  {s.health === 'Degraded' ? <Badge tone="amber">Degraded</Badge> : <LiveBadge />}
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Needs attention" sub="High priority maintenance" bodyClass="panel-body tight" action={<Link to="/management/maintenance" className="link-btn">View all tickets</Link>}>
            {highTickets.length === 0 ? (
              <Empty icon={<CheckCircle2 size={28} />} title="No high priority tickets">All rooms reporting normally.</Empty>
            ) : (
              <div className="list">
                {highTickets.map((t) => (
                  <div className="list-item" key={t.id}>
                    <div className="icon-tile sm" style={{ background: 'var(--red-50)', color: 'var(--red)' }}>
                      <AlertTriangle size={16} />
                    </div>
                    <div className="grow">
                      <div className="title">{t.room}</div>
                      <div className="sub">{t.device}</div>
                    </div>
                    <Badge tone={t.status === 'Open' ? 'amber' : 'blue'}>{t.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Recent activity" sub="Across the platform" bodyClass="panel-body tight">
            <div className="list">
              {state.activity.slice(0, 6).map((a) => (
                <div className="list-item" key={a.id}>
                  <div className="icon-tile sm">{activityIcon[a.kind] ?? <Activity size={16} />}</div>
                  <div className="grow">
                    <div className="title">{a.text}</div>
                    <div className="sub">{a.sub}</div>
                  </div>
                  <span className="xs muted num">{a.time}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Faculties at a glance" bodyClass="panel-body tight">
            <div className="list">
              {faculties.slice(0, 4).map((f) => (
                <div className="list-item" key={f.id}>
                  <div className="icon-tile sm">
                    <Users size={16} />
                  </div>
                  <div className="grow">
                    <div className="title truncate">{f.short}</div>
                    <div className="sub">{f.students.toLocaleString()} students, {f.liveNow} live now</div>
                  </div>
                  <strong className="num">{f.completion}%</strong>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </>
  )
}
