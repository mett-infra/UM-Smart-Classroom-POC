import { Link, useSearchParams } from 'react-router-dom'
import { BookOpen, CalendarClock, Search } from 'lucide-react'
import { courses, lecturerName, SEMESTER, studentCourseIds } from '../../data/mock'
import { Bar, Empty, PageHead } from '../../components/ui'
import { CoverPattern } from '../lecturer/LecturerCourses'
import { nextSlot } from '../lecturer/lecturerUtils'
import { useDemo } from '../../store/DemoStore'

export default function StudentCourses() {
  const [params, setParams] = useSearchParams()
  const { state } = useDemo()
  const q = (params.get('q') ?? '').trim().toLowerCase()
  const mine = courses.filter((c) => studentCourseIds.includes(c.id))
  const list = mine.filter((c) => !q || `${c.code} ${c.title} ${lecturerName(c.lecturerId)}`.toLowerCase().includes(q))

  const progressOf = (id: string) => {
    const c = courses.find((x) => x.id === id)!
    const items = c.modules.flatMap((m) => m.items)
    const done = items.filter((i) => i.done || state.completed[i.id]).length
    return Math.round((done / items.length) * 100)
  }

  return (
    <>
      <PageHead
        title="My courses"
        sub={`${SEMESTER}. ${mine.length} courses, ${mine.reduce((n, c) => n + c.credits, 0)} credits.`}
        actions={
          <div className="search-field" style={{ minWidth: 260 }}>
            <Search size={16} />
            <input className="input" placeholder="Filter courses" value={params.get('q') ?? ''} onChange={(e) => setParams(e.target.value ? { q: e.target.value } : {}, { replace: true })} aria-label="Filter courses" />
          </div>
        }
      />
      {list.length === 0 ? (
        <div className="panel">
          <Empty icon={<BookOpen size={28} />} title={`No courses match “${params.get('q')}”`}>
            Try a course code such as WIA2004.
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
            const pr = progressOf(c.id)
            return (
              <Link key={c.id} to={`/student/courses/${c.id}`} className="course-tile">
                <div className="course-cover" style={{ background: c.color }}>
                  <CoverPattern />
                  <span className="code">{c.code}</span>
                  <span className="xs" style={{ position: 'relative', opacity: 0.9 }}>
                    {c.credits} credits
                  </span>
                </div>
                <div className="body">
                  <h3>{c.title}</h3>
                  <p className="small muted">{lecturerName(c.lecturerId)}</p>
                  <div className="mt-1">
                    <div className="row between xs muted">
                      <span>Your progress</span>
                      <strong className="num" style={{ color: 'var(--ink)' }}>
                        {pr}%
                      </strong>
                    </div>
                    <Bar value={pr} thin color={c.color} />
                  </div>
                  {next && (
                    <span className="row xs mt-1" style={{ gap: 6, color: 'var(--text-2)' }}>
                      <CalendarClock size={14} /> {next.label}, {next.slot.room}
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}
