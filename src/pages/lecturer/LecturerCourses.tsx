import { Link, useSearchParams } from 'react-router-dom'
import { BookOpen, CalendarClock, Search, Users } from 'lucide-react'
import { PageHead, Badge, Bar, Empty } from '../../components/ui'
import { courses, lecturerCourseIds, TEACHING_WEEK } from '../../data/mock'
import { useDemo } from '../../store/DemoStore'
import { nextSlot } from './lecturerUtils'
import '../../styles/lecturer.css'

export function CoverPattern() {
  return (
    <svg className="pattern" width="140" height="120" viewBox="0 0 140 120" aria-hidden>
      {[0, 1, 2].map((r) =>
        [0, 1, 2, 3].map((c) => (
          <g key={`${r}-${c}`} transform={`translate(${c * 36 + (r % 2) * 18} ${r * 36})`}>
            <path d="M18 2 L34 18 L18 34 L2 18 Z" fill="none" stroke="#fff" strokeWidth="1.5" />
            <path d="M18 11 L25 18 L18 25 L11 18 Z" fill="#fff" />
          </g>
        )),
      )}
    </svg>
  )
}

export default function LecturerCourses() {
  const [params, setParams] = useSearchParams()
  const q = (params.get('q') ?? '').trim().toLowerCase()
  const { state } = useDemo()
  const mine = courses.filter((c) => lecturerCourseIds.includes(c.id))
  const list = mine.filter((c) => !q || `${c.code} ${c.title} ${c.description}`.toLowerCase().includes(q))

  return (
    <>
      <PageHead
        title="My courses"
        sub={`You are teaching ${mine.length} courses in Semester 1, Session 2026/2027.`}
        actions={
          <div className="search-field" style={{ minWidth: 260 }}>
            <Search size={16} />
            <input
              className="input"
              placeholder="Filter courses"
              value={params.get('q') ?? ''}
              onChange={(e) => setParams(e.target.value ? { q: e.target.value } : {}, { replace: true })}
              aria-label="Filter courses"
            />
          </div>
        }
      />

      {list.length === 0 ? (
        <div className="panel">
          <Empty icon={<BookOpen size={28} />} title={`No courses match “${params.get('q')}”`}>
            Try a course code such as WIA2004, or clear the filter.
            <div className="mt-2">
              <button className="btn secondary sm" onClick={() => setParams({})}>
                Clear filter
              </button>
            </div>
          </Empty>
        </div>
      ) : (
        <div className="grid g-3">
          {list.map((c) => {
            const next = nextSlot(c)
            const extra = state.extraMaterials[c.id]?.length ?? 0
            const items = c.modules.reduce((n, m) => n + m.items.length, 0) + extra
            const open = state.assignments.filter((a) => a.courseId === c.id && a.status !== 'Graded').length
            return (
              <Link key={c.id} to={`/lecturer/courses/${c.id}`} className="course-tile">
                <div className="course-cover" style={{ background: c.color }}>
                  <CoverPattern />
                  <span className="code">{c.code}</span>
                  <span className="xs" style={{ position: 'relative', opacity: 0.9 }}>
                    {c.credits} credits, week {Math.min(TEACHING_WEEK, c.modules.length)} of {c.modules.length}
                  </span>
                </div>
                <div className="body">
                  <h3>{c.title}</h3>
                  <p className="small muted">{c.description}</p>
                  <div className="row wrap small muted" style={{ gap: 14 }}>
                    <span className="row" style={{ gap: 6 }}>
                      <Users size={14} /> {c.enrolled} students
                    </span>
                    <span className="row" style={{ gap: 6 }}>
                      <BookOpen size={14} /> {items} items
                    </span>
                  </div>
                  <div className="mt-1">
                    <div className="row between xs muted">
                      <span>Attendance</span>
                      <strong className="num" style={{ color: 'var(--ink)' }}>
                        {c.attendance}%
                      </strong>
                    </div>
                    <Bar value={c.attendance} thin color={c.color} />
                  </div>
                  <div>
                    <div className="row between xs muted">
                      <span>Engagement</span>
                      <strong className="num" style={{ color: 'var(--ink)' }}>
                        {c.engagement}
                      </strong>
                    </div>
                    <Bar value={c.engagement} thin color="var(--gold)" />
                  </div>
                  <div className="row between wrap mt-1" style={{ gap: 8 }}>
                    {next && (
                      <span className="row xs" style={{ gap: 6, color: 'var(--text-2)' }}>
                        <CalendarClock size={14} /> {next.label}, {next.slot.room}
                      </span>
                    )}
                    {open > 0 && <Badge tone="amber">{open} open assessments</Badge>}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}
