import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Bar as RBar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Ban, Eye, FileSpreadsheet, Plus, Search, ShieldAlert, ShieldCheck, Zap } from 'lucide-react'
import { Badge, Empty, Metric, Modal, Notice, PageHead, Panel, Switch, Tabs, type Tone } from '../../components/ui'
import { axisProps, chartColors, gridProps, HBars, Legend, tooltipProps } from '../../components/charts'
import { itStaff, telemetrySources, usageByBuilding, usageByCategory, usageByHour, type Incident, type IncidentStatus, type NetPolicy, type Severity } from '../../data/smartcampus'
import { nowLabel, useDemo } from '../../store/DemoStore'
import { useRaiseIncident } from '../../components/IncidentWatch'
import { downloadCsv } from './csv'
import '../../styles/management.css'
import '../../styles/smartcampus.css'

type Tab = 'incidents' | 'usage' | 'policies'

export const incidentTone: Record<IncidentStatus, Tone> = {
  New: 'red',
  Acknowledged: 'blue',
  Investigating: 'amber',
  'On hold': '',
  Resolved: 'green',
  'False positive': 'plum',
}
const sevTone: Record<Severity, Tone> = { High: 'red', Medium: 'amber', Low: 'blue' }
const isOpen = (i: Incident) => i.status !== 'Resolved' && i.status !== 'False positive'

export default function NetworkIncidents() {
  const { state, update, toast, audit } = useDemo()
  const raise = useRaiseIncident()
  const [params, setParams] = useSearchParams()
  const [tab, setTab] = useState<Tab>('incidents')
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<'open' | 'all' | IncidentStatus>('open')
  const [sev, setSev] = useState<'all' | Severity>('all')
  const [net, setNet] = useState('all')
  const [openId, setOpenId] = useState<string | null>(params.get('open'))
  const [addRule, setAddRule] = useState(false)

  useEffect(() => {
    const o = params.get('open')
    if (o) setOpenId(o)
  }, [params])

  const list = useMemo(
    () =>
      state.incidents.filter((i) => {
        if (status === 'open' ? !isOpen(i) : status !== 'all' && i.status !== status) return false
        if (sev !== 'all' && i.severity !== sev) return false
        if (net !== 'all' && i.source !== net) return false
        const hay = `${i.id} ${i.category} ${i.destination} ${i.device} ${i.location}`.toLowerCase()
        return hay.includes(q.toLowerCase())
      }),
    [state.incidents, status, sev, net, q],
  )

  const open = state.incidents.filter(isOpen)
  const current = state.incidents.find((i) => i.id === openId) ?? null

  const closeModal = () => {
    setOpenId(null)
    if (params.get('open')) setParams({}, { replace: true })
  }

  const exportCsv = () => {
    downloadCsv('network-incidents-sample.csv', [
      ['Incident', 'Detected', 'Category', 'Destination', 'Device', 'Network', 'Source', 'Location', 'Faculty', 'Severity', 'Status', 'Owner'],
      ...list.map((i) => [i.id, i.detected, i.category, i.destination, i.device, i.network, i.source, i.location, i.faculty, i.severity, i.status, i.owner]),
    ])
    audit({ area: 'Reports', action: 'Exported incident list', target: `${list.length} incidents`, detail: 'CSV, current filters' })
    toast('Incident list exported as CSV.')
  }

  return (
    <>
      <PageHead
        title="Network incidents"
        sub="Restricted website and app alerts from university-managed devices in the Faculty of Engineering, on campus Wi-Fi and on other networks."
        actions={
          <>
            <label className="row small" style={{ gap: 8 }}>
              <Switch
                on={state.netFeed}
                label="Live feed"
                onChange={(v) => {
                  update((s) => ({ ...s, netFeed: v }))
                  toast(v ? 'Live feed on. New events arrive about once a minute.' : 'Live feed paused.', 'info')
                }}
              />
              Live feed
            </label>
            <button className="btn secondary" onClick={exportCsv}>
              <FileSpreadsheet size={16} /> Export CSV
            </button>
            <button
              className="btn"
              onClick={() => {
                const id = raise()
                setTab('incidents')
                setStatus('open')
                setOpenId(id)
              }}
            >
              <Zap size={16} /> Simulate network event
            </button>
          </>
        }
      />

      <div className="metrics m-5">
        <Metric label="Open incidents" value={open.length} foot="Across all statuses except closed" />
        <Metric label="Awaiting acknowledgement" value={open.filter((i) => i.status === 'New').length} foot={<span className={open.some((i) => i.status === 'New') ? 'delta-down' : ''}>Status: New</span>} />
        <Metric label="High severity open" value={open.filter((i) => i.severity === 'High').length} foot="VPN, P2P, assessment rules" />
        <Metric label="On hold" value={open.filter((i) => i.status === 'On hold').length} foot="Paused for follow-up" />
        <Metric label="Time to acknowledge" value="6" unit="min" foot="Average today, sample" />
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'incidents', label: <>Incidents <Badge tone={open.length ? 'red' : ''}>{open.length}</Badge></> },
          { id: 'usage', label: 'Internet usage' },
          { id: 'policies', label: <>Restricted policies <Badge>{state.netPolicies.filter((p) => p.active).length}</Badge></> },
        ]}
      />

      {tab === 'incidents' && (
        <Panel bodyClass="">
          <div className="mg-filters">
            <div className="search-field">
              <Search size={16} />
              <input className="input" placeholder="Search ID, device, site or location" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search incidents" />
            </div>
            <select className="select" value={status} onChange={(e) => setStatus(e.target.value as typeof status)} aria-label="Status">
              <option value="open">Open incidents</option>
              <option value="all">All statuses</option>
              {(['New', 'Acknowledged', 'Investigating', 'On hold', 'Resolved', 'False positive'] as IncidentStatus[]).map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <select className="select" value={sev} onChange={(e) => setSev(e.target.value as typeof sev)} aria-label="Severity">
              <option value="all">All severities</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
            <select className="select" value={net} onChange={(e) => setNet(e.target.value)} aria-label="Source">
              <option value="all">All sources</option>
              <option>Campus firewall</option>
              <option>DNS filter</option>
              <option>Endpoint agent</option>
            </select>
          </div>
          {list.length === 0 ? (
            <Empty icon={<ShieldCheck size={28} />} title="No incidents match these filters">
              Change the filters, or use Simulate network event to raise a test incident.
            </Empty>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Incident</th>
                    <th>What was accessed</th>
                    <th>Device and network</th>
                    <th>Severity</th>
                    <th>Status</th>
                    <th>Owner</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {list.map((i) => (
                    <tr key={i.id} className={i.status === 'New' ? 'row-new' : ''}>
                      <td>
                        <strong className="nowrap">{i.id}</strong>
                        <div className="xs muted">{i.detected}</div>
                      </td>
                      <td>
                        {i.category}
                        <div className="xs muted">{i.destination}</div>
                      </td>
                      <td>
                        {i.device}
                        <div className="xs muted">{i.network}</div>
                      </td>
                      <td>
                        <Badge tone={sevTone[i.severity]}>{i.severity}</Badge>
                      </td>
                      <td>
                        <Badge tone={incidentTone[i.status]}>{i.status}</Badge>
                      </td>
                      <td className="small">{i.owner}</td>
                      <td>
                        <button className="btn xs secondary" onClick={() => setOpenId(i.id)}>
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}

      {tab === 'usage' && <UsageTab />}
      {tab === 'policies' && <PoliciesTab onAdd={() => setAddRule(true)} />}

      {current && <IncidentModal inc={current} onClose={closeModal} />}
      <AddRuleModal open={addRule} onClose={() => setAddRule(false)} />
    </>
  )
}

/* ---------------- Incident detail ---------------- */

function IncidentModal({ inc, onClose }: { inc: Incident; onClose: () => void }) {
  const { state, update, toast, audit, log } = useDemo()
  const [note, setNote] = useState('')
  const [showUser, setShowUser] = useState(false)
  const policy = state.netPolicies.find((p) => p.id === inc.policyId)
  const closed = !isOpen(inc)

  const change = (status: IncidentStatus, text: string, needsNote = false) => {
    if (needsNote && !note.trim()) {
      toast('Add a note explaining the decision first.', 'warn')
      return
    }
    const t = nowLabel()
    update((s) => ({
      ...s,
      incidents: s.incidents.map((x) =>
        x.id === inc.id ? { ...x, status, owner: x.owner === 'Unassigned' ? 'Prof. Dr. Lim Mei Ling' : x.owner, notes: [...x.notes, { time: t, by: 'Prof. Dr. Lim Mei Ling', text: note.trim() || text, status }] } : x,
      ),
      dismissedIncidents: [...s.dismissedIncidents, inc.id],
    }))
    audit({ area: 'Network', action: 'Changed incident status', target: inc.id, detail: `${inc.status} to ${status}` })
    if (status === 'Resolved' || status === 'False positive') log({ text: `Incident ${inc.id} closed`, sub: status, kind: 'network' })
    toast(`${inc.id} is now ${status.toLowerCase()}.`)
    setNote('')
  }

  const assign = (owner: string) => {
    update((s) => ({ ...s, incidents: s.incidents.map((x) => (x.id === inc.id ? { ...x, owner, notes: [...x.notes, { time: nowLabel(), by: 'Prof. Dr. Lim Mei Ling', text: `Assigned to ${owner}.` }] } : x)) }))
    audit({ area: 'Network', action: 'Assigned incident', target: inc.id, detail: owner })
    toast(`${inc.id} assigned to ${owner}.`)
  }

  const requestBlock = () => {
    update((s) => ({ ...s, incidents: s.incidents.map((x) => (x.id === inc.id ? { ...x, notes: [...x.notes, { time: nowLabel(), by: 'Prof. Dr. Lim Mei Ling', text: `Block request sent to ${x.source.toLowerCase()} for ${x.destination}. Waiting for confirmation (simulated).` }] } : x)) }))
    audit({ area: 'Network', action: 'Requested block', target: inc.id, detail: `${inc.destination} via ${inc.source}` })
    toast('Block request sent to the campus firewall (simulated).', 'info')
  }

  return (
    <Modal
      open
      onClose={onClose}
      wide
      title={`${inc.id}: ${inc.category}`}
      sub={`Detected ${inc.detected} by ${inc.source.toLowerCase()}, policy: ${policy?.name ?? inc.policyId}`}
      foot={
        closed ? (
          <>
            <button className="btn secondary" onClick={() => change('Investigating', 'Incident reopened for further review.')}>
              Reopen incident
            </button>
            <button className="btn" onClick={onClose}>
              Done
            </button>
          </>
        ) : (
          <>
            {inc.status === 'New' && (
              <button className="btn" onClick={() => change('Acknowledged', 'Acknowledged.')}>
                Acknowledge
              </button>
            )}
            {(inc.status === 'Acknowledged' || inc.status === 'On hold') && (
              <button className="btn" onClick={() => change('Investigating', inc.status === 'On hold' ? 'Resumed investigation.' : 'Investigation started.')}>
                {inc.status === 'On hold' ? 'Resume' : 'Start investigating'}
              </button>
            )}
            {inc.status !== 'On hold' && (
              <button className="btn secondary" onClick={() => change('On hold', 'Paused.', true)}>
                Put on hold
              </button>
            )}
            <button className="btn secondary" onClick={() => change('False positive', 'Marked as false positive.', true)}>
              Mark false positive
            </button>
            <button className="btn success" onClick={() => change('Resolved', 'Resolved.', true)}>
              Resolve
            </button>
          </>
        )
      }
    >
      <div className="row wrap" style={{ gap: 8, marginBottom: 14 }}>
        <Badge tone={sevTone[inc.severity]}>{inc.severity} severity</Badge>
        <Badge tone={incidentTone[inc.status]}>{inc.status}</Badge>
        <Badge>{inc.faculty}</Badge>
      </div>
      <div className="grid g-2" style={{ gap: 18 }}>
        <dl className="kv">
          <dt>Accessed</dt>
          <dd>{inc.destination}</dd>
          <dt>Device</dt>
          <dd>
            {inc.device}, {inc.deviceKind}
          </dd>
          <dt>Network</dt>
          <dd>{inc.network}</dd>
          <dt>Location</dt>
          <dd>{inc.location}</dd>
          <dt>Data volume</dt>
          <dd>{inc.volume}</dd>
          <dt>Student</dt>
          <dd>
            {showUser ? (
              <>
                {inc.user.name}, {inc.user.matric}
                <div className="xs muted">{inc.user.programme}</div>
              </>
            ) : (
              <button
                className="link-btn row"
                style={{ gap: 6 }}
                onClick={() => {
                  setShowUser(true)
                  audit({ area: 'Access', action: 'Viewed student identity on incident', target: inc.id })
                }}
              >
                <Eye size={14} /> Show student (logged)
              </button>
            )}
          </dd>
        </dl>
        <div>
          <div className="field">
            <label htmlFor="inc-owner">Owner</label>
            <select id="inc-owner" className="select" value={inc.owner} onChange={(e) => assign(e.target.value)} disabled={closed}>
              {[...new Set([...itStaff, inc.owner])].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
          {!closed && (
            <div className="field">
              <label htmlFor="inc-note">Note</label>
              <textarea id="inc-note" className="textarea" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Required to put on hold, resolve or mark as false positive" />
            </div>
          )}
          {!closed && policy?.response === 'Notify and request block' && (
            <button className="btn secondary sm" onClick={requestBlock}>
              <Ban size={14} /> Request block via firewall
            </button>
          )}
        </div>
      </div>
      <h3 className="small strong mt-3" style={{ marginBottom: 8 }}>
        History
      </h3>
      <ol className="inc-timeline">
        {inc.notes.map((n, k) => (
          <li key={k}>
            <span className="num xs muted">{n.time}</span>
            <div>
              <strong className="small">{n.by}</strong> {n.status && <Badge tone={incidentTone[n.status]}>{n.status}</Badge>}
              <p className="small">{n.text}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="xs muted mt-2">The platform records metadata from approved network systems only. It does not read page content or monitor personal devices.</p>
    </Modal>
  )
}

/* ---------------- Usage ---------------- */

function UsageTab() {
  return (
    <div className="stack">
      <Panel title="Data sources" sub="Where the usage data comes from and how fresh it is">
        <div className="source-grid">
          {telemetrySources.map((t) => (
            <div key={t.name} className={`source ${t.state === 'Stale' ? 'stale' : ''}`}>
              <div className="row between">
                <strong className="small">{t.name}</strong>
                <Badge tone={t.state === 'Live' ? 'green' : 'amber'}>{t.state}</Badge>
              </div>
              <span className="xs muted">{t.kind}</span>
              <span className="xs">Last update {t.last}</span>
            </div>
          ))}
        </div>
      </Panel>
      <div className="grid g-main-side">
        <Panel title="Engineering data usage today" sub="Download and upload by hour, in GB, sample data" action={<Legend items={[{ label: 'Download', color: chartColors.primary }, { label: 'Upload', color: chartColors.gold }]} />}>
          <div className="chart-box">
            <ResponsiveContainer>
              <BarChart data={usageByHour}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="hour" {...axisProps} tickFormatter={(h) => `${h}:00`} />
                <YAxis {...axisProps} width={36} />
                <Tooltip {...tooltipProps} labelFormatter={(h) => `${h}:00`} formatter={(v, n) => [`${v} GB`, n === 'down' ? 'Download' : 'Upload']} />
                <RBar dataKey="down" stackId="a" fill={chartColors.primary} maxBarSize={28} />
                <RBar dataKey="up" stackId="a" fill={chartColors.gold} radius={[5, 5, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="By category" sub="Share of traffic, today">
          <HBars rows={usageByCategory.map((c) => ({ ...c, color: c.label === 'Restricted categories' ? chartColors.red : undefined }))} max={40} />
        </Panel>
      </div>
      <Panel title="By building" sub="Total traffic today, in GB">
        <HBars rows={usageByBuilding} max={1500} unit=" GB" />
      </Panel>
      <Notice>Usage figures are sample data. In production they come from the campus firewall, DNS filter and endpoint agent. A source that stops reporting is shown as stale, never as zero usage.</Notice>
    </div>
  )
}

/* ---------------- Policies ---------------- */

function PoliciesTab({ onAdd }: { onAdd: () => void }) {
  const { state, update, toast, audit } = useDemo()
  const toggle = (p: NetPolicy, v: boolean) => {
    update((s) => ({ ...s, netPolicies: s.netPolicies.map((x) => (x.id === p.id ? { ...x, active: v } : x)) }))
    audit({ area: 'Network', action: v ? 'Activated policy' : 'Deactivated policy', target: p.name })
    toast(`${p.name} ${v ? 'activated' : 'deactivated'}.`)
  }
  return (
    <Panel title="Restricted websites and apps" sub="Rules matched against events from the network and endpoint systems" action={<button className="btn sm" onClick={onAdd}><Plus size={14} /> Add rule</button>} bodyClass="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Rule</th>
            <th>Applies to</th>
            <th>When</th>
            <th>Severity</th>
            <th>Response</th>
            <th className="num">Hits today</th>
            <th>Active</th>
          </tr>
        </thead>
        <tbody>
          {state.netPolicies.map((p) => (
            <tr key={p.id}>
              <td>
                <strong>{p.name}</strong>
                <div className="xs muted">{p.examples}</div>
              </td>
              <td className="small">{p.scope}</td>
              <td className="small">{p.schedule}</td>
              <td>
                <Badge tone={sevTone[p.severity]}>{p.severity}</Badge>
              </td>
              <td className="small">{p.response}</td>
              <td className="num">{p.hitsToday}</td>
              <td>
                <Switch on={p.active} label={`Activate ${p.name}`} onChange={(v) => toggle(p, v)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  )
}

function AddRuleModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { update, toast, audit } = useDemo()
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Video streaming')
  const [examples, setExamples] = useState('')
  const [scope, setScope] = useState('Faculty of Engineering, managed devices')
  const [schedule, setSchedule] = useState('Mon to Fri, 08:00 to 18:00')
  const [severity, setSeverity] = useState<Severity>('Medium')
  const [response, setResponse] = useState<NetPolicy['response']>('Notify IT security')

  const save = () => {
    if (!name.trim()) {
      toast('Give the rule a name.', 'warn')
      return
    }
    const rule: NetPolicy = { id: `pol-${Date.now()}`, name: name.trim(), category, examples: examples.trim() || category, scope, schedule, severity, response, active: true, hitsToday: 0 }
    update((s) => ({ ...s, netPolicies: [...s.netPolicies, rule] }))
    audit({ area: 'Network', action: 'Created policy', target: rule.name, detail: `${severity}, ${response}` })
    toast(`Rule "${rule.name}" added and active.`)
    setName('')
    setExamples('')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add restricted rule"
      sub="Events from the network systems are matched against active rules."
      foot={
        <>
          <button className="btn secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn" onClick={save}>
            Add rule
          </button>
        </>
      }
    >
      <div className="field">
        <label htmlFor="r-name">Rule name</label>
        <input id="r-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Streaming during engineering labs" />
      </div>
      <div className="grid g-2" style={{ gap: 12 }}>
        <div className="field">
          <label htmlFor="r-cat">Category</label>
          <select id="r-cat" className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
            {['Video streaming', 'Online gaming', 'Torrent / P2P', 'VPN / proxy bypass', 'Generative AI', 'Social media', 'Gambling'].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="r-sev">Severity</label>
          <select id="r-sev" className="select" value={severity} onChange={(e) => setSeverity(e.target.value as Severity)}>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
        </div>
      </div>
      <div className="field">
        <label htmlFor="r-ex">Websites or apps</label>
        <input id="r-ex" className="input" value={examples} onChange={(e) => setExamples(e.target.value)} placeholder="Domains or app names, separated by commas" />
      </div>
      <div className="field">
        <label htmlFor="r-scope">Applies to</label>
        <select id="r-scope" className="select" value={scope} onChange={(e) => setScope(e.target.value)}>
          <option>Faculty of Engineering, managed devices</option>
          <option>All faculties, managed devices</option>
          <option>Exam and lab rooms in Engineering</option>
        </select>
      </div>
      <div className="grid g-2" style={{ gap: 12 }}>
        <div className="field">
          <label htmlFor="r-when">When</label>
          <select id="r-when" className="select" value={schedule} onChange={(e) => setSchedule(e.target.value)}>
            <option>Mon to Fri, 08:00 to 18:00</option>
            <option>Always</option>
            <option>During scheduled assessments only</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="r-resp">Response</label>
          <select id="r-resp" className="select" value={response} onChange={(e) => setResponse(e.target.value as NetPolicy['response'])}>
            <option>Log only</option>
            <option>Notify IT security</option>
            <option>Notify and request block</option>
          </select>
        </div>
      </div>
      <p className="xs muted">
        <ShieldAlert size={12} style={{ display: 'inline', verticalAlign: -2 }} /> Blocking always happens in the campus firewall, never in this platform.
      </p>
    </Modal>
  )
}
