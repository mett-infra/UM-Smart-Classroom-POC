import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, Mic, MicOff, Send, XCircle } from 'lucide-react'
import type { Device, DeviceType, Space } from '../data/smartcampus'
import { nowLabel, useDemo, type DeviceState } from '../store/DemoStore'
import { sceneStates, stateOf, type Scene } from '../pages/management/roomControl'
import { Badge, Modal, Seg } from './ui'
import '../styles/smartcampus.css'

/*
  Voice-to-command console (spec SC-01 to SC-07).
  Speech is turned into text by the browser (Web Speech API, works in Chrome and Edge) or typed.
  The text is matched against a fixed list of approved commands, the target room must be clear,
  broad actions ask for confirmation, and every command is logged. Nothing leaves the browser in this demo.
*/

type SR = {
  lang: string
  interimResults: boolean
  continuous: boolean
  start: () => void
  stop: () => void
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
}

const getSR = (): (new () => SR) | null => {
  const w = window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

const deviceWords: [DeviceType, RegExp, string][] = [
  ['Lights', /\b(lights?|lamps?|lampu)\b/, 'lights'],
  ['Fan', /\b(fans?|kipas)\b/, 'fan'],
  ['Air-conditioning', /\b(air[- ]?con\w*|aircond|a\/c|ac|penghawa dingin)\b/, 'air-con'],
  ['Projector', /\b(projector|projektor)\b/, 'projector'],
  ['Interactive display', /\b(display|screen|skrin|tv|board|panel)\b/, 'display'],
  ['Door controller', /\b(doors?|pintu)\b/, 'door'],
  ['Ceiling microphone', /\b(mics?|microphones?|mikrofon)\b/, 'microphone'],
  ['PTZ camera', /\b(camera|kamera)\b/, 'camera'],
]

type Plan = { ok: false; reason: string } | { ok: true; summary: string; changes: Record<string, DeviceState>; failed: string[]; confirm?: boolean; count: number }

const norm = (t: string) => t.toLowerCase().replace(/[^a-z0-9]/g, '')

function findRoom(text: string, rooms: Space[]) {
  const t = norm(text)
  let best: Space | null = null
  let len = 0
  for (const r of rooms) {
    for (const k of [r.name, r.code]) {
      const n = norm(k)
      if (n.length >= 3 && t.includes(n) && n.length > len) {
        best = r
        len = n.length
      }
    }
  }
  return best
}

function interpret(raw: string, room: Space, devices: Device[], all: Record<string, DeviceState>): Plan {
  // Remove the room name and code first so numbers like "DK2" are not read as values.
  let t = ` ${raw.toLowerCase()} `
  for (const k of [room.name, room.code]) t = t.split(k.toLowerCase()).join(' ')
  const scene: Scene | null = /(shut ?down|(switch|turn) off everything|everything off|all off|matikan semua|tutup semua)/.test(t)
    ? 'off'
    : /((switch|turn) on everything|everything on|all on|start (the )?class|hidupkan semua|mula(kan)? kelas)/.test(t)
      ? 'on'
      : null
  if (scene) {
    const { next, live, skipped } = sceneStates(devices, all, scene)
    if (live === 0) return { ok: false, reason: `${room.name} has no devices online to switch ${scene}.` }
    const label = scene === 'off' ? 'Everything switched off' : 'Everything switched on'
    return { ok: true, summary: `${label} in ${room.name}${skipped ? `, ${skipped} offline device${skipped > 1 ? 's' : ''} skipped` : ''}`, changes: next, failed: [], confirm: scene === 'off', count: live }
  }

  const match = deviceWords.find(([, re]) => re.test(t))
  if (!match) return { ok: false, reason: 'That isn’t on the approved command list. Try lights, fan, air-con, projector, display, door, microphone, or everything on or off.' }
  const [type, , word] = match
  const targets = devices.filter((d) => d.type === type)
  if (targets.length === 0) return { ok: false, reason: `${room.name} has no ${word} paired, so nothing was changed.` }

  const live = targets.filter((d) => d.status !== 'Offline')
  const failed = targets.filter((d) => d.status === 'Offline').map((d) => d.name)
  const changes: Record<string, DeviceState> = {}
  const apply = (patch: Partial<DeviceState>) => live.forEach((d) => (changes[d.id] = { ...stateOf(all, d), ...patch }))
  const num = (re: RegExp) => {
    const m = t.match(re)
    return m ? Number(m[1]) : null
  }

  let summary = ''
  if (type === 'Door controller') {
    if (/\b(unlock|buka kunci|buka pintu|open)\b/.test(t)) (apply({ locked: false }), (summary = `Door in ${room.name} unlocked`))
    else if (/\b(lock|kunci|tutup|close)\b/.test(t)) (apply({ locked: true }), (summary = `Door in ${room.name} locked`))
    else return { ok: false, reason: 'Say "lock the door" or "unlock the door".' }
  } else if (type === 'Air-conditioning' && /(\d{2})\s?(degrees?|°|darjah|c\b)|temp\w*/.test(t)) {
    return { ok: false, reason: 'Air-con can only be switched on or off. Say "switch on the air-con" or "switch off the air-con".' }
  } else if (type === 'Fan' && /(speed|kelajuan)/.test(t)) {
    return { ok: false, reason: 'The fan can only be switched on or off. Say "switch off the fan".' }
  } else if (type === 'Lights' && /\b(dim|malapkan|brightness|kecerahan)\b|(\d{1,3})\s?(%|percent|peratus)/.test(t)) {
    const v = num(/(\d{1,3})\s?(?:%|percent|peratus)?/) ?? 30
    if (v < 5 || v > 100) return { ok: false, reason: 'Brightness can be between 5 and 100 percent.' }
    apply({ on: true, level: v })
    summary = `Lights in ${room.name} dimmed to ${v}%`
  } else if (type === 'Ceiling microphone' && /\b(unmute)\b/.test(t)) {
    apply({ on: true })
    summary = `Microphones in ${room.name} live`
  } else if (type === 'Ceiling microphone' && /\b(mute|senyap)\b/.test(t)) {
    apply({ on: false })
    summary = `Microphones in ${room.name} muted`
  } else if (/\b(off|tutup|matikan|padam|stop)\b/.test(t)) {
    apply({ on: false })
    summary = `${word[0].toUpperCase()}${word.slice(1)} in ${room.name} switched off`
  } else if (/\b(on|hidupkan|buka|nyalakan|start)\b/.test(t)) {
    apply({ on: true })
    summary = `${word[0].toUpperCase()}${word.slice(1)} in ${room.name} switched on`
  } else {
    return { ok: false, reason: `I heard "${word}" but not what to do. Say on, off, lock or unlock (or dim, for lights).` }
  }
  if (live.length === 0) return { ok: false, reason: `The ${word} in ${room.name} is offline, so the command could not run. Check Maintenance.` }
  return { ok: true, summary, changes, failed, count: live.length }
}

interface Entry {
  id: number
  time: string
  said: string
  room?: string
  status: 'done' | 'partial' | 'rejected' | 'cancelled'
  text: string
}

const EXAMPLES = ['Dim the lights to 30% in DK2', 'Turn off the fan', 'Switch on the air-con', 'Lock the door', 'Switch everything on', 'Tutup lampu', 'Matikan kipas', 'Switch everything off']

export function VoiceCommand({ roomId, onClose }: { roomId?: string; onClose: () => void }) {
  const { state, update, audit, toast } = useDemo()
  const rooms = useMemo(() => state.spaces.filter((s) => s.kind === 'sub' && s.state !== 'Deactivated' && s.voice), [state.spaces])
  const [sel, setSel] = useState(roomId ?? '')
  const [lang, setLang] = useState<'en' | 'ms'>('en')
  const [text, setText] = useState('')
  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState('')
  const [log, setLog] = useState<Entry[]>([])
  const [pending, setPending] = useState<{ said: string; room: Space; plan: Extract<Plan, { ok: true }> } | null>(null)
  const rec = useRef<SR | null>(null)
  const SRClass = getSR()

  useEffect(() => () => rec.current?.stop(), [])

  const push = (e: Omit<Entry, 'id' | 'time'>) => setLog((l) => [{ ...e, id: Date.now() + Math.random(), time: nowLabel() }, ...l].slice(0, 12))

  const execute = (said: string, room: Space, plan: Extract<Plan, { ok: true }>) => {
    update((s) => ({ ...s, deviceState: { ...s.deviceState, ...plan.changes } }))
    const partial = plan.failed.length > 0
    audit({ area: 'Automation', action: 'Voice command', target: room.code, detail: `"${said}": ${plan.summary}${partial ? `; failed: ${plan.failed.join(', ')}` : ''}` })
    push({ said, room: room.name, status: partial ? 'partial' : 'done', text: `${plan.summary}${partial ? `. Not reached: ${plan.failed.join(', ')} (offline)` : ''}.` })
    toast(`${plan.summary}.`, partial ? 'warn' : 'ok')
  }

  const run = (raw: string) => {
    const said = raw.trim()
    if (!said) return
    setText('')
    const named = findRoom(said, rooms)
    const room = named ?? rooms.find((r) => r.id === sel)
    if (!room) {
      push({ said, status: 'rejected', text: 'Which room? Say the room name, for example "in DK2", or pick a room above. Commands never run on an unclear room.' })
      audit({ area: 'Automation', action: 'Voice command rejected', target: 'No room', detail: `"${said}": room not clear` })
      return
    }
    if (named && named.id !== sel) setSel(named.id)
    const devices = state.devices.filter((d) => d.spaceId === room.id)
    const plan = interpret(said, room, devices, state.deviceState)
    if (!plan.ok) {
      push({ said, room: room.name, status: 'rejected', text: plan.reason })
      audit({ area: 'Automation', action: 'Voice command rejected', target: room.code, detail: `"${said}": ${plan.reason}` })
      return
    }
    if (plan.confirm) {
      setPending({ said, room, plan })
      return
    }
    execute(said, room, plan)
  }

  const listen = () => {
    if (!SRClass) return
    if (listening) {
      rec.current?.stop()
      return
    }
    const r = new SRClass()
    r.lang = lang === 'en' ? 'en-MY' : 'ms-MY'
    r.interimResults = true
    r.continuous = false
    r.onresult = (e) => {
      let finalText = ''
      let mid = ''
      for (let i = 0; i < e.results.length; i++) {
        const res = e.results[i]
        if (res.isFinal) finalText += res[0].transcript
        else mid += res[0].transcript
      }
      setInterim(mid || finalText)
      if (finalText) {
        setInterim('')
        run(finalText)
      }
    }
    r.onerror = (e) => {
      setListening(false)
      toast(e.error === 'not-allowed' ? 'Microphone access was blocked. Allow it in the browser, or type the command instead.' : 'Couldn’t hear a command. Try again or type it below.', 'warn')
    }
    r.onend = () => setListening(false)
    rec.current = r
    setListening(true)
    r.start()
  }

  return (
    <Modal open onClose={onClose} wide title="Voice commands" sub="Speak or type a command. Only approved actions run, and every command is recorded in the audit log.">
      <div className="vc-top">
        <div className="field" style={{ marginBottom: 0, flex: 1, minWidth: 200 }}>
          <label htmlFor="vc-room">Room</label>
          <select id="vc-room" className="select" value={sel} onChange={(e) => setSel(e.target.value)}>
            <option value="">Say the room in the command</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}, {r.code}
              </option>
            ))}
          </select>
        </div>
        <div>
          <div className="xs strong" style={{ marginBottom: 6, color: 'var(--text-2)' }}>
            Language
          </div>
          <Seg value={lang} onChange={setLang} options={[{ id: 'en', label: 'English' }, { id: 'ms', label: 'Bahasa Melayu' }]} />
        </div>
      </div>

      <div className="vc-mic">
        <button className={`vc-mic-btn ${listening ? 'on' : ''}`} onClick={listen} disabled={!SRClass} aria-label={listening ? 'Stop listening' : 'Start listening'}>
          {SRClass ? <Mic size={30} /> : <MicOff size={30} />}
        </button>
        <div className="vc-mic-text">
          {!SRClass ? 'Voice input works in Chrome and Edge. Type the command below instead.' : listening ? interim || 'Listening… speak now' : 'Tap the microphone and speak'}
        </div>
      </div>

      <form
        className="vc-input"
        onSubmit={(e) => {
          e.preventDefault()
          run(text)
        }}
      >
        <input className="input" placeholder="Or type a command, e.g. dim the lights to 40% in DK2" value={text} onChange={(e) => setText(e.target.value)} aria-label="Command" />
        <button className="btn" type="submit" disabled={!text.trim()}>
          <Send size={15} /> Run
        </button>
      </form>
      <div className="vc-examples">
        {EXAMPLES.map((x) => (
          <button key={x} className="chip" onClick={() => run(x)}>
            {x}
          </button>
        ))}
      </div>

      {pending && (
        <div className="vc-confirm">
          <AlertTriangle size={18} />
          <div className="grow">
            <strong className="small">Confirm: {pending.plan.summary}</strong>
            <p className="xs muted">This switches off {pending.plan.count} devices in the room. Doors and sensors are not changed.</p>
          </div>
          <button
            className="btn secondary sm"
            onClick={() => {
              push({ said: pending.said, room: pending.room.name, status: 'cancelled', text: 'Cancelled before it ran.' })
              setPending(null)
            }}
          >
            Cancel
          </button>
          <button
            className="btn danger sm"
            onClick={() => {
              execute(pending.said, pending.room, pending.plan)
              setPending(null)
            }}
          >
            Confirm
          </button>
        </div>
      )}

      <h3 className="small strong mt-2" style={{ marginBottom: 8 }}>
        Recent commands
      </h3>
      {log.length === 0 ? (
        <p className="small muted">Commands you give appear here with what was understood and what happened.</p>
      ) : (
        <div className="vc-log">
          {log.map((e) => (
            <div key={e.id} className={`vc-entry ${e.status}`}>
              {e.status === 'done' ? <CheckCircle2 size={16} /> : e.status === 'partial' ? <AlertTriangle size={16} /> : <XCircle size={16} />}
              <div className="grow">
                <div className="small">
                  <strong>“{e.said}”</strong> {e.room && <span className="muted">in {e.room}</span>}
                </div>
                <div className="xs">{e.text}</div>
              </div>
              <span className="xs muted num">{e.time}</span>
              <Badge tone={e.status === 'done' ? 'green' : e.status === 'partial' ? 'amber' : e.status === 'cancelled' ? '' : 'red'}>{e.status === 'done' ? 'Done' : e.status === 'partial' ? 'Partly done' : e.status === 'cancelled' ? 'Cancelled' : 'Not run'}</Badge>
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}
