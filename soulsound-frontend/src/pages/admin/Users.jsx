import { useState, useEffect } from 'react'
import { adminApi } from '../../api/index.js'
import AdminLayout from './AdminLayout'

export default function AdminUsers() {
  const [users,      setUsers]      = useState([])
  const [totalPages, setTotalPages] = useState(0)
  const [curPage,    setCurPage]    = useState(0)
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')

  // Detail/message drawer
  const [selected,     setSelected]     = useState(null)
  const [msgText,      setMsgText]      = useState('')
  const [msgSending,   setMsgSending]   = useState(false)
  const [msgOk,        setMsgOk]        = useState(false)
  const [msgError,     setMsgError]     = useState('')

  const selectUser = (u) => {
    setSelected(s => s?.id === u.id ? null : u)
    setMsgText('')
    setMsgOk(false)
    setMsgError('')
  }
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
      ? { ...u, status: u.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE' } : u
    ))
    if (selected?.id === id) setSelected(s => ({ ...s, status: s.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE' }))
  }

  const handleSendMsg = async () => {
    if (!msgText.trim()) return
    setMsgSending(true)
    setMsgError('')
    setMsgOk(false)
    try {
      await adminApi.sendMessage(selected.id, msgText.trim())
      setMsgOk(true)
      setMsgText('')
      setTimeout(() => setMsgOk(false), 3000)
    } catch (err) {
      setMsgError(err?.response?.data?.error || 'Gửi thất bại. Vui lòng thử lại.')
    } finally {
      setMsgSending(false)
    }
  }

  const filtered = users.filter(u =>
    !search || u.fullName.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AdminLayout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <i className="bi bi-people-fill" style={{ color: 'var(--accent)' }}></i>
          Quản lý người dùng
          <span style={{ background: '#f5500a22', color: 'var(--accent)', fontSize: '0.75rem', padding: '2px 10px', borderRadius: '20px', fontWeight: 600 }}>
            {users.length} tổng
          </span>
        </h1>
        <input className="form-control" style={{ width: '260px' }} placeholder="Tìm theo tên, email..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 360px' : '1fr', gap: '20px', alignItems: 'start' }}>

        {/* Table */}
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <i className="bi bi-arrow-repeat spin" style={{ fontSize: '2rem', color: 'var(--accent)' }}></i>
            </div>
          ) : (
            <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '14px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#0d0d0d', borderBottom: '1px solid #1e1e1e' }}>
                    {['#','Người dùng','Email','Role','Trạng thái','Bài hát','Ngày tham gia','Hành động'].map(h => (
                      <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: '0.72rem', color: '#444', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u, i) => (
                    <tr key={u.id}
                      style={{ borderBottom: '1px solid #161616', transition: 'background .12s', cursor: 'pointer',
                        background: selected?.id === u.id ? '#f5500a08' : '' }}
                      onClick={() => selectUser(u)}
                      onMouseOver={e => { if (selected?.id !== u.id) e.currentTarget.style.background = '#161616' }}
                      onMouseOut={e  => { if (selected?.id !== u.id) e.currentTarget.style.background = '' }}>
                      <td style={{ padding: '11px 14px', color: '#444', fontSize: '0.8rem' }}>{curPage * 20 + i + 1}</td>
                      <td style={{ padding: '11px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img src={u.avatarUrl || '/images/default-avatar.png'} onError={e=>{e.target.src='/images/default-avatar.png'}}
                            style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} alt="" />
                          <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{u.fullName}</span>
                        </div>
                      </td>
                      <td style={{ padding: '11px 14px', fontSize: '0.82rem', color: '#666' }}>{u.email}</td>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{ padding: '2px 9px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 600,
                          background: u.role === 'ADMIN' ? '#FF980022' : '#2196F322',
                          color: u.role === 'ADMIN' ? '#FF9800' : '#2196F3' }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{ padding: '2px 9px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 600,
                          background: u.status === 'ACTIVE' ? '#4CAF5022' : '#ff444422',
                          color: u.status === 'ACTIVE' ? '#4CAF50' : '#ff4444' }}>
                          {u.status === 'ACTIVE' ? 'Hoạt động' : 'Bị khóa'}
                        </span>
                      </td>
                      <td style={{ padding: '11px 14px', fontSize: '0.82rem', color: '#666' }}>{u.trackCount ?? 0}</td>
                      <td style={{ padding: '11px 14px', fontSize: '0.78rem', color: '#555' }}>
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi') : '—'}
                      </td>
                      <td style={{ padding: '11px 14px' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button className="btn btn-ghost"
                            style={{ fontSize: '0.75rem', padding: '4px 10px', color: '#2196F3', border: '1px solid #2196F322' }}
                            onClick={() => selectUser(u)}>
                            <i className="bi bi-info-circle"></i>
                          </button>
                          {u.role !== 'ADMIN' && (
                            <button className="btn btn-ghost"
                              style={{ fontSize: '0.75rem', padding: '4px 10px', color: u.status === 'ACTIVE' ? '#ff4444' : '#4CAF50', border: `1px solid ${u.status === 'ACTIVE' ? '#ff444422' : '#4CAF5022'}` }}
                              onClick={() => handleBlock(u.id, u.status)}>
                              <i className={`bi ${u.status === 'ACTIVE' ? 'bi-lock' : 'bi-unlock'}`}></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {totalPages > 1 && (
            <div className="pagination" style={{ marginTop: '20px' }}>
              {curPage > 0 && <button className="page-btn" onClick={() => load(curPage - 1)}>‹</button>}
              {[...Array(totalPages)].map((_, i) => (
                <button key={i} className={`page-btn${i === curPage ? ' active' : ''}`} onClick={() => load(i)}>{i + 1}</button>
              ))}
              {curPage < totalPages - 1 && <button className="page-btn" onClick={() => load(curPage + 1)}>›</button>}
            </div>
          )}
        </div>

        {/* Detail drawer */}
        {selected && (
          <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '14px', padding: '20px', position: 'sticky', top: '20px' }}>
            {/* Close */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Thông tin user</div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
            </div>

            {/* Avatar + name */}
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <img src={selected.avatarUrl || '/images/default-avatar.png'} onError={e=>{e.target.src='/images/default-avatar.png'}}
                style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #2a2a2a' }} alt="" />
              <div style={{ fontWeight: 700, marginTop: '8px' }}>{selected.fullName}</div>
              <div style={{ fontSize: '0.8rem', color: '#555' }}>{selected.email}</div>
            </div>

            {/* Info fields */}
            <div style={{ background: '#0d0d0d', borderRadius: '10px', padding: '12px', marginBottom: '14px' }}>
              {[
                { label: 'Trạng thái', value: selected.status === 'ACTIVE' ? '✅ Hoạt động' : '🔒 Bị khóa' },
                { label: 'Vai trò',    value: selected.role },
                { label: 'Năm sinh',   value: selected.birthYear || '—' },
                { label: 'SĐT',        value: selected.phoneNumber || '—' },
                { label: 'Địa chỉ',   value: selected.address || '—' },
                { label: 'Followers',  value: selected.followerCount ?? 0 },
                { label: 'Following',  value: selected.followingCount ?? 0 },
                { label: 'Bài hát',    value: selected.trackCount ?? 0 },
                { label: 'Tham gia',   value: selected.createdAt ? new Date(selected.createdAt).toLocaleDateString('vi') : '—' },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #161616', fontSize: '0.8rem' }}>
                  <span style={{ color: '#555' }}>{r.label}</span>
                  <span style={{ color: '#ccc', fontWeight: 500 }}>{r.value}</span>
                </div>
              ))}
            </div>

            {/* Send message */}
            <div>
              <div style={{ fontSize: '0.78rem', color: '#666', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                <i className="bi bi-megaphone" style={{ color: 'var(--accent)', marginRight: '6px' }}></i>Gửi thông báo
              </div>
              <textarea
                value={msgText}
                onChange={e => setMsgText(e.target.value)}
                placeholder="Nhập nội dung thông báo..."
                style={{ width: '100%', minHeight: '80px', background: '#0d0d0d', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '10px', color: '#e0e0e0', fontSize: '0.85rem', resize: 'vertical', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
              {msgOk && (
                <div style={{ fontSize: '0.8rem', color: '#4CAF50', marginTop: '6px' }}>
                  <i className="bi bi-check-circle"></i> Đã gửi thông báo!
                </div>
              )}
              {msgError && (
                <div style={{ fontSize: '0.8rem', color: '#ff4444', marginTop: '6px' }}>
                  <i className="bi bi-exclamation-circle"></i> {msgError}
                </div>
              )}
              <button
                onClick={handleSendMsg}
                disabled={msgSending || !msgText.trim()}
                style={{ width: '100%', marginTop: '8px', padding: '9px', borderRadius: '8px', background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', opacity: (!msgText.trim() || msgSending) ? 0.5 : 1 }}>
                {msgSending ? <><i className="bi bi-arrow-repeat spin"></i> Đang gửi...</> : <><i className="bi bi-send"></i> Gửi thông báo</>}
              </button>
            </div>

            {/* Quick block */}
            {selected.role !== 'ADMIN' && (
              <button
                onClick={() => handleBlock(selected.id, selected.status)}
                style={{ width: '100%', marginTop: '10px', padding: '8px', borderRadius: '8px', border: '1px solid', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', background: 'transparent',
                  color: selected.status === 'ACTIVE' ? '#ff4444' : '#4CAF50',
                  borderColor: selected.status === 'ACTIVE' ? '#ff444433' : '#4CAF5033' }}>
                <i className={`bi ${selected.status === 'ACTIVE' ? 'bi-lock' : 'bi-unlock'}`}></i>
                {selected.status === 'ACTIVE' ? ' Khóa tài khoản' : ' Mở khóa tài khoản'}
              </button>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}