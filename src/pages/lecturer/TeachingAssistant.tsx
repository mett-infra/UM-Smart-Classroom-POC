import { useEffect, useRef, useState, type ReactNode } from 'react'
import { BookPlus, CalendarRange, Copy, Eye, EyeOff, FileText, Languages, ListChecks, Sparkles } from 'lucide-react'
import { PageHead, Panel, Badge, Notice } from '../../components/ui'
import { captionScript, transcript } from '../../data/mock'
import { useDemo } from '../../store/DemoStore'
import '../../styles/lecturer.css'

type Action = 'summary' | 'quiz' | 'plan' | 'captions'

const actions: { id: Action; title: string; sub: string; icon: ReactNode }[] = [
  { id: 'summary', title: 'Summarise the lecture', sub: 'Key points and a student-friendly recap', icon: <FileText size={18} /> },
  { id: 'quiz', title: 'Generate a quiz', sub: '5 multiple-choice questions with answers', icon: <ListChecks size={18} /> },
  { id: 'plan', title: 'Plan the next lecture', sub: 'A 60-minute outline for Lecture 15', icon: <CalendarRange size={18} /> },
  { id: 'captions', title: 'Suggest captions in BM', sub: 'Bahasa Melayu captions for key lines', icon: <Languages size={18} /> },
]

const quiz = [
  { q: 'Which set of conditions must all hold for a deadlock to occur?', opts: ['Mutual exclusion, hold and wait, no preemption, circular wait', 'Starvation, aging, preemption, priority inversion', 'Mutual exclusion, paging, swapping, thrashing', 'Hold and wait, busy waiting, spinlocks, semaphores'], a: 0 },
  { q: 'What does the Banker’s algorithm check before granting a request?', opts: ['That the request is smaller than the time quantum', 'That the system stays in a safe state afterwards', 'That no process holds more than one resource', 'That the wait-for graph has a cycle'], a: 1 },
  { q: 'A system is in a safe state when…', opts: ['No process is waiting', 'All resources are free', 'There is at least one order in which every process can finish', 'Every process holds its maximum claim'], a: 2 },
  { q: 'Deadlock detection usually relies on…', opts: ['A wait-for graph or detection algorithm run periodically', 'Disabling interrupts', 'Round robin scheduling', 'Increasing the page size'], a: 0 },
  { q: 'Which is a prevention strategy, not an avoidance strategy?', opts: ['Running the Banker’s algorithm on each request', 'Requiring processes to request resources in a fixed global order', 'Checking for a safe sequence', 'Simulating allocation before granting it'], a: 1 },
]

const plan = [
  { t: '0:00', what: 'Recap of Lecture 14: safe states and the Banker’s algorithm, with one worked example from the class poll.' },
  { t: '0:08', what: 'Introduce main memory: address binding, logical versus physical addresses.' },
  { t: '0:20', what: 'Contiguous allocation and fragmentation. Short think-pair-share for in-room and online students.' },
  { t: '0:32', what: 'Paging: page tables, frames and the TLB. Draw the translation on the whiteboard.' },
  { t: '0:48', what: 'Live poll: effective access time with a 90% TLB hit ratio.' },
  { t: '0:55', what: 'Wrap up, Assignment 2 reminder and preview of virtual memory.' },
]

function copyText(a: Action) {
  if (a === 'quiz') return quiz.map((x, i) => `${i + 1}. ${x.q}\n${x.opts.map((o, j) => `   ${'ABCD'[j]}. ${o}`).join('\n')}\n   Answer: ${'ABCD'[x.a]}`).join('\n\n')
  if (a === 'plan') return plan.map((p) => `${p.t}  ${p.what}`).join('\n')
  if (a === 'captions') return captionScript.map((c) => `${c.en}\n${c.bm}`).join('\n\n')
  return 'Deadlocks in one page: a deadlock needs mutual exclusion, hold and wait, no preemption and circular wait. Prevention breaks a condition, avoidance keeps the system in a safe state (Banker’s algorithm), detection finds cycles in a wait-for graph and recovers.'
}

export default function TeachingAssistant() {
  const { update, toast, log } = useDemo()
  const [active, setActive] = useState<Action | null>(null)
  const [loading, setLoading] = useState(false)
  const [showAnswers, setShowAnswers] = useState(false)
  const [added, setAdded] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  const run = (a: Action) => {
    setActive(a)
    setLoading(true)
    setShowAnswers(false)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setLoading(false), 600 + Math.round(Math.random() * 300))
  }

  const addQuiz = () => {
    update((s) => ({
      ...s,
      extraMaterials: {
        ...s.extraMaterials,
        wia2004: [...(s.extraMaterials.wia2004 ?? []), { id: `x${Date.now()}`, type: 'quiz', title: 'Practice quiz: Deadlocks', meta: '5 questions, generated from Lecture 14', week: 7 }],
      },
    }))
    log({ text: 'Practice quiz added to WIA2004', sub: 'Week 7: Deadlocks, 5 questions', kind: 'material' })
    toast('Practice quiz added to WIA2004, week 7.')
    setAdded(true)
  }

  const copy = (text: string) => {
    try {
      navigator.clipboard?.writeText(text)
    } catch {
      /* clipboard not available */
    }
    toast('Copied to clipboard.')
  }

  return (
    <>
      <PageHead title="AI teaching assistant" sub="Turn a lecture transcript into summaries, practice quizzes, lesson plans and captions." actions={<Badge tone="gold">Simulated AI</Badge>} />

      <Notice>
        This demo uses prepared sample responses. It does not call an AI model or send any data. In production, an approved AI service would work only over authorised lecture content, and every output would be reviewed by the lecturer before students see it.
      </Notice>

      <div className="grid g-2 mt-2">
        <Panel title="Source: WIA2004 Lecture 14" sub="Deadlocks: detection and avoidance, auto-transcribed" action={<Badge tone="blue">{transcript.length} segments</Badge>}>
          <div className="transcript">
            {transcript.map((t) => (
              <div key={t.t}>
                <time>{t.t}</time>
                <span>{t.text}</span>
              </div>
            ))}
          </div>
        </Panel>

        <div className="stack">
          <Panel title="What would you like to create?">
            <div className="ai-actions">
              {actions.map((a) => (
                <button key={a.id} className={`ai-action ${active === a.id ? 'on' : ''}`} onClick={() => run(a.id)}>
                  <div className="icon-tile sm">{a.icon}</div>
                  <div>
                    <strong>{a.title}</strong>
                    <span>{a.sub}</span>
                  </div>
                </button>
              ))}
            </div>
          </Panel>

          <Panel
            title={active ? actions.find((a) => a.id === active)!.title : 'Result'}
            sub={active ? 'Draft for your review' : undefined}
            action={
              active && !loading ? (
                <div className="row" style={{ gap: 8 }}>
                  {active === 'quiz' && (
                    <button className="btn ghost sm" onClick={() => setShowAnswers((v) => !v)}>
                      {showAnswers ? <EyeOff size={15} /> : <Eye size={15} />} {showAnswers ? 'Hide answers' : 'Show answers'}
                    </button>
                  )}
                  <button className="btn ghost sm" onClick={() => copy(copyText(active))}>
                    <Copy size={15} /> Copy
                  </button>
                </div>
              ) : undefined
            }
          >
            {!active && (
              <div className="empty" style={{ padding: '24px 8px' }}>
                <Sparkles size={26} />
                <strong>Pick an action to start</strong>
                Results appear here as an editable draft.
              </div>
            )}

            {active && loading && (
              <div className="skeleton" aria-label="Generating">
                <span style={{ width: '45%', height: 16 }} />
                <span style={{ width: '96%' }} />
                <span style={{ width: '88%' }} />
                <span style={{ width: '92%' }} />
                <span style={{ width: '70%' }} />
              </div>
            )}

            {active === 'summary' && !loading && (
              <div className="ai-out">
                <h3>Deadlocks in one page</h3>
                <p>A deadlock happens when each process in a group waits for something only another process in the group can release. It needs four conditions at once: mutual exclusion, hold and wait, no preemption and circular wait.</p>
                <ul>
                  <li>Prevention breaks one of the four conditions by design, for example by ordering resource requests.</li>
                  <li>Avoidance grants a request only if the system stays safe. The Banker’s algorithm checks for a safe sequence.</li>
                  <li>Detection allows deadlocks, finds them with a wait-for graph, then recovers by ending or preempting processes.</li>
                  <li>Assignment 2 asks students to implement the safety algorithm on three scenarios.</li>
                </ul>
              </div>
            )}

            {active === 'quiz' && !loading && (
              <div className="ai-out">
                {quiz.map((item, i) => (
                  <div className="mcq" key={i}>
                    <strong>
                      {i + 1}. {item.q}
                    </strong>
                    <ol>
                      {item.opts.map((o, j) => (
                        <li key={j} className={showAnswers && j === item.a ? 'correct' : ''}>
                          {o}
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
                <div className="row wrap" style={{ gap: 10 }}>
                  <button className="btn" onClick={addQuiz} disabled={added}>
                    <BookPlus size={16} /> {added ? 'Added to course' : 'Add quiz to course'}
                  </button>
                  <span className="xs muted">Adds a practice quiz to WIA2004, week 7</span>
                </div>
              </div>
            )}

            {active === 'plan' && !loading && (
              <div className="ai-out">
                <h3>Lecture 15: Main memory</h3>
                <p className="small muted">60 minutes, hybrid, DK2, FSKTM</p>
                <div className="mt-1">
                  {plan.map((p) => (
                    <div className="plan-step" key={p.t}>
                      <b>{p.t}</b>
                      <span>{p.what}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {active === 'captions' && !loading && (
              <div className="ai-out">
                {captionScript.map((c, i) => (
                  <div className="cap-pair" key={i}>
                    <p>{c.en}</p>
                    <p>{c.bm}</p>
                  </div>
                ))}
                <p className="xs muted">Check terminology with the faculty glossary before publishing.</p>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </>
  )
}
