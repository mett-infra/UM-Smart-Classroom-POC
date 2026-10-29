import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BookOpen, CaptionsOff, Captions, ClipboardPlus, PlayCircle, Plus, Radio, Search, UploadCloud } from 'lucide-react'
import { PageHead, Panel, Badge, Avatar, Bar, Modal, Empty, Tabs, riskTone, statusTone, fmtDue, fmtDate } from '../../components/ui'
import { courseById, lecturerName, liveSessionId, recordings, roster, sessions, TEACHING_WEEK } from '../../data/mock'
import type { Assignment, MaterialType } from '../../data/types'
import { useDemo } from '../../store/DemoStore'
import { MaterialIcon, materialLabel, materialTint, nextSlot } from './lecturerUtils'
import '../../styles/lecturer.css'

type Tab = 'content' | 'assignments' | 'students' | 'recordings'
const types: MaterialType[] = ['slides', 'pdf', 'video', 'quiz', 'lab', 'link']

export default function LecturerCourse() {
  const { courseId = '' } = useParams()
  const course = courseById(courseId)
  const { state, update, log, toast } = useDemo()
  const [tab, setTab] = useState<Tab>('content')
  const [addOpen, setAddOpen] = useState(false)
  const [asgOpen, setAsgOpen] = useState(false)
  const [q, setQ] = useState('')

  // add material form
  const [mTitle, setMTitle] = useState('')
  const [mType, setMType] = useState<MaterialType>('slides')
  const [mWeek, setMWeek] = useState(TEACHING_WEEK)
  const [mFile, setMFile] = useState<string | null>(null)
  const [over, setOver] = useState(false)

  // create assignment form
  const [aTitle, setATitle] = useState('')
  const [aKind, setAKind] = useState<Assignment['kind']>('Assignment')
  const [aDue, setADue] = useState('2026-11-06')
  const [aWeight, setAWeight] = useState(10)
  const [aBrief, setABrief] = useState('')

  if (!course) {
    return (
      <div className="panel">
        <Empty icon={<BookOpen size={28} />} title="Course not found">
          <Link to="/lecturer/courses">Back to my courses</Link>
        </Empty>
      </div>
    )
  }

  const extras = state.extraMaterials[course.id] ?? []
  const asg = state.assignments.filter((a) => a.courseId === course.id)
  const recs = recordings.filter((r) => r.courseId === course.id)
  const next = nextSlot(course)
  const isLive = sessions.some((s) => s.courseId === course.id && s.status === 'live')
  const students = roster.filter((s) => !q || `${s.name} ${s.matric}`.toLowerCase().includes(q.toLowerCase()))

  const resetMaterial = () => {
    setMTitle('')
    setMType('slides')
    setMWeek(TEACHING_WEEK)
    setMFile(null)
  }

  const addMaterial = () => {
    const title = mTitle.trim() || mFile?.replace(/\.[^.]+$/, '') || ''
    if (!title) {
      toast('Add a title or choose a file first.', 'warn')
      return
    }
    const meta = mFile ? `${mFile}, added just now` : 'Added just now'
    update((s) => ({
      ...s,
      extraMaterials: {
        ...s.extraMaterials,
        [course.id]: [...(s.extraMaterials[course.id] ?? []), { id: `x${Date.now()}`, type: mType, title, meta, week: mWeek }],
      },
    }))
    log({ text: `${materialLabel[mType]} added to ${course.code}`, sub: `Week ${mWeek}: ${title}`, kind: 'material' })
    toast(`Added “${title}” to week ${mWeek}. Students can see it now.`)
    setAddOpen(false)
    resetMaterial()
  }

  const createAssignment = () => {
    if (!aTitle.trim()) {
      toast('Give the assessment a title first.', 'warn')
      return
    }
    const a: Assignment = {
      id: `a${Date.now()}`,
      courseId: course.id,
      title: aTitle.trim(),
      kind: aKind,
      due: `${aDue}T23:59`,
      weight: aWeight,
      status: 'Not started',
      submitted: 0,
      graded: 0,
      brief: aBrief.trim() || 'Brief to follow.',
    }
    update((s) => ({ ...s, assignments: [a, ...s.assignments] }))
    log({ text: `${aKind} created in ${course.code}`, sub: a.title, kind: 'material' })
    toast(`Created “${a.title}”. ${course.enrolled} students notified.`)
    setAsgOpen(false)
    setATitle('')
    setABrief('')
  }

  return (
    <>
      <PageHead
        crumbs={
          <>
            <Link to="/lecturer/courses">My courses</Link> / <span>{course.code}</span>
          </>
        }
        title={
          <>
            {course.code} {course.title}
          </>
        }
        sub={`${course.enrolled} students, ${course.credits} credits. ${next ? `Next class ${next.label}, ${next.slot.room}.` : ''}`}
        actions={
          <>
            {isLive && (
              <Link className="btn gold" to={`/lecturer/live/${liveSessionId}`}>
                <Radio size={16} /> Open live class
              </Link>
            )}
            <button className="btn secondary" onClick={() => setAsgOpen(true)}>
              <ClipboardPlus size={16} /> Create assessment
            </button>
            <button className="btn" onClick={() => setAddOpen(true)}>
              <Plus size={16} /> Add material
            </button>
          </>
        }
      />

      <div className="metrics">
        <div className="metric">
          <div className="metric-label">Attendance</div>
          <div className="metric-value">
            {course.attendance}
            <small>%</small>
          </div>
          <div className="metric-foot">Class average this semester</div>
        </div>
        <div className="metric">
          <div className="metric-label">Engagement</div>
          <div className="metric-value">{course.engagement}</div>
          <div className="metric-foot">Views, chat and quiz activity</div>
        </div>
        <div className="metric">
          <div className="metric-label">Average mark</div>
          <div className="metric-value">
            {course.avgGrade}
            <small>%</small>
          </div>
          <div className="metric-foot">Graded coursework so far</div>
        </div>
        <div className="metric">
          <div className="metric-label">Materials</div>
          <div className="metric-value">{course.modules.reduce((n, m) => n + m.items.length, 0) + extras.length}</div>
          <div className="metric-foot">{extras.length ? `${extras.length} added this session` : 'Across all weeks'}</div>
        </div>
      </div>

      <Tabs<Tab>
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'content', label: 'Content' },
          { id: 'assignments', label: <>Assessments <Badge>{asg.length}</Badge></> },
          { id: 'students', label: <>Students <Badge>{course.enrolled}</Badge></> },
          { id: 'recordings', label: 'Recordings' },
        ]}
      />

      {tab === 'content' && (
        <div className="stack">
          {[...course.modules].reverse().map((m) => {
            const added = extras.filter((x) => x.week === m.week)
            const items = [...m.items, ...added]
            const now = m.week === TEACHING_WEEK
            return (
              <Panel
                key={m.id}
                title={
                  <span className="lec-week-head">
                    <span className={`lec-week-num ${now ? 'now' : ''}`}>{m.week}</span>
                    {m.title}
                    {now && <Badge tone="gold">This week</Badge>}
                    {m.week > TEACHING_WEEK && <Badge>Scheduled</Badge>}
                  </span>
                }
                action={
                  <button
                    className="btn ghost sm"
                    onClick={() => {
                      setMWeek(m.week)
                      setAddOpen(true)
                    }}
                  >
                    <Plus size={15} /> Add to week {m.week}
                  </button>
                }
                bodyClass="panel-body tight"
              >
                <div className="list">
                  {items.map((it) => (
                    <div key={it.id} className="list-item">
                      <div className="icon-tile sm" style={{ background: materialTint[it.type].bg, color: materialTint[it.type].fg }}>
                        <MaterialIcon type={it.type} size={16} />
                      </div>
                      <div className="grow">
                        <div className="title truncate">{it.title}</div>
                        <div className="sub">
                          {materialLabel[it.type]}, {it.meta}
                        </div>
                      </div>
                      {added.some((x) => x.id === it.id) ? <Badge tone="green">New</Badge> : m.week > TEACHING_WEEK ? <Badge>Hidden until week {m.week}</Badge> : <Badge tone="blue">Published</Badge>}
                    </div>
                  ))}
                </div>
              </Panel>
            )
          })}
        </div>
      )}

      {tab === 'assignments' && (
        <Panel
          title="Assessments"
          sub="Coursework set for this course"
          action={
            <button className="btn sm" onClick={() => setAsgOpen(true)}>
              <ClipboardPlus size={15} /> Create assessment
            </button>
          }
          bodyClass=""
        >
          {asg.length === 0 ? (
            <Empty title="No assessments yet">Create one to start collecting submissions.</Empty>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Assessment</th>
                    <th>Due</th>
                    <th className="num">Weight</th>
                    <th>Submitted</th>
                    <th className="num">Marked</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {asg.map((a) => {
                    const marked = a.id === 'a1' ? Object.keys(state.marks.a1 ?? {}).length : a.graded
                    const pct = Math.round((a.submitted / course.enrolled) * 100)
                    return (
                      <tr key={a.id}>
                        <td>
                          <strong>{a.title}</strong>
                          <div className="xs muted">{a.kind}</div>
                        </td>
                        <td className="small">{fmtDue(a.due)}</td>
                        <td className="num">{a.weight}%</td>
                        <td style={{ minWidth: 150 }}>
                          <div className="small num">
                            {a.submitted} of {course.enrolled}
                          </div>
                          <Bar value={pct} thin color={course.color} />
                        </td>
                        <td className="num">{marked}</td>
                        <td>
                          <Badge tone={a.status === 'Graded' ? 'green' : a.submitted > marked ? 'amber' : 'blue'}>{a.status === 'Graded' ? 'Marks released' : a.submitted > marked ? 'Marking' : 'Open'}</Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}

      {tab === 'students' && (
        <Panel
          title="Class list"
          sub={`Showing ${students.length} of ${course.enrolled} enrolled students in this sample`}
          action={
            <div className="search-field" style={{ width: 240 }}>
              <Search size={15} />
              <input className="input sm" placeholder="Search name or matric" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search students" />
            </div>
          }
          bodyClass=""
        >
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Programme</th>
                  <th className="num">Attendance</th>
                  <th className="num">Quiz average</th>
                  <th>Last active</th>
                  <th>Support</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div className="cell-person">
                        <Avatar name={s.name} color={s.color} size="sm" />
                        <div>
                          <strong>{s.name}</strong>
                          <span>{s.matric}</span>
                        </div>
                      </div>
                    </td>
                    <td className="small">{s.programme}</td>
                    <td className="num" style={{ color: s.attendance < 70 ? 'var(--red)' : undefined, fontWeight: s.attendance < 70 ? 700 : undefined }}>
                      {s.attendance}%
                    </td>
                    <td className="num">{s.quizAvg}%</td>
                    <td className="small muted">{s.lastActive}</td>
                    <td>
                      <Badge tone={riskTone(s.risk)}>{s.risk === 'Low' ? 'On track' : `${s.risk} risk`}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {students.length === 0 && <Empty title="No students match your search" />}
          </div>
        </Panel>
      )}

      {tab === 'recordings' && (
        <Panel title="Lecture recordings" sub="Captured automatically in hybrid rooms" bodyClass="panel-body tight">
          {recs.length === 0 ? (
            <Empty icon={<PlayCircle size={28} />} title="No recordings yet">
              Recordings appear here after each hybrid session ends.
            </Empty>
          ) : (
            <div className="list">
              {recs.map((r) => (
                <div key={r.id} className="list-item">
                  <div className="icon-tile" style={{ background: 'var(--red-50)', color: 'var(--red)' }}>
                    <PlayCircle size={18} />
                  </div>
                  <div className="grow">
                    <div className="title truncate">{r.title}</div>
                    <div className="sub">
                      {fmtDate(r.date)}, {r.duration}, {r.views} views
                    </div>
                  </div>
                  {r.captions ? (
                    <Badge tone="green">
                      <Captions size={13} /> Captions EN, BM
                    </Badge>
                  ) : (
                    <button className="btn secondary xs" onClick={() => toast(`Captions requested for “${r.title}”. Ready in about 10 minutes.`, 'info')}>
                      <CaptionsOff size={13} /> Generate captions
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add material"
        sub={`${course.code}, published to enrolled students`}
        foot={
          <>
            <button className="btn secondary" onClick={() => setAddOpen(false)}>
              Cancel
            </button>
            <button className="btn" onClick={addMaterial}>
              Add to week {mWeek}
            </button>
          </>
        }
      >
        <div
          className={`dropzone ${over ? 'over' : ''}`}
          role="button"
          tabIndex={0}
          onClick={() => setMFile(`Lecture${mWeek}_${course.code}_notes.pdf`)}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setMFile(`Lecture${mWeek}_${course.code}_notes.pdf`)}
          onDragOver={(e) => {
            e.preventDefault()
            setOver(true)
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setOver(false)
            const f = e.dataTransfer.files?.[0]
            setMFile(f ? f.name : `Lecture${mWeek}_${course.code}_notes.pdf`)
          }}
        >
          <UploadCloud size={28} />
          {mFile ? (
            <>
              <strong style={{ color: 'var(--ink)' }}>{mFile}</strong>
              <div className="xs">Ready to add. The file stays in your browser in this demo.</div>
            </>
          ) : (
            <>
              <strong style={{ color: 'var(--ink)' }}>Drop a file here or click to choose</strong>
              <div className="xs">Slides, PDF, video or lab sheet up to 500 MB</div>
            </>
          )}
        </div>
        <div className="field mt-2">
          <label htmlFor="m-title">Title</label>
          <input id="m-title" className="input" placeholder="e.g. Lecture 15: Main memory" value={mTitle} onChange={(e) => setMTitle(e.target.value)} />
        </div>
        <div className="field">
          <label>Type</label>
          <div className="lec-type-grid">
            {types.map((t) => (
              <button key={t} type="button" className={`lec-type ${mType === t ? 'on' : ''}`} onClick={() => setMType(t)}>
                <MaterialIcon type={t} size={16} /> {materialLabel[t]}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <label htmlFor="m-week">Week</label>
          <select id="m-week" className="select" value={mWeek} onChange={(e) => setMWeek(Number(e.target.value))}>
            {course.modules.map((m) => (
              <option key={m.week} value={m.week}>
                Week {m.week}: {m.title}
              </option>
            ))}
          </select>
        </div>
      </Modal>

      <Modal
        open={asgOpen}
        onClose={() => setAsgOpen(false)}
        title="Create assessment"
        sub={`${course.code}, ${course.enrolled} students will be notified`}
        foot={
          <>
            <button className="btn secondary" onClick={() => setAsgOpen(false)}>
              Cancel
            </button>
            <button className="btn" onClick={createAssignment}>
              Create assessment
            </button>
          </>
        }
      >
        <div className="field">
          <label htmlFor="a-title">Title</label>
          <input id="a-title" className="input" placeholder="e.g. Assignment 3: Page replacement" value={aTitle} onChange={(e) => setATitle(e.target.value)} />
        </div>
        <div className="grid g-3" style={{ gap: 12 }}>
          <div className="field">
            <label htmlFor="a-kind">Type</label>
            <select id="a-kind" className="select" value={aKind} onChange={(e) => setAKind(e.target.value as Assignment['kind'])}>
              <option>Assignment</option>
              <option>Quiz</option>
              <option>Lab report</option>
              <option>Project</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="a-due">Due date</label>
            <input id="a-due" type="date" className="input" value={aDue} onChange={(e) => setADue(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="a-w">Weight (%)</label>
            <input id="a-w" type="number" min={0} max={100} className="input" value={aWeight} onChange={(e) => setAWeight(Number(e.target.value))} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="a-brief">Brief</label>
          <textarea id="a-brief" className="textarea" placeholder="What should students hand in?" value={aBrief} onChange={(e) => setABrief(e.target.value)} />
        </div>
        <div className="xs muted">
          Set by {lecturerName(course.lecturerId)}. Status starts as <Badge tone={statusTone('Not started')}>Open</Badge>
        </div>
      </Modal>
    </>
  )
}
