import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { adminApi } from '../../api/index.js'

export default function AdminDashboard() {
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.getDashboard()
      .then(res => setStats(res.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ textAlign: 'center', padding: '80px' }}><i className="bi bi-arrow-repeat spin" style={{ fontSize: '2rem' }}></i></div>

  const cards = [
    { icon: 'bi-people-fill',    label: 'Tổng người dùng', value: stats?.totalUsers    ?? 0, color: '#4CAF50', link: '/admin/users' },
    { icon: 'bi-person-check',   label: 'Đang hoạt động',  value: stats?.activeUsers   ?? 0, color: '#2196F3', link: '/admin/users' },
    { icon: 'bi-music-note-list',label: 'Tổng bài hát',    value: stats?.totalTracks   ?? 0, color: 'var(--accent)', link: '/admin/tracks' },
    { icon: 'bi-play-circle',    label: 'Tổng lượt nghe',  value: stats?.totalPlays    ?? 0, color: '#FF9800', link: null },
  ]

  return (
    <div style={{ maxWidth: '1000px', margin: '32px auto', padding: '0 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
        <i className="bi bi-shield-lock-fill" style={{ color: 'var(--accent)', fontSize: '1.5rem' }}></i>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem' }}>Admin Dashboard</h1>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {cards.map(({ icon, label, value, color, link }) => {
          const Wrap = link ? Link : 'div'
          return (
            <Wrap key={label} to={link} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px', textDecoration: 'none', display: 'block', transition: 'border-color .2s' }}
              onMouseOver={e => link && (e.currentTarget.style.borderColor = 'var(--accent)')}
              onMouseOut={e  => link && (e.currentTarget.style.borderColor = 'var(--border)')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className={`bi ${icon}`} style={{ color, fontSize: '1.2rem' }}></i>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{label}</div>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
                {Number(value).toLocaleString('vi')}
              </div>
            </Wrap>
          )
        })}
      </div>

      {/* Quick links */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {[
          { to: '/admin/users',  icon: 'bi-people',     title: 'Quản lý người dùng', desc: 'Xem, chặn/bỏ chặn tài khoản' },
          { to: '/admin/tracks', icon: 'bi-music-note', title: 'Quản lý bài hát',    desc: 'Ẩn/hiện, xóa bài hát vi phạm' },
        ].map(({ to, icon, title, desc }) => (
          <Link key={to} to={to} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px', textDecoration: 'none', transition: 'border-color .2s, transform .2s' }}
            onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseOut={e  => { e.currentTarget.style.borderColor = 'var(--border)';  e.currentTarget.style.transform = '' }}>
            <i className={`bi ${icon}`} style={{ color: 'var(--accent)', fontSize: '2rem', marginBottom: '12px', display: 'block' }}></i>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '4px' }}>{title}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{desc}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}