import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, FileUp, FlaskConical, Plus, Server, Trash2 } from 'lucide-react'
import { Badge, Modal, Seg } from '../../components/ui'
import { labTemplates, stepsFromUpload, totalMarks, type LabTemplate, type LiveAssignment } from '../../data/labs'
import { nowLabel, useDemo } from '../../store/DemoStore'
import '../../styles/lecturer.css'

/*
  Start a live assignment: choose or upload the assessment, check its steps and time, then set up one lab
  environment for each student marked present. Labs are simulated in this demo.
*/

type Step = 'choose' | 'review' | 'provision'

export function LiveAssignmentSetup({
  sessionId,
  courseCode,
  studentIds,
  names,
  onStarted,
  onClose,
  onTakeAttendance,
}: {
  sessionId: string
  courseCode: string
  studentIds: string[]
  names: Record<string, string>
  onStarted: (id: string) => void
  onClose: () => void
  onTakeAttendance?: () => void
}) {
  const { update, toast, log } = useDemo()
  const [step, setStep] = useState<Step>('choose')
  const [tpl, setTpl] = useState<LabTemplate | null>(null)
  const [minutes, setMinutes] = useState('45')
  const [speed, setSpeed] = useState<'1' | '20'>('20')
  const [ready, setReady] = useState<Record<string, 'wait' | 'retry' | 'ok'>>({})
  // Freeze the class list while setting up, so attendance changes during set-up don't restart it.
  const frozen = useRef<string[] | null>(null)
  const ids = step === 'provision' && frozen.current ? frozen.current : studentIds
  const n = ids.length
  const okCount = Object.values(ready).filter((v) => v === 'ok').length
  const allReady = n > 0 && okCount === n

  const pick = (t: LabTemplate) => {
    setTpl(JSON.parse(JSON.stringify(t)) as LabTemplate)
    setMinutes(String(t.minutes))
    setStep('review')
  }

  // Provisioning: each lab becomes ready at its own time; a couple retry once.
  useEffect(() => {
    if (step !== 'provision') return
    const list = studentIds.slice()
    frozen.current = list
    const timers: number[] = []
    const start: Record<string, 'wait' | 'retry' | 'ok'> = {}
    list.forEach((id) => (start[id] = 'wait'))
    setReady(start)
    list.forEach((id, i) => {
      const h = (i * 2654435761) % 1000
      const at = 500 + (h / 1000) * 5200
      const retry = i % 41 === 7
      if (retry) {
        timers.push(window.setTimeout(() => setReady((r) => ({ ...r, [id]: 'retry' })), at))
        timers.push(window.setTimeout(() => setReady((r) => ({ ...r, [id]: 'ok' })), at + 2200))
      } else timers.push(window.setTimeout(() => setReady((r) => ({ ...r, [id]: 'ok' })), at))
    })
    return () => timers.forEach((t) => clearTimeout(t))
    // run once each time set-up starts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  const start = () => {
    if (!tpl) return
    const a: LiveAssignment = {
      id: `la-${Date.now().toString(36)}`,
      sessionId,
      courseCode,
      template: { ...tpl, minutes: Number(minutes) },
      studentIds: ids,
      status: 'running',
      speed: Number(speed),
      labMinAtMark: 0,
      markTs: Date.now(),
      extraMin: 0,
      startedAt: nowLabel(),
      marks: {},
    }
    update((s) => ({ ...s, liveAssignments: [a, ...s.liveAssignments] }))
    log({ text: `Live assignment started: ${tpl.title}`, sub: `${courseCode}, ${n} labs, ${minutes} minutes`, kind: 'submit' })
    toast(`Live assignment started. ${n} students can open their labs now.`)
    onStarted(a.id)
  }

  const editStep = (i: number, patch: Partial<LabTemplate['steps'][number]>) => setTpl((t) => (t ? { ...t, steps: t.steps.map((x, k) => (k === i ? { ...x, ...patch } : x)) } : t))

  const tiles = useMemo(() => ids.slice(0, 160), [ids])

  return (
    <Modal
      open
      wide
      onClose={onClose}
      title="Live assignment"
      sub={step === 'choose' ? 'Choose the assessment, or upload your own.' : step === 'review' ? 'Check the steps, marks and time.' : 'Setting up one lab for each student present.'}
      foot={
        step === 'choose' ? (
          <button className="btn secondary" onClick={onClose}>
            Cancel
          </button>
        ) : step === 'review' ? (
          <>
            <button className="btn secondary" onClick={() => setStep('choose')}>
              Back
            </button>
            <button className="btn" disabled={!tpl || tpl.steps.length === 0 || n === 0 || tpl.steps.some((s) => !s.title.trim())} onClick={() => setStep('provision')}>
              <Server size={15} /> Set up {n} labs
            </button>
          </>
        ) : (
          <>
            <button className="btn secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="btn" disabled={!allReady} onClick={start}>
              <FlaskConical size={15} /> Start the assignment
            </button>
          </>
        )
      }
    >
      <ol className="wiz-steps">
        {(['Assessment', 'Steps and time', 'Labs'] as const).map((label, i) => {
          const at = step === 'choose' ? 0 : step === 'review' ? 1 : 2
          return (
            <li key={label} className={i < at ? 'done' : i === at ? 'on' : ''}>
              <span>{i + 1}</span>
              {label}
            </li>
          )
        })}
      </ol>

      {n === 0 && (
        <div className="att-banner warn" style={{ marginBottom: 14 }}>
          <AlertTriangle size={18} />
          <div className="grow">
            <strong>No students are marked present yet.</strong> Labs are set up for the students marked present, so take attendance first.
          </div>
          {onTakeAttendance && (
            <button className="btn sm secondary" onClick={onTakeAttendance}>
              Take attendance
            </button>
          )}
        </div>
      )}

      {step === 'choose' && (
        <div className="stack" style={{ gap: 10 }}>
          {labTemplates
            .filter((t) => t.courseCode === courseCode)
            .map((t) => (
              <button key={t.id} className="la-tpl" onClick={() => pick(t)}>
                <span className="la-tpl-ico">
                  <FlaskConical size={18} />
                </span>
                <span className="grow">
                  <strong>{t.title}</strong>
                  <span>{t.summary}</span>
                  <span className="xs muted">
                    {t.steps.length} steps, {totalMarks(t)} marks, {t.minutes} minutes. {t.environment}.
                  </span>
                </span>
              </button>
            ))}
          <label className="face-drop la-upload">
            <FileUp size={24} />
            <strong>Upload your own assessment</strong>
            <span className="xs muted">PDF, Word, Markdown or a ZIP with starter files. The steps are read from the file for you to check.</span>
            <input type="file" accept=".pdf,.doc,.docx,.md,.txt,.zip" onChange={(e) => e.target.files?.[0] && pick(stepsFromUpload(e.target.files[0].name))} />
          </label>
        </div>
      )}

      {step === 'review' && tpl && (
        <div className="stack" style={{ gap: 14 }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="la-title">Title</label>
            <input id="la-title" className="input" value={tpl.title} onChange={(e) => setTpl({ ...tpl, title: e.target.value })} />
            {tpl.source && <p className="xs muted mt-1">Steps read from {tpl.source}. Edit anything that needs changing.</p>}
          </div>
          <div className="la-steps-edit">
            {tpl.steps.map((s, i) => (
              <div key={s.id} className="la-step-edit">
                <span className="la-step-n">{i + 1}</span>
                <input className="input sm grow" value={s.title} onChange={(e) => editStep(i, { title: e.target.value })} aria-label={`Step ${i + 1}`} />
                <input className="input sm la-marks" type="number" min={0} max={50} value={s.marks} onChange={(e) => editStep(i, { marks: Math.max(0, Number(e.target.value) || 0) })} aria-label={`Marks for step ${i + 1}`} />
                <span className="xs muted">marks</span>
                <button className="icon-btn sm" aria-label={`Remove step ${i + 1}`} disabled={tpl.steps.length <= 1} onClick={() => setTpl({ ...tpl, steps: tpl.steps.filter((_, k) => k !== i) })}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <button className="btn ghost sm" onClick={() => setTpl({ ...tpl, steps: [...tpl.steps, { id: `s${Date.now()}`, title: 'New step', detail: 'Describe what the student does.', marks: 2, evidence: 'Step completed' }] })}>
              <Plus size={14} /> Add a step
            </button>
          </div>
          <div className="la-settings">
            <div>
              <div className="xs strong" style={{ marginBottom: 6 }}>
                Time allowed
              </div>
              <Seg value={minutes} onChange={setMinutes} options={['30', '45', '60', '90'].map((m) => ({ id: m, label: `${m} min` }))} />
            </div>
            <div>
              <div className="xs strong" style={{ marginBottom: 6 }}>
                Demo speed
              </div>
              <Seg
                value={speed}
                onChange={setSpeed}
                options={[
                  { id: '20', label: 'Fast (20x)' },
                  { id: '1', label: 'Real time' },
                ]}
              />
            </div>
            <div className="la-total">
              <span className="xs muted">Total</span>
              <strong>{totalMarks(tpl)} marks</strong>
            </div>
          </div>
          <div className="la-env">
            <Server size={16} />
            <span className="small">
              <strong>
                {n} labs, one per student marked present.
              </strong>{' '}
              Each lab: {tpl.environment}, 2 vCPU and 4 GB, isolated from other students, and shut down when the assignment ends.
            </span>
          </div>
        </div>
      )}

      {step === 'provision' && (
        <div className="stack" style={{ gap: 12 }}>
          <div className="row between small">
            <strong>{allReady ? `${n} labs ready` : `Setting up labs… ${okCount} of ${n} ready`}</strong>
            {Object.values(ready).some((v) => v === 'retry') && <Badge tone="amber">Retrying a lab that didn’t start first time</Badge>}
          </div>
          <div className="cap-bar">
            <i style={{ width: `${n ? (okCount / n) * 100 : 0}%`, background: allReady ? 'var(--green)' : 'var(--primary)' }} />
          </div>
          <div className="la-tiles" aria-label="Lab environments">
            {tiles.map((id) => (
              <span key={id} className={`la-tile ${ready[id] ?? 'wait'}`} title={`${names[id] ?? id}: ${ready[id] === 'ok' ? 'ready' : ready[id] === 'retry' ? 'retrying' : 'starting'}`}>
                {(names[id] ?? '?')
                  .split(' ')
                  .filter((w) => /^[A-Z]/.test(w))
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join('')}
              </span>
            ))}
          </div>
          {allReady && (
            <div className="att-banner ok">
              <CheckCircle2 size={18} />
              <div className="grow">
                <strong>Every lab is ready.</strong> When you start, students see “Open your lab” and the {minutes}-minute timer begins.
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
