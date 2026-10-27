import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, Building2, CheckCircle2, ChevronDown, ChevronRight, Circle, CircleAlert, Download, FileUp, FolderTree, Link2, Loader2, Plus, Search, Upload, Wifi, WifiOff, XCircle } from 'lucide-react'
import { Badge, Empty, Metric, Modal, Notice, PageHead, Panel, Switch, Tabs, type Tone } from '../../components/ui'
import { AUTO_OFF_TYPES, buildings, CAMPUS, capsOf, defaultDeviceName, discoveredFor, IOT_NETWORK, modelFor, shortType, type Device, type Discovered, type Space, type SpaceState, type SubType } from '../../data/smartcampus'
import { useDemo } from '../../store/DemoStore'
import { downloadCsv } from './csv'
import '../../styles/management.css'
import '../../styles/smartcampus.css'

const SUB_TYPES: SubType[] = ['Lecture hall', 'Auditorium', 'Smart room', 'Seminar room', 'Lab', 'Control room']
const STATES: SpaceState[] = ['Operational', 'Setup incomplete', 'Under maintenance', 'Deactivated']
const stateTone: Record<SpaceState, Tone> = { Operational: 'green', 'Setup incomplete': 'amber', 'Under maintenance': 'red', Deactivated: '' }
const devTone = { Online: 'green', Offline: 'red', Stale: 'amber' } as const
const CODE_RE = /^[A-Z0-9-]{2,20}$/

export function setupChecks(sp: Space, devices: Device[]) {
  const mine = devices.filter((d) => d.spaceId === sp.id)
  return [
    { label: 'Devices paired', ok: mine.length > 0, detail: `${mine.length} devices` },
    { label: 'Occupancy source linked', ok: !!sp.occupancySource, detail: sp.occupancySource ?? 'Not configured' },
    { label: 'Door controller linked', ok: !!sp.doorId, detail: sp.doorId ?? 'Not configured' },
    { label: 'Timetable linked', ok: sp.timetable, detail: sp.timetable ? 'Student information system timetable' : 'Not linked' },
    { label: 'All devices reporting', ok: mine.length > 0 && mine.every((d) => d.status === 'Online'), detail: mine.length ? `${mine.filter((d) => d.status !== 'Online').length} offline or stale` : 'No devices yet' },
  ]
}

export default function CampusSetup() {
  const { state } = useDemo()
  const [params] = useSearchParams()
  const [tab, setTab] = useState<'rooms' | 'devices'>('rooms')
  const [sel, setSel] = useState(params.get('room') ?? 'sp-dk2')
  const [adding, setAdding] = useState<{ kind: 'master' | 'sub'; parentId?: string } | null>(null)
  const [importing, setImporting] = useState(false)

  const subs = state.spaces.filter((s) => s.kind === 'sub')
  const offline = state.devices.filter((d) => d.status !== 'Online').length

  return (
    <>
      <PageHead
        title="Campus setup"
        sub="The first step of setup. Create master rooms and their sub rooms, then pair the devices in each room. Paired rooms appear in Smart rooms."
        actions={
          <>
            <button className="btn secondary" onClick={() => setImporting(true)}>
              <Upload size={16} /> Import rooms
            </button>
            <button className="btn secondary" onClick={() => setAdding({ kind: 'master' })}>
              <FolderTree size={16} /> Add master room
            </button>
            <button className="btn" onClick={() => setAdding({ kind: 'sub' })}>
              <Plus size={16} /> Add sub room
            </button>
          </>
        }
      />
      <div className="metrics m-5">
        <Metric label="Buildings" value={buildings.length} foot={CAMPUS} />
        <Metric label="Master rooms" value={state.spaces.filter((s) => s.kind === 'master').length} foot="Room groups and main spaces" />
        <Metric label="Sub rooms" value={subs.filter((s) => s.state !== 'Deactivated').length} foot={`${subs.filter((s) => s.state === 'Setup incomplete').length} still in setup`} />
        <Metric label="Paired devices" value={state.devices.length} foot="Displays, lights, sensors, doors" />
        <Metric label="Offline or stale" value={offline} foot={<span className={offline ? 'delta-down' : ''}>Needs attention</span>} />
      </div>
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'rooms', label: 'Master rooms and sub rooms' },
          { id: 'devices', label: <>Device registry <Badge>{state.devices.length}</Badge></> },
        ]}
      />
      {tab === 'rooms' ? <RoomsTab sel={sel} setSel={setSel} onAddSub={(parentId) => setAdding({ kind: 'sub', parentId })} /> : <DevicesTab />}
      {adding && (
        <AddRoomModal
          kind={adding.kind}
          parentId={adding.parentId}
          onClose={() => setAdding(null)}
          onAdded={(id) => {
            setSel(id)
            setTab('rooms')
          }}
        />
      )}
      <ImportModal open={importing} onClose={() => setImporting(false)} />
    </>
  )
}

/* ---------------- Rooms tab ---------------- */

function RoomsTab({ sel, setSel, onAddSub }: { sel: string; setSel: (id: string) => void; onAddSub: (parentId: string) => void }) {
  const { state } = useDemo()
  const [params] = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const space = state.spaces.find((s) => s.id === sel)
  const match = (s: Space) => `${s.name} ${s.code}`.toLowerCase().includes(q.toLowerCase())

  return (
    <div className="grid g-side-main">
      <Panel title={CAMPUS} sub="Building, master room and sub room" bodyClass="panel-body tight">
        <div style={{ padding: '4px 16px 10px' }}>
          <div className="search-field">
            <Search size={16} />
            <input className="input sm" placeholder="Find a room or code" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Find a room" />
          </div>
        </div>
        <div className="tree">
          {buildings.map((b) => {
            const masters = state.spaces.filter((m) => m.kind === 'master' && m.buildingId === b.id)
            const visible = masters.filter((m) => match(m) || state.spaces.some((s) => s.parentId === m.id && match(s)))
            if (q && visible.length === 0) return null
            const open = !collapsed[b.id] || !!q
            return (
              <div key={b.id}>
                <button className="tree-b" onClick={() => setCollapsed((c) => ({ ...c, [b.id]: !c[b.id] }))} aria-expanded={open}>
                  {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                  <Building2 size={15} />
                  <span className="grow truncate">{b.name}</span>
                </button>
                {open &&
                  visible.map((m) => {
                    const kids = state.spaces.filter((s) => s.parentId === m.id && (!q || match(s) || match(m)))
                    return (
                      <div key={m.id} className="tree-f">
                        <button className={`tree-m ${m.id === sel ? 'on' : ''}`} onClick={() => setSel(m.id)}>
                          <FolderTree size={14} />
                          <span className="grow truncate">{m.name}</span>
                          <span className="xs muted">{kids.length}</span>
                        </button>
                        {kids.map((r) => (
                          <button key={r.id} className={`tree-r ${r.id === sel ? 'on' : ''}`} onClick={() => setSel(r.id)}>
                            <span className={`dot st-${stateTone[r.state] || 'grey'}`} />
                            <span className="grow truncate">{r.name}</span>
                            <span className="xs muted">{state.devices.filter((d) => d.spaceId === r.id).length} dev</span>
                          </button>
                        ))}
                      </div>
                    )
                  })}
              </div>
            )
          })}
        </div>
      </Panel>
      {space ? (
        space.kind === 'master' ? (
          <MasterEditor key={space.id} master={space} onOpen={setSel} onAddSub={() => onAddSub(space.id)} />
        ) : (
          <SubEditor key={space.id} space={space} />
        )
      ) : (
        <Panel>
          <Empty title="Choose a room">Select a master room or sub room on the left.</Empty>
        </Panel>
      )}
    </div>
  )
}

function MasterEditor({ master, onOpen, onAddSub }: { master: Space; onOpen: (id: string) => void; onAddSub: () => void }) {
  const { state, update, toast, audit } = useDemo()
  const [name, setName] = useState(master.name)
  const [code, setCode] = useState(master.code)
  const kids = state.spaces.filter((s) => s.parentId === master.id)
  const b = buildings.find((x) => x.id === master.buildingId)!
  const dirty = name !== master.name || code !== master.code

  const save = () => {
    const c = code.trim().toUpperCase()
    if (!name.trim()) return toast('Master room name is required.', 'warn')
    if (!CODE_RE.test(c)) return toast('Code must be 2 to 20 characters: capital letters, numbers and hyphens.', 'warn')
    if (state.spaces.some((s) => s.id !== master.id && s.code === c)) return toast(`Code ${c} is already used.`, 'warn')
    update((s) => ({ ...s, spaces: s.spaces.map((x) => (x.id === master.id ? { ...x, name: name.trim(), code: c } : x)) }))
    audit({ area: 'Rooms', action: 'Updated master room', target: c, detail: `${master.name} to ${name.trim()}` })
    toast(`${name.trim()} saved.`)
  }

  return (
    <div className="stack">
      <Panel
        title={master.name}
        sub={`Master room, ${b.name}`}
        action={<Badge tone="plum">Master room</Badge>}
        foot={
          <>
            <span>{dirty ? 'You have unsaved changes.' : 'All changes saved.'}</span>
            <button className="btn sm" onClick={save} disabled={!dirty}>
              Save changes
            </button>
          </>
        }
      >
        <div className="grid g-2" style={{ gap: 12 }}>
          <div className="field">
            <label htmlFor="mr-name">Master room name</label>
            <input id="mr-name" className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="mr-code">Code</label>
            <input id="mr-code" className="input" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
          </div>
        </div>
        <p className="xs muted">A master room groups related sub rooms, such as a lecture complex and its halls. Devices are paired to sub rooms.</p>
      </Panel>
      <Panel title="Sub rooms" sub={`${kids.length} in ${master.name}`} action={<button className="btn sm" onClick={onAddSub}><Plus size={14} /> Add sub room</button>} bodyClass="panel-body tight">
        {kids.length === 0 ? (
          <Empty title="No sub rooms yet">Add the first sub room to start pairing devices.</Empty>
        ) : (
          <div className="list">
            {kids.map((k) => {
              const devs = state.devices.filter((d) => d.spaceId === k.id)
              return (
                <button key={k.id} className="list-item clickable" style={{ border: 0, background: 'none', width: '100%', textAlign: 'left', borderBottom: '1px solid var(--line)' }} onClick={() => onOpen(k.id)}>
                  <span className="icon-tile sm">
                    <Building2 size={16} />
                  </span>
                  <div className="grow">
                    <div className="title">{k.name}</div>
                    <div className="sub">
                      {k.type}, {k.floor}, capacity {k.capacity}, {devs.length} devices
                    </div>
                  </div>
                  <Badge tone={stateTone[k.state]}>{k.state}</Badge>
                </button>
              )
            })}
          </div>
        )}
      </Panel>
    </div>
  )
}

function SubEditor({ space }: { space: Space }) {
  const { state, update, toast, audit } = useDemo()
  const [draft, setDraft] = useState<Space>(space)
  const [pairOpen, setPairOpen] = useState(false)
  const [confirmDeact, setConfirmDeact] = useState(false)
  const devices = state.devices.filter((d) => d.spaceId === space.id)
  const checks = setupChecks(draft, state.devices)
  const passing = checks.filter((c) => c.ok).length
  const b = buildings.find((x) => x.id === space.buildingId)!
  const masters = state.spaces.filter((s) => s.kind === 'master' && s.buildingId === space.buildingId)
  const dirty = JSON.stringify(draft) !== JSON.stringify(space)

  const save = () => {
    const code = draft.code.trim().toUpperCase()
    if (!draft.name.trim()) return toast('Room name is required.', 'warn')
    if (!CODE_RE.test(code)) return toast('Room code must be 2 to 20 characters: capital letters, numbers and hyphens.', 'warn')
    if (state.spaces.some((s) => s.id !== space.id && s.code === code)) return toast(`Room code ${code} is already used by another room.`, 'warn')
    if (!(draft.capacity > 0 && draft.capacity <= 5000)) return toast('Capacity must be between 1 and 5000.', 'warn')
    const changes = (Object.keys(draft) as (keyof Space)[]).filter((k) => String(draft[k]) !== String(space[k])).map((k) => `${k}: ${String(space[k])} to ${String(k === 'code' ? code : draft[k])}`)
    update((s) => ({ ...s, spaces: s.spaces.map((x) => (x.id === space.id ? { ...draft, code } : x)) }))
    audit({ area: 'Rooms', action: 'Updated sub room', target: code, detail: changes.join('; ') || 'No field changes' })
    toast(`${draft.name} saved.`)
  }

  const deactivate = () => {
    update((s) => ({ ...s, spaces: s.spaces.map((x) => (x.id === space.id ? { ...x, state: 'Deactivated' } : x)) }))
    audit({ area: 'Rooms', action: 'Deactivated sub room', target: space.code })
    toast(`${space.name} deactivated. It no longer appears in Smart rooms.`)
    setConfirmDeact(false)
  }

  const set = <K extends keyof Space>(k: K, v: Space[K]) => setDraft((d) => ({ ...d, [k]: v }))

  return (
    <div className="stack">
      <Panel
        title={space.name}
        sub={`Sub room ${space.code}, ${masters.find((m) => m.id === space.parentId)?.name ?? ''}, ${b.name}`}
        action={<Badge tone={stateTone[space.state]}>{space.state}</Badge>}
        foot={
          <>
            <span>{dirty ? 'You have unsaved changes.' : 'All changes saved.'}</span>
            <div className="row" style={{ gap: 8 }}>
              {space.state !== 'Deactivated' && (
                <button className="btn secondary sm" onClick={() => setConfirmDeact(true)}>
                  Deactivate
                </button>
              )}
              <button className="btn sm" onClick={save} disabled={!dirty}>
                Save changes
              </button>
            </div>
          </>
        }
      >
        <div className="grid g-2" style={{ gap: 12 }}>
          <div className="field">
            <label htmlFor="rm-name">Room name</label>
            <input id="rm-name" className="input" value={draft.name} onChange={(e) => set('name', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="rm-code">Room code</label>
            <input id="rm-code" className="input" value={draft.code} onChange={(e) => set('code', e.target.value.toUpperCase())} />
          </div>
          <div className="field">
            <label htmlFor="rm-master">Master room</label>
            <select id="rm-master" className="select" value={draft.parentId ?? ''} onChange={(e) => set('parentId', e.target.value)}>
              {masters.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="rm-type">Type</label>
            <select id="rm-type" className="select" value={draft.type} onChange={(e) => set('type', e.target.value as SubType)}>
              {SUB_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="rm-cap">Capacity</label>
            <input id="rm-cap" className="input" type="number" min={1} value={draft.capacity} onChange={(e) => set('capacity', Number(e.target.value))} />
          </div>
          <div className="field">
            <label htmlFor="rm-state">State</label>
            <select id="rm-state" className="select" value={draft.state} onChange={(e) => set('state', e.target.value as SpaceState)}>
              {STATES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="rm-occ">Occupancy source</label>
            <select id="rm-occ" className="select" value={draft.occupancySource ?? ''} onChange={(e) => set('occupancySource', e.target.value || null)}>
              <option value="">Not configured</option>
              {[...new Set([space.occupancySource, `People counter PC-${space.code}`, `Motion sensor MS-${space.code}`].filter(Boolean) as string[])].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="rm-door">Door controller</label>
            <select id="rm-door" className="select" value={draft.doorId ?? ''} onChange={(e) => set('doorId', e.target.value || null)}>
              <option value="">Not configured</option>
              {[...new Set([space.doorId, `DR-${space.code}`].filter(Boolean) as string[])].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="row wrap" style={{ gap: 24, marginTop: 4 }}>
          <label className="row small" style={{ gap: 8 }}>
            <Switch on={draft.timetable} onChange={(v) => set('timetable', v)} label="Timetable linked" /> Linked to the timetable
          </label>
          <label className="row small" style={{ gap: 8 }}>
            <Switch on={draft.voice} onChange={(v) => set('voice', v)} label="Voice commands" /> Voice commands allowed
          </label>
        </div>
      </Panel>

      <div className="grid g-2">
        <Panel
          title="Paired devices"
          sub={`${devices.length} in this room`}
          action={
            <button className="btn sm" onClick={() => setPairOpen(true)} disabled={space.state === 'Deactivated'}>
              <Link2 size={14} /> Pair a device
            </button>
          }
          bodyClass="panel-body tight"
          foot={devices.length > 0 ? <Link to={`/management/rooms?room=${space.id}`} className="link-btn row" style={{ gap: 6 }}>Control these devices in Smart rooms <ArrowRight size={13} /></Link> : undefined}
        >
          <div className="list">
            {devices.length === 0 && (
              <div className="empty" style={{ padding: '24px 20px' }}>
                <strong>No devices paired yet</strong>
                Pair the display, lights and sensors in this room to use it in Smart rooms.
              </div>
            )}
            {devices.map((d) => (
              <div key={d.id} className="list-item" style={{ padding: '10px 20px' }}>
                <Circle size={9} fill={d.status === 'Online' ? 'var(--green)' : d.status === 'Stale' ? 'var(--amber)' : 'var(--red)'} color="transparent" />
                <div className="grow">
                  <div className="title small truncate">{d.name}</div>
                  <div className="sub xs truncate">
                    {d.type}, {d.id}
                  </div>
                </div>
                <Badge tone={devTone[d.status]}>{d.status}</Badge>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Setup checks" sub={passing === checks.length ? 'Ready to operate' : `${checks.length - passing} of ${checks.length} checks need attention`}>
          <div className="checks">
            {checks.map((c) => (
              <div key={c.label} className="check-row">
                {c.ok ? <CheckCircle2 size={18} color="var(--green)" /> : <CircleAlert size={18} color="var(--amber)" />}
                <div className="grow">
                  <strong className="small">{c.label}</strong>
                  <div className="xs muted">{c.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {pairOpen && <PairWizard space={space} onClose={() => setPairOpen(false)} />}
      <Modal
        open={confirmDeact}
        onClose={() => setConfirmDeact(false)}
        title={`Deactivate ${space.name}?`}
        sub="The room is hidden from Smart rooms and schedules. Its devices and history are kept, and you can reactivate it later."
        foot={
          <>
            <button className="btn secondary" onClick={() => setConfirmDeact(false)}>
              Keep active
            </button>
            <button className="btn danger" onClick={deactivate}>
              Deactivate
            </button>
          </>
        }
      >
        <p className="small">This change is recorded in the audit log.</p>
      </Modal>
    </div>
  )
}

/* ---------------- Device pairing wizard ---------------- */

type Step = 'pick' | 'network' | 'pairing' | 'success' | 'fail-network' | 'fail-code'

const PAIR_STAGES = [
  { at: 0, label: 'Connecting to the device' },
  { at: 20, label: 'Checking the pairing number' },
  { at: 45, label: 'Exchanging security keys' },
  { at: 70, label: 'Registering in the device registry' },
  { at: 88, label: 'Testing control: switching on and off' },
]

function PairWizard({ space, onClose }: { space: Space; onClose: () => void }) {
  const { state, update, toast, audit } = useDemo()
  const navigate = useNavigate()
  const gateway = `GW-${space.code}`
  const already = new Set(state.devices.map((d) => d.pairing).filter(Boolean))
  const found = discoveredFor(space).filter((d) => !already.has(d.pairing))
  const [step, setStep] = useState<Step>('pick')
  const [pick, setPick] = useState<Discovered | null>(found[0] ?? null)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [moved, setMoved] = useState<Record<string, boolean>>({})
  const [checks, setChecks] = useState<('wait' | 'ok' | 'bad')[]>([])
  const [pct, setPct] = useState(0)
  const [made, setMade] = useState<Device | null>(null)
  const timers = useRef<number[]>([])

  const net = (d: Discovered) => (moved[d.key] ? IOT_NETWORK : d.network)
  const uniqueName = (d: Discovered) => {
    const base = defaultDeviceName(space.name, d.type)
    const taken = new Set(state.devices.filter((x) => x.spaceId === space.id).map((x) => x.name.toLowerCase()))
    if (!taken.has(base.toLowerCase())) return base
    let n = 2
    while (taken.has(`${base} ${n}`.toLowerCase())) n++
    return `${base} ${n}`
  }
  useEffect(() => () => timers.current.forEach((t) => clearTimeout(t)), [])
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms))

  const choose = (d: Discovered) => {
    setPick(d)
    setName(uniqueName(d))
  }
  useEffect(() => {
    if (found[0]) setName(uniqueName(found[0]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const startNetwork = (movedNow = false) => {
    if (!pick) return
    if (!name.trim()) return toast('Give the device a name.', 'warn')
    if (state.devices.some((d) => d.spaceId === space.id && d.name.toLowerCase() === name.trim().toLowerCase())) return toast('A device in this room already has that name.', 'warn')
    if (!/^\d{6}$/.test(code.replace(/\s/g, ''))) return toast('Enter the 6-digit pairing number shown on the device.', 'warn')
    setStep('network')
    setChecks(['wait', 'wait', 'wait'])
    const same = movedNow || net(pick) === IOT_NETWORK
    later(() => setChecks(['ok', 'wait', 'wait']), 800)
    later(() => setChecks(['ok', 'ok', 'wait']), 1600)
    later(() => {
      setChecks(['ok', 'ok', same ? 'ok' : 'bad'])
      if (same) later(startPairing, 700)
      else later(() => setStep('fail-network'), 900)
    }, 2400)
  }

  const startPairing = () => {
    if (!pick) return
    setStep('pairing')
    setPct(0)
    const right = code.replace(/\s/g, '') === pick.pairing
    let p = 0
    const tick = () => {
      p += 2
      setPct(p)
      if (!right && p >= 34) return later(() => setStep('fail-code'), 500)
      if (p >= 100) return later(finish, 400)
      later(tick, 70)
    }
    later(tick, 200)
  }

  const finish = () => {
    if (!pick) return
    let n = state.devices.filter((d) => d.spaceId === space.id).length
    let id = `${space.code}-${shortType(pick.type)}${n}`
    while (state.devices.some((d) => d.id === id)) id = `${space.code}-${shortType(pick.type)}${++n}`
    const dev: Device = {
      id,
      name: name.trim(),
      type: pick.type,
      spaceId: space.id,
      model: modelFor(pick.type),
      network: IOT_NETWORK,
      pairing: pick.pairing,
      status: 'Online',
      capabilities: capsOf[pick.type],
      lastSeen: 'Just now',
      maintenance: 'No action needed',
      autoOffEligible: AUTO_OFF_TYPES.includes(pick.type),
    }
    update((s) => ({ ...s, devices: [...s.devices, dev] }))
    audit({ area: 'Devices', action: 'Paired device', target: dev.name, detail: `${dev.id}, ${pick.label}, ${IOT_NETWORK}, room ${space.code}` })
    toast(`${dev.name} paired and registered.`)
    setMade(dev)
    setStep('success')
  }

  const stage = [...PAIR_STAGES].reverse().find((s) => pct >= s.at)?.label
  const steps = ['Choose device', 'Network check', 'Pairing', 'Done']
  const stepIdx = step === 'pick' ? 0 : step === 'network' || step === 'fail-network' ? 1 : step === 'pairing' || step === 'fail-code' ? 2 : 3

  return (
    <Modal open onClose={onClose} wide title={`Pair a device in ${space.name}`} sub={`Room gateway ${gateway} on ${IOT_NETWORK}`}>
      <ol className="wiz-steps">
        {steps.map((s, i) => (
          <li key={s} className={i < stepIdx ? 'done' : i === stepIdx ? (step.startsWith('fail') ? 'bad' : 'on') : ''}>
            <span>{i + 1}</span>
            {s}
          </li>
        ))}
      </ol>

      {step === 'pick' && (
        <>
          {found.length === 0 ? (
            <Empty title="No new devices found nearby">Switch on the device and put it in pairing mode, then open this again.</Empty>
          ) : (
            <>
              <p className="small muted" style={{ marginBottom: 10 }}>
                Devices found near {space.name} that are waiting to be paired:
              </p>
              <div className="disc-grid">
                {found.map((d) => (
                  <button key={d.key} className={`disc ${pick?.key === d.key ? 'on' : ''}`} onClick={() => choose(d)}>
                    <strong className="small">{d.label}</strong>
                    <span className="xs muted">{d.type}</span>
                    <span className="xs row" style={{ gap: 4, color: net(d) === IOT_NETWORK ? 'var(--green)' : 'var(--amber)' }}>
                      {net(d) === IOT_NETWORK ? <Wifi size={12} /> : <WifiOff size={12} />} {net(d)}
                    </span>
                  </button>
                ))}
              </div>
              <div className="grid g-2 mt-2" style={{ gap: 12 }}>
                <div className="field">
                  <label htmlFor="pw-name">Device name</label>
                  <input id="pw-name" className="input" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="pw-code">Pairing number</label>
                  <input id="pw-code" className="input num" inputMode="numeric" maxLength={7} placeholder="6 digits" value={code} onChange={(e) => setCode(e.target.value.replace(/[^\d ]/g, ''))} />
                  {pick && <span className="hint">Shown on the device screen. Demo number for {pick.label}: {pick.pairing}</span>}
                </div>
              </div>
              <div className="row" style={{ justifyContent: 'flex-end', gap: 8 }}>
                <button className="btn secondary" onClick={onClose}>
                  Cancel
                </button>
                <button className="btn" onClick={() => startNetwork()} disabled={!pick}>
                  Check network
                </button>
              </div>
            </>
          )}
        </>
      )}

      {(step === 'network' || step === 'fail-network') && pick && (
        <div className="net-checks">
          {[`Room gateway ${gateway} is online on ${IOT_NETWORK}`, `${pick.label} found at ${moved[pick.key] ? '10.20.120.88' : pick.ip} on ${net(pick)}`, 'Device and room gateway are on the same network'].map((t, i) => (
            <div key={t} className={`net-check ${checks[i] ?? 'wait'}`}>
              {checks[i] === 'ok' ? <CheckCircle2 size={18} /> : checks[i] === 'bad' ? <XCircle size={18} /> : <Loader2 size={18} className="spin" />}
              <span>{t}</span>
            </div>
          ))}
        </div>
      )}

      {step === 'fail-network' && pick && (
        <div className="trouble">
          <h3>
            <WifiOff size={18} /> The device is on a different network
          </h3>
          <p className="small">
            {pick.label} is on {pick.network}. The room gateway is on {IOT_NETWORK}. Both must be on the same network before they can pair.
          </p>
          <ol>
            <li>Open the device network settings and connect it to UM-IoT, not UM-Guest.</li>
            <li>If the device uses a cable, plug it into a wall port labelled IoT (VLAN 120).</li>
            <li>Wait about 30 seconds for the device to get a new address, then check again.</li>
            <li>Still failing? Ask network operations to confirm the device is allowed on UM-IoT.</li>
          </ol>
          <div className="row wrap" style={{ gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn secondary" onClick={() => setStep('pick')}>
              Back to devices
            </button>
            <button
              className="btn"
              onClick={() => {
                setMoved((m) => ({ ...m, [pick.key]: true }))
                startNetwork(true)
              }}
            >
              I moved it to UM-IoT, check again
            </button>
          </div>
        </div>
      )}

      {step === 'pairing' && pick && (
        <div className="pairing">
          <div className="row between small">
            <strong>{name}</strong>
            <span className="num strong">{pct}%</span>
          </div>
          <div className="bar pair-bar">
            <span style={{ width: `${pct}%` }} />
          </div>
          <p className="small muted row" style={{ gap: 8 }}>
            <Loader2 size={15} className="spin" /> {stage}
          </p>
        </div>
      )}

      {step === 'fail-code' && pick && (
        <div className="trouble">
          <h3>
            <XCircle size={18} /> Pairing number didn't match
          </h3>
          <p className="small">{pick.label} rejected the pairing number. Nothing was registered.</p>
          <ol>
            <li>Check the 6-digit number on the device screen and type it again.</li>
            <li>Numbers expire after 5 minutes. Press the pair button on the device to show a new one.</li>
            <li>Make sure you picked the right device in the list. Its name is shown on the screen too.</li>
          </ol>
          <div className="row wrap" style={{ gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn"
              onClick={() => {
                setCode('')
                setStep('pick')
              }}
            >
              Enter the number again
            </button>
          </div>
        </div>
      )}

      {step === 'success' && made && (
        <div className="pair-ok">
          <CheckCircle2 size={40} />
          <h3>{made.name} is paired</h3>
          <p className="small muted">The device is registered and responding. It is now available in Smart rooms.</p>
          <dl className="kv" style={{ textAlign: 'left', maxWidth: 420, margin: '14px auto' }}>
            <dt>Device ID</dt>
            <dd>{made.id}</dd>
            <dt>Type</dt>
            <dd>{made.type}</dd>
            <dt>Room</dt>
            <dd>{space.name}</dd>
            <dt>Network</dt>
            <dd>{made.network}</dd>
            <dt>Can do</dt>
            <dd>{made.capabilities.join(', ')}</dd>
          </dl>
          <div className="row wrap" style={{ gap: 8, justifyContent: 'center' }}>
            <button
              className="btn secondary"
              onClick={() => {
                setMade(null)
                setCode('')
                setStep('pick')
                const next = found.find((d) => d.key !== pick?.key)
                if (next) choose(next)
              }}
            >
              Pair another device
            </button>
            <button className="btn" onClick={() => navigate(`/management/rooms?room=${space.id}`)}>
              Open in Smart rooms <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}

/* ---------------- Device registry ---------------- */

function DevicesTab() {
  const { state } = useDemo()
  const [q, setQ] = useState('')
  const [type, setType] = useState('all')
  const [status, setStatus] = useState('all')
  const [bld, setBld] = useState('all')
  const spaceOf = useMemo(() => Object.fromEntries(state.spaces.map((s) => [s.id, s])), [state.spaces])
  const types = [...new Set(state.devices.map((d) => d.type))]
  const list = state.devices.filter((d) => {
    const sp = spaceOf[d.spaceId]
    if (type !== 'all' && d.type !== type) return false
    if (status !== 'all' && d.status !== status) return false
    if (bld !== 'all' && sp?.buildingId !== bld) return false
    return `${d.id} ${d.name} ${d.type} ${sp?.name} ${d.model}`.toLowerCase().includes(q.toLowerCase())
  })
  return (
    <Panel bodyClass="">
      <div className="mg-filters">
        <div className="search-field">
          <Search size={16} />
          <input className="input" placeholder="Search device name, ID or room" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search devices" />
        </div>
        <select className="select" value={type} onChange={(e) => setType(e.target.value)} aria-label="Type">
          <option value="all">All types</option>
          {types.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <select className="select" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          <option value="all">Any status</option>
          <option>Online</option>
          <option>Stale</option>
          <option>Offline</option>
        </select>
        <select className="select" value={bld} onChange={(e) => setBld(e.target.value)} aria-label="Building">
          <option value="all">All buildings</option>
          {buildings.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Device</th>
              <th>Room</th>
              <th>Network</th>
              <th>Can do</th>
              <th>Auto-off</th>
              <th>Status</th>
              <th>Last seen</th>
            </tr>
          </thead>
          <tbody>
            {list.map((d) => (
              <tr key={d.id}>
                <td>
                  <strong className="small">{d.name}</strong>
                  <div className="xs muted">
                    {d.type}, {d.id}
                  </div>
                </td>
                <td className="small">{spaceOf[d.spaceId]?.name}</td>
                <td className="small">{d.network}</td>
                <td className="xs">{d.capabilities.join(', ')}</td>
                <td>{d.autoOffEligible ? <Badge tone="blue">Eligible</Badge> : <Badge>Excluded</Badge>}</td>
                <td>
                  <Badge tone={devTone[d.status]}>{d.status}</Badge>
                </td>
                <td className="small">{d.lastSeen}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="panel-foot">
        <span>
          Showing {list.length} of {state.devices.length} devices. Doors, cameras and sensors are always excluded from automatic switch-off.
        </span>
      </div>
    </Panel>
  )
}

/* ---------------- Add master room or sub room ---------------- */

function AddRoomModal({ kind, parentId, onClose, onAdded }: { kind: 'master' | 'sub'; parentId?: string; onClose: () => void; onAdded: (id: string) => void }) {
  const { state, update, toast, audit } = useDemo()
  const masters = state.spaces.filter((s) => s.kind === 'master')
  const [mid, setMid] = useState(parentId ?? masters[0]?.id ?? '')
  const parent = masters.find((m) => m.id === mid)
  const [bid, setBid] = useState(buildings[0].id)
  const b = buildings.find((x) => x.id === (kind === 'sub' ? parent?.buildingId : bid)) ?? buildings[0]
  const [floor, setFloor] = useState(b.floors[0])
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [type, setType] = useState<SubType>('Seminar room')
  const [cap, setCap] = useState(40)
  const [err, setErr] = useState('')

  const save = () => {
    const c = code.trim().toUpperCase()
    if (!name.trim()) return setErr('Enter a name.')
    if (!CODE_RE.test(c)) return setErr('Code must be 2 to 20 characters: capital letters, numbers and hyphens.')
    if (state.spaces.some((s) => s.code === c)) return setErr(`Code ${c} already exists. Use a different code.`)
    if (kind === 'sub' && !parent) return setErr('Choose a master room first.')
    if (kind === 'sub' && !(cap > 0 && cap <= 5000)) return setErr('Capacity must be between 1 and 5000.')
    const fl = b.floors.includes(floor) ? floor : b.floors[0]
    const sp: Space =
      kind === 'master'
        ? { id: `m-${Date.now()}`, kind: 'master', parentId: null, code: c, name: name.trim(), buildingId: b.id, floor: fl, type: 'Master room', capacity: 0, state: 'Operational', occupancySource: null, camera: null, doorId: null, timetable: true, voice: false }
        : { id: `sp-${Date.now()}`, kind: 'sub', parentId: parent!.id, code: c, name: name.trim(), buildingId: b.id, floor: fl, type, capacity: cap, state: 'Setup incomplete', occupancySource: null, camera: null, doorId: null, timetable: false, voice: false }
    update((s) => ({ ...s, spaces: [...s.spaces, sp] }))
    audit({ area: 'Rooms', action: kind === 'master' ? 'Created master room' : 'Created sub room', target: c, detail: kind === 'master' ? b.name : `${type} in ${parent!.name}, capacity ${cap}` })
    toast(kind === 'master' ? `${sp.name} created. Add its sub rooms next.` : `${sp.name} created. Pair its devices to finish setup.`)
    onClose()
    onAdded(sp.id)
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={kind === 'master' ? 'Add master room' : 'Add sub room'}
      sub={kind === 'master' ? 'A master room groups related sub rooms, for example a lecture complex.' : 'Sub rooms hold the devices. New sub rooms start as Setup incomplete until devices are paired.'}
      foot={
        <>
          <button className="btn secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn" onClick={save}>
            {kind === 'master' ? 'Create master room' : 'Create sub room'}
          </button>
        </>
      }
    >
      <div className="grid g-2" style={{ gap: 12 }}>
        {kind === 'master' ? (
          <div className="field">
            <label htmlFor="ar-b">Building</label>
            <select id="ar-b" className="select" value={bid} onChange={(e) => setBid(e.target.value)}>
              {buildings.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="field">
            <label htmlFor="ar-m">Master room</label>
            <select id="ar-m" className="select" value={mid} onChange={(e) => setMid(e.target.value)}>
              {buildings.map((bb) => (
                <optgroup key={bb.id} label={bb.name}>
                  {masters
                    .filter((m) => m.buildingId === bb.id)
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </div>
        )}
        <div className="field">
          <label htmlFor="ar-f">Floor</label>
          <select id="ar-f" className="select" value={floor} onChange={(e) => setFloor(e.target.value)}>
            {b.floors.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="ar-n">Name</label>
          <input id="ar-n" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={kind === 'master' ? 'e.g. Seminar Complex' : 'e.g. BK3'} />
        </div>
        <div className="field">
          <label htmlFor="ar-c">Code</label>
          <input id="ar-c" className="input" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder={kind === 'master' ? 'e.g. FSKTM-SEM' : 'e.g. FSKTM-BK3'} />
        </div>
        {kind === 'sub' && (
          <>
            <div className="field">
              <label htmlFor="ar-t">Type</label>
              <select id="ar-t" className="select" value={type} onChange={(e) => setType(e.target.value as SubType)}>
                {SUB_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="ar-cap">Capacity</label>
              <input id="ar-cap" className="input" type="number" min={1} value={cap} onChange={(e) => setCap(Number(e.target.value))} />
            </div>
          </>
        )}
      </div>
      {err && (
        <p className="small c-red row" style={{ gap: 6 }}>
          <XCircle size={14} /> {err}
        </p>
      )}
    </Modal>
  )
}

/* ---------------- Bulk import ---------------- */

interface ImportRow {
  line: number
  master: string
  floor: string
  code: string
  name: string
  type: string
  capacity: string
  error?: string
}

function ImportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, update, toast, audit } = useDemo()
  const [rows, setRows] = useState<ImportRow[] | null>(null)
  const [file, setFile] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const masterBy = (c: string) => state.spaces.find((s) => s.kind === 'master' && s.code === c.toUpperCase())

  const template = () => {
    downloadCsv('sub-room-import-template.csv', [
      ['master_room_code', 'floor', 'room_code', 'room_name', 'type', 'capacity'],
      ['FSKTM-BK', 'Level 2', 'FSKTM-BK3', 'BK3', 'Seminar room', 40],
      ['ENG-A-TS', 'Level 2', 'ENG-EA-205', 'Smart Room EA-205', 'Smart room', 48],
      ['ENG-B-TS', 'Level 1', 'ENG-EA-101', 'Duplicate code example', 'Lecture hall', 200],
    ])
    toast('Template downloaded. The last row shows what a validation error looks like.', 'info')
  }

  const parse = (text: string) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim())
    const seen = new Set<string>()
    const out: ImportRow[] = lines.slice(1).map((l, i) => {
      const [master = '', floor = '', code = '', name = '', type = '', capacity = ''] = l.split(',').map((x) => x.trim().replace(/^"|"$/g, ''))
      const r: ImportRow = { line: i + 2, master: master.toUpperCase(), floor, code: code.toUpperCase(), name, type, capacity }
      const m = masterBy(master)
      const b = m && buildings.find((x) => x.id === m.buildingId)
      const cap = Number(capacity)
      if (!m) r.error = `Master room "${master}" not found`
      else if (!b?.floors.includes(floor)) r.error = `Floor "${floor}" not found in ${b?.short}`
      else if (!CODE_RE.test(r.code)) r.error = 'Room code format is invalid'
      else if (state.spaces.some((s) => s.code === r.code) || seen.has(r.code)) r.error = `Room code ${r.code} already exists`
      else if (!name) r.error = 'Room name is missing'
      else if (!SUB_TYPES.includes(type as SubType)) r.error = `Type "${type}" is not allowed`
      else if (!(cap > 0 && cap <= 5000)) r.error = 'Capacity must be 1 to 5000'
      seen.add(r.code)
      return r
    })
    setRows(out)
  }

  const valid = rows?.filter((r) => !r.error) ?? []

  const doImport = () => {
    const add: Space[] = valid.map((r, k) => {
      const m = masterBy(r.master)!
      return { id: `sp-imp-${Date.now()}-${k}`, kind: 'sub', parentId: m.id, code: r.code, name: r.name, buildingId: m.buildingId, floor: r.floor, type: r.type as SubType, capacity: Number(r.capacity), state: 'Setup incomplete', occupancySource: null, camera: null, doorId: null, timetable: false, voice: false }
    })
    update((s) => ({ ...s, spaces: [...s.spaces, ...add] }))
    audit({ area: 'Rooms', action: 'Imported sub rooms', target: file || 'CSV file', detail: `${add.length} imported, ${(rows?.length ?? 0) - add.length} rejected` })
    toast(`${add.length} sub rooms imported. ${(rows?.length ?? 0) - add.length} rows were skipped.`)
    setRows(null)
    setFile('')
    onClose()
  }

  const downloadErrors = () => downloadCsv('room-import-errors.csv', [['line', 'room_code', 'error'], ...(rows ?? []).filter((r) => r.error).map((r) => [r.line, r.code, r.error ?? ''])])

  return (
    <Modal
      open={open}
      onClose={() => {
        setRows(null)
        onClose()
      }}
      wide
      title="Import sub rooms from a spreadsheet"
      sub="Upload a CSV file. Each row is checked before anything is saved."
      foot={
        rows ? (
          <>
            {rows.some((r) => r.error) && (
              <button className="btn secondary" onClick={downloadErrors}>
                <Download size={15} /> Download errors
              </button>
            )}
            <button className="btn" onClick={doImport} disabled={valid.length === 0}>
              Import {valid.length} valid rows
            </button>
          </>
        ) : (
          <button className="btn secondary" onClick={template}>
            <Download size={15} /> Download template
          </button>
        )
      }
    >
      {!rows ? (
        <>
          <div className="dropzone" role="button" tabIndex={0} onClick={() => input.current?.click()} onKeyDown={(e) => e.key === 'Enter' && input.current?.click()}>
            <FileUp size={26} />
            <strong style={{ color: 'var(--ink)' }}>Choose a CSV file</strong>
            <div className="xs">Columns: master_room_code, floor, room_code, room_name, type, capacity. The file is read in your browser only.</div>
            <input
              ref={input}
              type="file"
              accept=".csv,text/csv"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (!f) return
                setFile(f.name)
                f.text().then(parse)
                e.target.value = ''
              }}
            />
          </div>
          <p className="xs muted mt-2">Tip: download the template, then choose it here to see how validation works.</p>
        </>
      ) : (
        <>
          <Notice tone={rows.some((r) => r.error) ? '' : 'blue'}>
            {file}: {valid.length} of {rows.length} rows are valid.
          </Notice>
          <div className="table-wrap mt-2">
            <table className="table">
              <thead>
                <tr>
                  <th>Line</th>
                  <th>Room code</th>
                  <th>Name</th>
                  <th>Master room</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.line}>
                    <td className="num">{r.line}</td>
                    <td>{r.code}</td>
                    <td>{r.name}</td>
                    <td>
                      {r.master}, {r.floor}
                    </td>
                    <td>{r.error ? <span className="small c-red">{r.error}</span> : <Badge tone="green">Ready to import</Badge>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Modal>
  )
}
