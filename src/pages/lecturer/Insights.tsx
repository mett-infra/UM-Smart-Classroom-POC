import { useState } from 'react'
import { Bar as RBar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { MessageSquare, Send } from 'lucide-react'
import { PageHead, Panel, Badge, Avatar, Modal, Seg, riskTone } from '../../components/ui'
import { axisProps, chartColors, gridProps, HBars, Legend, tooltipProps } from '../../components/charts'
import { courseById, lecturerCourseIds, personas, roster, TEACHING_WEEK, weeklyTrend } from '../../data/mock'
import type { StudentRow } from '../../data/types'
import { useDemo } from '../../store/DemoStore'
import '../../styles/lecturer.css'

function reasons(s: StudentRow) {
  const r: string[] = []
  if (s.attendance < 75) r.push(`attendance ${s.attendance}%`)
  if (s.quizAvg < 60) r.push(`quiz average ${s.quizAvg}%`)
  if (s.assignmentAvg < 60) r.push(`assignment average ${s.assignmentAvg}%`)
  if (s.lastActive === '5 days ago') r.push('not active for 5 days')
  if (!r.length) r.push(`marks trending down, quiz average ${s.quizAvg}%`)
  const t = r.join(', ')
  return t[0].toUpperCase() + t.slice(1)
}

export default function Insights() {
  const { toast, log } = useDemo()
  const [cid, setCid] = useState(lecturerCourseIds[0])
  const [msgTo, setMsgTo] = useState<StudentRow | null>(null)
  const [msg, setMsg] = useState('')
  const course = courseById(cid)!
  const off = course.attendance - 85
  const eOff = course.engagement - 81
  const trend = weeklyTrend.map((w) => ({ week: w.week, Attendance: Math.min(100, w.attendance + off), Engagement: Math.min(100, w.engagement + eOff) }))

  const bins = [
    { label: 'Below 50', min: 0, max: 49 },
    { label: '50 to 59', min: 50, max: 59 },
    { label: '60 to 69', min: 60, max: 69 },
    { label: '70 to 79', min: 70, max: 79 },
    { label: '80 to 89', min: 80, max: 89 },
    { label: '90 and up', min: 90, max: 100 },
  ].map((b) => ({ range: b.label, Students: roster.filter((s) => s.quizAvg >= b.min && s.quizAvg <= b.max).length }))

  const completion = course.modules
    .filter((m) => m.week <= TEACHING_WEEK)
    .map((m) => ({ label: `Week ${m.week}: ${m.title}`, value: Math.max(28, 97 - (m.week - 1) * 5 - (m.week === TEACHING_WEEK ? 24 : 0) - ((course.code.charCodeAt(4) + m.week) % 4)) }))

  const atRisk = roster.filter((s) => s.risk !== 'Low').sort((a, b) => (a.risk === b.risk ? a.attendance - b.attendance : a.risk === 'High' ? -1 : 1))

  const openMsg = (s: StudentRow) => {
    const first = s.name.split(' ')[0]
    setMsg(
      `Hi ${first},\n\nI noticed you have missed a few ${course.code} sessions recently and wanted to check in. Is everything okay? If anything is making it hard to keep up, I’m happy to meet during my consultation hours (Thursday, 14:00 to 16:00) or online.\n\nThe Lecture 14 recording and slides are on the course page if you want to catch up.\n\n${personas.lecturer.short}`,
    )
    setMsgTo(s)
  }

  const send = () => {
    if (!msgTo) return
    log({ text: `Check-in message sent`, sub: `${msgTo.name}, ${course.code}`, kind: 'announce' })
    toast(`Message sent to ${msgTo.name}.`)
    setMsgTo(null)
  }

  return (
    <>
      <PageHead
        title="Class insights"
        sub="See how your class is engaging and who may need support, week by week."
        actions={<Seg<string> value={cid} onChange={setCid} options={lecturerCourseIds.map((id) => ({ id, label: courseById(id)!.code }))} />}
      />

      <div className="metrics">
        <div className="metric">
          <div className="metric-label">Attendance this week</div>
          <div className="metric-value">
            {trend[trend.length - 1].Attendance}
            <small>%</small>
          </div>
          <div className="metric-foot">
            <span className="delta-down">{trend[trend.length - 2].Attendance - trend[trend.length - 1].Attendance} pt</span> lower than week 6
          </div>
        </div>
        <div className="metric">
          <div className="metric-label">Engagement score</div>
          <div className="metric-value">{trend[trend.length - 1].Engagement}</div>
          <div className="metric-foot">
            <span className="delta-up">+{trend[trend.length - 1].Engagement - trend[0].Engagement}</span> since week 1
          </div>
        </div>
        <div className="metric">
          <div className="metric-label">Recording views</div>
          <div className="metric-value">{Math.round(course.enrolled * 0.83)}</div>
          <div className="metric-foot">Lecture 13, in the first 48 hours</div>
        </div>
        <div className="metric">
          <div className="metric-label">Need support</div>
          <div className="metric-value">{atRisk.length}</div>
          <div className="metric-foot">{atRisk.filter((s) => s.risk === 'High').length} high risk in this sample</div>
        </div>
      </div>

      <div className="grid g-2">
        <Panel title="Attendance and engagement" sub="Teaching weeks 1 to 7" action={<Legend items={[{ label: 'Attendance', color: chartColors.primary }, { label: 'Engagement', color: chartColors.gold }]} />}>
          <div className="chart-box">
            <ResponsiveContainer>
              <LineChart data={trend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="week" {...axisProps} />
                <YAxis domain={[50, 100]} {...axisProps} />
                <Tooltip {...tooltipProps} cursor={{ stroke: chartColors.grid }} />
                <Line type="monotone" dataKey="Attendance" stroke={chartColors.primary} strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Engagement" stroke={chartColors.gold} strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Quiz score distribution" sub={`Average across quizzes, ${roster.length} students in this sample`}>
          <div className="chart-box">
            <ResponsiveContainer>
              <BarChart data={bins} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="range" {...axisProps} interval={0} tick={{ ...axisProps.tick, fontSize: 11 }} />
                <YAxis allowDecimals={false} {...axisProps} />
                <Tooltip {...tooltipProps} />
                <RBar dataKey="Students" fill={course.color} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="grid g-main-side mt-2">
        <Panel title="Students needing support" sub="Flagged from attendance, marks and activity" bodyClass="">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Why flagged</th>
                  <th>Level</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {atRisk.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div className="cell-person">
                        <Avatar name={s.name} color={s.color} size="sm" />
                        <div>
                          <strong>{s.name}</strong>
                          <span>Last active {s.lastActive.toLowerCase()}</span>
                        </div>
                      </div>
                    </td>
                    <td className="small">{reasons(s)}</td>
                    <td>
                      <Badge tone={riskTone(s.risk)}>{s.risk}</Badge>
                    </td>
                    <td>
                      <button className="btn secondary xs" onClick={() => openMsg(s)}>
                        <MessageSquare size={13} /> Send check-in
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Module completion" sub="Share of students who finished each week’s materials">
          <HBars rows={completion} color={course.color} />
        </Panel>
      </div>

      <Modal
        open={!!msgTo}
        onClose={() => setMsgTo(null)}
        title="Send a check-in message"
        sub="Private message, delivered in the app and by email"
        foot={
          <>
            <button className="btn secondary" onClick={() => setMsgTo(null)}>
              Cancel
            </button>
            <button className="btn" onClick={send}>
              <Send size={16} /> Send message
            </button>
          </>
        }
      >
        {msgTo && (
          <>
            <div className="check-msg-to">
              <Avatar name={msgTo.name} color={msgTo.color} size="sm" />
              <div className="grow">
                <strong className="small">{msgTo.name}</strong>
                <div className="xs muted">{reasons(msgTo)}</div>
              </div>
            </div>
            <div className="field">
              <label htmlFor="ci-msg">Message</label>
              <textarea id="ci-msg" className="textarea" style={{ minHeight: 200 }} value={msg} onChange={(e) => setMsg(e.target.value)} />
            </div>
          </>
        )}
      </Modal>
    </>
  )
}
