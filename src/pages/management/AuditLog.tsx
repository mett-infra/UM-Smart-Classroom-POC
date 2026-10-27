import { useState } from 'react'
import { FileSpreadsheet, Search, ScrollText } from 'lucide-react'
import { Avatar, Badge, Empty, PageHead, Panel, type Tone } from '../../components/ui'
import type { AuditEntry } from '../../data/smartcampus'
import { useDemo } from '../../store/DemoStore'
import { downloadCsv } from './csv'
import '../../styles/management.css'
import '../../styles/smartcampus.css'

const AREAS: AuditEntry['area'][] = ['Rooms', 'Devices', 'Network', 'Doors', 'Attendance', 'Automation', 'Reports', 'Access']
const areaTone: Record<AuditEntry['area'], Tone> = { Rooms: 'blue', Devices: 'teal', Network: 'red', Doors: 'plum', Attendance: 'green', Automation: 'gold', Reports: '', Access: 'amber' }

export default function AuditLog() {
  const { state, toast, audit } = useDemo()
  const [q, setQ] = useState('')
  const [area, setArea] = useState<'all' | AuditEntry['area']>('all')
  const list = state.audit.filter((a) => (area === 'all' || a.area === area) && `${a.actor} ${a.action} ${a.target} ${a.detail ?? ''}`.toLowerCase().includes(q.toLowerCase()))

  const exportCsv = () => {
    downloadCsv('audit-log-sample.csv', [['Time', 'Actor', 'Area', 'Action', 'Target', 'Detail'], ...list.map((a) => [a.time, a.actor, a.area, a.action, a.target, a.detail ?? ''])])
    audit({ area: 'Reports', action: 'Exported audit log', target: `${list.length} entries` })
    toast('Audit log exported as CSV. The export itself is also logged.')
  }

  return (
    <>
      <PageHead
        title="Audit log"
        sub="Every change to rooms, devices, network rules, incidents and exports, with who made it and when."
        actions={
          <button className="btn secondary" onClick={exportCsv}>
            <FileSpreadsheet size={16} /> Export CSV
          </button>
        }
      />
      <Panel bodyClass="">
        <div className="mg-filters">
          <div className="search-field">
            <Search size={16} />
            <input className="input" placeholder="Search person, action or record" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search audit log" />
          </div>
          <select className="select" value={area} onChange={(e) => setArea(e.target.value as typeof area)} aria-label="Area">
            <option value="all">All areas</option>
            {AREAS.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </div>
        {list.length === 0 ? (
          <Empty icon={<ScrollText size={28} />} title="No entries match">
            Try a different search or area.
          </Empty>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Who</th>
                  <th>Area</th>
                  <th>Action</th>
                  <th>Record</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {list.map((a) => (
                  <tr key={a.id}>
                    <td className="num small">{a.time}</td>
                    <td>
                      <div className="cell-person" style={{ minWidth: 160 }}>
                        <Avatar name={a.actor} size="sm" color={a.actor === 'System' ? '#64708a' : undefined} />
                        <strong>{a.actor}</strong>
                      </div>
                    </td>
                    <td>
                      <Badge tone={areaTone[a.area]}>{a.area}</Badge>
                    </td>
                    <td className="small">{a.action}</td>
                    <td className="small strong">{a.target}</td>
                    <td className="xs muted" style={{ maxWidth: 320 }}>
                      {a.detail}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="panel-foot">
          <span>{list.length} entries. In production the audit trail is stored on the server and cannot be edited.</span>
        </div>
      </Panel>
    </>
  )
}
