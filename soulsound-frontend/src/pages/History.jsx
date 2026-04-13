import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { usersApi } from '../api/index.js'
import { usePlayer } from '../context/PlayerContext'

export default function History() {
  const [histories, setHistories] = useState([])
  const [totalPages, setTotal]    = useState(0)
  const [curPage, setCurPage]     = useState(0)
  const [loading, setLoading]     = useState(true)
  const { playTrack }             = usePlayer()

  const load = async (page) => {
    setLoading(true)
    const res = await usersApi.getHistory(page)
    setHistories(res.data.histories)
    setTotal(res.data.totalPages)
    setCurPage(page)
    setLoading(false)
  }

  useEffect(() => { load(0) }, [])

  return (
    <div style={{ maxWidth: '900px', margin: '32px auto', padding: '0 24px' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
        <i className="bi bi-clock-history" style={{ color: 'var(--accent)' }}></i> Lịch sử nghe
      </h1>

      {loading ? <div style={{ textAlign: 'center', padding: '60px' }}><i className="bi bi-arrow-repeat spin" style={{ fontSize: '2rem' }}></i></div>
        : histories.length === 0
          ? <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🕐</div>
              <p>Chưa có lịch sử nghe.</p>
              <Link className="btn btn-primary" to="/" style={{ display: 'inline-flex', marginTop: '20px' }}>Nghe nhạc ngay</Link>
            </div>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {histories.map(h => (
                <div key={h.id} style={{ display: 'flex', gap: '14px', padding: '14px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', alignItems: 'center' }}>
                  <img src={h.track.thumbnailUrl||'/images/default-thumb.png'} onError={e=>{e.target.src='/images/default-thumb.png'}}
                    style={{ width: '52px', height: '52px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} alt="" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link to={`/tracks/${h.track.id}`} style={{ fontWeight: 600, fontSize: '0.95rem', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.track.title}</Link>
                    <div style={{ fontSize: '0.8rem', color: 'var(--accent)' }}>{h.track.artist}</div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(h.listenedAt).toLocaleDateString('vi')}
                  </div>
                  <button className="btn btn-primary" style={{ padding: '6px 12px', flexShrink: 0 }}
                    onMouseDown={() => playTrack(h.track)}>
                    <i className="bi bi-play-fill"></i>
                  </button>
                </div>
              ))}
            </div>
      }

      {totalPages > 1 && (
        <div className="pagination" style={{ marginTop: '24px' }}>
          {curPage > 0 && <button className="page-btn" onClick={() => load(curPage-1)}>‹</button>}
          {[...Array(totalPages)].map((_,i) => (
            <button key={i} className={`page-btn${i===curPage?' active':''}`} onClick={() => load(i)}>{i+1}</button>
          ))}
          {curPage < totalPages-1 && <button className="page-btn" onClick={() => load(curPage+1)}>›</button>}
        </div>
      )}
    </div>
  )
}