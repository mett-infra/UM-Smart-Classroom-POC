import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Clock, Download, Eye, FlaskConical, Plus, Search, Send, Square, TimerReset, Wand2 } from 'lucide-react'
import { Avatar, Badge, Bar, Empty, Metric, Modal, Notice, PageHead, Panel, Seg, type Tone } from '../../components/ui'
import { limitOf, progressOf, suggestedMark, totalMarks, type LabState, type LiveAssignment, type StudentProgress } from '../../data/labs'
import { useDemo } from '../../store/DemoStore'
import { downloadCsv } from './lecturerUtils'
import { lecSessions } from './attendanceData'
import { useLecAttendance, useNow } from './useLecAttendance'
import { LiveAssignmentSetup } from './LiveAssignmentSetup'
import { colorOf, fmtLab, idNoOf, nameOf, useLabActions, useLabClock } from './labClock'
import '../../styles/lecturer.css'

/*
  Live assignments (lecturer): start one from a class, watch every student's lab live,
  end it (all work is submitted automatically), then review and give marks.
*/

const stateTone: Record<LabState, Tone> = { Starting: '', Working: 'blue', 'Needs help': 'amber', Reconnecting: 'red', Finished: 'green', Submitted: 'teal' }

export default function LiveAssignments() {
  const { id } = useParams()
  const { state } = useDemo()
  const a = state.liveAssignments.find((x) => x.id === id)
  if (id && !a) {
    return (
      <Panel>
        <Empty icon={<FlaskConical size={28} />} title="This live assignment isn’t on this device">
          It may have been cleared with Reset demo data. <Link to="/lecturer/live-assignments">See all live assignments</Link>
        </Empty>
      </Panel>
    )
  }
  return a ? <AssignmentView key={a.id} a={a} /> : <AssignmentList />
}

function AssignmentList() {
  const { state } = useDemo()
  const nav = useNavigate()
  const now = useNow()
  const sess = lecSessions[0]
  const att = useLecAttendance(sess, now)
  const [setup, setSetup] = useState(false)
  const names = useMemo(() => Object.fromEntries(att.people.map((p) => [p.id, p.name])), [att.people])
  const list = state.liveAssignments

  return (
    <>
      <PageHead
        title="Live assignments"
        sub="Give the class a hands-on task with one lab per student, watch everyone’s progress live, then mark the work."
        actions={
          <button className="btn" onClick={() => setSetup(true)}>
            <Plus size={16} /> New live assignment
          </button>
        }
      />
      {list.length === 0 ? (
        <Panel>
          <Empty icon={<FlaskConical size={28} />} title="No live assignments yet">
            Start one from your live class with the <strong>Live assignment</strong> button, or click <strong>New live assignment</strong> here. Labs are set up for the students marked present in {sess.code} {sess.label}.
          </Empty>
        </Panel>
      ) : (
        <Panel title="Your live assignments" bodyClass="panel-body tight">
          <div className="list">
            {list.map((x) => (
              <div key={x.id} className="list-item clickable" onClick={() => nav(`/lecturer/live-assignments/${x.id}`)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && nav(`/lecturer/live-assignments/${x.id}`)}>
                <span className="icon-tile" style={{ background: 'var(--gold-50)', color: 'var(--gold-600)' }}>
                  <FlaskConical size={18} />
                </span>
                <div className="grow">
                  <div className="title">{x.template.title}</div>
                  <div className="sub">
                    {x.courseCode}, {x.studentIds.length} labs, started {x.startedAt}
                    {x.endedAt ? `, ended ${x.endedAt}` : ''}
                  </div>
                </div>
                <Badge tone={x.status === 'running' ? 'live' : x.status === 'ended' ? 'amber' : 'green'}>{x.status === 'running' ? 'Running' : x.status === 'ended' ? 'To mark' : 'Marks released'}</Badge>
              </div>
            ))}
          </div>
        </Panel>
      )}
      {setup && (
        <LiveAssignmentSetup
          sessionId={sess.id}
          courseCode={sess.code}
          studentIds={att.present.map((p) => p.id)}
          names={names}
          onClose={() => setSetup(false)}
          onTakeAttendance={() => nav('/lecturer/attendance')}
          onStarted={(nid) => {
            setSetup(false)
            nav(`/lecturer/live-assignments/${nid}`)
          }}
        />
      )}
    </>
  )
}

function AssignmentView({ a }: { a: LiveAssignment }) {
  const t = useLabClock(a)
  const rows = useMemo(() => a.studentIds.map((id) => ({ id, p: progressOf(a, id, t) })), [a, t])
  return a.status === 'running' ? <Monitor a={a} t={t} rows={rows} /> : <Review a={a} rows={rows} />
}

type Row = { id: string; p: StudentProgress }

function Monitor({ a, t, rows }: { a: LiveAssignment; t: number; rows: Row[] }) {
  const act = useLabActions()
  const [filter, setFilter] = useState<'all' | 'help' | 'working' | 'finished'>('all')
  const [q, setQ] = useState('')
  const [view, setView] = useState<string | null>(null)
  const [confirmEnd, setConfirmEnd] = useState(false)
  const n = a.template.steps.length
  const limit = limitOf(a)
  const left = limit - t
  const finished = rows.filter((r) => r.p.state === 'Finished').length
  const help = rows.filter((r) => r.p.state === 'Needs help').length
  const reconnecting = rows.filter((r) => r.p.state === 'Reconnecting').length
  const avg = Math.round((rows.reduce((s, r) => s + r.p.done, 0) / Math.max(1, rows.length * n)) * 100)
  const shown = rows.filter(
    (r) =>
      (filter === 'all' || (filter === 'help' && (r.p.state === 'Needs help' || r.p.state === 'Reconnecting')) || (filter === 'working' && (r.p.state === 'Working' || r.p.state === 'Starting')) || (filter === 'finished' && r.p.state === 'Finished')) &&
      (!q || `${nameOf(r.id)} ${idNoOf(r.id)}`.toLowerCase().includes(q.toLowerCase())),
  )

  return (
    <>
      <PageHead
        crumbs={
          <>
            <Link to="/lecturer/live-assignments">Live assignments</Link> <span>/</span> <span>Live</span>
          </>
        }
        title={a.template.title}
        sub={`${a.courseCode}, ${a.studentIds.length} labs, started ${a.startedAt}. ${a.template.environment}.`}
        actions={
          <>
            <button className="btn secondary" onClick={() => act.addTime(a, 10)}>
              <TimerReset size={16} /> Add 10 minutes
            </button>
            <button className="btn danger" onClick={() => setConfirmEnd(true)}>
              <Square size={14} fill="currentColor" /> End assignment
            </button>
          </>
        }
      />

      <div className="la-clock">
        <div>
          <span className="xs muted">Time left</span>
          <strong className={`num ${left < 5 ? 'c-red' : ''}`}>{fmtLab(left)}</strong>
          <span className="xs muted">
            of {limit} minutes{a.extraMin ? ` (${a.extraMin} added)` : ''}
          </span>
        </div>
        <div className="grow">
          <div className="cap-bar">
            <i style={{ width: `${(t / limit) * 100}%`, background: left < 5 ? 'var(--red)' : 'var(--primary)', transition: 'width 1s linear' }} />
          </div>
          <p className="xs muted" style={{ marginTop: 6 }}>
            When time runs out, every lab is submitted automatically and shut down.
          </p>
        </div>
        <div>
          <div className="xs strong" style={{ marginBottom: 6 }}>
            Demo speed
          </div>
          <Seg value={String(a.speed) as '1' | '20'} onChange={(v) => act.setSpeed(a, Number(v))} options={[{ id: '20', label: 'Fast (20x)' }, { id: '1', label: 'Real time' }]} />
        </div>
      </div>

      <div className="metrics m-5">
        <Metric label="Labs running" value={rows.length - finished} foot={`Of ${rows.length} students`} />
        <Metric label="Average progress" value={avg} unit="%" foot={`${n} steps each`} />
        <Metric label="Finished every step" value={finished} foot="Can still improve until the end" />
        <Metric label="Need help" value={help} foot={<span className={help ? 'delta-down' : ''}>No progress for 6+ minutes</span>} />
        <Metric label="Reconnecting" value={reconnecting} foot="Lab connection dropped, retrying" />
      </div>

      <div className="grid g-main-side">
        <Panel title="Students" sub="Updates live from each student’s lab" bodyClass="panel-body tight">
          <div className="lat-tools">
            <div className="search-field">
              <Search size={15} />
              <input className="input sm" placeholder="Find a student" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Find a student" />
            </div>
            <Seg
              value={filter}
              onChange={setFilter}
              options={[
                { id: 'all', label: 'All' },
                { id: 'help', label: `Need help (${help + reconnecting})` },
                { id: 'working', label: 'Working' },
                { id: 'finished', label: 'Finished' },
              ]}
            />
          </div>
          <div className="table-wrap">
            <table className="table la-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Lab</th>
                  <th>Now on</th>
                  <th style={{ minWidth: 140 }}>Progress</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {shown.map(({ id, p }) => (
                  <tr key={id} className={p.state === 'Needs help' ? 'la-help' : ''}>
                    <td>
                      <div className="cell-person">
                        <Avatar name={nameOf(id)} color={colorOf(id)} size="sm" />
                        <div>
                          <strong>{nameOf(id)}</strong>
                          <span>{idNoOf(id)}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge tone={stateTone[p.state]}>{p.state}</Badge>
                      <div className="xs muted nowrap" style={{ marginTop: 3 }}>
                        {p.state === 'Starting' ? 'Opening the lab' : `Last step ${fmtAgo(t - p.lastActivityMin)}`}
                      </div>
                    </td>
                    <td style={{ minWidth: 170, maxWidth: 260 }}>
                      <div className="small strong">{p.done >= n ? 'All steps done' : `Step ${p.done + 1} of ${n}`}</div>
                      {p.done < n && <div className="xs muted truncate">{a.template.steps[p.done].title}</div>}
                    </td>
                    <td>
                      <div className="row" style={{ gap: 8 }}>
                        <div className="grow">
                          <Bar value={(p.done / n) * 100} thin color={p.state === 'Needs help' ? 'var(--amber)' : p.done >= n ? 'var(--green)' : undefined} />
                        </div>
                        <span className="xs num">
                          {p.done}/{n}
                        </span>
                      </div>
                    </td>
                    <td>
                      <button className="btn xs secondary" onClick={() => setView(id)}>
                        <Eye size={13} /> View lab
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {shown.length === 0 && <Empty title="No students match" />}
          </div>
        </Panel>

        <div className="stack">
          <Panel title="Progress by step" sub="How many students have finished each step">
            <div className="la-funnel">
              {a.template.steps.map((s, i) => {
                const c = rows.filter((r) => r.p.done > i).length
                return (
                  <div key={s.id}>
                    <div className="row between small">
                      <span className="truncate">
                        {i + 1}. {s.title}
                      </span>
                      <span className="num muted">
                        {c}/{rows.length}
                      </span>
                    </div>
                    <Bar value={(c / Math.max(1, rows.length)) * 100} thin />
                  </div>
                )
              })}
            </div>
          </Panel>
          {help > 0 && (
            <Panel title="Students who may need help" sub="No new step for 6 minutes or more" bodyClass="panel-body tight">
              <div className="list">
                {rows
                  .filter((r) => r.p.state === 'Needs help')
                  .slice(0, 6)
                  .map((r) => (
                    <div key={r.id} className="list-item clickable" onClick={() => setView(r.id)}>
                      <Avatar name={nameOf(r.id)} color={colorOf(r.id)} size="sm" />
                      <div className="grow">
                        <div className="title small">{nameOf(r.id)}</div>
                        <div className="sub xs">
                          Stuck on step {r.p.done + 1}: {a.template.steps[r.p.done]?.title}
                        </div>
                      </div>
                      <AlertTriangle size={15} className="c-gold" />
                    </div>
                  ))}
              </div>
            </Panel>
          )}
        </div>
      </div>
      <div className="mt-2">
        <Notice>Simulated labs for this demo. In production each lab is an isolated cloud workspace started for the student, and its progress comes from the checks built into the assessment.</Notice>
      </div>

      {view && <LabViewer a={a} id={view} p={rows.find((r) => r.id === view)!.p} onClose={() => setView(null)} />}
      <Modal
        open={confirmEnd}
        onClose={() => setConfirmEnd(false)}
        title="End the assignment for everyone?"
        sub={`${rows.length} labs will be submitted automatically, as they are now, and then shut down.`}
        foot={
          <>
            <button className="btn secondary" onClick={() => setConfirmEnd(false)}>
              Keep it running
            </button>
            <button
              className="btn danger"
              onClick={() => {
                act.end(a)
                setConfirmEnd(false)
              }}
            >
              End and submit all
            </button>
          </>
        }
      >
        <p className="small">
          {finished} of {rows.length} students have finished every step. {fmtLab(left)} minutes are left.
        </p>
      </Modal>
    </>
  )
}

const fmtAgo = (min: number) => (min < 1 ? 'just now' : `${Math.floor(min)} min ago`)

function LabViewer({ a, id, p, onClose }: { a: LiveAssignment; id: string; p: StudentProgress; onClose: () => void }) {
  const steps = a.template.steps
  return (
    <Modal open wide onClose={onClose} title={`${nameOf(id)}’s lab`} sub={`${idNoOf(id)}. lab-${a.courseCode.toLowerCase()}-${id.slice(-4)}. ${a.template.environment}.`}>
      <div className="la-viewer">
        <ol className="la-checklist">
          {steps.map((s, i) => (
            <li key={s.id} className={i < p.done ? 'done' : i === p.done && a.status === 'running' ? 'now' : ''}>
              {i < p.done ? <CheckCircle2 size={16} /> : i === p.done && a.status === 'running' ? <Clock size={16} /> : <span className="la-dot" />}
              <div>
                <strong className="small">
                  {i + 1}. {s.title}
                </strong>
                <span className="xs muted">
                  {i < p.done ? `Done, ${s.marks} marks` : i === p.done && a.status === 'running' ? (p.state === 'Needs help' ? 'Working on it, no progress for a while' : 'Working on it now') : 'Not started'}
                </span>
              </div>
            </li>
          ))}
        </ol>
        <div className="la-term" aria-label="Lab terminal">
          <div className="la-term-bar">
            <span />
            <span />
            <span />
            <em>Terminal, view only</em>
          </div>
          <pre>
            {steps
              .slice(0, p.done)
              .map((s) => s.evidence)
              .join('\n\n') || '$ Lab started. Waiting for the student’s first command…'}
            {a.status === 'running' && p.done < steps.length ? '\n\n$ ▍' : ''}
          </pre>
        </div>
      </div>
    </Modal>
  )
}

function Review({ a, rows }: { a: LiveAssignment; rows: Row[] }) {
  const act = useLabActions()
  const max = totalMarks(a.template)
  const [open, setOpen] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const marked = rows.filter((r) => a.marks[r.id] !== undefined).length
  const finishedAll = rows.filter((r) => r.p.done >= a.template.steps.length).length
  const avg = marked ? Math.round((rows.reduce((s, r) => s + (a.marks[r.id]?.mark ?? 0), 0) / marked) * 10) / 10 : 0
  const released = a.status === 'released'
  const shown = rows.filter((r) => !q || `${nameOf(r.id)} ${idNoOf(r.id)}`.toLowerCase().includes(q.toLowerCase()))

  const useSuggested = () => {
    const m: Record<string, { mark: number; feedback: string }> = {}
    rows.filter((r) => a.marks[r.id] === undefined).forEach((r) => (m[r.id] = { mark: suggestedMark(a, r.p), feedback: '' }))
    act.setMarks(a, m)
  }

  const exportCsv = () =>
    downloadCsv(`live-assignment_${a.courseCode}_${a.id}.csv`, [
      ['Student', 'Matric', 'Steps done', 'Suggested mark', 'Mark', 'Out of', 'Feedback'],
      ...rows.map((r) => [nameOf(r.id), idNoOf(r.id), `${r.p.done}/${a.template.steps.length}`, suggestedMark(a, r.p), a.marks[r.id]?.mark ?? '', max, a.marks[r.id]?.feedback ?? '']),
    ])

  return (
    <>
      <PageHead
        crumbs={
          <>
            <Link to="/lecturer/live-assignments">Live assignments</Link> <span>/</span> <span>Review</span>
          </>
        }
        title={a.template.title}
        sub={`${a.courseCode}. Ended ${a.endedAt ?? ''} ${a.endedBy === 'time' ? 'when the time ran out' : 'by you'}. Every lab was submitted automatically.`}
        actions={
          <>
            <button className="btn secondary" onClick={exportCsv}>
              <Download size={16} /> Export CSV
            </button>
            {!released && (
              <button className="btn secondary" onClick={useSuggested} disabled={marked === rows.length}>
                <Wand2 size={16} /> Use suggested marks
              </button>
            )}
            {!released && (
              <button className="btn" onClick={() => act.release(a)} disabled={marked < rows.length}>
                <Send size={16} /> Release marks
              </button>
            )}
          </>
        }
      />
      {released ? (
        <div className="att-banner ok" style={{ marginBottom: 18 }}>
          <CheckCircle2 size={18} />
          <div className="grow">
            <strong>Marks released.</strong> Students can see their mark and your feedback.
          </div>
        </div>
      ) : (
        <div className="att-banner info" style={{ marginBottom: 18 }}>
          <FlaskConical size={18} />
          <div className="grow">
            <strong>
              {marked} of {rows.length} marked.
            </strong>{' '}
            Suggested marks give full marks for each completed step and half marks for a step that was started. Change any mark before you release.
          </div>
        </div>
      )}

      <div className="metrics">
        <Metric label="Submitted" value={rows.length} foot="Automatically, when the assignment ended" />
        <Metric label="Finished every step" value={finishedAll} foot={`${Math.round((finishedAll / Math.max(1, rows.length)) * 100)}% of the class`} />
        <Metric label="Marked" value={`${marked}/${rows.length}`} foot={released ? 'Released to students' : 'Not released yet'} />
        <Metric label="Average mark" value={marked ? avg : 'n/a'} foot={`Out of ${max}`} />
      </div>

      <Panel
        title="Submissions"
        sub={`Out of ${max} marks`}
        action={
          <div className="search-field" style={{ width: 220 }}>
            <Search size={15} />
            <input className="input sm" placeholder="Find a student" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Find a student" />
          </div>
        }
        bodyClass="table-wrap"
      >
        <table className="table la-table">
          <thead>
            <tr>
              <th>Student</th>
              <th style={{ minWidth: 110 }}>Steps done</th>
              <th className="num col-sugg">Suggested</th>
              <th>Mark</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {shown.map(({ id, p }) => {
              const m = a.marks[id]
              return (
                <tr key={id}>
                  <td>
                    <div className="cell-person">
                      <Avatar name={nameOf(id)} color={colorOf(id)} size="sm" />
                      <div>
                        <strong>{nameOf(id)}</strong>
                        <span>{idNoOf(id)}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="row" style={{ gap: 8 }}>
                      <div className="grow">
                        <Bar value={(p.done / a.template.steps.length) * 100} thin color={p.done >= a.template.steps.length ? 'var(--green)' : undefined} />
                      </div>
                      <span className="xs num">
                        {p.done}/{a.template.steps.length}
                      </span>
                    </div>
                  </td>
                  <td className="num small col-sugg">{suggestedMark(a, p)}</td>
                  <td>
                    <div className="row" style={{ gap: 6 }}>
                      <input
                        className="input sm la-mark"
                        type="number"
                        min={0}
                        max={max}
                        value={m?.mark ?? ''}
                        placeholder="–"
                        disabled={released}
                        aria-label={`Mark for ${nameOf(id)}`}
                        onChange={(e) => e.target.value !== '' && act.setMark(a, id, Math.max(0, Math.min(max, Number(e.target.value))))}
                      />
                      <span className="xs muted">/ {max}</span>
                    </div>
                  </td>
                  <td>
                    <button className="btn xs secondary" onClick={() => setOpen(id)}>
                      <Eye size={13} /> {released ? 'View' : 'Review'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Panel>

      {open && <SubmissionModal a={a} id={open} p={rows.find((r) => r.id === open)!.p} onClose={() => setOpen(null)} />}
    </>
  )
}

function SubmissionModal({ a, id, p, onClose }: { a: LiveAssignment; id: string; p: StudentProgress; onClose: () => void }) {
  const act = useLabActions()
  const max = totalMarks(a.template)
  const released = a.status === 'released'
  const [mark, setMark] = useState(String(a.marks[id]?.mark ?? suggestedMark(a, p)))
  const [feedback, setFeedback] = useState(a.marks[id]?.feedback ?? '')
  return (
    <Modal
      open
      wide
      onClose={onClose}
      title={`${nameOf(id)}’s submission`}
      sub={`${idNoOf(id)}. ${p.done} of ${a.template.steps.length} steps done. Submitted automatically at ${a.endedAt ?? ''}.`}
      foot={
        released ? (
          <button className="btn" onClick={onClose}>
            Close
          </button>
        ) : (
          <>
            <button className="btn secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn"
              onClick={() => {
                act.setMark(a, id, Math.max(0, Math.min(max, Number(mark) || 0)), feedback)
                onClose()
              }}
            >
              Save mark
            </button>
          </>
        )
      }
    >
      <div className="la-viewer">
        <ol className="la-checklist">
          {a.template.steps.map((s, i) => (
            <li key={s.id} className={i < p.done ? 'done' : ''}>
              {i < p.done ? <CheckCircle2 size={16} /> : <span className="la-dot" />}
              <div>
                <strong className="small">
                  {i + 1}. {s.title}
                </strong>
                <span className="xs muted">{i < p.done ? `${s.marks} of ${s.marks} marks` : i === p.done ? `Started, not finished (${s.marks} marks)` : `Not done (${s.marks} marks)`}</span>
              </div>
            </li>
          ))}
        </ol>
        <div className="la-term">
          <div className="la-term-bar">
            <span />
            <span />
            <span />
            <em>Submitted work</em>
          </div>
          <pre>
            {a.template.steps
              .slice(0, p.done)
              .map((s) => s.evidence)
              .join('\n\n') || 'No completed steps.'}
          </pre>
        </div>
      </div>
      <div className="grid g-2 mt-2" style={{ gap: 12 }}>
        <div className="field">
          <label htmlFor="la-m">
            Mark (suggested {suggestedMark(a, p)} of {max})
          </label>
          <input id="la-m" className="input" type="number" min={0} max={max} value={mark} disabled={released} onChange={(e) => setMark(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="la-f">Feedback for the student</label>
          <input id="la-f" className="input" value={feedback} disabled={released} onChange={(e) => setFeedback(e.target.value)} placeholder="e.g. Good safety check. Explain why P1 goes first." />
        </div>
      </div>
    </Modal>
  )
}
