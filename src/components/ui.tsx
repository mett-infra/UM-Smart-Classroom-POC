import { useEffect, type ReactNode } from 'react'
import { CheckCircle2, Info, AlertTriangle, X } from 'lucide-react'
import { colorFor, initialsOf } from '../data/mock'
import { useDemo } from '../store/DemoStore'

export function PageHead({ title, sub, actions, crumbs }: { title: ReactNode; sub?: ReactNode; actions?: ReactNode; crumbs?: ReactNode }) {
  return (
    <div className="page-head">
      <div>
        {crumbs && <div className="crumbs">{crumbs}</div>}
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  )
}

export function Panel({ title, sub, action, children, foot, bodyClass = 'panel-body', className = '' }: { title?: ReactNode; sub?: ReactNode; action?: ReactNode; children: ReactNode; foot?: ReactNode; bodyClass?: string; className?: string }) {
  return (
    <section className={`panel ${className}`}>
      {(title || action) && (
        <div className="panel-head">
          <div>
            {title && <h2>{title}</h2>}
            {sub && <p>{sub}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={bodyClass}>{children}</div>
      {foot && <div className="panel-foot">{foot}</div>}
    </section>
  )
}

export type Tone = 'blue' | 'green' | 'red' | 'amber' | 'gold' | 'teal' | 'plum' | 'live' | ''

export function Badge({ tone = '', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`badge ${tone}`}>{children}</span>
}

export function LiveBadge({ label = 'Live' }: { label?: string }) {
  return (
    <span className="badge live">
      <span className="live-dot" /> {label}
    </span>
  )
}

export function Avatar({ name, size = '', color }: { name: string; size?: '' | 'sm' | 'lg' | 'xl'; color?: string }) {
  return (
    <span className={`avatar ${size}`} style={{ background: color ?? colorFor(name) }} aria-hidden>
      {initialsOf(name)}
    </span>
  )
}

export function Metric({ label, value, unit, foot, icon }: { label: ReactNode; value: ReactNode; unit?: string; foot?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="metric">
      <div className="metric-label">
        {icon}
        {label}
      </div>
      <div className="metric-value">
        {value}
        {unit && <small>{unit}</small>}
      </div>
      {foot && <div className="metric-foot">{foot}</div>}
    </div>
  )
}

export function Bar({ value, color, thin }: { value: number; color?: string; thin?: boolean }) {
  return (
    <div className={`bar ${thin ? 'thin' : ''}`} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <span style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }} />
    </div>
  )
}

export function Ring({ value, size = 76, stroke = 8, color = 'var(--primary)', label }: { value: number; size?: number; stroke?: number; color?: string; label?: ReactNode }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e8ecf3" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} strokeLinecap="round" style={{ transition: 'stroke-dashoffset .6s ease' }} />
      </svg>
      <div className="ring-label" style={{ fontSize: size / 4.4 }}>
        {label ?? `${value}%`}
      </div>
    </div>
  )
}

export function Modal({ open, onClose, title, sub, children, foot, wide }: { open: boolean; onClose: () => void; title: ReactNode; sub?: ReactNode; children: ReactNode; foot?: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true">
        <div className="modal-head">
          <div>
            <h2>{title}</h2>
            {sub && <p>{sub}</p>}
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {foot && <div className="modal-foot">{foot}</div>}
      </div>
    </div>
  )
}

export function Empty({ icon, title, children }: { icon?: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      {icon}
      <strong>{title}</strong>
      {children}
    </div>
  )
}

export function Notice({ children, tone = '' }: { children: ReactNode; tone?: '' | 'blue' }) {
  return (
    <div className={`notice ${tone}`}>
      <Info size={16} />
      <div>{children}</div>
    </div>
  )
}

export function Toasts() {
  const { toasts } = useDemo()
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.tone}`}>
          {t.tone === 'warn' ? <AlertTriangle size={16} /> : t.tone === 'info' ? <Info size={16} /> : <CheckCircle2 size={16} />}
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  )
}

export function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button type="button" className={`switch ${on ? 'on' : ''}`} role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} />
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: ReactNode }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <button key={t.id} role="tab" aria-selected={value === t.id} className={`tab ${value === t.id ? 'on' : ''}`} onClick={() => onChange(t.id)}>
          {t.label}
        </button>
      ))}
    </div>
  )
}

export function Seg<T extends string>({ options, value, onChange }: { options: { id: T; label: ReactNode }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="seg">
      {options.map((o) => (
        <button key={o.id} className={value === o.id ? 'on' : ''} onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function riskTone(r: string): Tone {
  return r === 'High' ? 'red' : r === 'Medium' ? 'amber' : 'green'
}

export function statusTone(s: string): Tone {
  switch (s) {
    case 'Graded':
    case 'Resolved':
    case 'Available':
    case 'Submitted':
    case 'present':
      return 'green'
    case 'Overdue':
    case 'Issue reported':
    case 'High':
    case 'absent':
      return 'red'
    case 'Draft':
    case 'Open':
    case 'Medium':
    case 'late':
      return 'amber'
    case 'In session':
    case 'Assigned':
    case 'Scheduled':
      return 'blue'
    case 'Offline':
      return ''
    default:
      return ''
  }
}

export function fmtDue(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) + ', ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export function daysLeft(iso: string) {
  const now = new Date(2026, 9, 21, 10, 12).getTime()
  const diff = new Date(iso).getTime() - now
  const days = Math.ceil(diff / 86400000)
  if (diff < 0) return 'Past due'
  if (days <= 1) return 'Due in ' + Math.max(1, Math.round(diff / 3600000)) + ' h'
  return `Due in ${days} days`
}

export function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
