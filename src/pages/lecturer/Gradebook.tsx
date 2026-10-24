import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, Send } from 'lucide-react'
import { PageHead, Panel, Badge, Avatar, Modal, Seg, Empty, Bar, riskTone, fmtDue } from '../../components/ui'
import { courseById, lecturerCourseIds, roster } from '../../data/mock'
import type { Assignment } from '../../data/types'
import { useDemo } from '../../store/DemoStore'
import { downloadCsv, hashStr } from './lecturerUtils'
import '../../styles/lecturer.css'

type Filter = 'all' | 'unmarked' | 'risk'

function derivedScore(a: Assignment, sid: string, base: number) {
  if (sid === 'st1' && a.score != null) return a.score // the student persona's real score
  const off = (hashStr(a.id + sid) % 17) - 8
  return Math.max(0, Math.min(100, base + off))
}

const hasSubmitted = (a: Assignment, sid: string) => hashStr(a.id + sid) % 5 !== 0

export default function Gradebook() {
  const { state, update, log, toast } = useDemo()
  const [cid, setCid] = useState(lecturerCourseIds[0])
  const [filter, setFilter] = useState<Filter>('all')
  const [confirm, setConfirm] = useState(false)
  const course = courseById(cid)!

  const cols = useMemo(
    () =>
      state.assignments
        .filter((a) => a.courseId === cid && (a.status === 'Graded' || a.submitted > 0))
        .sort((a, b) => a.due.localeCompare(b.due)),
    [state.assignments, cid],
  )
  const editable = cols.find((a) => a.status !== 'Graded')
  const marks = editable ? state.marks[editable.id] ?? {} : {}
  const weightTotal = cols.reduce((n, a) => n + a.weight, 0)

  const scoreOf = (a: Assignment, sid: string): number | null => {
    const s = roster.find((r) => r.id === sid)!
    if (a.status === 'Graded') return derivedScore(a, sid, a.kind === 'Quiz' ? s.quizAvg : s.assignmentAvg)
    return marks[sid] ?? null
  }

  const rows = roster.filter((s) => {
    if (filter === 'risk') return s.risk !== 'Low'
    if (filter === 'unmarked') return !!editable && hasSubmitted(editable, s.id) && marks[s.id] == null
    return true
  })

  const submittedStudents = editable ? roster.filter((s) => hasSubmitted(editable, s.id)) : []
  const markedCount = submittedStudents.filter((s) => marks[s.id] != null).length

  const setMark = (sid: string, raw: string) => {
    if (!editable) return
    const aid = editable.id
    update((st) => {
      const cur = { ...(st.marks[aid] ?? {}) }
      if (raw === '') delete cur[sid]
      else cur[sid] = Math.max(0, Math.min(100, Math.round(Number(raw))))
      return { ...st, marks: { ...st.marks, [aid]: cur } }
    })
  }

  const total = (sid: string) => {
    let got = 0
    let w = 0
    cols.forEach((a) => {
      const v = scoreOf(a, sid)
      if (v != null) {
        got += (v * a.weight) / 100
        w += a.weight
      }
    })
    return { got, w }
  }

  const release = () => {
    if (!editable) return
    update((st) => ({ ...st, assignments: st.assignments.map((a) => (a.id === editable.id ? { ...a, graded: Math.max(a.graded, markedCount) } : a)) }))
    log({ text: `Marks released for ${course.code}`, sub: `${editable.title}, ${markedCount} students`, kind: 'grade' })
    toast(`Marks released to ${markedCount} students. They can see marks and feedback now.`)
    setConfirm(false)
  }

  const exportCsv = () => {
    downloadCsv(`gradebook_${course.code}.csv`, [
      ['Matric', 'Name', ...cols.map((a) => `${a.title} (${a.weight}%)`), `Coursework (of ${weightTotal})`],
      ...roster.map((s) => {
        const t = total(s.id)
        return [s.matric, s.name, ...cols.map((a) => scoreOf(a, s.id) ?? ''), t.got.toFixed(1)]
      }),
    ])
    toast('Gradebook exported as CSV.')
  }

  return (
    <>
      <PageHead
        title="Gradebook"
        sub="Enter marks inline. Students only see marks after you release them."
        actions={
          <>
            <button className="btn secondary" onClick={exportCsv}>
              <Download size={16} /> Export CSV
            </button>
            <button className="btn" disabled={!editable || markedCount === 0} onClick={() => setConfirm(true)}>
              <Send size={16} /> Release marks
            </button>
          </>
        }
      />

      <div className="row wrap between" style={{ marginBottom: 16, gap: 12 }}>
        <Seg<string>
          value={cid}
          onChange={(v) => {
            setCid(v)
            setFilter('all')
          }}
          options={lecturerCourseIds.map((id) => ({ id, label: courseById(id)!.code }))}
        />
        <Seg<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            { id: 'all', label: 'All students' },
            { id: 'unmarked', label: 'Not marked yet' },
            { id: 'risk', label: 'Needs support' },
          ]}
        />
      </div>

      {editable && (
        <Panel>
          <div className="row wrap between" style={{ gap: 16 }}>
            <div className="grow">
              <div className="strong">{editable.title}</div>
              <div className="small muted">
                {editable.weight}% of the final grade, due {fmtDue(editable.due)}
              </div>
            </div>
            <div style={{ minWidth: 220 }}>
              <div className="row between small">
                <span className="muted">Marked</span>
                <strong className="num">
                  {markedCount} of {submittedStudents.length} submitted
                </strong>
              </div>
              <Bar value={submittedStudents.length ? (markedCount / submittedStudents.length) * 100 : 0} color={course.color} />
            </div>
          </div>
        </Panel>
      )}

      <Panel
        className="mt-2"
        title={`${course.code} ${course.title}`}
        sub={`Showing ${rows.length} of ${course.enrolled} students in this sample. Coursework is worth ${weightTotal}% so far.`}
        bodyClass=""
      >
        {cols.length === 0 ? (
          <Empty title="No marks to show yet">
            Assessments appear here once students start submitting. <Link to={`/lecturer/courses/${cid}`}>Open the course</Link>
          </Empty>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  {cols.map((a) => (
                    <th key={a.id} className="num" title={a.title}>
                      {a.title.split(':')[0]}
                      <div className="xs" style={{ fontWeight: 500 }}>
                        {a.weight}%{a === editable ? ', marking' : ''}
                      </div>
                    </th>
                  ))}
                  <th className="num">
                    Coursework
                    <div className="xs" style={{ fontWeight: 500 }}>
                      out of {weightTotal}
                    </div>
                  </th>
                  <th>Support</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => {
                  const t = total(s.id)
                  return (
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
                      {cols.map((a) => {
                        if (a === editable) {
                          if (!hasSubmitted(a, s.id))
                            return (
                              <td key={a.id} className="num xs muted">
                                Not submitted
                              </td>
                            )
                          const v = marks[s.id]
                          return (
                            <td key={a.id} className="num">
                              <input
                                className={`mark-input ${v == null ? 'empty' : ''}`}
                                type="number"
                                min={0}
                                max={100}
                                inputMode="numeric"
                                placeholder="Mark"
                                value={v ?? ''}
                                onChange={(e) => setMark(s.id, e.target.value)}
                                aria-label={`${a.title} mark for ${s.name}`}
                              />
                            </td>
                          )
                        }
                        const v = scoreOf(a, s.id)
                        return (
                          <td key={a.id} className="num" style={{ color: v != null && v < 50 ? 'var(--red)' : undefined }}>
                            {v ?? ''}
                          </td>
                        )
                      })}
                      <td className="num">
                        <span className="gb-total">{t.got.toFixed(1)}</span>
                      </td>
                      <td>
                        <Badge tone={riskTone(s.risk)}>{s.risk === 'Low' ? 'On track' : `${s.risk} risk`}</Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {rows.length === 0 && <Empty title={filter === 'unmarked' ? 'Everything submitted has a mark' : 'No students in this view'}>{filter === 'unmarked' ? 'Release marks when you are ready.' : null}</Empty>}
          </div>
        )}
      </Panel>

      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Release marks?"
        sub={editable ? `${course.code}, ${editable.title}` : ''}
        foot={
          <>
            <button className="btn secondary" onClick={() => setConfirm(false)}>
              Keep editing
            </button>
            <button className="btn" onClick={release}>
              <Send size={16} /> Release marks
            </button>
          </>
        }
      >
        <p className="small">
          {markedCount} students will see their mark and feedback straight away and get a notification. {submittedStudents.length - markedCount > 0 ? `${submittedStudents.length - markedCount} submissions are still unmarked and stay hidden.` : 'Every submission in this sample has a mark.'}
        </p>
      </Modal>
    </>
  )
}
