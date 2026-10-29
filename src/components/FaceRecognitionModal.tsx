import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Camera, ImageUp, Loader2, ScanFace, UserCheck, XCircle } from 'lucide-react'
import { Modal } from './ui'
import { facePersonById } from '../data/faces'
import { nowLabel, useDemo } from '../store/DemoStore'
import { useFaces } from '../store/faces'
import { confidenceOf, faceDistance, findFaces, loadFaceEngine, MATCH_DISTANCE, type FaceFound } from '../lib/faceEngine'
import { faceThumb, fileToCanvas, frameOf, useCamera } from '../lib/faceMedia'
import '../styles/smartcampus.css'

/*
  15-second face recognition scan against the face database on this device.
  Used by Face sign-up (management) and Attendance (lecturer). Runs entirely in the browser.
*/

export const SCAN_SECONDS = 15

const STAGES: [number, string][] = [
  [0, 'Looking for a face'],
  [3, 'Reading facial features'],
  [7, 'Comparing with the face database'],
  [12, 'Confirming the match'],
]

interface Result {
  kind: 'match' | 'unknown' | 'none'
  personId?: string
  confidence?: number
  frames: number
  hits: number
  snapshot?: string
}

export function FaceRecognitionModal({ onClose, onMatch, title = 'Test face recognition', sub }: { onClose: () => void; onMatch?: (personId: string) => void; title?: string; sub?: string }) {
  const faces = useFaces()
  const { audit } = useDemo()
  const enrolled = Object.values(faces).filter((f) => facePersonById(f.personId))
  const [phase, setPhase] = useState<'ready' | 'loading' | 'scan' | 'result'>('ready')
  const [useCam, setUseCam] = useState(false)
  const [photo, setPhoto] = useState<HTMLCanvasElement | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [box, setBox] = useState<{ b: FaceFound['box']; w: number; h: number } | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const cam = useCamera(useCam)
  const stop = useRef(false)

  useEffect(() => () => void (stop.current = true), [])

  const source = (): HTMLVideoElement | HTMLCanvasElement | null => photo ?? (cam.ready ? cam.videoRef.current : null)

  const scan = async () => {
    setPhase('loading')
    setErr(null)
    try {
      await loadFaceEngine()
    } catch {
      setErr('The face model could not be loaded. Check the internet connection and try again.')
      return setPhase('ready')
    }
    setPhase('scan')
    stop.current = false
    const samples: { pid: string | null; d: number }[] = []
    let snapshot: string | undefined
    const t0 = performance.now()
    while (!stop.current) {
      const t = (performance.now() - t0) / 1000
      setElapsed(t)
      if (t >= SCAN_SECONDS) break
      const src = source()
      if (src) {
        const found = await findFaces(src)
        const w = src instanceof HTMLVideoElement ? src.videoWidth : src.width
        const h = src instanceof HTMLVideoElement ? src.videoHeight : src.height
        if (found.length) {
          const main = [...found].sort((a, b) => b.box.width - a.box.width)[0]
          setBox({ b: main.box, w, h })
          let best: { pid: string | null; d: number } = { pid: null, d: 9 }
          enrolled.forEach((f) => {
            const d = faceDistance(f.descriptor, main.descriptor)
            if (d < best.d) best = { pid: f.personId, d }
          })
          samples.push(best)
          if (!snapshot && t > 4) {
            const c = src instanceof HTMLVideoElement ? frameOf(src) : src
            snapshot = faceThumb(c, main.box)
          }
        } else setBox(null)
      }
      await new Promise((r) => setTimeout(r, 200))
    }
    if (stop.current) return
    setElapsed(SCAN_SECONDS)
    // Decide: the person most often matched below the threshold, using the median distance of those frames.
    const hits: Record<string, number[]> = {}
    samples.forEach((s) => s.pid && s.d < MATCH_DISTANCE && (hits[s.pid] ??= []).push(s.d))
    const top = Object.entries(hits).sort((a, b) => b[1].length - a[1].length)[0]
    let res: Result
    if (samples.length === 0) res = { kind: 'none', frames: 0, hits: 0 }
    else if (top && top[1].length >= Math.max(2, samples.length * 0.4)) {
      const ds = [...top[1]].sort((a, b) => a - b)
      res = { kind: 'match', personId: top[0], confidence: confidenceOf(ds[Math.floor(ds.length / 2)]), frames: samples.length, hits: top[1].length, snapshot }
    } else res = { kind: 'unknown', frames: samples.length, hits: 0, snapshot }
    setResult(res)
    setPhase('result')
    const who = res.personId ? facePersonById(res.personId)?.name : undefined
    if (res.kind === 'match' && res.personId) onMatch?.(res.personId)
    audit({ area: 'Access', action: 'Face recognition test', target: res.kind === 'match' ? who ?? 'Matched' : res.kind === 'unknown' ? 'Not recognised' : 'No face seen', detail: res.kind === 'match' ? `${res.confidence}% confidence, ${res.hits} of ${res.frames} frames` : `${res.frames} frames with a face` })
  }

  const stage = [...STAGES].reverse().find(([s]) => elapsed >= s)?.[1] ?? STAGES[0][1]
  const mirrored = !photo
  const person = result?.personId ? facePersonById(result.personId) : undefined
  const rec = result?.personId ? faces[result.personId] : undefined

  return (
    <Modal open wide onClose={onClose} title={title} sub={sub ?? `The same ${SCAN_SECONDS}-second scan that marks attendance in a live session. Everything runs on this device.`}>
      {enrolled.length === 0 ? (
        <div className="face-cam-msg static">
          <AlertTriangle size={18} /> Nobody is signed up on this device yet. Sign someone up first, then test recognition.
        </div>
      ) : phase === 'result' && result ? (
        <div className={`face-result ${result.kind}`}>
          <div className="face-result-pics">
            {result.snapshot ? <img src={result.snapshot} alt="Face seen by the camera" /> : <span className="face-result-blank"><ScanFace size={34} /></span>}
            {rec && <img src={rec.photo} alt={`${person?.name}, signed-up photo`} />}
          </div>
          {result.kind === 'match' && person ? (
            <>
              <h3>
                <UserCheck size={22} /> Recognised: {person.name}
              </h3>
              <p className="small">
                {person.designation}, {person.organisation}
              </p>
              <div className="att-stats">
                <div>
                  <span>Match confidence</span>
                  <strong>{result.confidence}%</strong>
                </div>
                <div>
                  <span>Frames matched</span>
                  <strong>
                    {result.hits} of {result.frames}
                  </strong>
                </div>
                <div>
                  <span>In a live session</span>
                  <strong>Marked present at {nowLabel()}</strong>
                </div>
              </div>
            </>
          ) : result.kind === 'unknown' ? (
            <>
              <h3>
                <XCircle size={22} /> Not recognised
              </h3>
              <p className="small">A face was seen, but it does not match anyone signed up on this device, so no attendance would be marked.</p>
            </>
          ) : (
            <>
              <h3>
                <AlertTriangle size={22} /> No face seen
              </h3>
              <p className="small">Face the camera in good light and try again.</p>
            </>
          )}
          <div className="row" style={{ gap: 8, justifyContent: 'center', marginTop: 14 }}>
            <button
              className="btn secondary"
              onClick={() => {
                setResult(null)
                setBox(null)
                setElapsed(0)
                setPhase('ready')
              }}
            >
              Scan again
            </button>
            <button className="btn" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      ) : (
        <div className="stack" style={{ gap: 12 }}>
          <div className={`face-video scan ${phase === 'scan' ? 'scanning' : ''}`}>
            {photo ? <img src={photo.toDataURL('image/jpeg', 0.9)} alt="Photo used for the test" /> : <video ref={cam.videoRef} playsInline muted autoPlay style={useCam ? undefined : { display: 'none' }} />}
            {!photo && !useCam && (
              <div className="face-cam-msg">
                <ScanFace size={20} /> Start the camera, then look straight at it.
              </div>
            )}
            {useCam && !photo && !cam.ready && !cam.error && (
              <div className="face-cam-msg">
                <Loader2 size={18} className="spin" /> Starting the camera…
              </div>
            )}
            {useCam && cam.error && !photo && (
              <div className="face-cam-msg">
                <AlertTriangle size={18} /> {cam.error}
              </div>
            )}
            {phase === 'scan' && <span className="scan-line" />}
            {box && phase === 'scan' && (
              <span
                className="face-box live"
                style={{ left: `${((mirrored ? box.w - box.b.x - box.b.width : box.b.x) / box.w) * 100}%`, top: `${(box.b.y / box.h) * 100}%`, width: `${(box.b.width / box.w) * 100}%`, height: `${(box.b.height / box.h) * 100}%` }}
              />
            )}
          </div>

          {phase === 'scan' || phase === 'loading' ? (
            <div className="scan-progress">
              <div className="row between small">
                <strong>{phase === 'loading' ? 'Loading the face model…' : stage}</strong>
                <span className="num muted">{phase === 'loading' ? '' : `${Math.max(0, Math.ceil(SCAN_SECONDS - elapsed))} s`}</span>
              </div>
              <div className="cap-bar">
                <i style={{ width: `${(elapsed / SCAN_SECONDS) * 100}%`, background: 'var(--primary)', transition: 'width 0.2s linear' }} />
              </div>
              <ol className="scan-stages">
                {STAGES.map(([s, label], i) => (
                  <li key={label} className={elapsed >= (STAGES[i + 1]?.[0] ?? SCAN_SECONDS) ? 'done' : elapsed >= s && phase === 'scan' ? 'on' : ''}>
                    {label}
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <div className="row wrap" style={{ gap: 8 }}>
              {!useCam && !photo ? (
                <button className="btn" onClick={() => setUseCam(true)}>
                  <Camera size={15} /> Start camera
                </button>
              ) : (
                <button className="btn" disabled={!photo && !cam.ready} onClick={scan}>
                  <ScanFace size={15} /> Start {SCAN_SECONDS}-second scan
                </button>
              )}
              <label className="btn secondary">
                <ImageUp size={15} /> {photo ? 'Use another photo' : 'Use a photo instead'}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={async (e) => {
                    const f = e.target.files?.[0]
                    if (f) {
                      setUseCam(false)
                      setPhoto(await fileToCanvas(f))
                    }
                  }}
                />
              </label>
              <span className="xs muted grow" style={{ alignSelf: 'center' }}>
                {enrolled.length} {enrolled.length === 1 ? 'person' : 'people'} signed up on this device
              </span>
            </div>
          )}
          {err && <p className="small c-red">{err}</p>}
        </div>
      )}
    </Modal>
  )
}
