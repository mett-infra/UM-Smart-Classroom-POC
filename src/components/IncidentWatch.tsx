import { useCallback, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ShieldAlert, X } from 'lucide-react'
import { liveEventPool, type Incident } from '../data/smartcampus'
import { nowLabel, useDemo } from '../store/DemoStore'
import '../styles/smartcampus.css'

/*
  Automatic network monitoring (simulated).
  In production, the wireless intrusion system, firewall, DNS security, network access control and
  Wi-Fi sign-in service send events through their APIs and every match is recorded as an incident.
  Nobody reports incidents by hand. Here a timer stands in for that feed:
  the first event arrives about 20 seconds after the management panel opens, then about once a minute.
  Presenter shortcut for demos: Shift + N records the next event immediately.
*/

const FIRST_MS = 20000
const EVERY_MS = 60000
let firstFired = false

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
    const t = nowLabel()
    const inc: Incident = {
      ...ev,
      id,
      detected: t,
      status: 'New',
      owner: 'Unassigned',
      notes: [{ time: t, by: 'System', text: `Detected automatically by ${ev.source.toLowerCase()} and recorded.`, status: 'New' }],
    }
    update((st) => ({ ...st, incidents: [inc, ...st.incidents], netPolicies: st.netPolicies.map((p) => (p.id === ev.policyId ? { ...p, hitsToday: p.hitsToday + 1 } : p)) }))
    log({ text: `Network incident ${id} recorded`, sub: `${ev.category}, ${ev.location}`, kind: 'network' })
    audit({ actor: 'System', area: 'Network', action: 'Recorded incident automatically', target: id, detail: `${ev.title} (${ev.source})` })
    toast(`${ev.severity} severity incident ${id} recorded: ${ev.title}.`, 'warn')
    return id
  }, [update, toast, log, audit])
}

export function IncidentWatch() {
  const { state, update } = useDemo()
  const raise = useRaiseIncident()

  useEffect(() => {
    const first = firstFired ? null : setTimeout(() => ((firstFired = true), raise()), FIRST_MS)
    const every = setInterval(raise, EVERY_MS)
    const key = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (e.shiftKey && (e.key === 'N' || e.key === 'n') && tag !== 'INPUT' && tag !== 'TEXTAREA') raise()
    }
    window.addEventListener('keydown', key)
    return () => {
      if (first) clearTimeout(first)
      clearInterval(every)
      window.removeEventListener('keydown', key)
    }
  }, [raise])

  const latest = state.incidents.find((i) => i.status === 'New' && !state.dismissedIncidents.includes(i.id))
  if (!latest) return null

  const dismiss = () => update((s) => ({ ...s, dismissedIncidents: [...s.dismissedIncidents, latest.id] }))

  return (
    <div className={`incident-banner sev-${latest.severity.toLowerCase()}`} role="alert">
      <ShieldAlert size={18} />
      <div className="grow">
        <strong>
          {latest.id}: {latest.title}
        </strong>
        <span>
          {latest.severity} severity, {latest.category.toLowerCase()}, {latest.location}, detected {latest.detected} by {latest.source.toLowerCase()}
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
