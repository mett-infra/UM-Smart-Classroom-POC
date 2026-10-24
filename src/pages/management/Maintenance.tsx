import { useState } from 'react'
import { CheckCircle2, Plus, Search, Wrench } from 'lucide-react'
import { Badge, Empty, Metric, Modal, PageHead, Panel, statusTone } from '../../components/ui'
import type { Ticket } from '../../data/types'
import { useDemo, nowLabel } from '../../store/DemoStore'
import '../../styles/management.css'

const technicians = ['Unassigned', 'Azlan (ICT)', 'Mei Fong (ICT)', 'Kumar (ICT)', 'Hafizah (Facilities)']

export default function Maintenance() {
  const { state, update, toast, log } = useDemo()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('All statuses')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ room: state.rooms[0]?.name ?? '', device: '', priority: 'Medium' as Ticket['priority'] })
  const [error, setError] = useState('')

  const tickets = state.tickets
  const openCount = tickets.filter((t) => t.status !== 'Resolved').length
  const highOpen = tickets.filter((t) => t.status !== 'Resolved' && t.priority === 'High').length
  const healthy = 472 - (openCount - 5)
  const needle = q.trim().toLowerCase()
  const shown = tickets.filter(
    (t) => (!needle || `${t.id} ${t.room} ${t.device} ${t.assignee}`.toLowerCase().includes(needle)) && (status === 'All statuses' || t.status === status),
  )

  const patch = (id: string, p: Partial<Ticket>) => update((s) => ({ ...s, tickets: s.tickets.map((t) => (t.id === id ? { ...t, ...p } : t)) }))

  const submit = () => {
    if (!form.device.trim()) {
      setError('Describe the device and what is wrong, for example "Projector not detecting HDMI".')
      return
    }
    const max = Math.max(...state.tickets.map((t) => parseInt(t.id.replace('SC-', ''), 10) || 1000))
    const id = `SC-${max + 1}`
    const ticket: Ticket = { id, room: form.room, device: form.device.trim(), priority: form.priority, status: 'Open', reported: `${nowLabel()} today`, assignee: 'Unassigned' }
    update((s) => ({ ...s, tickets: [ticket, ...s.tickets] }))
    log({ kind: 'ticket', text: `Ticket ${id} reported`, sub: `${form.room}, ${form.device.trim()}` })
    toast(`Ticket ${id} created for ${form.room}.`)
    setOpen(false)
    setError('')
    setForm((f) => ({ ...f, device: '', priority: 'Medium' }))
  }

  return (
    <>
      <PageHead
        title="Maintenance"
        sub="Track classroom devices and support tickets so every room is ready before the next class."
        actions={
          <button className="btn" onClick={() => setOpen(true)}>
            <Plus size={16} /> Report an issue
          </button>
        }
      />

      <div className="metrics">
        <Metric label="Devices registered" value="486" foot="Displays, microphones, cameras, controllers" />
        <Metric label="Healthy devices" value={`${((healthy / 486) * 100).toFixed(1)}`} unit="%" foot={`${healthy} reporting normally`} />
        <Metric label="Open tickets" value={openCount} foot={`${highOpen} high priority`} />
        <Metric label="Average response" value="2.4" unit="h" foot="Sample service metric" />
      </div>

      <Panel title="Tickets" sub="Sample devices and support requests" bodyClass="">
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
          <Empty icon={<Wrench size={28} />} title="No tickets match">Clear the search or choose another status.</Empty>
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
                    <td className="strong num">{t.id}</td>
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
                      <select
                        className="select sm"
                        style={{ minWidth: 150 }}
                        value={t.assignee}
                        disabled={t.status === 'Resolved'}
                        aria-label={`Assign ${t.id}`}
                        onChange={(e) => {
                          const who = e.target.value
                          patch(t.id, { assignee: who, status: who === 'Unassigned' ? 'Open' : t.status === 'Open' ? 'Assigned' : t.status })
                          toast(who === 'Unassigned' ? `${t.id} is unassigned.` : `${t.id} assigned to ${who}.`)
                        }}
                      >
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
                        <button
                          className="btn xs secondary"
                          onClick={() => {
                            patch(t.id, { status: 'Resolved' })
                            log({ kind: 'ticket', text: `Ticket ${t.id} resolved`, sub: t.room })
                            toast(`${t.id} marked as resolved.`)
                          }}
                        >
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

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Report an issue"
        sub="Create a support ticket for a classroom device."
        foot={
          <>
            <button className="btn secondary" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button className="btn" onClick={submit}>
              Create ticket
            </button>
          </>
        }
      >
        <div className="field">
          <label htmlFor="t-room">Room</label>
          <select id="t-room" className="select" value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })}>
            {state.rooms.map((r) => (
              <option key={r.id} value={r.name}>
                {r.name}, {r.building}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="t-dev">Device and issue</label>
          <input id="t-dev" className="input" placeholder="Projector not detecting HDMI" value={form.device} onChange={(e) => setForm({ ...form, device: e.target.value })} />
          {error && <span className="hint" style={{ color: 'var(--red)' }}>{error}</span>}
        </div>
        <div className="field">
          <label htmlFor="t-pri">Priority</label>
          <select id="t-pri" className="select" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Ticket['priority'] })}>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
          <span className="hint">High means a class cannot run normally.</span>
        </div>
      </Modal>
    </>
  )
}
