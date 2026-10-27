import { useState } from 'react'
import { CheckCircle2, Search, Wrench } from 'lucide-react'
import { Badge, Empty, Metric, Modal, PageHead, Panel, statusTone } from '../../components/ui'
import type { Ticket } from '../../data/types'
import { useDemo, nowLabel } from '../../store/DemoStore'
import '../../styles/management.css'
import '../../styles/smartcampus.css'

const technicians = ['Unassigned', 'Azlan (ICT)', 'Mei Fong (ICT)', 'Kumar (ICT)', 'Hafizah (Facilities)']

interface TicketDetail {
  raisedBy: string
  deviceId: string
  impact: string
  description: string
  signals: string[]
  steps: string[]
  history: { time: string; text: string }[]
}

// Detailed sample descriptions for each ticket. In production these come from device health monitoring and the ICT service desk.
const details: Record<string, TicketDetail> = {
  'SC-1042': {
    raisedBy: 'Device health monitoring (automatic)',
    deviceId: 'ENG-EA-112-CM5',
    impact: 'Hybrid tutorial affected, 25 students online could not hear the lecturer.',
    description: 'During the 10:00 Thermodynamics tutorial the ceiling microphone stopped sending audio to the hybrid stream. Online students reported in the class chat that the lecturer went silent. The microphone stopped responding to health checks at 10:11.',
    signals: ['Last heartbeat 10:11:42', 'Audio level 0 dB for more than 3 minutes', 'Power over Ethernet port: on', 'Firmware 3.2.1 (current)'],
    steps: ['Check the network cable at the ceiling junction above row 3.', 'Restart the microphone from the room controller.', 'If it still does not respond, swap in the spare microphone from the Engineering AV store.'],
    history: [
      { time: '10:11', text: 'Microphone stopped responding to health checks.' },
      { time: '10:14', text: 'Ticket opened automatically with high priority because a live class was affected.' },
    ],
  },
  'SC-1041': {
    raisedBy: 'Lecturer feedback, confirmed by device logs',
    deviceId: 'FSKTM-DK1-ID3',
    impact: 'Lecturers fall back to the HDMI cable at the podium.',
    description: 'The wireless display adapter in DK1 drops the connection every 10 to 15 minutes when a lecturer shares from a laptop. The display returns to the home screen and the lecturer must reconnect.',
    signals: ['7 disconnects this morning', 'Wi-Fi channel 44 congested during peak hours', 'Adapter temperature normal'],
    steps: ['Move the adapter to a less busy Wi-Fi channel.', 'Update the adapter firmware to the latest version.', 'Test with two laptops for 30 minutes before closing.'],
    history: [
      { time: '09:02', text: 'Ticket opened after the third disconnect in one class.' },
      { time: '09:20', text: 'Assigned to Azlan (ICT).' },
    ],
  },
  'SC-1038': {
    raisedBy: 'Device health monitoring (automatic)',
    deviceId: 'FBE-B-204-RC0',
    impact: 'Room scenes and voice commands are unavailable in B-204. Manual wall controls still work.',
    description: 'The room controller in Smart Room B-204 keeps losing its network connection and reports as stale. Scenes such as Start class do not reach the devices until it reconnects.',
    signals: ['Last update 18 minutes ago', 'Reconnected 4 times since 08:00', 'Switch port shows errors'],
    steps: ['Replace the patch cable between the controller and the wall port.', 'Ask network operations to check switch port FBE-L2-SW2 port 14.', 'Run a Start class scene to confirm all devices respond.'],
    history: [{ time: 'Yesterday 16:40', text: 'Ticket opened automatically after repeated disconnects.' }],
  },
  'SC-1035': {
    raisedBy: 'Scheduled maintenance',
    deviceId: 'Lecture Theatre D display',
    impact: 'None if done outside teaching hours.',
    description: 'A firmware update is available for the interactive display in Lecture Theatre D. It fixes a touch calibration issue reported by the vendor.',
    signals: ['Current firmware 5.0.4', 'Available firmware 5.1.0'],
    steps: ['Install the update after 18:00 when the room is free.', 'Check touch calibration at the four corners.'],
    history: [{ time: '19 Oct', text: 'Scheduled for this week by Mei Fong (ICT).' }],
  },
  'SC-1031': {
    raisedBy: 'ICT lab team',
    deviceId: 'Makmal 1 workstations',
    impact: 'Makmal 1 is under maintenance. Classes moved to Makmal 3.',
    description: 'Twelve workstations in Makmal 1 fail to start the lab image after the latest update. They need to be reimaged before the room can be used again.',
    signals: ['12 of 60 workstations fail to start the image', 'Room set to Under maintenance in Campus setup'],
    steps: ['Reimage the 12 workstations from the lab image server.', 'Run the start-up check on every workstation.', 'Set Makmal 1 back to Operational in Campus setup.'],
    history: [
      { time: '18 Oct', text: 'Ticket opened by the ICT lab team.' },
      { time: '18 Oct', text: 'Room set to Under maintenance. Timetable moved to Makmal 3.' },
    ],
  },
  'SC-1027': {
    raisedBy: 'Lecturer feedback',
    deviceId: 'Dewan Kuliah Perubatan 2 camera',
    impact: 'Fixed. No impact now.',
    description: 'The tracking camera preset for the podium had drifted, so the lecturer was partly out of frame for online students.',
    signals: ['Preset 1 re-saved', 'Tracking tested for 20 minutes'],
    steps: ['No further action needed.'],
    history: [
      { time: '16 Oct', text: 'Reported by the lecturer after class.' },
      { time: '16 Oct', text: 'Preset re-saved and tested. Ticket resolved.' },
    ],
  },
}

const fallback = (t: Ticket): TicketDetail => ({
  raisedBy: 'Device health monitoring (automatic)',
  deviceId: t.device,
  impact: 'Being assessed.',
  description: `${t.device} in ${t.room} needs attention. The issue was detected at ${t.reported}.`,
  signals: ['Details are collected from the device when the ticket opens.'],
  steps: ['Check the device on site.', 'Update this ticket with what you find.'],
  history: [{ time: t.reported, text: 'Ticket opened.' }],
})

export default function Maintenance() {
  const { state, update, toast, log } = useDemo()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('All statuses')
  const [openId, setOpenId] = useState<string | null>(null)

  const tickets = state.tickets
  const openCount = tickets.filter((t) => t.status !== 'Resolved').length
  const highOpen = tickets.filter((t) => t.status !== 'Resolved' && t.priority === 'High').length
  const total = state.devices.length
  const healthy = state.devices.filter((d) => d.status === 'Online').length
  const needle = q.trim().toLowerCase()
  const shown = tickets.filter((t) => (!needle || `${t.id} ${t.room} ${t.device} ${t.assignee}`.toLowerCase().includes(needle)) && (status === 'All statuses' || t.status === status))
  const current = tickets.find((t) => t.id === openId) ?? null

  const patch = (id: string, p: Partial<Ticket>) => update((s) => ({ ...s, tickets: s.tickets.map((t) => (t.id === id ? { ...t, ...p } : t)) }))

  const resolve = (t: Ticket) => {
    patch(t.id, { status: 'Resolved' })
    log({ kind: 'ticket', text: `Ticket ${t.id} resolved`, sub: t.room })
    toast(`${t.id} marked as resolved.`)
  }

  const assign = (t: Ticket, who: string) => {
    patch(t.id, { assignee: who, status: who === 'Unassigned' ? 'Open' : t.status === 'Open' ? 'Assigned' : t.status })
    toast(who === 'Unassigned' ? `${t.id} is unassigned.` : `${t.id} assigned to ${who}.`)
  }

  return (
    <>
      <PageHead title="Maintenance" sub="Tickets are opened automatically when device health monitoring spots a problem, or by the ICT team. Click a ticket number to see the full details." />

      <div className="metrics">
        <Metric label="Devices monitored" value={total} foot="Paired in Campus setup" />
        <Metric label="Healthy devices" value={`${((healthy / Math.max(1, total)) * 100).toFixed(1)}`} unit="%" foot={`${healthy} reporting normally`} />
        <Metric label="Open tickets" value={openCount} foot={`${highOpen} high priority`} />
        <Metric label="Average response" value="2.4" unit="h" foot="Sample service metric" />
      </div>

      <Panel title="Tickets" sub="Sample support tickets" bodyClass="">
        <div className="mg-filters">
          <div className="search-field">
            <Search size={16} />
            <input className="input sm" placeholder="Search tickets, rooms or devices" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search tickets" />
          </div>
          <select className="select sm" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
            <option>All statuses</option>
            <option>Open</option>
            <option>Assigned</option>
            <option>Scheduled</option>
            <option>Resolved</option>
          </select>
        </div>
        {shown.length === 0 ? (
          <Empty icon={<Wrench size={28} />} title="No tickets match">
            Clear the search or choose another status.
          </Empty>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Room</th>
                  <th>Device and issue</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Assigned to</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {shown.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <button className="ticket-link num" onClick={() => setOpenId(t.id)} aria-label={`Open ticket ${t.id}`}>
                        {t.id}
                      </button>
                    </td>
                    <td className="small" style={{ minWidth: 140 }}>
                      {t.room}
                      <div className="xs muted">Reported {t.reported}</div>
                    </td>
                    <td className="small" style={{ minWidth: 200 }}>
                      {t.device}
                    </td>
                    <td>
                      <Badge tone={t.priority === 'Low' ? 'blue' : statusTone(t.priority)}>{t.priority}</Badge>
                    </td>
                    <td>
                      <Badge tone={statusTone(t.status)}>{t.status}</Badge>
                    </td>
                    <td>
                      <select className="select sm" style={{ minWidth: 150 }} value={t.assignee} disabled={t.status === 'Resolved'} aria-label={`Assign ${t.id}`} onChange={(e) => assign(t, e.target.value)}>
                        {technicians.map((x) => (
                          <option key={x}>{x}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      {t.status === 'Resolved' ? (
                        <span className="row xs" style={{ color: 'var(--green)', gap: 4 }}>
                          <CheckCircle2 size={14} /> Resolved
                        </span>
                      ) : (
                        <button className="btn xs secondary" onClick={() => resolve(t)}>
                          Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {current && <TicketDialog t={current} onClose={() => setOpenId(null)} onResolve={() => resolve(current)} onAssign={(w) => assign(current, w)} />}
    </>
  )
}

function TicketDialog({ t, onClose, onResolve, onAssign }: { t: Ticket; onClose: () => void; onResolve: () => void; onAssign: (who: string) => void }) {
  const d = details[t.id] ?? fallback(t)
  const history = t.status === 'Resolved' && !details[t.id]?.history.some((h) => h.text.includes('resolved')) ? [...d.history, { time: nowLabel(), text: 'Marked as resolved.' }] : d.history
  return (
    <Modal
      open
      onClose={onClose}
      wide
      title={`${t.id}: ${t.device}`}
      sub={`${t.room}, reported ${t.reported}`}
      foot={
        <>
          <button className="btn secondary" onClick={onClose}>
            Close
          </button>
          {t.status !== 'Resolved' && (
            <button className="btn success" onClick={onResolve}>
              <CheckCircle2 size={15} /> Mark as resolved
            </button>
          )}
        </>
      }
    >
      <div className="row wrap" style={{ gap: 8, marginBottom: 14 }}>
        <Badge tone={t.priority === 'Low' ? 'blue' : statusTone(t.priority)}>{t.priority} priority</Badge>
        <Badge tone={statusTone(t.status)}>{t.status}</Badge>
      </div>
      <h3 className="small strong" style={{ marginBottom: 6 }}>
        What happened
      </h3>
      <p className="small" style={{ color: 'var(--text-2)', maxWidth: '72ch' }}>
        {d.description}
      </p>
      <div className="grid g-2 mt-2" style={{ gap: 18 }}>
        <dl className="kv">
          <dt>Room</dt>
          <dd>{t.room}</dd>
          <dt>Device</dt>
          <dd>{d.deviceId}</dd>
          <dt>Raised by</dt>
          <dd>{d.raisedBy}</dd>
          <dt>Impact</dt>
          <dd>{d.impact}</dd>
        </dl>
        <div>
          <div className="field">
            <label htmlFor="tk-as">Assigned to</label>
            <select id="tk-as" className="select" value={t.assignee} disabled={t.status === 'Resolved'} onChange={(e) => onAssign(e.target.value)}>
              {technicians.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </div>
          <h3 className="small strong" style={{ marginBottom: 6 }}>
            What the system saw
          </h3>
          <ul className="tk-signals">
            {d.signals.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      </div>
      <h3 className="small strong mt-2" style={{ marginBottom: 6 }}>
        Suggested next steps
      </h3>
      <ol className="tk-steps">
        {d.steps.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
      <h3 className="small strong mt-2" style={{ marginBottom: 8 }}>
        History
      </h3>
      <ol className="inc-timeline">
        {history.map((h, k) => (
          <li key={k}>
            <span className="num xs muted">{h.time}</span>
            <p className="small">{h.text}</p>
          </li>
        ))}
      </ol>
    </Modal>
  )
}
