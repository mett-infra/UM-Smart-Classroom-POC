import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Users } from 'lucide-react'
import { Modal } from '../../components/ui'
import { SCAN_SECONDS } from '../../components/FaceRecognitionModal'
import { roomScan, type LecSession } from './attendanceData'
import '../../styles/lecturer.css'
import '../../styles/smartcampus.css'

// ---------- room camera scan (simulated room camera, 15 seconds) ----------
const STAGES: [number, string][] = [
  [0, 'Looking for faces'],
  [3, 'Reading facial features'],
  [7, 'Matching with the class list'],
  [12, 'Confirming matches'],
]

// Where recognition boxes appear on the classroom camera image (percent).
const BOXES = Array.from({ length: 26 }, (_, i) => {
  const row = Math.floor(i / 7)
  const col = i % 7
  return { x: 10 + col * 12.2 + (row % 2) * 5, y: 44 + row * 11, s: 6.5 - row * 0.4 }
})

export function RoomScanModal({ session, now, onFinish, onClose }: { session: LecSession; now: number; onFinish: (ids: string[]) => void; onClose: () => void }) {
  const [t, setT] = useState(0)
  const [done, setDone] = useState(false)
  const result = useMemo(() => roomScan(session, now), [session, now])

  useEffect(() => {
    const t0 = performance.now()
    const id = setInterval(() => {
      const e = (performance.now() - t0) / 1000
      if (e >= SCAN_SECONDS) {
        clearInterval(id)
        setT(SCAN_SECONDS)
        setDone(true)
        onFinish(result.recognised)
      } else setT(e)
    }, 100)
    return () => clearInterval(id)
    // run once when the scan opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const k = t / SCAN_SECONDS
  const count = Math.round(result.recognised.length * Math.min(1, k * 1.15))
  const stage = [...STAGES].reverse().find(([s]) => t >= s)?.[1] ?? STAGES[0][1]
  const missed = result.inRoom - result.recognised.length

  return (
    <Modal open wide onClose={onClose} title={`Face scan, ${session.room.split(',')[0]}`} sub={`The room camera scans the class for ${SCAN_SECONDS} seconds and marks recognised students present.`}>
      {!done ? (
        <div className="stack" style={{ gap: 12 }}>
          <div className="face-video scan scanning room-scan">
            <img src={`${import.meta.env.BASE_URL}cctv/lecture-hall.jpg`} alt="Classroom camera view" />
            <span className="scan-line" />
            {BOXES.slice(0, Math.floor(BOXES.length * Math.min(1, k * 1.2))).map((b, i) => (
              <span key={i} className="face-box live" style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.s}%`, height: `${b.s * 1.5}%` }} />
            ))}
            <div className="room-scan-count">
              <Users size={16} /> <strong className="num">{count}</strong> recognised
            </div>
          </div>
          <div className="scan-progress">
            <div className="row between small">
              <strong>{stage}</strong>
              <span className="num muted">{Math.max(0, Math.ceil(SCAN_SECONDS - t))} s</span>
            </div>
            <div className="cap-bar">
              <i style={{ width: `${k * 100}%`, background: 'var(--primary)', transition: 'width 0.1s linear' }} />
            </div>
            <ol className="scan-stages">
              {STAGES.map(([s, label], i) => (
                <li key={label} className={t >= (STAGES[i + 1]?.[0] ?? SCAN_SECONDS) ? 'done' : t >= s ? 'on' : ''}>
                  {label}
                </li>
              ))}
            </ol>
          </div>
        </div>
      ) : (
        <div className="face-result match">
          <h3>
            <CheckCircle2 size={22} /> {result.recognised.length} students recognised and marked present
          </h3>
          <div className="att-stats" style={{ width: '100%' }}>
            <div>
              <span>People counter</span>
              <strong>{result.inRoom} students in the room</strong>
            </div>
            <div>
              <span>Recognised by the camera</span>
              <strong>{result.recognised.length}</strong>
            </div>
            <div>
              <span>Not recognised</span>
              <strong className={missed > 0 ? 'c-red' : ''}>{missed}</strong>
            </div>
          </div>
          {missed > 0 && <p className="small" style={{ marginTop: 10 }}>Some faces were turned away or covered. Mark the {missed} missing {missed === 1 ? 'student' : 'students'} present yourself from the list.</p>}
          <div className="row" style={{ gap: 8, justifyContent: 'center', marginTop: 14 }}>
            <button className="btn" onClick={onClose}>
              {missed > 0 ? 'Mark the rest myself' : 'Done'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
