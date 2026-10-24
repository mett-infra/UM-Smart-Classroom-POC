import { Bar as RBar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from 'recharts'
import { courses, studentCourseIds } from '../../data/mock'
import { Badge, Metric, Notice, PageHead, Panel, Ring } from '../../components/ui'
import { axisProps, chartColors, gridProps, tooltipProps } from '../../components/charts'
import { useDemo } from '../../store/DemoStore'

// Illustrative grading bands for the demo. Production uses the university's official scale.
const band = (s: number) => (s >= 80 ? 'A' : s >= 75 ? 'A-' : s >= 70 ? 'B+' : s >= 65 ? 'B' : s >= 60 ? 'B-' : s >= 55 ? 'C+' : s >= 50 ? 'C' : 'D')

export default function StudentGrades() {
  const { state } = useDemo()
  const mine = courses.filter((c) => studentCourseIds.includes(c.id))
  const rows = mine.map((c) => {
    const as = state.assignments.filter((a) => a.courseId === c.id)
    const graded = as.filter((a) => a.status === 'Graded' && a.score !== undefined)
    const weightDone = graded.reduce((n, a) => n + a.weight, 0)
    const earned = graded.reduce((n, a) => n + ((a.score ?? 0) * a.weight) / 100, 0)
    const pct = weightDone ? Math.round((earned / weightDone) * 100) : 0
    return { c, graded, weightDone, earned: Math.round(earned * 10) / 10, pct, total: as.reduce((n, a) => n + a.weight, 0) }
  })
  const overall = Math.round(rows.filter((r) => r.weightDone).reduce((n, r) => n + r.pct, 0) / Math.max(1, rows.filter((r) => r.weightDone).length))
  const scores = state.assignments
    .filter((a) => studentCourseIds.includes(a.courseId) && a.status === 'Graded')
    .map((a) => ({ name: courses.find((c) => c.id === a.courseId)!.code, title: a.title, score: a.score ?? 0, avg: Math.max(50, (a.score ?? 0) - 6 + (a.id.length % 5)) }))

  return (
    <>
      <PageHead title="Grades and progress" sub="Coursework marks released so far this semester. Final examinations are not included." />
      <div className="metrics">
        <Metric label="Coursework average" value={overall} unit="%" foot={`Projected band ${band(overall)} on the sample scale`} />
        <Metric label="Assessments graded" value={scores.length} foot="Out of 9 this semester" />
        <Metric label="Attendance" value="92" unit="%" foot={<span className="delta-up">On track</span>} />
        <Metric label="Content completed" value="69" unit="%" foot="Across all courses" />
      </div>
      <div className="grid g-main-side">
        <Panel title="By course" bodyClass="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Course</th>
                <th className="num">Coursework marked</th>
                <th className="num">Earned so far</th>
                <th className="num">Average</th>
                <th>Band</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.c.id}>
                  <td>
                    <div className="row" style={{ gap: 10 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 3, background: r.c.color, flexShrink: 0 }} />
                      <div>
                        <strong>{r.c.code}</strong>
                        <div className="xs muted">{r.c.title}</div>
                      </div>
                    </div>
                  </td>
                  <td className="num">
                    {r.weightDone}% of {r.total}%
                  </td>
                  <td className="num">{r.earned}%</td>
                  <td className="num strong">{r.weightDone ? `${r.pct}%` : '-'}</td>
                  <td>{r.weightDone ? <Badge tone={r.pct >= 75 ? 'green' : r.pct >= 65 ? 'blue' : 'amber'}>{band(r.pct)}</Badge> : <Badge>Pending</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <Panel title="Where you stand" sub="Your coursework average against the class">
          <div className="row" style={{ gap: 20, justifyContent: 'center', padding: '6px 0 16px' }}>
            <div style={{ textAlign: 'center' }}>
              <Ring value={overall} size={110} stroke={10} />
              <div className="xs muted mt-1">You</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <Ring value={72} size={110} stroke={10} color={chartColors.gold} />
              <div className="xs muted mt-1">Class average</div>
            </div>
          </div>
          <Notice>Grade bands here use a sample scale for the demo. The production system uses the official university grading scheme.</Notice>
        </Panel>
      </div>
      <Panel title="Your graded assessments" sub="Your score compared with the class average" className="mt-3">
        <div className="chart-box">
          <ResponsiveContainer>
            <BarChart data={scores} barGap={4}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="name" {...axisProps} />
              <YAxis domain={[0, 100]} {...axisProps} width={32} />
              <Tooltip {...tooltipProps} labelFormatter={(_l, p) => (p?.[0]?.payload as { title?: string })?.title ?? ''} />
              <ReferenceLine y={80} stroke={chartColors.green} strokeDasharray="4 4" />
              <RBar dataKey="score" name="Your score" fill={chartColors.primary} radius={[6, 6, 0, 0]} maxBarSize={36} />
              <RBar dataKey="avg" name="Class average" fill="#cdd5e1" radius={[6, 6, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </>
  )
}
