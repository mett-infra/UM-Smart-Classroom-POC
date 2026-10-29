import { useMemo, useState } from 'react'
import { AlertTriangle, Camera, CheckCircle2, Circle, ImageUp, Loader2, ScanFace, ShieldCheck, Trash2, XCircle } from 'lucide-react'
import { Avatar, Badge, Metric, Modal, Notice, PageHead, Panel, Seg } from '../../components/ui'
import { facePeople, facePersonById, type FacePerson } from '../../data/faces'
import { nowLabel, useDemo } from '../../store/DemoStore'
import { removeFace, saveFace, useFaces, type FaceRecord } from '../../store/faces'
import { faceDistance, findFaces, loadFaceEngine, MATCH_DISTANCE, type FaceFound } from '../../lib/faceEngine'
import { faceThumb, fileToCanvas, frameOf, useCamera } from '../../lib/faceMedia'
import { FaceRecognitionModal } from '../../components/FaceRecognitionModal'
import '../../styles/management.css'
import '../../styles/smartcampus.css'

/*
  Face sign-up (management). People are signed up with consent, from an uploaded photo or the device camera.
  The face is checked and turned into a face template in the browser. The photo and template are stored on this
  device only. "Test recognition" runs the 15-second scan used for live-session attendance.
*/

// ---------- page ----------
export default function FaceSignup() {
  const faces = useFaces()
  const { audit, toast } = useDemo()
  const [signUp, setSignUp] = useState<FacePerson | null>(null)
  const [test, setTest] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState<FacePerson | null>(null)
  const signed = facePeople.filter((p) => faces[p.id]).length

  const remove = (p: FacePerson) => {
    removeFace(p.id)
    audit({ area: 'Access', action: 'Removed face sign-up', target: p.name, detail: 'Photo and face template deleted from this device' })
    toast(`${p.name}'s face data was deleted from this device.`)
    setConfirmRemove(null)
  }

  return (
    <>
      <PageHead
        title="Face sign-up"
        sub="Sign up the demo participant for face recognition, so live sessions can mark attendance automatically. Consent comes first, and the photo stays on this device."
        actions={
          <button className="btn" onClick={() => setTest(true)}>
            <ScanFace size={16} /> Test recognition
          </button>
        }
      />

      <div className="metrics">
        <Metric label="In the face database" value={facePeople.length} foot={facePeople.map((p) => p.name).join(', ')} />
        <Metric label="Signed up on this device" value={signed ? 'Yes' : 'Not yet'} foot={signed ? 'Ready for recognition' : 'Sign up before the demo'} />
        <Metric label="Scan time" value="15 s" foot="Same scan as live sessions" />
        <Metric label="Match rule" value="75%" foot="Confidence needed to recognise someone" />
      </div>

      <div className="grid g-main-side face-grid">
        <Panel
          title="Face database"
          sub={
            <>
              Demo participant for this proof of concept
              <span className="face-note">This option is only for demo purposes. In production, the workflow would be configured based on feedback and information shared by the Universiti PIC.</span>
            </>
          }
          bodyClass="panel-body tight"
        >
          <div className="list">
            {facePeople.map((p) => {
              const f = faces[p.id]
              return (
                <div key={p.id} className="list-item face-row featured">
                  {f ? <img className="face-thumb" src={f.photo} alt={`${p.name}, signed-up photo`} /> : <Avatar name={p.name} color={p.color} />}
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div className="row wrap" style={{ gap: 8 }}>
                      <strong className="small">{p.name}</strong>
                      <Badge tone="gold">Demo participant</Badge>
                    </div>
                    <div className="xs muted">
                      {p.designation}, {p.organisation}
                    </div>
                    <div className="xs muted">
                      {p.email} · <span className="num">{p.idNo}</span>
                    </div>
                  </div>
                  <div className="face-actions">
                    {f ? (
                      <>
                        <Badge tone="green">
                          <CheckCircle2 size={12} /> Signed up
                        </Badge>
                        <button className="btn ghost xs" onClick={() => setConfirmRemove(p)} aria-label={`Remove ${p.name}'s face`}>
                          <Trash2 size={14} /> Remove
                        </button>
                      </>
                    ) : (
                      <button className="btn sm" onClick={() => setSignUp(p)}>
                        <ScanFace size={15} /> Sign up face
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Panel>

        <div className="stack">
          <Panel title="How face data is handled" sub="In this demo and in production">
            <ul className="face-rules">
              <li>
                <ShieldCheck size={16} /> Consent is recorded before any photo is taken.
              </li>
              <li>
                <ShieldCheck size={16} /> The photo is checked on this device and turned into a face template (128 numbers).
              </li>
              <li>
                <ShieldCheck size={16} /> In this demo the photo and template stay in this browser only. They are never uploaded or added to the website.
              </li>
              <li>
                <ShieldCheck size={16} /> Remove a person at any time. Their face data is deleted at once.
              </li>
              <li>
                <ShieldCheck size={16} /> In production, templates are stored encrypted in the university’s own system, under the Personal Data Protection Act 2010 and the university’s retention policy.
              </li>
            </ul>
          </Panel>
          <Panel title="Demo tip" sub="Before presenting">
            <ol className="tk-steps">
              <li>On the demo laptop, sign up Pranav Kuri with his photo or the camera.</li>
              <li>Click Test recognition and look at the camera for 15 seconds.</li>
              <li>His name appears with the match confidence. Anyone not signed up is not recognised.</li>
            </ol>
          </Panel>
        </div>
      </div>

      <div className="mt-2">
        <Notice>Face sign-ups are kept on this device, separately from the demo data, so Reset demo data does not remove them. Use Remove to delete one.</Notice>
      </div>

      {signUp && (
        <SignUpModal
          person={signUp}
          onClose={() => setSignUp(null)}
          onTest={() => {
            setSignUp(null)
            setTest(true)
          }}
        />
      )}
      {test && <FaceRecognitionModal onClose={() => setTest(false)} />}
      <Modal
        open={!!confirmRemove}
        onClose={() => setConfirmRemove(null)}
        title={`Remove ${confirmRemove?.name}'s face?`}
        sub="The photo and face template are deleted from this device. They can sign up again later."
        foot={
          <>
            <button className="btn secondary" onClick={() => setConfirmRemove(null)}>
              Keep
            </button>
            <button className="btn danger" onClick={() => confirmRemove && remove(confirmRemove)}>
              Remove face data
            </button>
          </>
        }
      >
        <p className="small">Their attendance history is not affected.</p>
      </Modal>
    </>
  )
}

// ---------- sign-up wizard ----------
type Step = 'consent' | 'photo' | 'check' | 'done'
type CheckState = 'wait' | 'run' | 'ok' | 'bad'

const CHECKS = ['Load the face model (first time only, about 7 MB)', 'Find a face in the photo', 'Make sure there is only one face', 'Check the face is clear and large enough', 'Create the face template']

function SignUpModal({ person, onClose, onTest }: { person: FacePerson; onClose: () => void; onTest: () => void }) {
  const { audit, toast } = useDemo()
  const faces = useFaces()
  const [step, setStep] = useState<Step>('consent')
  const [consent, setConsent] = useState(false)
  const [mode, setMode] = useState<'upload' | 'camera'>('upload')
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)
  const [checks, setChecks] = useState<CheckState[]>(CHECKS.map(() => 'wait'))
  const [fail, setFail] = useState<string | null>(null)
  const [box, setBox] = useState<FaceFound['box'] | null>(null)
  const [saved, setSaved] = useState<FaceRecord | null>(null)
  const cam = useCamera(step === 'photo' && mode === 'camera')
  const preview = useMemo(() => canvas?.toDataURL('image/jpeg', 0.9) ?? null, [canvas])
  const first = person.name.split(' ')[0]

  const run = async (c: HTMLCanvasElement, src: FaceRecord['source']) => {
    setCanvas(c)
    setStep('check')
    setFail(null)
    setBox(null)
    const st: CheckState[] = CHECKS.map(() => 'wait')
    const mark = (i: number, s: CheckState) => {
      st[i] = s
      setChecks([...st])
    }
    const pause = (ms: number) => new Promise((r) => setTimeout(r, ms))
    try {
      mark(0, 'run')
      await loadFaceEngine()
      mark(0, 'ok')
      mark(1, 'run')
      const found = await findFaces(c)
      await pause(350)
      if (found.length === 0) {
        mark(1, 'bad')
        return setFail('No face was found. Use a front-facing photo in good light, with the whole face visible.')
      }
      mark(1, 'ok')
      const main = [...found].sort((a, b) => b.box.width - a.box.width)[0]
      setBox(main.box)
      mark(2, 'run')
      await pause(350)
      if (found.length > 1) {
        mark(2, 'bad')
        return setFail(`${found.length} faces were found. Use a photo with only ${first} in it.`)
      }
      mark(2, 'ok')
      mark(3, 'run')
      await pause(350)
      if (main.box.width < Math.min(c.width, c.height) * 0.15 || main.score < 0.6) {
        mark(3, 'bad')
        return setFail('The face is too small or not clear enough. Move closer to the camera or use a sharper photo.')
      }
      mark(3, 'ok')
      mark(4, 'run')
      await pause(350)
      const clash = Object.values(faces).filter((f) => facePersonById(f.personId)).find((f) => f.personId !== person.id && faceDistance(f.descriptor, main.descriptor) < MATCH_DISTANCE)
      if (clash) {
        mark(4, 'bad')
        return setFail(`This face already matches ${facePersonById(clash.personId)?.name ?? 'someone'} in the face database, so it was not signed up again.`)
      }
      const rec: FaceRecord = { personId: person.id, photo: faceThumb(c, main.box), descriptor: main.descriptor, source: src, consentBy: 'Prof. Dr. Lim Mei Ling', signedUpAt: nowLabel() }
      saveFace(rec)
      mark(4, 'ok')
      setSaved(rec)
      audit({ area: 'Access', action: 'Signed up face', target: person.name, detail: `${src}, consent recorded, stored on this device only` })
      toast(`${person.name} is signed up for face recognition.`)
      await pause(500)
      setStep('done')
    } catch {
      setChecks((x) => x.map((s) => (s === 'run' ? 'bad' : s)))
      setFail('The face model could not be loaded. Check the internet connection and try again.')
    }
  }

  const upload = async (file?: File) => {
    if (!file) return
    if (!file.type.startsWith('image/')) return toast('Choose a photo (JPG or PNG).', 'warn')
    try {
      run(await fileToCanvas(file), 'Photo upload')
    } catch {
      toast('That photo could not be opened. Try a JPG or PNG.', 'warn')
    }
  }

  const steps: [Step, string][] = [
    ['consent', 'Consent'],
    ['photo', 'Photo'],
    ['check', 'Check'],
    ['done', 'Signed up'],
  ]
  const at = steps.findIndex(([s]) => s === step)

  return (
    <Modal
      open
      wide
      onClose={onClose}
      title={`Sign up ${person.name}`}
      sub={`${person.designation}, ${person.organisation}`}
      foot={
        step === 'consent' ? (
          <>
            <button className="btn secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="btn" disabled={!consent} onClick={() => setStep('photo')}>
              Continue
            </button>
          </>
        ) : step === 'done' ? (
          <>
            <button className="btn secondary" onClick={onClose}>
              Done
            </button>
            <button className="btn" onClick={onTest}>
              <ScanFace size={15} /> Test recognition now
            </button>
          </>
        ) : step === 'check' && fail ? (
          <>
            <button className="btn secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="btn" onClick={() => setStep('photo')}>
              Try another photo
            </button>
          </>
        ) : undefined
      }
    >
      <ol className="wiz-steps">
        {steps.map(([id, label], i) => (
          <li key={id} className={i < at ? 'done' : i === at ? (fail ? 'bad' : 'on') : ''}>
            <span>{i + 1}</span>
            {label}
          </li>
        ))}
      </ol>

      {step === 'consent' && (
        <div className="stack" style={{ gap: 14 }}>
          <dl className="kv">
            <dt>Name</dt>
            <dd>{person.name}</dd>
            <dt>Designation</dt>
            <dd>
              {person.designation}, {person.organisation}
            </dd>
            <dt>Email</dt>
            <dd>{person.email}</dd>
            <dt>ID</dt>
            <dd className="num">{person.idNo}</dd>
            <dt>Used for</dt>
            <dd>Marking attendance in live sessions and counting who takes part in assessments</dd>
          </dl>
          <label className={`opt ${consent ? 'on' : ''}`}>
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <div>
              <strong className="small">{first} has agreed to have their face signed up</strong>
              <div className="xs muted">The photo and face template stay on this device and can be removed at any time. Consent is recorded in the audit log.</div>
            </div>
          </label>
        </div>
      )}

      {step === 'photo' && (
        <div className="stack" style={{ gap: 14 }}>
          <Seg
            value={mode}
            onChange={setMode}
            options={[
              { id: 'upload', label: 'Upload a photo' },
              { id: 'camera', label: 'Use the camera' },
            ]}
          />
          {mode === 'upload' ? (
            <label className="face-drop">
              <ImageUp size={28} />
              <strong>Choose a photo of {first}</strong>
              <span className="xs muted">Front facing, good light, only one person. JPG or PNG.</span>
              <input type="file" accept="image/*" onChange={(e) => upload(e.target.files?.[0])} />
            </label>
          ) : (
            <div className="face-cam">
              {cam.error ? (
                <div className="face-cam-msg">
                  <AlertTriangle size={20} /> {cam.error}
                </div>
              ) : (
                <>
                  <div className="face-video">
                    <video ref={cam.videoRef} playsInline muted autoPlay />
                    <div className="face-guide" />
                    {!cam.ready && (
                      <div className="face-cam-msg">
                        <Loader2 size={18} className="spin" /> Starting the camera…
                      </div>
                    )}
                  </div>
                  <button className="btn" disabled={!cam.ready} onClick={() => cam.videoRef.current && run(frameOf(cam.videoRef.current), 'Camera')}>
                    <Camera size={15} /> Take photo
                  </button>
                  <p className="xs muted">Ask {first} to look straight at the camera, inside the oval.</p>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {step === 'check' && (
        <div className="face-check">
          {preview && canvas && (
            <div className="face-preview">
              <img src={preview} alt="Photo being checked" />
              {box && <span className={`face-box ${fail ? 'bad' : ''}`} style={{ left: `${(box.x / canvas.width) * 100}%`, top: `${(box.y / canvas.height) * 100}%`, width: `${(box.width / canvas.width) * 100}%`, height: `${(box.height / canvas.height) * 100}%` }} />}
            </div>
          )}
          <div className="grow">
            <ul className="face-checks">
              {CHECKS.map((c, i) => (
                <li key={c} className={checks[i]}>
                  {checks[i] === 'ok' ? <CheckCircle2 size={17} /> : checks[i] === 'bad' ? <XCircle size={17} /> : checks[i] === 'run' ? <Loader2 size={17} className="spin" /> : <Circle size={17} />}
                  {c}
                </li>
              ))}
            </ul>
            {fail && (
              <div className="trouble mt-2">
                <h3>
                  <AlertTriangle size={17} /> Not signed up
                </h3>
                <p className="small" style={{ margin: 0 }}>
                  {fail}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {step === 'done' && saved && (
        <div className="pair-ok">
          <img className="face-thumb xl" src={saved.photo} alt={`${person.name}, signed-up photo`} />
          <h3>{person.name} is signed up</h3>
          <p className="small muted">
            From {saved.source === 'Camera' ? 'the camera' : 'an uploaded photo'} at {saved.signedUpAt}. Stored on this device only.
          </p>
        </div>
      )}
    </Modal>
  )
}

