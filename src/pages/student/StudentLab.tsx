import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CheckCircle2, Circle, Clock, FlaskConical, Hand, Lock, Play, Save, Send, Terminal } from 'lucide-react'
import { Avatar, Badge, Empty, Notice, PageHead, Panel, Ring } from '../../components/ui'
import { actionOf, limitOf, progressOf, totalMarks, type DrivenLab, type LiveAssignment } from '../../data/labs'
import { useDemo } from '../../store/DemoStore'
import { colorOf, fmtLab, nameOf, useLabClock } from '../lecturer/labClock'
import { DEMO_ID, labFor, runningWithoutMe, viewersOf } from './labAccess'
import '../../styles/lecturer.css'
import '../../styles/student-lab.css'

/*
  The student's lab screen (live assignment). Steps and instructions on the left, progress and the terminal
  on the right. Every step the student completes shows on the lecturer's live monitor straight away
  (shared demo data, synced across browser tabs). When the lecturer ends the assignment, or time runs out,
  the lab is submitted automatically and locked.
*/

export default function StudentLab() {
  const { id } = useParams()
  const { state } = useDemo()
  const a = labFor(state.liveAssignments, id)

  const notMine = !a ? runningWithoutMe(state.liveAssignments) : undefined
  if (!a && notMine) {
    return (
      <>
        <PageHead title="Live lab" sub={`${notMine.courseCode}: ${notMine.template.title}`} />
        <Panel>
          <Empty icon={<FlaskConical size={28} />} title="Your lab isn’t set up yet">
            Labs are set up for the students marked present. Ask your lecturer to mark you present in Attendance, and your lab opens here straight away.
          </Empty>
        </Panel>
      </>
    )
  }
  if (!a) {
    return (
      <>
        <PageHead title="Live lab" sub="Hands-on tasks your lecturer starts during a live class." />
        <Panel>
          <Empty icon={<FlaskConical size={28} />} title="No live lab right now">
            When your lecturer starts a live assignment in class, your own lab appears here with the steps to follow. <Link to="/student">Back to home</Link>
          </Empty>
        </Panel>
      </>
    )
  }
  return <LabScreen key={a.id} a={a} />
}

function LabScreen({ a }: { a: LiveAssignment }) {
  const { update, toast } = useDemo()
  const viewers = viewersOf(a)
  const [who, setWho] = useState(viewers.includes(DEMO_ID) ? DEMO_ID : viewers[0])
  // If the demo participant's lab is added later (marked present after the start), show it.
  const hadDemo = useRef(viewers.includes(DEMO_ID))
  useEffect(() => {
    if (viewers.includes(DEMO_ID) && !hadDemo.current) {
      hadDemo.current = true
      setWho(DEMO_ID)
    }
  }, [viewers])
  const t = useLabClock(a)
  const steps = a.template.steps
  const n = steps.length
  const running = a.status === 'running'
  const d: DrivenLab | undefined = a.driven?.[who]
  const p = progressOf(a, who, t)
  const done = d ? d.done : running ? 0 : p.done
  const left = limitOf(a) - t
  const earned = steps.slice(0, done).reduce((x, s) => x + s.marks, 0)
  const mark = a.status === 'released' ? a.marks[who] : undefined
  const [busy, setBusy] = useState(false)
  const [typed, setTyped] = useState('')
  const termRef = useRef<HTMLDivElement>(null)

  const patchMe = (fn: (cur: DrivenLab) => DrivenLab) =>
    update((s) => ({
      ...s,
      liveAssignments: s.liveAssignments.map((x) => {
        if (x.id !== a.id || x.status !== 'running') return x
        const cur = x.driven?.[who] ?? { done: 0, at: t, log: [] }
        return { ...x, driven: { ...(x.driven ?? {}), [who]: fn(cur) } }
      }),
    }))

  // Opening the lab starts it for this student (shows as Working on the lecturer's monitor).
  useEffect(() => {
    if (running && !a.driven?.[who]) patchMe((c) => ({ ...c, at: t, log: [`Welcome, ${nameOf(who).split(' ')[0]}. This lab is yours alone: ${a.template.environment}.`, 'Follow the steps on the left. Your work is saved as you go.'] }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [who, running])

  useEffect(() => {
    termRef.current?.scrollTo({ top: termRef.current.scrollHeight })
  }, [d?.log.length, typed])

  const current = steps[done]
  const act = current ? actionOf(current) : null

  const doStep = () => {
    if (!running || !current || !act || busy) return
    setBusy(true)
    const text = act.kind === 'run' ? act.command : `Saving ${act.command === 'answer.md' ? 'answer.md' : 'your work'}…`
    let i = 0
    const typer = setInterval(() => {
      i++
      setTyped(text.slice(0, i))
      if (i >= text.length) {
        clearInterval(typer)
        setTimeout(() => {
          const out = act.kind === 'run' ? [`$ ${act.command}`, act.output] : [`✎ ${current.title}`, act.output, 'Saved.']
          patchMe((c) => ({ ...c, done: c.done + 1, at: t, help: false, log: [...c.log, ...out.filter(Boolean), `✓ Step ${done + 1} done: ${current.title} (${current.marks} marks)`] }))
          setTyped('')
          setBusy(false)
          if (done + 1 >= n) toast('All steps done. You can keep checking your work until the lecturer ends the lab.')
        }, 500)
      }
    }, 28)
  }

  const askHelp = () => {
    patchMe((c) => ({ ...c, help: !c.help, log: [...c.log, c.help ? 'Help request cancelled.' : '✋ Help requested. Your lecturer can see it on the live monitor.'] }))
    toast(d?.help ? 'Help request cancelled.' : 'Your lecturer has been told you need help.', 'info')
  }

  const log = d?.log ?? (running ? [] : steps.slice(0, p.done).map((s) => s.evidence))

  return (
    <>
      <PageHead
        crumbs={
          <>
            <Link to="/student">Home</Link> <span>/</span> <span>Live lab</span>
          </>
        }
        title={a.template.title}
        sub={`${a.courseCode}, started ${a.startedAt}. Your own lab: ${a.template.environment}.`}
        actions={
          viewers.length > 1 ? (
            <label className="lab-viewas">
              <span className="xs muted">Demo: lab of</span>
              <select className="select sm" value={who} onChange={(e) => setWho(e.target.value)}>
                {viewers.map((v) => (
                  <option key={v} value={v}>
                    {nameOf(v)}
                  </option>
                ))}
              </select>
            </label>
          ) : undefined
        }
      />

      {running ? (
        <div className={`lab-status ${left < 5 ? 'urgent' : ''}`}>
          <span className="lab-who">
            <Avatar name={nameOf(who)} color={colorOf(who)} size="sm" />
            <span>
              <strong className="small">{nameOf(who)}</strong>
              <span className="xs muted">{who === DEMO_ID ? 'Demo participant' : 'Student'}</span>
            </span>
          </span>
          <span className="lab-status-time">
            <Clock size={18} /> <strong className="num">{fmtLab(left)}</strong> left
          </span>
          <div className="grow">
            <div className="cap-bar">
              <i style={{ width: `${(done / n) * 100}%`, background: done >= n ? 'var(--green)' : 'var(--primary)' }} />
            </div>
            <span className="xs muted">
              {done} of {n} steps done, {earned} of {totalMarks(a.template)} marks so far
            </span>
          </div>
          <button className={`btn sm ${d?.help ? 'gold' : 'secondary'}`} onClick={askHelp}>
            <Hand size={15} /> {d?.help ? 'Help requested' : 'Ask for help'}
          </button>
        </div>
      ) : (
        <div className="att-banner ok" style={{ marginBottom: 18 }}>
          <Lock size={18} />
          <div className="grow">
            <strong>Submitted automatically at {a.endedAt}.</strong> {a.endedBy === 'time' ? 'Time ran out' : 'Your lecturer ended the lab'}, so your work was handed in and the lab was shut down. {done} of {n} steps done.
            {mark && (
              <>
                {' '}
                <strong>
                  Your mark: {mark.mark}/{totalMarks(a.template)}
                </strong>
                {mark.feedback ? `. Feedback: “${mark.feedback}”` : ''}
              </>
            )}
            {a.status === 'ended' && ' Marks appear here when your lecturer releases them.'}
          </div>
        </div>
      )}

      <div className="lab-grid">
        <Panel title="Steps" sub="Follow them in order" className="lab-steps">
          <ol className="lab-step-list">
            {steps.map((s, i) => {
              const isDone = i < done
              const isNow = i === done && running
              return (
                <li key={s.id} className={isDone ? 'done' : isNow ? 'now' : ''}>
                  <span className="lab-step-ico">{isDone ? <CheckCircle2 size={18} /> : isNow ? <Play size={14} /> : <Circle size={16} />}</span>
                  <div className="grow">
                    <div className="row between" style={{ gap: 8 }}>
                      <strong className="small">
                        {i + 1}. {s.title}
                      </strong>
                      <span className="xs muted nowrap">{s.marks} marks</span>
                    </div>
                    {(isNow || isDone) && <p className="small" style={{ margin: '4px 0 0' }}>{s.detail}</p>}
                    {isNow && act && (
                      <button className="btn sm mt-1" onClick={doStep} disabled={busy}>
                        {act.kind === 'run' ? (
                          <>
                            <Terminal size={14} /> Run <code>{act.command}</code>
                          </>
                        ) : (
                          <>
                            <Save size={14} /> Save and continue
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
        </Panel>

        <div className="stack">
          <Panel title="Your progress">
            <div className="lab-progress">
              <Ring value={Math.round((done / n) * 100)} label={<strong>{done}/{n}</strong>} color={done >= n ? 'var(--green)' : 'var(--primary)'} />
              <div className="grow">
                <div className="row wrap" style={{ gap: 6 }}>
                  <Badge tone={!running ? 'teal' : done >= n ? 'green' : d?.help ? 'amber' : 'blue'}>{!running ? 'Submitted' : done >= n ? 'All steps done' : d?.help ? 'Waiting for help' : 'Working'}</Badge>
                  {running && <Badge>{fmtLab(left)} left</Badge>}
                </div>
                <p className="small" style={{ margin: '8px 0 0' }}>
                  {!running ? 'This lab is closed. You can still read your work below.' : done >= n ? 'Every step is done. Your work is submitted automatically when the lab ends.' : `Next: step ${done + 1}, ${current?.title}.`}
                </p>
                <p className="xs muted" style={{ margin: '4px 0 0' }}>
                  Your lecturer sees each step you finish on the live monitor.
                </p>
              </div>
            </div>
          </Panel>

          <div className={`lab-term ${running ? '' : 'locked'}`}>
            <div className="la-term-bar">
              <span />
              <span />
              <span />
              <em>
                {nameOf(who).split(' ')[0].toLowerCase()}@lab-{a.courseCode.toLowerCase()}: ~/lab
              </em>
            </div>
            <div className="lab-term-body" ref={termRef}>
              {log.map((line, i) => (
                <pre key={i} className={line.startsWith('✓') ? 'ok' : line.startsWith('✋') ? 'warn' : line.startsWith('$') ? 'cmd' : ''}>
                  {line}
                </pre>
              ))}
              {running && (
                <div className="lab-prompt">
                  <span>$</span> {typed}
                  <span className="lab-caret" />
                </div>
              )}
              {!running && <pre className="warn">Lab submitted and shut down at {a.endedAt}.</pre>}
            </div>
            {running && act && (
              <form
                className="lab-term-input"
                onSubmit={(e) => {
                  e.preventDefault()
                  doStep()
                }}
              >
                <span>$</span>
                <input value={act.kind === 'run' ? act.command : `save ${act.command}`} readOnly aria-label="Next command" />
                <button className="btn xs gold" type="submit" disabled={busy}>
                  <Send size={12} /> Enter
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
      <div className="mt-2">
        <Notice>Demo lab. In production this is a real, isolated cloud workspace with a code editor and terminal, started for you when the lecturer begins the assignment and closed when it ends.</Notice>
      </div>
    </>
  )
}

// small export for other student pages
export function useStudentLab() {
  const { state } = useDemo()
  return useMemo(() => labFor(state.liveAssignments), [state.liveAssignments])
}
