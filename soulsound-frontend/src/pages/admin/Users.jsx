import { useState, useEffect } from 'react'
import { adminApi } from '../../api/index.js'

export default function AdminUsers() {
  const [users,      setUsers]      = useState([])
  const [totalPages, setTotalPages] = useState(0)
  const [curPage,    setCurPage]    = useState(0)
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')

  const load = async (page) => {
    setLoading(true)
    try {
      const res = await adminApi.getUsers(page)
      setUsers(res.data.users)
      setTotalPages(res.data.totalPages)
      setCurPage(page)
    } finally { setLoading(false) }
  }

  useEffect(() => { load(0) }, [])

  const handleBlock = async (id, currentStatus) => {
    const action = currentStatus === 'ACTIVE' ? 'khóa' : 'mở khóa'
    if (!confirm(`Bạn có chắc muốn ${action} tài khoản này?`)) return
    await adminApi.blockUser(id)
    setUsers(us => us.map(u => u.id === id
      ? { ...u, status: u.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE' }
      : u
    ))
  }

  const filtered = users.filter(u =>
    !search || u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ maxWidth: '1100px', margin: '32px auto', padding: '0 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <i className="bi bi-people-fill" style={{ color: 'var(--accent)' }}></i> Quản lý người dùng
        </h1>
        <input className="form-control" style={{ width: '260px' }} placeholder="Tìm theo tên, email..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}><i className="bi bi-arrow-repeat spin" style={{ fontSize: '2rem' }}></i></div>
      ) : (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
                {['#', 'Người dùng', 'Email', 'Role', 'Trạng thái', 'Bài hát', 'Hành động'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background .15s' }}
                  onMouseOver={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                  onMouseOut={e  => e.currentTarget.style.background = ''}>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{curPage * 20 + i + 1}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img src={u.avatarUrl || '/images/default-avatar.png'} onError={e => { e.target.src = '/images/default-avatar.png' }}
                        style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} alt="" />
                      <span style={{ fontWeight: 500 }}>{u.fullName}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600,
                      background: u.role === 'ADMIN' ? 'rgba(255,152,0,0.15)' : 'rgba(33,150,243,0.15)',
                      color: u.role === 'ADMIN' ? '#FF9800' : '#2196F3' }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600,
                      background: u.status === 'ACTIVE' ? 'rgba(76,175,80,0.15)' : 'rgba(255,50,50,0.15)',
                      color: u.status === 'ACTIVE' ? '#4CAF50' : '#ff4444' }}>
                      {u.status === 'ACTIVE' ? 'Hoạt động' : 'Bị khóa'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>{u.trackCount ?? 0}</td>
                  <td style={{ padding: '12px 16px' }}>
                    {u.role !== 'ADMIN' && (
                      <button
                        className={`btn btn-ghost`}
                        style={{ fontSize: '0.8rem', padding: '5px 12px', color: u.status === 'ACTIVE' ? '#ff4444' : '#4CAF50', border: `1px solid ${u.status === 'ACTIVE' ? '#ff444433' : '#4CAF5033'}` }}
                        onClick={() => handleBlock(u.id, u.status)}>
                        <i className={`bi ${u.status === 'ACTIVE' ? 'bi-lock' : 'bi-unlock'}`}></i>
                        {u.status === 'ACTIVE' ? ' Khóa' : ' Mở khóa'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination" style={{ marginTop: '24px' }}>
          {curPage > 0 && <button className="page-btn" onClick={() => load(curPage - 1)}>‹</button>}
          {[...Array(totalPages)].map((_, i) => (
            <button key={i} className={`page-btn${i === curPage ? ' active' : ''}`} onClick={() => load(i)}>{i + 1}</button>
          ))}
          {curPage < totalPages - 1 && <button className="page-btn" onClick={() => load(curPage + 1)}>›</button>}
        </div>
      )}
    </div>
  )
}