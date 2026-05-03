import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { tracksApi } from '../api/index.js'
import { useAuth }   from '../context/AuthContext'
import { usePlayer } from '../context/PlayerContext'
import PlaylistModal from '../components/common/PlaylistModal'

export default function TrackDetail() {
  const { id }     = useParams()
  const { user }   = useAuth()
  const { playTrack, currentTrack, isPlaying } = usePlayer()
  const navigate   = useNavigate()

  const [track,   setTrack]   = useState(null)
  const [liked,   setLiked]   = useState(false)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [showPlModal, setShowPlModal] = useState(false)

  useEffect(() => {
    tracksApi.getById(id)
      .then(res => { setTrack(res.data); setLiked(res.data.isLiked ?? false) })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false))
  }, [id])

  const handleLike = async () => {
    if (!user) return
    const res = await tracksApi.like(id)
    setLiked(res.data.liked)
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!comment.trim()) return
    const res = await tracksApi.addComment(id, comment.trim())
    setTrack(t => ({ ...t, comments: [...(t.comments||[]), res.data] }))
    setComment('')
  }

  const handleDelete = async () => {
    if (!confirm('Xóa bài hát này?')) return
    await tracksApi.delete(id)
    navigate(`/profile/${track.uploader.email}`)
  }

  const isActive = currentTrack?.id === Number(id)

  if (loading) return <div style={{ textAlign: 'center', padding: '60px' }}><i className="bi bi-arrow-repeat spin" style={{ fontSize: '2rem' }}></i></div>
  if (!track) return null

  return (
    <div style={{ maxWidth: '800px', margin: '32px auto', padding: '0 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', gap: '24px', marginBottom: '32px', background: 'var(--bg-surface)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
        <img src={track.thumbnailUrl||'/images/default-thumb.png'} onError={e=>{e.target.src='/images/default-thumb.png'}}
          style={{ width: '160px', height: '160px', borderRadius: 'var(--radius-md)', objectFit: 'cover', flexShrink: 0 }} alt={track.title} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--accent)', marginBottom: '4px' }}>{track.genre}</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', marginBottom: '8px' }}>{track.title}</h1>
          <Link to={`/profile/${track.uploader.email}`} style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            {track.artist || track.uploader.fullName}
          </Link>
          <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <span><i className="bi bi-play"></i> {track.playCount}</span>
            <span><i className="bi bi-heart"></i> {track.likeCount}</span>
            <span><i className="bi bi-chat"></i> {track.comments?.length || 0}</span>
          </div>
          {track.description && <p style={{ marginTop: '12px', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{track.description}</p>}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onMouseDown={() => playTrack(track)}>
              <i className={`bi ${isActive && isPlaying ? 'bi-pause-fill' : 'bi-play-fill'}`}></i>
              {isActive && isPlaying ? ' Dừng' : ' Phát'}
            </button>
            {user && (
              <>
                <button className={`btn ${liked ? 'btn-primary' : 'btn-outline'}`} onClick={handleLike}>
                  <i className={`bi ${liked ? 'bi-heart-fill' : 'bi-heart'}`}></i> {liked ? 'Đã thích' : 'Thích'}
                </button>
                <button className="btn btn-outline" onClick={() => setShowPlModal(true)}>
                  <i className="bi bi-collection-play"></i> Thêm vào playlist
                </button>
              </>
            )}
            {track.isOwner && (
              <>
                <Link className="btn btn-outline" to={`/tracks/${id}/edit`}><i className="bi bi-pencil"></i> Sửa</Link>
                <button className="btn btn-outline" style={{ color: '#ff4444' }} onClick={handleDelete}><i className="bi bi-trash"></i> Xóa</button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Comments */}
      <div>
        <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '20px' }}>Bình luận ({track.comments?.length || 0})</h3>

        {user && (
          <form onSubmit={handleComment} style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
            <img src={user.avatarUrl||'/images/default-avatar.png'} onError={e=>{e.target.src='/images/default-avatar.png'}}
              style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} alt="" />
            <input className="form-control" value={comment} onChange={e=>setComment(e.target.value)}
              placeholder="Viết bình luận..." style={{ flex: 1 }} />
            <button className="btn btn-primary" type="submit">Gửi</button>
          </form>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {(track.comments || []).map(c => (
            <div key={c.id} style={{ display: 'flex', gap: '12px' }}>
              <Link to={`/profile/${c.author.email}`}>
                <img src={c.author.avatarUrl||'/images/default-avatar.png'} onError={e=>{e.target.src='/images/default-avatar.png'}}
                  style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} alt="" />
              </Link>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline', flexWrap: 'wrap' }}>
                  <Link to={`/profile/${c.author.email}`} style={{ fontWeight: 600, fontSize: '0.875rem' }}>{c.author.fullName}</Link>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(c.createdAt).toLocaleDateString('vi')}</span>
                  {(user?.email === c.author.email || track.isOwner) && (
                    <button style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', fontSize: '0.8rem' }}
                      onClick={async () => {
                        await tracksApi.deleteComment(c.id)
                        setTrack(t => ({ ...t, comments: t.comments.filter(x=>x.id!==c.id) }))
                      }}>
                      <i className="bi bi-trash"></i>
                    </button>
                  )}
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{c.content}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showPlModal && (
        <PlaylistModal
          trackId={Number(id)}
          onClose={() => setShowPlModal(false)}
        />
      )}
    </div>
  )
}