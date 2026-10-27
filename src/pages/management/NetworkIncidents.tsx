import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Bar as RBar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Eye, FileSpreadsheet, Plus, Radar, Search, ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react'
import { Badge, Empty, Metric, Modal, Notice, PageHead, Panel, Switch, Tabs, type Tone } from '../../components/ui'
import { axisProps, chartColors, gridProps, HBars, Legend, tooltipProps } from '../../components/charts'
import { detectionSources, itStaff, telemetrySources, usageByBuilding, usageByCategory, usageByHour, type DetectionSource, type Incident, type IncidentStatus, type NetPolicy, type Severity } from '../../data/smartcampus'
import { nowLabel, useDemo } from '../../store/DemoStore'
import { downloadCsv } from './csv'
import '../../styles/management.css'
import '../../styles/smartcampus.css'

type Tab = 'incidents' | 'usage' | 'rules'

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

const containment: Record<string, string> = {
  Malware: 'Request device isolation',
  'Network attack': 'Request device isolation',
  'Data exfiltration': 'Request device isolation',
  'Credential attack': 'Request account lock',
  'Rogue access point': 'Send security to locate it',
  'Unauthorised device': 'Block device on all networks',
}

export default function NetworkIncidents() {
  const { state, toast, audit } = useDemo()
  const [params, setParams] = useSearchParams()
  const [tab, setTab] = useState<Tab>('incidents')
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<'open' | 'all' | IncidentStatus>('open')
  const [sev, setSev] = useState<'all' | Severity>('all')
  const [src, setSrc] = useState<'all' | DetectionSource>('all')
  const [openId, setOpenId] = useState<string | null>(params.get('open'))
  const [addRule, setAddRule] = useState(false)

  useEffect(() => {
    const o = params.get('open')
    if (o) {
      setOpenId(o)
      setTab('incidents')
    }
  }, [params])

  const list = useMemo(
    () =>
      state.incidents.filter((i) => {
        if (status === 'open' ? !isOpen(i) : status !== 'all' && i.status !== status) return false
        if (sev !== 'all' && i.severity !== sev) return false
        if (src !== 'all' && i.source !== src) return false
        return `${i.id} ${i.title} ${i.category} ${i.device} ${i.location} ${i.network}`.toLowerCase().includes(q.toLowerCase())
      }),
    [state.incidents, status, sev, src, q],
  )

  const open = state.incidents.filter(isOpen)
  const today = state.incidents.filter((i) => !i.detected.startsWith('Yesterday')).length
  const current = state.incidents.find((i) => i.id === openId) ?? null

  const closeModal = () => {
    setOpenId(null)
    if (params.get('open')) setParams({}, { replace: true })
  }

  const exportCsv = () => {
    downloadCsv('network-incidents-sample.csv', [
      ['Incident', 'Detected', 'Category', 'What happened', 'Detected by', 'Device', 'Network', 'Location', 'Severity', 'Status', 'Owner'],
      ...list.map((i) => [i.id, i.detected, i.category, i.title, i.source, i.device, i.network, i.location, i.severity, i.status, i.owner]),
    ])
    audit({ area: 'Reports', action: 'Exported incident list', target: `${list.length} incidents`, detail: 'CSV, current filters' })
    toast('Incident list exported as CSV.')
  }

  return (
    <>
      <PageHead
        title="Network incidents"
        sub="Unauthorised, malicious or unusual activity on the university network and Wi-Fi. Every event is detected and recorded automatically."
        actions={
          <>
            <span className="monitor-chip">
              <span className="live-dot" style={{ background: 'var(--green)' }} /> Monitoring live
            </span>
            <button className="btn secondary" onClick={exportCsv}>
              <FileSpreadsheet size={16} /> Export CSV
            </button>
          </>
        }
      />

      <div className="metrics m-5">
        <Metric label="Open incidents" value={open.length} foot="Not yet resolved or closed" />
        <Metric label="Awaiting acknowledgement" value={open.filter((i) => i.status === 'New').length} foot={<span className={open.some((i) => i.status === 'New') ? 'delta-down' : ''}>Status: New</span>} />
        <Metric label="High severity open" value={open.filter((i) => i.severity === 'High').length} foot="Attacks, malware, rogue Wi-Fi" />
        <Metric label="On hold" value={open.filter((i) => i.status === 'On hold').length} foot="Paused for follow-up" />
        <Metric label="Recorded today" value={today} foot="All detected automatically" />
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'incidents', label: <>Incidents <Badge tone={open.length ? 'red' : ''}>{open.length}</Badge></> },
          { id: 'usage', label: 'Network usage' },
          { id: 'rules', label: <>Detection rules <Badge>{state.netPolicies.filter((p) => p.active).length}</Badge></> },
        ]}
      />

      {tab === 'incidents' && (
        <Panel bodyClass="">
          <div className="mg-filters">
            <div className="search-field">
              <Search size={16} />
              <input className="input" placeholder="Search ID, device, location or network" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search incidents" />
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
            <select className="select" value={src} onChange={(e) => setSrc(e.target.value as typeof src)} aria-label="Detected by">
              <option value="all">All detection sources</option>
              {detectionSources.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          {list.length === 0 ? (
            <Empty icon={<ShieldCheck size={28} />} title="No incidents match these filters">
              New events are recorded here automatically as soon as they are detected.
            </Empty>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Incident</th>
                    <th>What happened</th>
                    <th>Where</th>
                    <th>Detected by</th>
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
                        <button className="link-btn nowrap" onClick={() => setOpenId(i.id)}>
                          {i.id}
                        </button>
                        <div className="xs muted">{i.detected}</div>
                      </td>
                      <td style={{ minWidth: 230 }}>
                        {i.title}
                        <div className="xs muted">{i.category}</div>
                      </td>
                      <td style={{ minWidth: 170 }}>
                        {i.location}
                        <div className="xs muted">{i.network}</div>
                      </td>
                      <td className="small">{i.source}</td>
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
          <div className="panel-foot">
            <span>
              <Radar size={13} style={{ display: 'inline', verticalAlign: -2 }} /> Incidents come only from the university network and security systems. Students and staff do not report them here.
            </span>
          </div>
        </Panel>
      )}

      {tab === 'usage' && <UsageTab />}
      {tab === 'rules' && <RulesTab onAdd={() => setAddRule(true)} />}

      {current && <IncidentModal key={current.id} inc={current} onClose={closeModal} />}
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
  const action = inc.severity !== 'Low' ? containment[inc.category] : undefined

  const addNote = (text: string, status?: IncidentStatus) =>
    update((s) => ({
      ...s,
      incidents: s.incidents.map((x) =>
        x.id === inc.id ? { ...x, status: status ?? x.status, owner: x.owner === 'Unassigned' ? 'Prof. Dr. Lim Mei Ling' : x.owner, notes: [...x.notes, { time: nowLabel(), by: 'Prof. Dr. Lim Mei Ling', text, status }] } : x,
      ),
      dismissedIncidents: [...s.dismissedIncidents, inc.id],
    }))

  const change = (status: IncidentStatus, text: string, needsNote = false) => {
    if (needsNote && !note.trim()) {
      toast('Add a note explaining the decision first.', 'warn')
      return
    }
    addNote(note.trim() || text, status)
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

  const contain = () => {
    if (!action) return
    addNote(`${action}: request sent to ${inc.source.toLowerCase()}. Waiting for confirmation (simulated).`)
    audit({ area: 'Network', action, target: inc.id, detail: `${inc.device} via ${inc.source}` })
    toast(`${action}: request sent (simulated).`, 'info')
  }

  return (
    <Modal
      open
      onClose={onClose}
      wide
      title={`${inc.id}: ${inc.title}`}
      sub={`Recorded automatically at ${inc.detected} by ${inc.source.toLowerCase()}. Rule: ${policy?.name ?? inc.category}.`}
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
        <Badge>{inc.category}</Badge>
        <Badge tone="teal">Auto-recorded</Badge>
      </div>
      <p className="small" style={{ marginBottom: 14, color: 'var(--text-2)', maxWidth: '72ch' }}>
        {inc.evidence}
      </p>
      <div className="grid g-2" style={{ gap: 18 }}>
        <dl className="kv">
          <dt>Device</dt>
          <dd>
            {inc.device}
            <div className="xs muted">{inc.deviceKind}</div>
          </dd>
          <dt>Network</dt>
          <dd>{inc.network}</dd>
          <dt>Location</dt>
          <dd>{inc.location}</dd>
          <dt>Faculty</dt>
          <dd>{inc.faculty}</dd>
          <dt>Linked account</dt>
          <dd>
            {!inc.user ? (
              <span className="muted">None identified</span>
            ) : showUser ? (
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
                  audit({ area: 'Access', action: 'Viewed linked account on incident', target: inc.id })
                }}
              >
                <Eye size={14} /> Show account (logged)
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
          {!closed && action && (
            <button className="btn secondary sm" onClick={contain}>
              <ShieldX size={14} /> {action}
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
      <p className="xs muted mt-2">Recorded from approved network and security systems only. Page content and personal devices are not inspected.</p>
    </Modal>
  )
}

/* ---------------- Usage ---------------- */

function UsageTab() {
  return (
    <div className="stack">
      <Panel title="Monitoring sources" sub="The systems that detect incidents and how recently each reported">
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
        <Panel title="Campus network traffic today" sub="Download and upload by hour, in GB, sample data" action={<Legend items={[{ label: 'Download', color: chartColors.primary }, { label: 'Upload', color: chartColors.gold }]} />}>
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
          <HBars rows={usageByCategory.map((c) => ({ ...c, color: c.label === 'Blocked or suspicious' ? chartColors.red : undefined }))} max={40} />
        </Panel>
      </div>
      <Panel title="By building" sub="Total traffic today, in GB">
        <HBars rows={usageByBuilding} max={1500} unit=" GB" />
      </Panel>
      <Notice>Figures are sample data. In production they come from the university network and security systems. A source that stops reporting is shown as stale, never as zero.</Notice>
    </div>
  )
}

/* ---------------- Detection rules ---------------- */

function RulesTab({ onAdd }: { onAdd: () => void }) {
  const { state, update, toast, audit } = useDemo()
  const toggle = (p: NetPolicy, v: boolean) => {
    update((s) => ({ ...s, netPolicies: s.netPolicies.map((x) => (x.id === p.id ? { ...x, active: v } : x)) }))
    audit({ area: 'Network', action: v ? 'Activated detection rule' : 'Deactivated detection rule', target: p.name })
    toast(`${p.name} ${v ? 'activated' : 'deactivated'}.`)
  }
  return (
    <Panel title="Detection rules" sub="Events from the network systems that match an active rule are recorded as incidents automatically" action={<button className="btn sm" onClick={onAdd}><Plus size={14} /> Add rule</button>} bodyClass="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Rule</th>
            <th>Detected by</th>
            <th>Applies to</th>
            <th>When</th>
            <th>Severity</th>
            <th>Automatic response</th>
            <th className="num">Today</th>
            <th>Active</th>
          </tr>
        </thead>
        <tbody>
          {state.netPolicies.map((p) => (
            <tr key={p.id}>
              <td style={{ minWidth: 240 }}>
                <strong>{p.name}</strong>
                <div className="xs muted">{p.detects}</div>
              </td>
              <td className="small">{p.source}</td>
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
  const [detects, setDetects] = useState('')
  const [source, setSource] = useState<DetectionSource>('Firewall (IPS)')
  const [scope, setScope] = useState('All campus networks')
  const [schedule, setSchedule] = useState('Always')
  const [severity, setSeverity] = useState<Severity>('Medium')
  const [response, setResponse] = useState('Record, alert security')

  const save = () => {
    if (!name.trim()) {
      toast('Give the rule a name.', 'warn')
      return
    }
    const rule: NetPolicy = { id: `pol-${Date.now()}`, name: name.trim(), category: 'Custom rule', detects: detects.trim() || 'Custom detection', source, scope, schedule, severity, response, active: true, hitsToday: 0 }
    update((s) => ({ ...s, netPolicies: [...s.netPolicies, rule] }))
    audit({ area: 'Network', action: 'Created detection rule', target: rule.name, detail: `${severity}, ${source}, ${response}` })
    toast(`Rule "${rule.name}" added and active.`)
    setName('')
    setDetects('')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add detection rule"
      sub="Matching events from the selected system are recorded as incidents automatically."
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
        <input id="r-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Crypto mining on lab PCs" />
      </div>
      <div className="field">
        <label htmlFor="r-det">What it detects</label>
        <input id="r-det" className="input" value={detects} onChange={(e) => setDetects(e.target.value)} placeholder="e.g. Connections to known mining pools" />
      </div>
      <div className="grid g-2" style={{ gap: 12 }}>
        <div className="field">
          <label htmlFor="r-src">Detected by</label>
          <select id="r-src" className="select" value={source} onChange={(e) => setSource(e.target.value as DetectionSource)}>
            {detectionSources.map((s) => (
              <option key={s}>{s}</option>
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
        <div className="field">
          <label htmlFor="r-scope">Applies to</label>
          <select id="r-scope" className="select" value={scope} onChange={(e) => setScope(e.target.value)}>
            <option>All campus networks</option>
            <option>All campus Wi-Fi</option>
            <option>Lab LAN and UM-IoT</option>
            <option>Managed devices, Faculty of Engineering first</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="r-when">When</label>
          <select id="r-when" className="select" value={schedule} onChange={(e) => setSchedule(e.target.value)}>
            <option>Always</option>
            <option>Mon to Fri, 08:00 to 18:00</option>
            <option>During scheduled assessments only</option>
          </select>
        </div>
      </div>
      <div className="field">
        <label htmlFor="r-resp">Automatic response</label>
        <select id="r-resp" className="select" value={response} onChange={(e) => setResponse(e.target.value)}>
          <option>Record only</option>
          <option>Record, alert security</option>
          <option>Record, alert security, request device isolation</option>
          <option>Record, notify network operations</option>
        </select>
      </div>
      <p className="xs muted">
        <ShieldAlert size={12} style={{ display: 'inline', verticalAlign: -2 }} /> Blocking and isolation always happen in the university security systems, never in this platform.
      </p>
    </Modal>
  )
}
