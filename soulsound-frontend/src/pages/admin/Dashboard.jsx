import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { adminApi } from '../../api/index.js'
import AdminLayout from './AdminLayout'

function fmtDuration(secs) {
  if (!secs) return '0p'
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  return h > 0 ? `${h}g ${m}p` : `${m}p`
}

export default function AdminDashboard() {
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.getDashboard()
      .then(res => setStats(res.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <AdminLayout>
      <div style={{ textAlign: 'center', padding: '80px' }}>
        <i className="bi bi-arrow-repeat spin" style={{ fontSize: '2rem', color: 'var(--accent)' }}></i>
      </div>
    </AdminLayout>
  )

  const statCards = [
    { icon: 'bi-people-fill',     label: 'Tổng người dùng',  value: stats?.totalUsers,    color: '#4CAF50', link: '/admin/users'  },
    { icon: 'bi-person-check',    label: 'Đang hoạt động',   value: stats?.activeUsers,   color: '#2196F3', link: '/admin/users'  },
    { icon: 'bi-music-note-list', label: 'Tổng bài hát',     value: stats?.totalTracks,   color: '#f5500a', link: '/admin/tracks' },
    { icon: 'bi-eye-slash',       label: 'Đang bị ẩn',       value: stats?.hiddenTracks,  color: '#FF9800', link: '/admin/tracks' },
    { icon: 'bi-play-circle',     label: 'Tổng lượt nghe',   value: stats?.totalPlays,    color: '#9C27B0', link: null },
    { icon: 'bi-clock',           label: 'Tổng thời lượng',  value: fmtDuration(stats?.totalDuration), color: '#00BCD4', link: null, raw: true },
  ]

  return (
    <AdminLayout>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
        <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#f5500a18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="bi bi-shield-lock-fill" style={{ color: 'var(--accent)', fontSize: '1.3rem' }}></i>
        </div>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', lineHeight: 1 }}>Admin Dashboard</h1>
          <p style={{ color: '#555', fontSize: '0.85rem', marginTop: '4px' }}>Tổng quan hệ thống</p>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px', marginBottom: '36px' }}>
        {statCards.map(({ icon, label, value, color, link, raw }) => {
          const Wrap = link ? Link : 'div'
          return (
            <Wrap key={label} to={link}
              style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '14px', padding: '20px', textDecoration: 'none', display: 'block', transition: 'border-color .2s, transform .2s' }}
              onMouseOver={e => link && Object.assign(e.currentTarget.style, { borderColor: color, transform: 'translateY(-2px)' })}
              onMouseOut={e  => link && Object.assign(e.currentTarget.style, { borderColor: '#1e1e1e', transform: '' })}>
              <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                <i className={`bi ${icon}`} style={{ color, fontSize: '1rem' }}></i>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#555', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
              <div style={{ fontSize: raw ? '1.4rem' : '1.8rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: '#e0e0e0', lineHeight: 1 }}>
                {raw ? value : Number(value ?? 0).toLocaleString('vi')}
              </div>
            </Wrap>
          )
        })}
      </div>

      {/* Top tracks */}
      <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '14px', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <i className="bi bi-trophy-fill" style={{ color: '#f5500a' }}></i>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>Top 10 bài hát — lượt nghe cao nhất</h2>
        </div>
        <div>
          {(stats?.topTracks ?? []).map((t, i) => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: i < 9 ? '1px solid #1a1a1a' : 'none' }}>
              <div style={{ width: '28px', textAlign: 'center', fontWeight: 800, fontSize: '0.9rem',
                color: i < 3 ? ['#FFD700','#C0C0C0','#CD7F32'][i] : '#444' }}>
                {i + 1}
              </div>
              <img src={t.thumbnailUrl || '/images/default-thumb.png'} onError={e => { e.target.src = '/images/default-thumb.png' }}
                style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} alt="" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                <div style={{ fontSize: '0.78rem', color: '#555' }}>{t.artist || '—'}</div>
              </div>
              <div style={{ display: 'flex', gap: '16px', flexShrink: 0 }}>
                <span style={{ fontSize: '0.82rem', color: '#888' }}>
                  <i className="bi bi-play-fill" style={{ color: 'var(--accent)', marginRight: '4px' }}></i>
                  {(t.playCount || 0).toLocaleString('vi')}
                </span>
                <span style={{ fontSize: '0.82rem', color: '#888' }}>
                  <i className="bi bi-heart-fill" style={{ color: '#e91e63', marginRight: '4px' }}></i>
                  {t.likeCount || 0}
                </span>
                <span style={{ fontSize: '0.82rem', color: '#888' }}>
                  <i className="bi bi-clock" style={{ color: '#00BCD4', marginRight: '4px' }}></i>
                  {fmtDuration(t.duration)}
                </span>
              </div>
            </div>
          ))}
          {!stats?.topTracks?.length && (
            <p style={{ color: '#444', textAlign: 'center', padding: '24px' }}>Chưa có dữ liệu.</p>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}