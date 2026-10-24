import { Link } from 'react-router-dom'
import { CalendarClock, ClipboardCheck, MapPin, PlayCircle, Radio, Video } from 'lucide-react'
import { courseById, courses, lecturerName, liveSessionId, personas, sessions, studentCourseIds } from '../../data/mock'
import { Badge, Bar, LiveBadge, Metric, PageHead, Panel, daysLeft, fmtDue } from '../../components/ui'
import { useDemo } from '../../store/DemoStore'
import { MaterialIcon, materialTint } from '../lecturer/lecturerUtils'

export default function StudentHome() {
  const { state } = useDemo()
  const p = personas.student
  const mine = courses.filter((c) => studentCourseIds.includes(c.id))
  const today = sessions.filter((s) => studentCourseIds.includes(s.courseId) && s.id !== 's-wia3003-12')
  const live = sessions.find((s) => s.id === liveSessionId)!
  const liveCourse = courseById(live.courseId)!
  const due = state.assignments
    .filter((a) => studentCourseIds.includes(a.courseId) && a.status !== 'Graded' && a.status !== 'Submitted')
    .sort((a, b) => a.due.localeCompare(b.due))
  const graded = state.assignments.filter((a) => studentCourseIds.includes(a.courseId) && a.status === 'Graded' && a.score !== undefined)
  const avg = Math.round(graded.reduce((n, a) => n + (a.score ?? 0), 0) / Math.max(1, graded.length))
  const credits = mine.reduce((n, c) => n + c.credits, 0)
  const anns = state.announcements.filter((a) => !a.courseId || studentCourseIds.includes(a.courseId)).slice(0, 3)

  // next unfinished item per course
  const next = mine
    .map((c) => {
      for (const m of c.modules) {
        const item = m.items.find((i) => !i.done && !state.completed[i.id])
        if (item) return { c, m, item }
      }
      return null
    })
    .filter(Boolean)
    .slice(0, 4) as { c: (typeof mine)[number]; m: (typeof mine)[number]['modules'][number]; item: (typeof mine)[number]['modules'][number]['items'][number] }[]

  return (
    <>
      <PageHead title={`Selamat pagi, ${p.short}`} sub={`Wednesday, 21 October. You have 4 classes today and ${due.filter((a) => a.due < '2026-10-26').length} deadlines this week.`} />

      <div className="live-banner">
        <span className="icon-tile" style={{ background: 'rgba(255,255,255,.08)', color: '#fff' }}>
          <Radio size={20} />
        </span>
        <div className="grow">
          <div className="row" style={{ gap: 10 }}>
            <LiveBadge label="Live now" />
            <span className="xs" style={{ color: '#b9c3db' }}>
              Started 10:00, {live.room}, hybrid
            </span>
          </div>
          <h3 style={{ marginTop: 6 }}>
            {liveCourse.code} {liveCourse.title}: {live.title}
          </h3>
          <p>
            {lecturerName(liveCourse.lecturerId)} is teaching. {live.attendees} classmates have joined, 41 of them online.
          </p>
        </div>
        <Link to={`/student/live/${liveSessionId}`} className="btn gold">
          Join class
        </Link>
      </div>

      <div className="metrics">
        <Metric label="My attendance" value="92" unit="%" foot={<span className="delta-up">Above the 80% requirement</span>} />
        <Metric label="Coursework average" value={avg} unit="%" foot={`From ${graded.length} graded assessments`} />
        <Metric label="Due this week" value={due.filter((a) => a.due < '2026-10-26').length} foot={due[0] ? `Next: ${fmtDue(due[0].due)}` : 'Nothing due'} />
        <Metric label="Credits this semester" value={credits} foot={`${mine.length} courses`} />
      </div>

      <div className="grid g-main-side">
        <div className="stack">
          <Panel title="Today" sub="Wednesday, 21 October" action={<Link to="/student/timetable" className="link-btn">Full timetable</Link>} bodyClass="panel-body tight">
            <div className="timeline">
              {today.map((s) => {
                const c = courseById(s.courseId)!
                return (
                  <div key={s.id} className={`tl-item ${s.status === 'live' ? 'now' : s.status === 'ended' ? 'done' : ''}`}>
                    <div className="tl-time">
                      {s.start}
                      <span>{s.end}</span>
                    </div>
                    <div className="tl-rail">
                      <i />
                    </div>
                    <div className="tl-body">
                      <div className="tl-card">
                        <div className="grow">
                          <div className="strong small">
                            {c.code} {c.title}
                          </div>
                          <div className="xs muted row" style={{ gap: 6, marginTop: 2 }}>
                            {s.mode === 'Online' ? <Video size={13} /> : <MapPin size={13} />}
                            {s.title}, {s.room}
                          </div>
                        </div>
                        {s.status === 'live' ? (
                          <Link to={`/student/live/${s.id}`} className="btn sm">
                            Join
                          </Link>
                        ) : s.status === 'ended' ? (
                          <Link to="/student/recordings" className="btn sm secondary">
                            Watch recording
                          </Link>
                        ) : (
                          <Badge>{s.mode}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Panel>

          <Panel title="Pick up where you left off" bodyClass="panel-body tight">
            <div className="list">
              {next.map(({ c, m, item }) => (
                <Link key={item.id} to={`/student/courses/${c.id}`} className="list-item clickable" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <span className="icon-tile" style={{ background: materialTint[item.type].bg, color: materialTint[item.type].fg }}>
                    <MaterialIcon type={item.type} />
                  </span>
                  <div className="grow">
                    <div className="title truncate">{item.title}</div>
                    <div className="sub">
                      {c.code}, week {m.week}, {item.meta}
                    </div>
                  </div>
                  <div style={{ width: 110 }} className="hide-sm">
                    <div className="xs muted" style={{ marginBottom: 4 }}>
                      Course {c.progress}%
                    </div>
                    <Bar value={c.progress} thin color={c.color} />
                  </div>
                </Link>
              ))}
            </div>
          </Panel>
        </div>

        <div className="stack">
          <Panel title="Due soon" action={<Link to="/student/assignments" className="link-btn">All assignments</Link>} bodyClass="panel-body tight">
            <div className="list">
              {due.slice(0, 4).map((a) => {
                const c = courseById(a.courseId)!
                const soon = new Date(a.due).getTime() - new Date(2026, 9, 21, 10, 12).getTime() < 3 * 86400000
                return (
                  <Link key={a.id} to={`/student/assignments?open=${a.id}`} className="list-item clickable" style={{ textDecoration: 'none', color: 'inherit', alignItems: 'flex-start' }}>
                    <span className="icon-tile sm" style={{ background: soon ? 'var(--red-50)' : 'var(--primary-50)', color: soon ? 'var(--red)' : 'var(--primary)' }}>
                      <ClipboardCheck size={16} />
                    </span>
                    <div className="grow">
                      <div className="title" style={{ fontSize: 13 }}>
                        {a.title}
                      </div>
                      <div className="sub xs">
                        {c.code}, {fmtDue(a.due)}
                      </div>
                    </div>
                    <Badge tone={soon ? 'red' : a.status === 'Draft' ? 'amber' : ''}>{a.status === 'Draft' ? 'Draft saved' : daysLeft(a.due)}</Badge>
                  </Link>
                )
              })}
            </div>
          </Panel>

          <Panel title="Announcements" action={<Link to="/student/announcements" className="link-btn">See all</Link>} bodyClass="panel-body tight">
            <div className="list">
              {anns.map((a) => (
                <div key={a.id} className="list-item" style={{ alignItems: 'flex-start' }}>
                  <div className="grow">
                    <div className="title" style={{ fontSize: 13 }}>
                      {a.title}
                    </div>
                    <p className="xs muted" style={{ marginTop: 2 }}>
                      {a.from}
                    </p>
                  </div>
                  {a.pinned && <Badge tone="gold">Pinned</Badge>}
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="New recordings" bodyClass="panel-body tight">
            <div className="list">
              {[
                ['WIA2005', 'Lecture 13: Dynamic programming II', 'This morning'],
                ['WIE2003', 'Lecture 6: Statistics refresher', 'Yesterday'],
              ].map(([code, t, when]) => (
                <Link key={t} to="/student/recordings" className="list-item clickable" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <span className="icon-tile sm" style={{ background: 'var(--red-50)', color: 'var(--red)' }}>
                    <PlayCircle size={16} />
                  </span>
                  <div className="grow">
                    <div className="title" style={{ fontSize: 13 }}>
                      {code} {t}
                    </div>
                    <div className="sub xs row" style={{ gap: 4 }}>
                      <CalendarClock size={12} /> {when}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </>
  )
}
