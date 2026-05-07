import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { tracksApi } from '../api/index.js'
import { useAuth }   from '../context/AuthContext'
import { usePlayer } from '../context/PlayerContext'
import PlaylistModal from '../components/common/PlaylistModal'

function CommentItem({ c, user, track, trackId, onDelete, onReplyAdded }) {
  const [showReplyBox, setShowReplyBox] = useState(false)
  const [replyText,    setReplyText]    = useState('')
  const [sending,      setSending]      = useState(false)

  const isUploader = track.isOwner

  const handleReply = async (e) => {
    e.preventDefault()
    if (!replyText.trim()) return
    setSending(true)
    try {
      const res = await tracksApi.replyComment(trackId, c.id, replyText.trim())
      onReplyAdded(c.id, res.data)
      setReplyText('')
      setShowReplyBox(false)
    } finally { setSending(false) }
  }

  return (
    <div style={{ display: 'flex', gap: '12px' }}>
      <Link to={`/profile/${c.author.email}`}>
        <img src={c.author.avatarUrl||'/images/default-avatar.png'}
          onError={e=>{e.target.src='/images/default-avatar.png'}}
          style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} alt="" />
      </Link>
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Comment header */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline', flexWrap: 'wrap' }}>
          <Link to={`/profile/${c.author.email}`} style={{ fontWeight: 600, fontSize: '0.875rem' }}>{c.author.fullName}</Link>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(c.createdAt).toLocaleDateString('vi')}</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', alignItems: 'center' }}>
            {/* Nút Trả lời — chỉ hiện với uploader */}
            {isUploader && user && (
              <button
                style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.8rem', padding: '2px 6px' }}
                onClick={() => setShowReplyBox(v => !v)}>
                <i className="bi bi-reply"></i> Trả lời
              </button>
            )}
            {(user?.email === c.author.email || track.isOwner) && (
              <button
                style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', fontSize: '0.8rem', padding: '2px 6px' }}
                onClick={() => onDelete(c.id)}>
                <i className="bi bi-trash"></i>
              </button>
            )}
          </div>
        </div>

        {/* Comment body */}
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>{c.content}</div>

        {/* Replies */}
        {(c.replies || []).length > 0 && (
          <div style={{ marginTop: '10px', paddingLeft: '12px', borderLeft: '2px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {c.replies.map(r => (
              <div key={r.id} style={{ display: 'flex', gap: '10px' }}>
                <Link to={`/profile/${r.author.email}`}>
                  <img src={r.author.avatarUrl||'/images/default-avatar.png'}
                    onError={e=>{e.target.src='/images/default-avatar.png'}}
                    style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} alt="" />
                </Link>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline', flexWrap: 'wrap' }}>
                    <Link to={`/profile/${r.author.email}`} style={{ fontWeight: 600, fontSize: '0.8rem' }}>{r.author.fullName}</Link>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(r.createdAt).toLocaleDateString('vi')}</span>
                    {(user?.email === r.author.email || track.isOwner) && (
                      <button
                        style={{
                          marginLeft: 'auto',
                          background: 'none',
                          border: 'none',
                          color: '#ff4444',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          padding: '2px 6px'
                        }}
                        onClick={() => onDelete(r.id)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    )}
                  </div>
                  <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.5 }}>{r.content}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reply input box */}
        {showReplyBox && (
          <form onSubmit={handleReply} style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <img src={user.avatarUrl||'/images/default-avatar.png'}
              onError={e=>{e.target.src='/images/default-avatar.png'}}
              style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} alt="" />
            <input
              className="form-control"
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder={`Trả lời ${c.author.fullName}...`}
              style={{ flex: 1, fontSize: '0.875rem' }}
              autoFocus
            />
            <button className="btn btn-primary" type="submit" disabled={sending} style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
              {sending ? <i className="bi bi-arrow-repeat spin" /> : 'Gửi'}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => setShowReplyBox(false)} style={{ fontSize: '0.8rem', padding: '6px 10px' }}>
              Huỷ
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

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
            <CommentItem
              key={c.id}
              c={c}
              user={user}
              track={track}
              trackId={id}
              onDelete={async (cid) => {
                await tracksApi.deleteComment(cid)
                setTrack(t => ({ ...t, comments: t.comments.filter(x => x.id !== cid) }))
              }}
              onReplyAdded={(cid, reply) => {
                setTrack(t => ({
                  ...t,
                  comments: t.comments.map(x =>
                    x.id === cid ? { ...x, replies: [...(x.replies || []), reply] } : x
                  )
                }))
              }}
            />
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