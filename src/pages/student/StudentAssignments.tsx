import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ClipboardCheck, FileUp, Paperclip, X } from 'lucide-react'
import { courseById, studentCourseIds } from '../../data/mock'
import type { Assignment } from '../../data/types'
import { Badge, Empty, Modal, Notice, PageHead, Panel, Tabs, daysLeft, fmtDue, statusTone } from '../../components/ui'
import { useDemo } from '../../store/DemoStore'

type Tab = 'todo' | 'submitted' | 'graded'

export default function StudentAssignments() {
  const { state, update, toast, log } = useDemo()
  const [params, setParams] = useSearchParams()
  const [tab, setTab] = useState<Tab>('todo')
  const [openId, setOpenId] = useState<string | null>(params.get('open'))
  const [files, setFiles] = useState<string[]>([])
  const [note, setNote] = useState('')
  const [over, setOver] = useState(false)
  const [declare, setDeclare] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const mine = state.assignments.filter((a) => studentCourseIds.includes(a.courseId))
  const groups: Record<Tab, Assignment[]> = {
    todo: mine.filter((a) => a.status === 'Not started' || a.status === 'Draft' || a.status === 'Overdue').sort((a, b) => a.due.localeCompare(b.due)),
    submitted: mine.filter((a) => a.status === 'Submitted'),
    graded: mine.filter((a) => a.status === 'Graded'),
  }
  const current = mine.find((a) => a.id === openId) ?? null

  useEffect(() => {
    if (current) {
      setFiles(state.submissionFiles[current.id] ?? (current.status === 'Draft' ? ['bankers_simulator_v1.py'] : []))
      setNote('')
      setDeclare(current.status === 'Submitted')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openId])

  const close = () => {
    setOpenId(null)
    if (params.get('open')) setParams({}, { replace: true })
  }

  const addFiles = (list: FileList | null) => {
    if (!list) return
    // Only file names are kept. Files never leave the browser.
    setFiles((f) => [...f, ...Array.from(list).map((x) => x.name)])
  }

  const setStatus = (a: Assignment, status: Assignment['status']) => {
    update((s) => ({
      ...s,
      assignments: s.assignments.map((x) => (x.id === a.id ? { ...x, status, submitted: status === 'Submitted' && x.status !== 'Submitted' ? x.submitted + 1 : x.submitted } : x)),
      submissionFiles: { ...s.submissionFiles, [a.id]: files },
    }))
  }

  const submit = () => {
    if (!current) return
    if (files.length === 0) return toast('Attach at least one file before you submit.', 'warn')
    if (!declare) return toast('Confirm the academic integrity declaration to submit.', 'warn')
    setStatus(current, 'Submitted')
    log({ text: 'Assignment submitted', sub: `${courseById(current.courseId)?.code} ${current.title}`, kind: 'submit' })
    toast(`Submitted. Receipt sent to your university email.`)
    close()
    setTab('submitted')
  }

  const saveDraft = () => {
    if (!current) return
    setStatus(current, 'Draft')
    toast('Draft saved. You can come back to it before the deadline.', 'info')
    close()
  }

  const row = (a: Assignment) => {
    const c = courseById(a.courseId)!
    return (
      <div key={a.id} className="list-item clickable" onClick={() => setOpenId(a.id)}>
        <span className="icon-tile" style={{ background: `color-mix(in srgb, ${c.color} 12%, white)`, color: c.color }}>
          <ClipboardCheck size={18} />
        </span>
        <div className="grow">
          <div className="title">{a.title}</div>
          <div className="sub">
            {c.code} {c.title}, {a.kind.toLowerCase()}, {a.weight}% of the course
          </div>
        </div>
        <div className="hide-sm" style={{ textAlign: 'right' }}>
          <div className="small strong">{fmtDue(a.due)}</div>
          <div className="xs muted">{a.status === 'Graded' ? 'Graded' : daysLeft(a.due)}</div>
        </div>
        {a.status === 'Graded' ? <Badge tone="green">{a.score}%</Badge> : <Badge tone={statusTone(a.status)}>{a.status}</Badge>}
      </div>
    )
  }

  return (
    <>
      <PageHead title="Assignments" sub="Everything you need to hand in, across all your courses." />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'todo', label: <>To do <Badge tone="amber">{groups.todo.length}</Badge></> },
          { id: 'submitted', label: <>Submitted <Badge>{groups.submitted.length}</Badge></> },
          { id: 'graded', label: <>Graded <Badge>{groups.graded.length}</Badge></> },
        ]}
      />
      <Panel bodyClass="panel-body tight">
        {groups[tab].length === 0 ? (
          <Empty icon={<ClipboardCheck size={28} />} title={tab === 'todo' ? 'You’re all caught up' : 'Nothing here yet'}>
            {tab === 'todo' ? 'New assignments from your lecturers will appear here.' : 'Assignments move here once you submit them.'}
          </Empty>
        ) : (
          <div className="list">{groups[tab].map(row)}</div>
        )}
      </Panel>

      <Modal
        open={!!current}
        onClose={close}
        wide
        title={current?.title ?? ''}
        sub={current ? `${courseById(current.courseId)?.code}, due ${fmtDue(current.due)}, ${current.weight}% of the course` : ''}
        foot={
          current && current.status !== 'Graded' && current.status !== 'Submitted' ? (
            <>
              <button className="btn secondary" onClick={saveDraft}>
                Save draft
              </button>
              <button className="btn" onClick={submit}>
                Submit assignment
              </button>
            </>
          ) : current?.status === 'Submitted' ? (
            <>
              <button
                className="btn secondary"
                onClick={() => {
                  setStatus(current, 'Draft')
                  toast('Submission withdrawn. It is a draft again until you resubmit.', 'info')
                  close()
                }}
              >
                Withdraw and edit
              </button>
              <button className="btn" onClick={close}>
                Done
              </button>
            </>
          ) : (
            <button className="btn" onClick={close}>
              Close
            </button>
          )
        }
      >
        {current && (
          <div className="stack" style={{ gap: 16 }}>
            <div>
              <h3 style={{ fontSize: 14, marginBottom: 6 }}>Brief</h3>
              <p className="small" style={{ color: 'var(--text-2)', maxWidth: '70ch' }}>
                {current.brief}
              </p>
            </div>
            {current.status === 'Graded' ? (
              <div className="grade-box">
                <div>
                  <span className="xs muted">Your score</span>
                  <div className="metric-value">{current.score}%</div>
                </div>
                <div className="grow">
                  <span className="xs muted">Feedback from your lecturer</span>
                  <p className="small" style={{ marginTop: 4 }}>
                    {current.feedback}
                  </p>
                </div>
              </div>
            ) : (
              <>
                {current.status === 'Submitted' && <Notice tone="blue">Submitted. Your lecturer will release marks after the deadline.</Notice>}
                <div
                  className={`dropzone ${over ? 'over' : ''}`}
                  onClick={() => inputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setOver(true)
                  }}
                  onDragLeave={() => setOver(false)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setOver(false)
                    addFiles(e.dataTransfer.files)
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
                >
                  <FileUp size={26} />
                  <strong style={{ color: 'var(--ink)' }}>Drop files here or choose files</strong>
                  <div className="xs">PDF, DOCX, ZIP, PY or IPYNB, up to 50 MB. In this demo files stay on your device.</div>
                  <input ref={inputRef} type="file" multiple hidden onChange={(e) => addFiles(e.target.files)} />
                </div>
                {files.length > 0 && (
                  <div className="file-list">
                    {files.map((f, i) => (
                      <div key={f + i} className="file-chip">
                        <Paperclip size={14} />
                        <span className="truncate">{f}</span>
                        {current.status !== 'Submitted' && (
                          <button onClick={() => setFiles((x) => x.filter((_, k) => k !== i))} aria-label={`Remove ${f}`}>
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {current.status !== 'Submitted' && (
                  <>
                    <div className="field" style={{ marginBottom: 0 }}>
                      <label htmlFor="sub-note">Note to your lecturer (optional)</label>
                      <textarea id="sub-note" className="textarea" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
                    </div>
                    <label className="check small">
                      <input type="checkbox" checked={declare} onChange={(e) => setDeclare(e.target.checked)} />I confirm this is my own work and I have cited all sources.
                    </label>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </Modal>
    </>
  )
}
