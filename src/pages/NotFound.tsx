import { Link, useLocation } from 'react-router-dom'
import { Compass } from 'lucide-react'

export default function NotFound() {
  const loc = useLocation()
  const base = '/' + (loc.pathname.split('/')[1] || '')
  const home = ['/student', '/lecturer', '/management'].includes(base) ? base : '/'
  return (
    <div className="panel" style={{ maxWidth: 560, margin: '60px auto' }}>
      <div className="empty">
        <Compass size={32} />
        <strong>This page isn’t part of the demo yet</strong>
        <p>The address {loc.pathname} doesn’t match a screen in this proof of concept.</p>
        <Link to={home} className="btn mt-2">
          Go to home
        </Link>
      </div>
    </div>
  )
}
