import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, ClipboardCheck, FileUp, Megaphone, Radio, Upload, Users, Wrench } from 'lucide-react'
import { PageHead, Panel, Badge, LiveBadge, Avatar, Metric, Bar, riskTone, fmtDue, daysLeft } from '../../components/ui'
import { courseById, courses, lecturerCourseIds, liveSessionId, personas, roster, sessions, TEACHING_WEEK } from '../../data/mock'
import { useDemo, type ActivityItem } from '../../store/DemoStore'
import '../../styles/lecturer.css'

const activityIcon: Record<ActivityItem['kind'], ReactNode> = {
  live: <Radio size={16} />,
  submit: <FileUp size={16} />,
  ticket: <Wrench size={16} />,
  announce: <Megaphone size={16} />,
  grade: <CheckCircle2 size={16} />,
  room: <Users size={16} />,
  material: <Upload size={16} />,
  network: <AlertTriangle size={16} />,
}

export default function LecturerHome() {
  const { state } = useDemo()
  const nav = useNavigate()
  const p = personas.lecturer
  const myCourses = courses.filter((c) => lecturerCourseIds.includes(c.id))
  const taught = myCourses.reduce((n, c) => n + c.enrolled, 0)
  const avgAttendance = Math.round(myCourses.reduce((n, c) => n + c.attendance, 0) / myCourses.length)
  const marked = Object.keys(state.marks.a1 ?? {}).length
  const a1 = state.assignments.find((a) => a.id === 'a1')
  const toGradeA1 = Math.max(0, (a1?.submitted ?? 0) - marked)
  const atRisk = roster.filter((s) => s.risk !== 'Low')
  const live = sessions.find((s) => s.id === liveSessionId)!
  const liveCourse = courseById(live.courseId)!
  const today = sessions.filter((s) => lecturerCourseIds.includes(s.courseId))

  const queue = state.assignments
    .filter((a) => lecturerCourseIds.includes(a.courseId) && a.submitted > a.graded)
    .map((a) => {
      const pending = a.id === 'a1' ? toGradeA1 : a.submitted - a.graded
      return { a, pending }
    })
    .filter((x) => x.pending > 0)
  const totalToGrade = queue.reduce((n, q) => n + q.pending, 0)

  return (
    <>
      <PageHead
        title={`Good morning, ${p.short}`}
        sub={`You have ${today.length} sessions today and ${totalToGrade} submissions waiting for marks. Teaching week ${TEACHING_WEEK}.`}
        actions={
          <>
            <Link className="btn secondary" to="/lecturer/announcements">
              <Megaphone size={16} /> Post announcement
            </Link>
            <Link className="btn" to="/lecturer/gradebook">
              <ClipboardCheck size={16} /> Open gradebook
            </Link>
          </>
        }
      />

      <div className="live-banner">
        <LiveBadge label="Live now" />
        <div className="grow">
          <h3>
            {liveCourse.code} Lecture {live.lectureNo}: {live.title}
          </h3>
          <p>
            {live.room}, {live.mode.toLowerCase()}. {live.attendees} students joined, started at {live.start}.
          </p>
        </div>
        <button className="btn gold" onClick={() => nav(`/lecturer/live/${liveSessionId}`)}>
          <Radio size={16} /> Open live class
        </button>
      </div>

      <div className="metrics">
        <Metric label="Students taught" value={taught} foot={`Across ${myCourses.length} courses this semester`} />
        <Metric label="Submissions to mark" value={totalToGrade} foot={<>Assignment 2 has {toGradeA1} waiting</>} />
        <Metric label="Average attendance" value={avgAttendance} unit="%" foot={<><span className="delta-down">1 pt lower</span> than last week</>} />
        <Metric label="Students needing support" value={atRisk.length} foot={`${atRisk.filter((s) => s.risk === 'High').length} high, ${atRisk.filter((s) => s.risk === 'Medium').length} medium in WIA2004`} />
      </div>

      <div className="grid g-main-side">
        <div className="stack">
          <Panel title="Today’s teaching" sub="Wednesday, 21 October" bodyClass="panel-body tight">
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
                          <div className="row wrap" style={{ gap: 8 }}>
                            <strong>{c.code}</strong>
                            <span className="muted small">{c.title}</span>
                          </div>
                          <div className="small" style={{ marginTop: 2 }}>
                            {s.title}
                          </div>
                          <div className="xs muted" style={{ marginTop: 2 }}>
                            {s.room === 'Online' ? 'Online class' : `${s.room}, ${s.mode.toLowerCase()}`}
                          </div>
                        </div>
                        {s.status === 'live' ? (
                          <Link className="btn sm gold" to={`/lecturer/live/${s.id}`}>
                            Open live class
                          </Link>
                        ) : (
                          <Link className="btn sm secondary" to={`/lecturer/courses/${c.id}`}>
                            Prepare materials
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Panel>

          <Panel
            title="Marking queue"
            sub="Submissions waiting for your marks"
            action={
              <Link className="link-btn" to="/lecturer/gradebook">
                Open gradebook
              </Link>
            }
            bodyClass="panel-body tight"
          >
            <div className="list">
              {queue.map(({ a, pending }) => {
                const c = courseById(a.courseId)!
                const pct = a.submitted ? Math.round(((a.submitted - pending) / a.submitted) * 100) : 0
                return (
                  <div key={a.id} className="list-item clickable" onClick={() => nav('/lecturer/gradebook')}>
                    <div className="icon-tile" style={{ background: c.color + '18', color: c.color }}>
                      <ClipboardCheck size={18} />
                    </div>
                    <div className="grow">
                      <div className="title truncate">{a.title}</div>
                      <div className="sub">
                        {c.code}, {a.submitted} of {c.enrolled} submitted, {fmtDue(a.due)}
                      </div>
                      <div style={{ maxWidth: 260, marginTop: 6 }}>
                        <Bar value={pct} thin color={c.color} />
                      </div>
                    </div>
                    <Badge tone="amber">{pending} to mark</Badge>
                  </div>
                )
              })}
            </div>
          </Panel>
        </div>

        <div className="stack">
          <Panel
            title="Students needing support"
            sub="WIA2004, based on attendance and marks"
            action={
              <Link className="link-btn" to="/lecturer/insights">
                View insights
              </Link>
            }
            bodyClass="panel-body tight"
          >
            <div className="list">
              {atRisk
                .sort((a, b) => (a.risk === b.risk ? a.attendance - b.attendance : a.risk === 'High' ? -1 : 1))
                .slice(0, 5)
                .map((s) => (
                  <div key={s.id} className="list-item">
                    <Avatar name={s.name} color={s.color} size="sm" />
                    <div className="grow">
                      <div className="title truncate">{s.name}</div>
                      <div className="sub">
                        Attendance {s.attendance}%, quiz average {s.quizAvg}%
                      </div>
                    </div>
                    <Badge tone={riskTone(s.risk)}>{s.risk}</Badge>
                  </div>
                ))}
            </div>
          </Panel>

          <Panel title="Recent activity" bodyClass="panel-body tight">
            <div className="list">
              {state.activity.slice(0, 6).map((a) => (
                <div key={a.id} className="list-item">
                  <div className="icon-tile sm">{activityIcon[a.kind]}</div>
                  <div className="grow">
                    <div className="title small">{a.text}</div>
                    <div className="sub xs">{a.sub}</div>
                  </div>
                  <span className="xs muted num">{a.time}</span>
                </div>
              ))}
            </div>
          </Panel>

          {a1 && (
            <div className="notice">
              <AlertTriangle size={16} />
              <div>
                <strong>{a1.title}</strong> closes {daysLeft(a1.due).toLowerCase()}. {courseById('wia2004')!.enrolled - a1.submitted} students have not submitted yet.
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
