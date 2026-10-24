import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Mail, Search, Star, Users } from 'lucide-react'
import { Avatar, Badge, Empty, Modal, Notice, PageHead, Panel, Tabs, riskTone, Bar } from '../../components/ui'
import { colorFor, lecturers, roster } from '../../data/mock'
import type { Lecturer, StudentRow } from '../../data/types'
import { useDemo } from '../../store/DemoStore'
import '../../styles/management.css'

// Extra synthetic rows from other programmes so the directory looks university-wide.
const extra: StudentRow[] = [
  ['Muhammad Aiman bin Rosli', 'Bachelor of Engineering (Mechanical)', 82, 71, 74, 'Today'],
  ['Chan Li Ying', 'Bachelor of Accounting', 91, 84, 88, 'Today'],
  ['Shalini a/p Raju', 'Bachelor of Medicine and Surgery', 96, 81, 85, 'Today'],
  ['Nur Syafiqah binti Azhar', 'Bachelor of Laws', 88, 76, 80, 'Yesterday'],
  ['Daniel Lau Jun Kit', 'Bachelor of Science (Physics)', 63, 55, 58, '6 days ago'],
  ['Hidayah binti Mohd Fauzi', 'Bachelor of Arts (Malay Studies)', 74, 69, 72, '2 days ago'],
  ['Kumaresan a/l Muniandy', 'Bachelor of Education (TESL)', 85, 78, 81, 'Today'],
  ['Tay Hui Wen', 'Bachelor of Economics', 58, 61, 52, '8 days ago'],
].map(([name, programme, attendance, quizAvg, assignmentAvg, lastActive], i) => {
  const score = (attendance as number) * 0.4 + (quizAvg as number) * 0.3 + (assignmentAvg as number) * 0.3
  return {
    id: `ex${i + 1}`,
    name: name as string,
    matric: `2304${(1120 + i * 29).toString().padStart(4, '0')}`,
    programme: programme as string,
    attendance: attendance as number,
    quizAvg: quizAvg as number,
    assignmentAvg: assignmentAvg as number,
    lastActive: lastActive as string,
    risk: score < 64 ? 'High' : score < 74 ? 'Medium' : 'Low',
    color: colorFor(name as string),
  } as StudentRow
})

const students = [...roster, ...extra]
const advisors = ['Dr. Siti Khadijah binti Omar', 'Dr. Farid Hakimi bin Zulkifli', 'Dr. Nurul Izzah binti Ahmad', 'Assoc. Prof. Dr. Tan Wei Jie']

type Tab = 'students' | 'lecturers'

export default function People() {
  const { toast } = useDemo()
  const [params] = useSearchParams()
  const [tab, setTab] = useState<Tab>('students')
  const [q, setQ] = useState(params.get('q') ?? '')
  const [programme, setProgramme] = useState('All programmes')
  const [risk, setRisk] = useState('Any risk level')
  const [student, setStudent] = useState<StudentRow | null>(null)
  const [lecturer, setLecturer] = useState<Lecturer | null>(null)

  const programmes = useMemo(() => [...new Set(students.map((s) => s.programme))].sort(), [])
  const needle = q.trim().toLowerCase()

  const shownStudents = students.filter(
    (s) =>
      (!needle || s.name.toLowerCase().includes(needle) || s.matric.includes(needle) || s.programme.toLowerCase().includes(needle)) &&
      (programme === 'All programmes' || s.programme === programme) &&
      (risk === 'Any risk level' || s.risk === risk),
  )
  const shownLecturers = lecturers.filter((l) => !needle || l.name.toLowerCase().includes(needle) || l.department.toLowerCase().includes(needle))

  const sIdx = student ? students.findIndex((s) => s.id === student.id) : 0

  return (
    <>
      <PageHead title="Students and staff" sub="Search the directory, check engagement and reach out to students who need support." />

      <Notice tone="blue">Directory sync: sample data. In production this directory syncs from the student information system and HR records.</Notice>

      <div className="mt-2">
        <Tabs
          tabs={[
            { id: 'students', label: <>Students <Badge>{students.length}</Badge></> },
            { id: 'lecturers', label: <>Lecturers <Badge>{lecturers.length}</Badge></> },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>

      <Panel bodyClass="">
        <div className="mg-filters">
          <div className="search-field">
            <Search size={16} />
            <input className="input sm" placeholder={tab === 'students' ? 'Search by name, matric number or programme' : 'Search by name or department'} value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search directory" />
          </div>
          {tab === 'students' && (
            <>
              <select className="select sm" value={programme} onChange={(e) => setProgramme(e.target.value)} aria-label="Filter by programme">
                <option>All programmes</option>
                {programmes.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
              <select className="select sm" value={risk} onChange={(e) => setRisk(e.target.value)} aria-label="Filter by risk">
                <option>Any risk level</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </>
          )}
        </div>

        {tab === 'students' ? (
          shownStudents.length === 0 ? (
            <Empty icon={<Users size={28} />} title="No students match these filters">Clear the search or choose a different programme.</Empty>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Programme</th>
                    <th className="num">Attendance</th>
                    <th className="num">Assessment avg</th>
                    <th>Last active</th>
                    <th>Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {shownStudents.map((s) => (
                    <tr key={s.id} style={{ cursor: 'pointer' }} onClick={() => setStudent(s)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setStudent(s)}>
                      <td>
                        <div className="cell-person">
                          <Avatar name={s.name} size="sm" color={s.color} />
                          <div>
                            <strong>{s.name}</strong>
                            <span>{s.matric}</span>
                          </div>
                        </div>
                      </td>
                      <td className="small">{s.programme}</td>
                      <td className="num">{s.attendance}%</td>
                      <td className="num">{Math.round((s.quizAvg + s.assignmentAvg) / 2)}%</td>
                      <td className="small">{s.lastActive}</td>
                      <td>
                        <Badge tone={riskTone(s.risk)}>{s.risk}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : shownLecturers.length === 0 ? (
          <Empty icon={<Users size={28} />} title="No lecturers match this search">Try a department name.</Empty>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Lecturer</th>
                  <th>Department</th>
                  <th className="num">Courses</th>
                  <th className="num">Student rating</th>
                </tr>
              </thead>
              <tbody>
                {shownLecturers.map((l) => (
                  <tr key={l.id} style={{ cursor: 'pointer' }} onClick={() => setLecturer(l)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setLecturer(l)}>
                    <td>
                      <div className="cell-person">
                        <Avatar name={l.name} size="sm" color={l.color} />
                        <div>
                          <strong>{l.name}</strong>
                          <span>{l.title}</span>
                        </div>
                      </div>
                    </td>
                    <td className="small">{l.department}</td>
                    <td className="num">{l.courses}</td>
                    <td className="num">
                      <span className="row" style={{ justifyContent: 'flex-end', gap: 4 }}>
                        <Star size={13} fill="var(--gold)" color="var(--gold)" /> {l.rating.toFixed(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Modal
        open={!!student}
        onClose={() => setStudent(null)}
        title="Student profile"
        foot={
          <>
            <button className="btn secondary" onClick={() => setStudent(null)}>
              Close
            </button>
            <button
              className="btn"
              onClick={() => {
                toast(`Message sent to ${student?.name.split(' ')[0]}.`)
                setStudent(null)
              }}
            >
              <Mail size={16} /> Message student
            </button>
          </>
        }
      >
        {student && (
          <>
            <div className="mg-profile-head">
              <Avatar name={student.name} size="lg" color={student.color} />
              <div>
                <h3>{student.name}</h3>
                <div className="small muted">
                  Matric {student.matric}, {student.programme}
                </div>
              </div>
            </div>
            <div className="mg-profile-stats">
              <div>
                <strong>{student.attendance}%</strong>
                <span>Attendance</span>
              </div>
              <div>
                <strong>{student.quizAvg}%</strong>
                <span>Quiz average</span>
              </div>
              <div>
                <strong>{student.assignmentAvg}%</strong>
                <span>Assignments</span>
              </div>
            </div>
            <dl className="kv">
              <dt>Risk level</dt>
              <dd>
                <Badge tone={riskTone(student.risk)}>{student.risk}</Badge>
              </dd>
              <dt>Courses this semester</dt>
              <dd>{5 + (sIdx % 2)}</dd>
              <dt>Last active</dt>
              <dd>{student.lastActive}</dd>
              <dt>Academic advisor</dt>
              <dd>{advisors[sIdx % advisors.length]}</dd>
            </dl>
            <div className="mt-2">
              <div className="small muted" style={{ marginBottom: 6 }}>
                Engagement this semester
              </div>
              <Bar value={Math.round(student.attendance * 0.5 + student.quizAvg * 0.25 + student.assignmentAvg * 0.25)} color={student.risk === 'High' ? 'var(--red)' : undefined} />
            </div>
          </>
        )}
      </Modal>

      <Modal
        open={!!lecturer}
        onClose={() => setLecturer(null)}
        title="Lecturer profile"
        foot={
          <>
            <button className="btn secondary" onClick={() => setLecturer(null)}>
              Close
            </button>
            <button
              className="btn"
              onClick={() => {
                toast(`Message sent to ${lecturer?.name}.`)
                setLecturer(null)
              }}
            >
              <Mail size={16} /> Message lecturer
            </button>
          </>
        }
      >
        {lecturer && (
          <>
            <div className="mg-profile-head">
              <Avatar name={lecturer.name} size="lg" color={lecturer.color} />
              <div>
                <h3>{lecturer.name}</h3>
                <div className="small muted">
                  {lecturer.title}, {lecturer.department}
                </div>
              </div>
            </div>
            <div className="mg-profile-stats">
              <div>
                <strong>{lecturer.courses}</strong>
                <span>Courses</span>
              </div>
              <div>
                <strong>{lecturer.rating.toFixed(1)}</strong>
                <span>Student rating</span>
              </div>
              <div>
                <strong>{90 + (lecturer.courses % 3) * 3}%</strong>
                <span>Classes recorded</span>
              </div>
            </div>
            <dl className="kv">
              <dt>Live classes this week</dt>
              <dd>{lecturer.courses * 2}</dd>
              <dt>Grading turnaround</dt>
              <dd>{(4 + lecturer.courses * 0.8).toFixed(1)} days</dd>
              <dt>Platform training</dt>
              <dd>Completed</dd>
            </dl>
          </>
        )}
      </Modal>
    </>
  )
}
