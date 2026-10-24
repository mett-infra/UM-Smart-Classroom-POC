import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CheckCircle2, ChevronDown, Circle, Download, MessageCircle, PlayCircle, Radio } from 'lucide-react'
import { courseById, lecturerName, liveSessionId, recordings, TEACHING_WEEK } from '../../data/mock'
import type { Material } from '../../data/types'
import { Avatar, Badge, Modal, PageHead, Panel, Ring, Tabs, daysLeft, fmtDate, fmtDue, statusTone } from '../../components/ui'
import { useDemo } from '../../store/DemoStore'
import NotFound from '../NotFound'
import { MaterialIcon, materialLabel, materialTint } from '../lecturer/lecturerUtils'
import { CoverPattern } from '../lecturer/LecturerCourses'

type Tab = 'content' | 'assess' | 'recordings' | 'discussion' | 'about'

export default function StudentCourse() {
  const { courseId = '' } = useParams()
  const c = courseById(courseId)
  const { state, update, toast } = useDemo()
  const [tab, setTab] = useState<Tab>('content')
  const [openWeek, setOpenWeek] = useState<number>(TEACHING_WEEK)
  const [viewing, setViewing] = useState<Material | null>(null)
  const [post, setPost] = useState('')
  const [threads, setThreads] = useState([
    { id: 1, who: 'Tan Jia Hui', text: 'For Assignment 2, should the program read input from a file or from the keyboard?', replies: 3, time: '2 h ago', answered: true },
    { id: 2, who: 'Arjun a/l Krishnan', text: 'Can someone explain why the safe sequence in the slides starts with P1?', replies: 5, time: 'Yesterday', answered: false },
  ])
  if (!c) return <NotFound />

  const extra = state.extraMaterials[c.id] ?? []
  const modules = c.modules.map((m) => ({ ...m, items: [...m.items, ...extra.filter((e) => e.week === m.week)] }))
  const all = modules.flatMap((m) => m.items)
  const isDone = (i: Material) => !!(i.done || state.completed[i.id])
  const progress = Math.round((all.filter(isDone).length / all.length) * 100)
  const mine = state.assignments.filter((a) => a.courseId === c.id)
  const recs = recordings.filter((r) => r.courseId === c.id)
  const isLiveCourse = c.id === 'wia2004'

  const toggleDone = (i: Material) => {
    if (i.done) return
    update((s) => ({ ...s, completed: { ...s.completed, [i.id]: !s.completed[i.id] } }))
  }

  return (
    <>
      <PageHead
        crumbs={
          <>
            <Link to="/student/courses">My courses</Link> <span>/</span> <span>{c.code}</span>
          </>
        }
        title={`${c.code} ${c.title}`}
        sub={`${lecturerName(c.lecturerId)}, ${c.credits} credits, ${c.faculty}`}
        actions={
          isLiveCourse ? (
            <Link to={`/student/live/${liveSessionId}`} className="btn">
              <Radio size={16} /> Join live class
            </Link>
          ) : undefined
        }
      />

      <div className="course-hero" style={{ background: c.color }}>
        <CoverPattern />
        <div className="grow" style={{ position: 'relative' }}>
          <p style={{ maxWidth: '60ch' }}>{c.description}</p>
          <div className="row wrap mt-1" style={{ gap: 8 }}>
            {c.schedule.map((s) => (
              <span key={s.day + s.start} className="hero-chip">
                {['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'][s.day]} {s.start}, {s.kind}, {s.room}
              </span>
            ))}
          </div>
        </div>
        <div className="course-hero-ring">
          <Ring value={progress} size={84} color="#fff" />
          <span>Your progress</span>
        </div>
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'content', label: 'Content' },
          { id: 'assess', label: <>Assessments <Badge>{mine.length}</Badge></> },
          { id: 'recordings', label: 'Recordings' },
          { id: 'discussion', label: 'Discussion' },
          { id: 'about', label: 'About' },
        ]}
      />

      {tab === 'content' && (
        <div className="stack">
          {modules.map((m) => {
            const open = openWeek === m.week
            const done = m.items.filter(isDone).length
            return (
              <section key={m.id} className={`panel module-panel ${m.week === TEACHING_WEEK ? 'current' : ''}`}>
                <button className="module-head" onClick={() => setOpenWeek(open ? 0 : m.week)} aria-expanded={open}>
                  <span className="module-week">Week {m.week}</span>
                  <span className="grow strong">{m.title}</span>
                  {m.week === TEACHING_WEEK && <Badge tone="gold">This week</Badge>}
                  <span className="xs muted num hide-sm">
                    {done} of {m.items.length} done
                  </span>
                  <ChevronDown size={18} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
                </button>
                {open && (
                  <div className="list">
                    {m.items.map((i) => (
                      <div key={i.id} className="list-item">
                        <button className="done-btn" onClick={() => toggleDone(i)} aria-label={isDone(i) ? 'Completed' : 'Mark as done'} title={isDone(i) ? 'Completed' : 'Mark as done'}>
                          {isDone(i) ? <CheckCircle2 size={20} color="var(--green)" /> : <Circle size={20} color="var(--line-strong)" />}
                        </button>
                        <span className="icon-tile sm" style={{ background: materialTint[i.type].bg, color: materialTint[i.type].fg }}>
                          <MaterialIcon type={i.type} size={16} />
                        </span>
                        <div className="grow">
                          <div className="title truncate">{i.title}</div>
                          <div className="sub">
                            {materialLabel[i.type]}, {i.meta}
                          </div>
                        </div>
                        <button className="btn xs secondary" onClick={() => setViewing(i)}>
                          Open
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )
          })}
        </div>
      )}

      {tab === 'assess' && (
        <Panel bodyClass="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Assessment</th>
                <th>Due</th>
                <th className="num">Weight</th>
                <th>Status</th>
                <th className="num">Score</th>
              </tr>
            </thead>
            <tbody>
              {mine.map((a) => (
                <tr key={a.id}>
                  <td>
                    <Link to={`/student/assignments?open=${a.id}`} className="strong">
                      {a.title}
                    </Link>
                    <div className="xs muted">{a.kind}</div>
                  </td>
                  <td>
                    {fmtDue(a.due)}
                    <div className="xs muted">{a.status === 'Graded' ? 'Closed' : daysLeft(a.due)}</div>
                  </td>
                  <td className="num">{a.weight}%</td>
                  <td>
                    <Badge tone={statusTone(a.status)}>{a.status}</Badge>
                  </td>
                  <td className="num strong">{a.score !== undefined ? `${a.score}%` : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}

      {tab === 'recordings' && (
        <Panel bodyClass="panel-body tight">
          <div className="list">
            {recs.length === 0 && <p className="small muted" style={{ padding: '8px 20px' }}>No recordings yet for this course.</p>}
            {recs.map((r) => (
              <Link key={r.id} to={`/student/recordings?play=${r.id}`} className="list-item clickable" style={{ textDecoration: 'none', color: 'inherit' }}>
                <span className="icon-tile" style={{ background: 'var(--red-50)', color: 'var(--red)' }}>
                  <PlayCircle size={18} />
                </span>
                <div className="grow">
                  <div className="title">{r.title}</div>
                  <div className="sub">
                    {fmtDate(r.date)}, {r.duration}
                  </div>
                </div>
                {r.captions && <Badge tone="blue">Captions EN, BM</Badge>}
              </Link>
            ))}
          </div>
        </Panel>
      )}

      {tab === 'discussion' && (
        <div className="grid g-main-side">
          <Panel title="Course discussion" sub="Ask classmates and the teaching team." bodyClass="panel-body tight">
            <div className="list">
              {threads.map((t) => (
                <div key={t.id} className="list-item" style={{ alignItems: 'flex-start' }}>
                  <Avatar name={t.who} size="sm" />
                  <div className="grow">
                    <div className="strong small">{t.who}</div>
                    <p className="small" style={{ margin: '2px 0 6px' }}>
                      {t.text}
                    </p>
                    <span className="xs muted row" style={{ gap: 6 }}>
                      <MessageCircle size={13} /> {t.replies} replies, {t.time}
                      {t.answered && <Badge tone="green">Lecturer answered</Badge>}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Start a thread">
            <textarea className="textarea" value={post} onChange={(e) => setPost(e.target.value)} placeholder="What would you like to ask?" />
            <button
              className="btn block mt-2"
              disabled={!post.trim()}
              onClick={() => {
                setThreads((t) => [{ id: Date.now(), who: 'Aina Sofea binti Rahman', text: post.trim(), replies: 0, time: 'Just now', answered: false }, ...t])
                setPost('')
                toast('Thread posted to the course discussion.')
              }}
            >
              Post thread
            </button>
          </Panel>
        </div>
      )}

      {tab === 'about' && (
        <Panel title="About this course">
          <dl className="kv">
            <dt>Lecturer</dt>
            <dd>{lecturerName(c.lecturerId)}</dd>
            <dt>Department</dt>
            <dd>{c.department}</dd>
            <dt>Credits</dt>
            <dd>{c.credits}</dd>
            <dt>Assessment</dt>
            <dd>Coursework 60%, final examination 40%</dd>
            <dt>Consultation</dt>
            <dd>Thursday 15:00 to 16:00, online or in the department</dd>
          </dl>
        </Panel>
      )}

      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        wide
        title={viewing?.title ?? ''}
        sub={viewing ? `${c.code}, ${materialLabel[viewing.type]}, ${viewing.meta}` : ''}
        foot={
          <>
            <button className="btn secondary" onClick={() => toast('Download started (sample file).', 'info')}>
              <Download size={15} /> Download
            </button>
            <button
              className="btn"
              onClick={() => {
                if (viewing && !isDone(viewing)) toggleDone(viewing)
                toast('Marked as done. Your progress is updated.')
                setViewing(null)
              }}
            >
              Mark as done
            </button>
          </>
        }
      >
        {viewing && (
          <div className="viewer">
            <div className="viewer-page" style={{ borderTopColor: c.color }}>
              <span className="xs muted">
                {c.code}, week {modules.find((m) => m.items.some((i) => i.id === viewing.id))?.week}
              </span>
              <h3>{viewing.title.replace(/^(Lecture \d+: |Recording: |Reading: |Quick check: )/, '')}</h3>
              <div className="viewer-lines">
                <span style={{ width: '92%' }} />
                <span style={{ width: '84%' }} />
                <span style={{ width: '88%' }} />
                <span style={{ width: '60%' }} />
              </div>
              <p className="xs muted mt-2">Preview of a sample file. In production this opens the real material from the course library.</p>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
