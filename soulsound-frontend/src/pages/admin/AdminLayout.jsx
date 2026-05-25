import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const NAV = [
  { to: '/admin/dashboard', icon: 'bi-grid-fill',        label: 'Dashboard'   },
  { to: '/admin/overview',  icon: 'bi-bar-chart-fill',   label: 'Overview'    },
  { to: '/admin/users',     icon: 'bi-people-fill',      label: 'Người dùng'  },
  { to: '/admin/tracks',    icon: 'bi-music-note-list',  label: 'Bài hát'     },
]

export default function AdminLayout({ children }) {
  const { pathname } = useLocation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: '220px', flexShrink: 0,
        background: '#0a0a0a',
        borderRight: '1px solid #1e1e1e',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh',
      }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid #1e1e1e' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem' }}>
            Soul<span style={{ color: 'var(--accent)' }}>Sound</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: '#f5500a', marginTop: '4px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Admin Panel
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px' }}>
          {NAV.map(({ to, icon, label }) => {
            const active = pathname === to || (to !== '/admin/dashboard' && pathname.startsWith(to))
            return (
              <Link key={to} to={to} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', borderRadius: '8px', marginBottom: '2px',
                textDecoration: 'none', fontSize: '0.875rem', fontWeight: active ? 600 : 400,
                color: active ? '#fff' : '#666',
                background: active ? '#f5500a18' : 'transparent',
                borderLeft: active ? '3px solid var(--accent)' : '3px solid transparent',
                transition: 'all .15s',
              }}>
                <i className={`bi ${icon}`} style={{ color: active ? 'var(--accent)' : 'inherit', fontSize: '1rem' }} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* User + back */}
        <div style={{ padding: '12px', borderTop: '1px solid #1e1e1e' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <img src={user?.avatarUrl || '/images/default-avatar.png'}
              onError={e => { e.target.src = '/images/default-avatar.png' }}
              style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} alt="" />
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e0e0e0' }}>{user?.fullName}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--accent)' }}>Admin</div>
            </div>
          </div>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#666', padding: '6px 8px', borderRadius: '6px', textDecoration: 'none' }}
            onMouseOver={e => e.currentTarget.style.color = '#aaa'}
            onMouseOut={e => e.currentTarget.style.color = '#666'}>
            <i className="bi bi-arrow-left" /> Về trang chủ
          </Link>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '32px 32px 60px' }}>
        {children}
      </main>
    </div>
  )
}