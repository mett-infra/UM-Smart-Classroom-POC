import { useCallback, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ShieldAlert, X } from 'lucide-react'
import { engStudents, liveEventPool, type Incident } from '../data/smartcampus'
import { nowLabel, useDemo } from '../store/DemoStore'
import '../styles/smartcampus.css'

/*
  Simulated network telemetry feed.
  In production, incidents arrive from the campus firewall, DNS filter or endpoint agent through an API.
  Here a timer (or the "Simulate network event" button) creates a realistic incident so the demo shows
  the alert appearing on the management panel straight away.
*/

const FEED_MS = 60000

export function useRaiseIncident() {
  const { state, update, toast, log, audit } = useDemo()
  const ref = useRef(state)
  ref.current = state
  return useCallback(() => {
    const s = ref.current
    const max = s.incidents.reduce((m, i) => Math.max(m, Number(i.id.split('-').pop()) || 0), 141)
    const n = max + 1
    const id = `NET-2026-${String(n).padStart(4, '0')}`
    const ev = liveEventPool[n % liveEventPool.length]
    const user = engStudents[(n * 3) % engStudents.length]
    const t = nowLabel()
    const inc: Incident = {
      ...ev,
      id,
      detected: t,
      user,
      status: 'New',
      owner: 'Unassigned',
      notes: [{ time: t, by: 'System', text: `Incident opened from ${ev.source.toLowerCase()} event. ${ev.network}.`, status: 'New' }],
    }
    update((st) => ({ ...st, incidents: [inc, ...st.incidents], netPolicies: st.netPolicies.map((p) => (p.id === ev.policyId ? { ...p, hitsToday: p.hitsToday + 1 } : p)) }))
    log({ text: `Network incident ${id} raised`, sub: `${ev.category}, ${ev.faculty}, ${ev.network}`, kind: 'network' })
    audit({ actor: 'System', area: 'Network', action: 'Opened incident', target: id, detail: `${ev.category} on ${ev.device}` })
    toast(`New ${ev.severity.toLowerCase()} severity incident ${id}: ${ev.category.toLowerCase()} on ${ev.network}.`, 'warn')
    return id
  }, [update, toast, log, audit])
}

export function IncidentWatch() {
  const { state, update } = useDemo()
  const raise = useRaiseIncident()

  useEffect(() => {
    if (!state.netFeed) return
    const id = setInterval(raise, FEED_MS)
    return () => clearInterval(id)
  }, [state.netFeed, raise])

  const latest = state.incidents.find((i) => i.status === 'New' && !state.dismissedIncidents.includes(i.id))
  if (!latest) return null

  const dismiss = () => update((s) => ({ ...s, dismissedIncidents: [...s.dismissedIncidents, latest.id] }))

  return (
    <div className={`incident-banner sev-${latest.severity.toLowerCase()}`} role="alert">
      <ShieldAlert size={18} />
      <div className="grow">
        <strong>
          {latest.id}: {latest.category}, {latest.severity.toLowerCase()} severity
        </strong>
        <span>
          {latest.faculty}, device {latest.device}, {latest.network}, detected {latest.detected}
        </span>
      </div>
      <Link to={`/management/network?open=${latest.id}`} className="btn sm" onClick={dismiss}>
        Review incident
      </Link>
      <button className="incident-x" onClick={dismiss} aria-label="Dismiss alert">
        <X size={16} />
      </button>
    </div>
  )
}
