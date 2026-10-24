import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Captions, Pause, Play, PlayCircle, Search, Sparkles } from 'lucide-react'
import { captionScript, courseById, recordings, studentCourseIds, transcript } from '../../data/mock'
import { Badge, Empty, Modal, PageHead, Panel, fmtDate } from '../../components/ui'

export default function StudentRecordings() {
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState('')
  const [course, setCourse] = useState('all')
  const [playId, setPlayId] = useState<string | null>(params.get('play'))
  const [playing, setPlaying] = useState(false)
  const [pos, setPos] = useState(0) // seconds
  const [speed, setSpeed] = useState(1)
  const [cc, setCc] = useState(true)
  const [lang, setLang] = useState<'en' | 'bm'>('en')

  const list = recordings.filter((r) => studentCourseIds.includes(r.courseId) && (course === 'all' || r.courseId === course) && r.title.toLowerCase().includes(q.toLowerCase()))
  const current = recordings.find((r) => r.id === playId)
  const total = current ? parseInt(current.duration) * 60 : 1

  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => setPos((p) => Math.min(total, p + speed * 4)), 250)
    return () => clearInterval(id)
  }, [playing, speed, total])

  useEffect(() => {
    setPos(0)
    setPlaying(!!playId)
  }, [playId])

  const close = () => {
    setPlayId(null)
    setPlaying(false)
    if (params.get('play')) setParams({}, { replace: true })
  }
  const toSec = (t: string) => {
    const [m, s] = t.split(':').map(Number)
    return m * 60 + s
  }
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
  const lineIdx = transcript.reduce((acc, l, i) => (toSec(l.t) <= pos ? i : acc), 0)

  return (
    <>
      <PageHead title="Lecture recordings" sub="Watch again at your own pace, with captions and a searchable transcript." />
      <div className="row wrap" style={{ gap: 10, marginBottom: 16 }}>
        <div className="search-field" style={{ flex: 1, minWidth: 220, maxWidth: 360 }}>
          <Search size={16} />
          <input className="input" placeholder="Search recordings" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search recordings" />
        </div>
        <select className="select" style={{ width: 'auto' }} value={course} onChange={(e) => setCourse(e.target.value)} aria-label="Filter by course">
          <option value="all">All courses</option>
          {studentCourseIds.map((id) => (
            <option key={id} value={id}>
              {courseById(id)?.code} {courseById(id)?.title}
            </option>
          ))}
        </select>
      </div>
      {list.length === 0 ? (
        <Panel>
          <Empty icon={<PlayCircle size={28} />} title="No recordings match">
            Try another course or search term.
          </Empty>
        </Panel>
      ) : (
        <div className="grid g-3">
          {list.map((r) => {
            const c = courseById(r.courseId)!
            return (
              <button key={r.id} className="rec-tile" onClick={() => setPlayId(r.id)}>
                <div className="rec-thumb" style={{ background: c.color }}>
                  <span className="rec-code">{c.code}</span>
                  <PlayCircle size={40} />
                  <span className="rec-dur">{r.duration}</span>
                </div>
                <div className="rec-body">
                  <strong>{r.title}</strong>
                  <span className="xs muted">
                    {fmtDate(r.date)}, {r.views} views
                  </span>
                  {r.captions ? <Badge tone="blue">Captions EN, BM</Badge> : <Badge>Captions processing</Badge>}
                </div>
              </button>
            )
          })}
        </div>
      )}

      <Modal open={!!current} onClose={close} wide title={current?.title ?? ''} sub={current ? `${courseById(current.courseId)?.code}, ${fmtDate(current.date)}, ${current.duration}` : ''}>
        {current && (
          <div className="player-wrap">
            <div className="player" style={{ ['--c' as string]: courseById(current.courseId)!.color }}>
              <div className="player-slide">
                <span className="xs">{courseById(current.courseId)?.code}</span>
                <strong>{current.title.split(': ')[1] ?? current.title}</strong>
              </div>
              {cc && <div className="player-cc">{captionScript[lineIdx % captionScript.length][lang]}</div>}
              <div className="player-bar">
                <button className="player-btn" onClick={() => setPlaying((p) => !p)} aria-label={playing ? 'Pause' : 'Play'}>
                  {playing ? <Pause size={18} /> : <Play size={18} />}
                </button>
                <input type="range" min={0} max={total} value={pos} onChange={(e) => setPos(Number(e.target.value))} aria-label="Seek" className="player-seek" />
                <span className="num xs">
                  {fmt(pos)} / {current.duration.replace(' min', ':00')}
                </span>
                <button className={`player-btn ${cc ? 'on' : ''}`} onClick={() => setCc((v) => !v)} aria-label="Captions">
                  <Captions size={18} />
                </button>
                <button className="player-btn txt" onClick={() => setLang((l) => (l === 'en' ? 'bm' : 'en'))}>
                  {lang.toUpperCase()}
                </button>
                <button className="player-btn txt" onClick={() => setSpeed((s) => (s === 1 ? 1.5 : s === 1.5 ? 2 : 1))}>
                  {speed}x
                </button>
              </div>
            </div>
            <div className="transcript">
              <div className="row between" style={{ marginBottom: 8 }}>
                <strong className="small">Transcript</strong>
                <span className="xs muted row" style={{ gap: 4 }}>
                  <Sparkles size={12} /> Generated automatically
                </span>
              </div>
              {transcript.map((l, i) => (
                <button key={l.t} className={`tr-line ${i === lineIdx ? 'on' : ''}`} onClick={() => setPos(toSec(l.t))}>
                  <span className="num">{l.t}</span>
                  {l.text}
                </button>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
