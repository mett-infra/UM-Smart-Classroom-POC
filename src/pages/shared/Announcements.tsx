import { useState } from 'react'
import { Megaphone, Pin, Send } from 'lucide-react'
import { courseById, courses, faculties, lecturerCourseIds, personas, studentCourseIds } from '../../data/mock'
import type { Role } from '../../data/types'
import { Avatar, Badge, Empty, PageHead, Panel, Seg, fmtDate } from '../../components/ui'
import { useDemo } from '../../store/DemoStore'

export default function Announcements({ role }: { role: Role }) {
  const { state, update, toast, log } = useDemo()
  const me = personas[role]
  const [filter, setFilter] = useState<'all' | 'uni' | 'course'>('all')
  const audiences =
    role === 'lecturer'
      ? lecturerCourseIds.map((id) => `${courseById(id)!.code} students`)
      : ['All students and staff', 'All students', 'All academic staff', ...faculties.map((f) => `${f.short} students`)]
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [audience, setAudience] = useState(audiences[0])
  const [pinned, setPinned] = useState(false)
  const [email, setEmail] = useState(true)

  const mine = state.announcements.filter((a) => {
    if (role === 'student') return !a.courseId || studentCourseIds.includes(a.courseId)
    if (role === 'lecturer') return !a.courseId || lecturerCourseIds.includes(a.courseId)
    return true
  })
  const list = mine
    .filter((a) => (filter === 'all' ? true : filter === 'uni' ? !a.courseId : !!a.courseId))
    .sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || b.date.localeCompare(a.date))

  const post = () => {
    if (!title.trim() || !body.trim()) {
      toast('Add a title and a message before posting.', 'warn')
      return
    }
    const course = role === 'lecturer' ? courses.find((c) => audience.startsWith(c.code)) : undefined
    update((s) => ({
      ...s,
      announcements: [{ id: `an${Date.now()}`, title: title.trim(), body: body.trim(), from: role === 'management' ? 'Academic Management Office' : me.name, audience, date: '2026-10-21', pinned, courseId: course?.id }, ...s.announcements],
    }))
    log({ text: `Announcement posted: ${title.trim()}`, sub: `To ${audience.toLowerCase()}`, kind: 'announce' })
    toast(`Announcement posted to ${audience.toLowerCase()}${email ? ' and sent by email' : ''}.`)
    setTitle('')
    setBody('')
    setPinned(false)
  }

  const canPost = role !== 'student'

  return (
    <>
      <PageHead
        title="Announcements"
        sub={role === 'student' ? 'News from the university and from your lecturers.' : role === 'lecturer' ? 'Post updates to the students in your courses.' : 'Send university-wide or faculty notices.'}
        actions={<Seg value={filter} onChange={setFilter} options={[{ id: 'all', label: 'All' }, { id: 'uni', label: 'University' }, { id: 'course', label: 'Courses' }]} />}
      />
      <div className={`grid ${canPost ? 'g-main-side' : ''}`}>
        <Panel title={`${list.length} announcements`} bodyClass="panel-body tight">
          {list.length === 0 ? (
            <Empty icon={<Megaphone size={28} />} title="Nothing here yet">
              Announcements for this filter will appear here.
            </Empty>
          ) : (
            <div className="list">
              {list.map((a) => (
                <article key={a.id} className="list-item" style={{ alignItems: 'flex-start' }}>
                  <Avatar name={a.from} />
                  <div className="grow">
                    <div className="row wrap" style={{ gap: 8 }}>
                      <span className="title">{a.title}</span>
                      {a.pinned && (
                        <Badge tone="gold">
                          <Pin size={11} /> Pinned
                        </Badge>
                      )}
                      {a.courseId && <Badge tone="blue">{courseById(a.courseId)?.code}</Badge>}
                    </div>
                    <p className="small" style={{ margin: '4px 0 6px', color: 'var(--text-2)', maxWidth: '70ch' }}>
                      {a.body}
                    </p>
                    <span className="xs muted">
                      {a.from}, to {a.audience.toLowerCase()}, {fmtDate(a.date)}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </Panel>
        {canPost && (
          <Panel title="New announcement" sub="Students see it on their home page and in notifications.">
            <div className="field">
              <label htmlFor="an-aud">Send to</label>
              <select id="an-aud" className="select" value={audience} onChange={(e) => setAudience(e.target.value)}>
                {audiences.map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="an-title">Title</label>
              <input id="an-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={role === 'lecturer' ? 'e.g. Extra consultation hour on Friday' : 'e.g. Library opening hours during exams'} />
            </div>
            <div className="field">
              <label htmlFor="an-body">Message</label>
              <textarea id="an-body" className="textarea" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write the details students need" />
            </div>
            <label className="check mt-1">
              <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} /> Pin to the top
            </label>
            <label className="check mt-1">
              <input type="checkbox" checked={email} onChange={(e) => setEmail(e.target.checked)} /> Also send by email
            </label>
            <button className="btn block mt-2" onClick={post}>
              <Send size={15} /> Post announcement
            </button>
          </Panel>
        )}
      </div>
    </>
  )
}
