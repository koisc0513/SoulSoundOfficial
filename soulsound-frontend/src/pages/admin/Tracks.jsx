import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { adminApi } from '../../api/index.js'
import AdminLayout from './AdminLayout'

function fmtDuration(s) {
  if (!s) return '—'
  const m = Math.floor(s / 60), sec = s % 60
  return `${m}:${String(sec).padStart(2,'0')}`
}

export default function AdminTracks() {
  const [tracks,     setTracks]     = useState([])
  const [totalPages, setTotalPages] = useState(0)
  const [curPage,    setCurPage]    = useState(0)
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')

  // Comment panel
  const [commentTrack,    setCommentTrack]    = useState(null)
  const [comments,        setComments]        = useState([])
  const [commentLoading,  setCommentLoading]  = useState(false)

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
    const action = hidden ? 'hiện lại' : 'ẩn'
    if (!confirm(`Bạn có chắc muốn ${action} bài hát này?`)) return
    await adminApi.hideTrack(id)
    setTracks(ts => ts.map(t => t.id === id ? { ...t, hidden: !t.hidden } : t))
  }

  const loadComments = async (track) => {
    if (commentTrack?.id === track.id) { setCommentTrack(null); return }
    setCommentTrack(track)
    setCommentLoading(true)
    setComments([])
    try {
      const res = await adminApi.getTrackComments(track.id)
      setComments(res.data.comments || [])
    } finally { setCommentLoading(false) }
  }

  const filtered = tracks.filter(t =>
    !search ||
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    (t.artist || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.uploader?.fullName || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AdminLayout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <i className="bi bi-music-note-list" style={{ color: 'var(--accent)' }}></i>
          Quản lý bài hát
          <span style={{ background: '#f5500a22', color: 'var(--accent)', fontSize: '0.75rem', padding: '2px 10px', borderRadius: '20px', fontWeight: 600 }}>
            {tracks.length} bài
          </span>
        </h1>
        <input className="form-control" style={{ width: '260px' }} placeholder="Tìm theo tên, nghệ sĩ, uploader..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <i className="bi bi-arrow-repeat spin" style={{ fontSize: '2rem', color: 'var(--accent)' }}></i>
        </div>
      ) : (
        <>
          <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '14px', overflow: 'hidden', marginBottom: '16px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#0d0d0d', borderBottom: '1px solid #1e1e1e' }}>
                  {['Bài hát','Nghệ sĩ','Uploader','Thời lượng','Plays','Likes','Trạng thái','Hành động'].map(h => (
                    <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: '0.72rem', color: '#444', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <>
                    <tr key={t.id}
                      style={{ borderBottom: '1px solid #161616', transition: 'background .12s', opacity: t.hidden ? 0.55 : 1,
                        background: commentTrack?.id === t.id ? '#f5500a06' : '' }}
                      onMouseOver={e => { if (commentTrack?.id !== t.id) e.currentTarget.style.background = '#161616' }}
                      onMouseOut={e  => { if (commentTrack?.id !== t.id) e.currentTarget.style.background = '' }}>
                      <td style={{ padding: '11px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img src={t.thumbnailUrl || '/images/default-thumb.png'} onError={e=>{e.target.src='/images/default-thumb.png'}}
                            style={{ width: '38px', height: '38px', borderRadius: '7px', objectFit: 'cover', flexShrink: 0 }} alt="" />
                          <div>
                            <Link to={`/tracks/${t.id}`} style={{ fontWeight: 500, fontSize: '0.875rem', maxWidth: '150px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</Link>
                            {t.hidden && <span style={{ fontSize: '0.65rem', color: '#ff4444' }}>🚫 Đã ẩn</span>}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '11px 14px', fontSize: '0.82rem', color: '#666' }}>{t.artist || '—'}</td>
                      <td style={{ padding: '11px 14px' }}>
                        <Link to={`/profile/${t.uploader?.email}`} style={{ fontSize: '0.82rem', color: 'var(--accent)' }}>{t.uploader?.fullName}</Link>
                      </td>
                      <td style={{ padding: '11px 14px', fontSize: '0.82rem', color: '#666' }}>{fmtDuration(t.duration)}</td>
                      <td style={{ padding: '11px 14px', fontSize: '0.82rem', color: '#888' }}>
                        <i className="bi bi-play-fill" style={{ color: 'var(--accent)', marginRight: '4px' }}></i>
                        {(t.playCount || 0).toLocaleString('vi')}
                      </td>
                      <td style={{ padding: '11px 14px', fontSize: '0.82rem', color: '#888' }}>
                        <i className="bi bi-heart-fill" style={{ color: '#e91e63', marginRight: '4px' }}></i>
                        {t.likeCount || 0}
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{ padding: '2px 9px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 600,
                          background: t.hidden ? '#ff444422' : '#4CAF5022',
                          color: t.hidden ? '#ff4444' : '#4CAF50' }}>
                          {t.hidden ? 'Đã ẩn' : 'Hiển thị'}
                        </span>
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {/* Comment toggle */}
                          <button className="btn btn-ghost"
                            style={{ fontSize: '0.75rem', padding: '4px 10px', color: commentTrack?.id === t.id ? 'var(--accent)' : '#2196F3', border: `1px solid ${commentTrack?.id === t.id ? '#f5500a33' : '#2196F322'}` }}
                            onClick={() => loadComments(t)}
                            title="Xem comment">
                            <i className="bi bi-chat-dots"></i>
                          </button>
                          {/* Hide toggle */}
                          <button className="btn btn-ghost"
                            style={{ fontSize: '0.75rem', padding: '4px 10px', color: t.hidden ? '#4CAF50' : '#FF9800', border: `1px solid ${t.hidden ? '#4CAF5022' : '#FF980022'}` }}
                            onClick={() => handleToggleHide(t.id, t.hidden)}>
                            <i className={`bi ${t.hidden ? 'bi-eye' : 'bi-eye-slash'}`}></i>
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Inline comment panel */}
                    {commentTrack?.id === t.id && (
                      <tr key={`cmt-${t.id}`}>
                        <td colSpan={8} style={{ padding: '0', borderBottom: '1px solid #222' }}>
                          <div style={{ background: '#0d0d0d', borderTop: '1px solid #1e1e1e', padding: '16px 20px' }}>
                            <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '12px', color: '#ccc' }}>
                              <i className="bi bi-chat-dots" style={{ color: 'var(--accent)', marginRight: '8px' }}></i>
                              Bình luận: <em style={{ color: '#888', fontWeight: 400 }}>{t.title}</em>
                              <span style={{ marginLeft: '10px', fontSize: '0.75rem', color: '#555' }}>({comments.length} bình luận)</span>
                            </div>

                            {commentLoading ? (
                              <div style={{ textAlign: 'center', padding: '24px' }}>
                                <i className="bi bi-arrow-repeat spin" style={{ color: 'var(--accent)' }}></i>
                              </div>
                            ) : comments.length === 0 ? (
                              <p style={{ color: '#444', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>Chưa có bình luận nào.</p>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '320px', overflowY: 'auto' }}>
                                {comments.map(c => (
                                  <div key={c.id} style={{ display: 'flex', gap: '10px' }}>
                                    <img src={c.author.avatarUrl || '/images/default-avatar.png'} onError={e=>{e.target.src='/images/default-avatar.png'}}
                                      style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} alt="" />
                                    <div style={{ flex: 1 }}>
                                      <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline', marginBottom: '3px' }}>
                                        <Link to={`/profile/${c.author.email}`} style={{ fontWeight: 600, fontSize: '0.8rem', color: '#ccc' }}>{c.author.fullName}</Link>
                                        <span style={{ fontSize: '0.7rem', color: '#444' }}>
                                          {new Date(c.createdAt).toLocaleString('vi', { dateStyle: 'short', timeStyle: 'short' })}
                                        </span>
                                      </div>
                                      <div style={{ fontSize: '0.83rem', color: '#888', lineHeight: 1.4 }}>{c.content}</div>
                                      {/* Replies */}
                                      {c.replies?.length > 0 && (
                                        <div style={{ marginTop: '8px', paddingLeft: '12px', borderLeft: '2px solid #2a2a2a', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                          {c.replies.map(r => (
                                            <div key={r.id} style={{ display: 'flex', gap: '8px' }}>
                                              <img src={r.author.avatarUrl || '/images/default-avatar.png'} onError={e=>{e.target.src='/images/default-avatar.png'}}
                                                style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} alt="" />
                                              <div>
                                                <span style={{ fontWeight: 600, fontSize: '0.75rem', color: 'var(--accent)', marginRight: '6px' }}>{r.author.fullName}</span>
                                                <span style={{ fontSize: '0.78rem', color: '#777' }}>{r.content}</span>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              {curPage > 0 && <button className="page-btn" onClick={() => load(curPage - 1)}>‹</button>}
              {[...Array(totalPages)].map((_, i) => (
                <button key={i} className={`page-btn${i === curPage ? ' active' : ''}`} onClick={() => load(i)}>{i + 1}</button>
              ))}
              {curPage < totalPages - 1 && <button className="page-btn" onClick={() => load(curPage + 1)}>›</button>}
            </div>
          )}
        </>
      )}
    </AdminLayout>
  )
}