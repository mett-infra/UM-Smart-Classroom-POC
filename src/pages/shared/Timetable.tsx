import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarPlus, MapPin, Radio, Video } from 'lucide-react'
import { courseById, courses, DEMO_DAY, dayNames, lecturerCourseIds, lecturerName, liveSessionId, studentCourseIds, weekDates } from '../../data/mock'
import type { ClassSlot, Course, Role } from '../../data/types'
import { Badge, Modal, PageHead, Panel, Seg } from '../../components/ui'
import { useDemo } from '../../store/DemoStore'

const START = 8
const END = 21
const HOUR_PX = 56
const toMin = (t: string) => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export default function Timetable({ role }: { role: Role }) {
  const { toast } = useDemo()
  const ids = role === 'lecturer' ? lecturerCourseIds : studentCourseIds
  const mine = courses.filter((c) => ids.includes(c.id))
  const [view, setView] = useState<'week' | 'list'>(() => (typeof window !== 'undefined' && window.innerWidth < 700 ? 'list' : 'week'))
  const [open, setOpen] = useState<{ c: Course; s: ClassSlot } | null>(null)

  const events = mine.flatMap((c) => c.schedule.map((s) => ({ c, s })))
  const nowTop = ((10 * 60 + 12 - START * 60) / 60) * HOUR_PX
  const hours = Array.from({ length: END - START }, (_, i) => START + i)

  const exportIcs = () => {
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//METGABB//UM Smart Classroom POC//EN']
    events.forEach(({ c, s }, i) => {
      const d = 19 + (s.day - 1)
      const st = s.start.replace(':', '')
      const en = s.end.replace(':', '')
      lines.push('BEGIN:VEVENT', `UID:poc-${c.id}-${i}@example`, `DTSTART:202610${d}T${st}00`, `DTEND:202610${d}T${en}00`, 'RRULE:FREQ=WEEKLY;COUNT=7', `SUMMARY:${c.code} ${c.title} (${s.kind})`, `LOCATION:${s.room}`, 'END:VEVENT')
    })
    lines.push('END:VCALENDAR')
    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'um-timetable-sample.ics'
    a.click()
    toast('Timetable file downloaded. Open it to add classes to your calendar.')
  }

  const isLive = (c: Course, s: ClassSlot) => s.day === DEMO_DAY && c.id === 'wia2004' && s.start === '10:00'

  return (
    <>
      <PageHead
        title={role === 'lecturer' ? 'Teaching timetable' : 'Timetable'}
        sub="Teaching week 7, 19 to 23 October 2026."
        actions={
          <>
            <Seg value={view} onChange={setView} options={[{ id: 'week', label: 'Week' }, { id: 'list', label: 'List' }]} />
            <button className="btn secondary" onClick={exportIcs}>
              <CalendarPlus size={16} /> Add to my calendar
            </button>
          </>
        }
      />
      {view === 'week' ? (
        <Panel bodyClass="table-wrap">
          <div className="week">
            <div className="week-head" />
            {[1, 2, 3, 4, 5].map((d) => (
              <div key={d} className={`week-head ${d === DEMO_DAY ? 'today' : ''}`}>
                {dayNames[d]}
                <span>{weekDates[d - 1]}</span>
              </div>
            ))}
            <div>
              {hours.map((h) => (
                <div key={h} className="week-hour">
                  {String(h).padStart(2, '0')}:00
                </div>
              ))}
            </div>
            {[1, 2, 3, 4, 5].map((d) => (
              <div key={d} className={`week-col ${d === DEMO_DAY ? 'today' : ''}`}>
                {hours.map((h) => (
                  <div key={h} className="week-slot" />
                ))}
                {d === DEMO_DAY && <div className="now-line" style={{ top: nowTop }} />}
                {events
                  .filter((e) => e.s.day === d)
                  .map(({ c, s }) => {
                    const top = ((toMin(s.start) - START * 60) / 60) * HOUR_PX
                    const h = ((toMin(s.end) - toMin(s.start)) / 60) * HOUR_PX
                    return (
                      <button key={c.id + s.start + d} className="week-event" style={{ top: top + 2, height: h - 4, color: c.color, background: `color-mix(in srgb, ${c.color} 10%, white)` }} onClick={() => setOpen({ c, s })}>
                        <strong>
                          {c.code} {s.kind}
                        </strong>
                        <span>{s.room}</span>
                        {isLive(c, s) && <span style={{ color: 'var(--red)', fontWeight: 700 }}>Live now</span>}
                      </button>
                    )
                  })}
              </div>
            ))}
          </div>
        </Panel>
      ) : (
        <div className="stack">
          {[1, 2, 3, 4, 5].map((d) => {
            const day = events.filter((e) => e.s.day === d).sort((a, b) => toMin(a.s.start) - toMin(b.s.start))
            return (
              <Panel key={d} title={`${dayNames[d]}, ${weekDates[d - 1]}`} action={d === DEMO_DAY ? <Badge tone="blue">Today</Badge> : undefined} bodyClass="panel-body tight">
                {day.length === 0 ? (
                  <p className="small muted" style={{ padding: '6px 20px' }}>
                    No classes.
                  </p>
                ) : (
                  <div className="list">
                    {day.map(({ c, s }) => (
                      <div key={c.id + s.start} className="list-item clickable" onClick={() => setOpen({ c, s })}>
                        <span className="num strong small" style={{ width: 92 }}>
                          {s.start} to {s.end}
                        </span>
                        <span className="icon-tile sm" style={{ background: `color-mix(in srgb, ${c.color} 12%, white)`, color: c.color }}>
                          {s.mode === 'Online' ? <Video size={16} /> : <MapPin size={16} />}
                        </span>
                        <div className="grow">
                          <div className="title truncate">
                            {c.code} {c.title}
                          </div>
                          <div className="sub">
                            {s.kind}, {s.room}
                          </div>
                        </div>
                        {isLive(c, s) ? <Badge tone="live">Live</Badge> : <Badge>{s.mode}</Badge>}
                      </div>
                    ))}
                  </div>
                )}
              </Panel>
            )
          })}
        </div>
      )}

      <Modal
        open={!!open}
        onClose={() => setOpen(null)}
        title={open ? `${open.c.code} ${open.s.kind}` : ''}
        sub={open?.c.title}
        foot={
          open && isLive(open.c, open.s) ? (
            <Link to={`/${role}/live/${liveSessionId}`} className="btn">
              <Radio size={16} /> {role === 'lecturer' ? 'Open live class' : 'Join live class'}
            </Link>
          ) : (
            <Link to={`/${role}/courses/${open?.c.id}`} className="btn secondary">
              Open course
            </Link>
          )
        }
      >
        {open && (
          <dl className="kv">
            <dt>When</dt>
            <dd>
              {dayNames[open.s.day]}, {open.s.start} to {open.s.end}
            </dd>
            <dt>Where</dt>
            <dd>{open.s.room}</dd>
            <dt>Mode</dt>
            <dd>{open.s.mode === 'Hybrid' ? 'Hybrid: join in the room or online' : open.s.mode}</dd>
            <dt>Lecturer</dt>
            <dd>{lecturerName(courseById(open.c.id)!.lecturerId)}</dd>
          </dl>
        )}
      </Modal>
    </>
  )
}
