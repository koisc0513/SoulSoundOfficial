import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { adminApi } from '../../api/index.js'
import AdminLayout from './AdminLayout'

function fmtDuration(secs) {
  if (!secs) return '0p'
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  return h > 0 ? `${h}g ${m}p` : `${m}p`
}

function BarRank({ tracks }) {
  if (!tracks?.length) return <p style={{ color: '#444', padding: '20px', textAlign: 'center' }}>Chưa có dữ liệu.</p>
  const max = Math.max(...tracks.map(t => t.playCount || 0), 1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {tracks.map((t, i) => (
        <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '22px', textAlign: 'right', fontWeight: 800, fontSize: '0.78rem',
            color: i < 3 ? ['#FFD700','#C0C0C0','#CD7F32'][i] : '#444', flexShrink: 0 }}>
            {i + 1}
          </div>
          <img src={t.thumbnailUrl || '/images/default-thumb.png'} onError={e=>{e.target.src='/images/default-thumb.png'}}
            style={{ width: '34px', height: '34px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }} alt="" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '4px' }}>{t.title}</div>
            <div style={{ height: '6px', background: '#1e1e1e', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${((t.playCount || 0) / max) * 100}%`, background: 'var(--accent)', borderRadius: '3px', transition: 'width 0.6s ease' }} />
            </div>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#888', flexShrink: 0, minWidth: '50px', textAlign: 'right' }}>
            {(t.playCount || 0).toLocaleString('vi')} ▶
          </div>
        </div>
      ))}
    </div>
  )
}

export default function AdminOverview() {
  const [users,   setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [selected, setSelected] = useState(null)
  const [ov, setOv]             = useState(null)
  const [ovLoading, setOvLoading] = useState(false)

  useEffect(() => {
    adminApi.getUsers(0).then(res => setUsers(res.data.users)).finally(() => setLoading(false))
  }, [])

  const selectUser = async (u) => {
    setSelected(u)
    setOv(null)
    setOvLoading(true)
    try {
      const res = await adminApi.getUserOverview(u.id)
      setOv(res.data)
    } finally { setOvLoading(false) }
  }

  const filtered = users.filter(u =>
    !search || u.fullName.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AdminLayout>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px' }}>
        <i className="bi bi-bar-chart-fill" style={{ color: 'var(--accent)', fontSize: '1.3rem' }}></i>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem' }}>Overview người dùng</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px', alignItems: 'start' }}>

        {/* User list */}
        <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '14px', overflow: 'hidden' }}>
          <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid #1e1e1e' }}>
            <input className="form-control" placeholder="Tìm người dùng..."
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ fontSize: '0.85rem' }} />
          </div>
          <div style={{ overflowY: 'auto', maxHeight: '70vh' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <i className="bi bi-arrow-repeat spin" style={{ color: 'var(--accent)' }}></i>
              </div>
            ) : filtered.map(u => (
              <div key={u.id}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', cursor: 'pointer',
                  background: selected?.id === u.id ? '#f5500a10' : 'transparent',
                  borderLeft: selected?.id === u.id ? '3px solid var(--accent)' : '3px solid transparent',
                  borderBottom: '1px solid #161616', transition: 'background .15s' }}
                onClick={() => selectUser(u)}>
                <img src={u.avatarUrl || '/images/default-avatar.png'} onError={e=>{e.target.src='/images/default-avatar.png'}}
                  style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} alt="" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.fullName}</div>
                  <div style={{ fontSize: '0.72rem', color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                </div>
                <span style={{ fontSize: '0.7rem', background: '#1a1a1a', borderRadius: '4px', padding: '2px 6px', color: '#666' }}>
                  {u.trackCount ?? 0} bài
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Overview panel */}
        <div>
          {!selected && (
            <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '14px', padding: '60px 24px', textAlign: 'center', color: '#444' }}>
              <i className="bi bi-person-lines-fill" style={{ fontSize: '2.5rem', marginBottom: '12px', display: 'block' }}></i>
              <p>Chọn một người dùng để xem overview</p>
            </div>
          )}
          {selected && ovLoading && (
            <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '14px', padding: '60px', textAlign: 'center' }}>
              <i className="bi bi-arrow-repeat spin" style={{ color: 'var(--accent)', fontSize: '1.5rem' }}></i>
            </div>
          )}
          {selected && ov && !ovLoading && (
            <div>
              {/* User card */}
              <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '14px', padding: '20px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <img src={ov.user.avatarUrl || '/images/default-avatar.png'} onError={e=>{e.target.src='/images/default-avatar.png'}}
                  style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover' }} alt="" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem' }}>{ov.user.fullName}</div>
                  <div style={{ fontSize: '0.82rem', color: '#555', marginTop: '2px' }}>{ov.user.email}</div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '6px', flexWrap: 'wrap' }}>
                    {ov.user.phoneNumber && <span style={{ fontSize: '0.75rem', color: '#666' }}>📞 {ov.user.phoneNumber}</span>}
                    {ov.user.birthYear   && <span style={{ fontSize: '0.75rem', color: '#666' }}>🎂 {ov.user.birthYear}</span>}
                    {ov.user.address     && <span style={{ fontSize: '0.75rem', color: '#666' }}>📍 {ov.user.address}</span>}
                    <span style={{ fontSize: '0.75rem', color: '#666' }}>👥 {ov.user.followerCount} followers</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.7rem', color: '#555', textTransform: 'uppercase' }}>Tham gia</div>
                  <div style={{ fontSize: '0.82rem', color: '#888' }}>
                    {ov.user.createdAt ? new Date(ov.user.createdAt).toLocaleDateString('vi') : '—'}
                  </div>
                </div>
              </div>

              {/* Stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
                {[
                  { label: 'Bài hát', value: ov.trackCount,             color: 'var(--accent)', icon: 'bi-music-note' },
                  { label: 'Tổng nghe', value: (ov.totalPlays ?? 0).toLocaleString('vi'), color: '#9C27B0', icon: 'bi-play-circle' },
                  { label: 'Tổng thích', value: ov.totalLikes ?? 0,    color: '#e91e63',  icon: 'bi-heart-fill' },
                  { label: 'Tổng thời lượng', value: fmtDuration(ov.totalDuration), color: '#00BCD4', icon: 'bi-clock', raw: true },
                ].map(s => (
                  <div key={s.label} style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <i className={`bi ${s.icon}`} style={{ color: s.color, fontSize: '0.9rem' }}></i>
                      <span style={{ fontSize: '0.7rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</span>
                    </div>
                    <div style={{ fontWeight: 800, fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: '#e0e0e0' }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Ranked tracks */}
              <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '14px', padding: '20px' }}>
                <div style={{ fontWeight: 700, marginBottom: '16px', fontSize: '0.9rem', color: '#ccc' }}>
                  <i className="bi bi-bar-chart-steps" style={{ color: 'var(--accent)', marginRight: '8px' }}></i>
                  Xếp hạng bài hát theo lượt nghe
                </div>
                <BarRank tracks={ov.rankedTracks} />
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}