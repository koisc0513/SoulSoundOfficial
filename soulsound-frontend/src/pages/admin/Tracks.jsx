import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { adminApi } from '../../api/index.js'

export default function AdminTracks() {
  const [tracks,     setTracks]     = useState([])
  const [totalPages, setTotalPages] = useState(0)
  const [curPage,    setCurPage]    = useState(0)
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')

  const load = async (page) => {
    setLoading(true)
    try {
      const res = await adminApi.getTracks(page)
      setTracks(res.data.tracks)
      setTotalPages(res.data.totalPages)
      setCurPage(page)
    } finally { setLoading(false) }
  }

  useEffect(() => { load(0) }, [])

  const handleToggleHide = async (id, hidden) => {
    const action = hidden ? 'hiện' : 'ẩn'
    if (!confirm(`Bạn có chắc muốn ${action} bài hát này?`)) return
    await adminApi.hideTrack(id)
    setTracks(ts => ts.map(t => t.id === id ? { ...t, hidden: !t.hidden } : t))
  }

  const filtered = tracks.filter(t =>
    !search ||
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    (t.artist || '').toLowerCase().includes(search.toLowerCase()) ||
    t.uploader.fullName.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ maxWidth: '1100px', margin: '32px auto', padding: '0 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <i className="bi bi-music-note-list" style={{ color: 'var(--accent)' }}></i> Quản lý bài hát
        </h1>
        <input className="form-control" style={{ width: '260px' }} placeholder="Tìm theo tên, nghệ sĩ..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}><i className="bi bi-arrow-repeat spin" style={{ fontSize: '2rem' }}></i></div>
      ) : (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
                {['Bài hát', 'Nghệ sĩ', 'Uploader', 'Plays', 'Likes', 'Trạng thái', 'Hành động'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background .15s', opacity: t.hidden ? 0.6 : 1 }}
                  onMouseOver={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                  onMouseOut={e  => e.currentTarget.style.background = ''}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img src={t.thumbnailUrl || '/images/default-thumb.png'} onError={e => { e.target.src = '/images/default-thumb.png' }}
                        style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }} alt="" />
                      <Link to={`/tracks/${t.id}`} style={{ fontWeight: 500, fontSize: '0.9rem', maxWidth: '160px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</Link>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{t.artist}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <Link to={`/profile/${t.uploader.email}`} style={{ fontSize: '0.85rem', color: 'var(--accent)' }}>{t.uploader.fullName}</Link>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>{(t.playCount || 0).toLocaleString('vi')}</td>
                  <td style={{ padding: '12px 16px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>{t.likeCount || 0}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600,
                      background: t.hidden ? 'rgba(255,50,50,0.15)' : 'rgba(76,175,80,0.15)',
                      color: t.hidden ? '#ff4444' : '#4CAF50' }}>
                      {t.hidden ? 'Đã ẩn' : 'Hiển thị'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button
                      className="btn btn-ghost"
                      style={{ fontSize: '0.8rem', padding: '5px 12px', color: t.hidden ? '#4CAF50' : '#FF9800', border: `1px solid ${t.hidden ? '#4CAF5033' : '#FF980033'}` }}
                      onClick={() => handleToggleHide(t.id, t.hidden)}>
                      <i className={`bi ${t.hidden ? 'bi-eye' : 'bi-eye-slash'}`}></i>
                      {t.hidden ? ' Hiện' : ' Ẩn'}
                    </button>
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