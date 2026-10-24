import { useMemo, useState } from 'react'
import { Bar as RBar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AlertTriangle, ArrowDown, ArrowUp } from 'lucide-react'
import { Badge, Metric, PageHead, Panel, Seg } from '../../components/ui'
import { axisProps, chartColors, gridProps, HBars, Legend, tooltipProps } from '../../components/charts'
import { courses, faculties, lecturerName } from '../../data/mock'
import type { Faculty } from '../../data/types'
import { useDemo } from '../../store/DemoStore'
import '../../styles/management.css'

type Period = 'week' | 'semester'
type SortKey = 'short' | 'students' | 'lecturers' | 'courses' | 'attendance' | 'completion' | 'satisfaction' | 'utilisation'

// Semester-to-date figures differ slightly from this week's figures.
function forPeriod(f: Faculty, p: Period): Faculty {
  if (p === 'week') return f
  return {
    ...f,
    attendance: Math.min(99, f.attendance + 2),
    completion: Math.max(0, f.completion - 4),
    satisfaction: Math.round((f.satisfaction + 0.05) * 10) / 10,
    utilisation: Math.max(0, f.utilisation - 3),
  }
}

export default function Academics() {
  const { toast } = useDemo()
  const [period, setPeriod] = useState<Period>('week')
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'attendance', dir: -1 })

  const data = useMemo(() => faculties.map((f) => forPeriod(f, period)), [period])
  const sorted = useMemo(
    () =>
      [...data].sort((a, b) => {
        const av = a[sort.key]
        const bv = b[sort.key]
        if (typeof av === 'string' && typeof bv === 'string') return av.localeCompare(bv) * sort.dir
        return ((av as number) - (bv as number)) * sort.dir
      }),
    [data, sort],
  )

  const total = data.reduce((s, f) => s + f.students, 0)
  const att = Math.round(data.reduce((s, f) => s + f.attendance * f.students, 0) / total)
  const comp = Math.round(data.reduce((s, f) => s + f.completion * f.students, 0) / total)
  const sat = (data.reduce((s, f) => s + f.satisfaction, 0) / data.length).toFixed(1)

  // Synthesised at-risk counts: share of students under 70% attendance, scaled by how far below 90% the faculty is.
  const atRisk = data.map((f) => ({ label: f.short, value: Math.round(f.students * (0.02 + Math.max(0, 90 - f.attendance) * 0.006)) }))
  const atRiskTotal = atRisk.reduce((s, r) => s + r.value, 0)

  const watch = courses
    .filter((c) => c.engagement < 75 || c.attendance < 85)
    .map((c) => {
      const reasons: string[] = []
      if (c.attendance < 85) reasons.push(`Attendance ${c.attendance}%`)
      if (c.engagement < 75) reasons.push(`Engagement ${c.engagement}`)
      return { ...c, reasons }
    })

  const head = (key: SortKey, label: string, num = true) => (
    <th className={num ? 'num' : ''} aria-sort={sort.key === key ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}>
      <button className={`mg-sort ${sort.key === key ? 'on' : ''}`} onClick={() => setSort((s) => ({ key, dir: s.key === key ? ((-s.dir) as 1 | -1) : -1 }))}>
        {label}
        {sort.key === key && (sort.dir === 1 ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
      </button>
    </th>
  )

  return (
    <>
      <PageHead
        title="Academic performance"
        sub="Attendance, completion and student experience across faculties. Sample data for the proof of concept."
        actions={
          <Seg
            options={[
              { id: 'week', label: 'This week' },
              { id: 'semester', label: 'Semester to date' },
            ]}
            value={period}
            onChange={setPeriod}
          />
        }
      />

      <div className="metrics">
        <Metric label="Students enrolled" value={total.toLocaleString()} foot="Across 8 faculties" />
        <Metric label="Average attendance" value={att} unit="%" foot={period === 'week' ? 'Teaching week 7' : 'Weeks 1 to 7'} />
        <Metric label="Course completion" value={comp} unit="%" foot="Learning items completed on time" />
        <Metric label="Student satisfaction" value={sat} unit="/ 5" foot="Pulse survey, 3,214 responses" />
      </div>

      <div className="grid g-main-side">
        <Panel title="Attendance and completion by faculty" sub={period === 'week' ? 'This week' : 'Semester to date'} action={<Legend items={[{ label: 'Attendance %', color: chartColors.primary }, { label: 'Completion %', color: chartColors.gold }]} />}>
          <div className="chart-box" style={{ height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={data} margin={{ top: 8, right: 4, left: -22, bottom: 0 }} barGap={3}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="short" {...axisProps} interval={0} angle={-25} textAnchor="end" height={70} tick={{ fill: chartColors.axis, fontSize: 11 }} />
                <YAxis domain={[0, 100]} {...axisProps} />
                <Tooltip {...tooltipProps} />
                <RBar dataKey="attendance" name="Attendance %" fill={chartColors.primary} radius={[4, 4, 0, 0]} maxBarSize={22} />
                <RBar dataKey="completion" name="Completion %" fill={chartColors.gold} radius={[4, 4, 0, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Students at risk" sub={`${atRiskTotal.toLocaleString()} students flagged by attendance and assessment signals`}>
          <HBars rows={[...atRisk].sort((a, b) => b.value - a.value)} max={Math.max(...atRisk.map((r) => r.value))} unit="" color={chartColors.red} />
          <button className="btn secondary sm mt-2" onClick={() => toast('Faculty deans notified with their at-risk lists (demo).')}>
            Notify faculty deans
          </button>
        </Panel>
      </div>

      <Panel title="Faculty comparison" sub="Select a column heading to sort" className="mt-3" bodyClass="">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                {head('short', 'Faculty', false)}
                {head('students', 'Students')}
                {head('lecturers', 'Lecturers')}
                {head('courses', 'Courses')}
                {head('attendance', 'Attendance')}
                {head('completion', 'Completion')}
                {head('satisfaction', 'Satisfaction')}
                {head('utilisation', 'Room use')}
              </tr>
            </thead>
            <tbody>
              {sorted.map((f) => (
                <tr key={f.id}>
                  <td style={{ minWidth: 200 }}>
                    <strong>{f.short}</strong>
                    <div className="xs muted">{f.name}</div>
                  </td>
                  <td className="num">{f.students.toLocaleString()}</td>
                  <td className="num">{f.lecturers}</td>
                  <td className="num">{f.courses}</td>
                  <td className="num">
                    <span className={f.attendance < 82 ? 'delta-down' : ''}>{f.attendance}%</span>
                  </td>
                  <td className="num">{f.completion}%</td>
                  <td className="num">{f.satisfaction.toFixed(1)}</td>
                  <td className="num">{f.utilisation}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Course watchlist" sub="Courses with attendance under 85% or engagement under 75" className="mt-3" bodyClass="panel-body tight">
        <div className="list">
          {watch.map((c) => (
            <div className="list-item" key={c.id}>
              <div className="icon-tile sm" style={{ background: 'var(--amber-50)', color: 'var(--amber)' }}>
                <AlertTriangle size={16} />
              </div>
              <div className="grow">
                <div className="title">
                  {c.code} {c.title}
                </div>
                <div className="sub">
                  {lecturerName(c.lecturerId)}, {c.enrolled} students
                </div>
              </div>
              <div className="row wrap" style={{ justifyContent: 'flex-end' }}>
                {c.reasons.map((r) => (
                  <Badge key={r} tone="amber">
                    {r}
                  </Badge>
                ))}
              </div>
              <button className="btn xs secondary" onClick={() => toast(`Check-in request sent to ${lecturerName(c.lecturerId)}.`)}>
                Request check-in
              </button>
            </div>
          ))}
        </div>
      </Panel>
    </>
  )
}
