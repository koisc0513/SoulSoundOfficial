import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { tracksApi } from '../api/index.js'
import { useAuth }   from '../context/AuthContext'
import { usePlayer } from '../context/PlayerContext'
import PlaylistModal from '../components/common/PlaylistModal'

// ── CommentLikeButton ─────────────────────────────────────────────
function CommentLikeButton({ trackId, commentId, initialLiked, initialCount, user }) {
  // Ép kiểu số ngay từ đầu để tránh lỗi so sánh string/number
  const [liked, setLiked] = useState(!!initialLiked)
  const [count, setCount] = useState(Number(initialCount) || 0)
  const [busy,  setBusy]  = useState(false)

  const handle = async (e) => {
    e.stopPropagation()
    if (!user || busy) return

    // ── Optimistic update: cập nhật UI ngay lập tức, TRƯỚC khi gọi API ──
    const prevLiked = liked
    const prevCount = count
    const nextLiked = !liked
    const nextCount = nextLiked ? prevCount + 1 : Math.max(0, prevCount - 1)

    setLiked(nextLiked)   // tim đổi màu ngay
    setCount(nextCount)   // số thay đổi ngay
    setBusy(true)

    try {
      const res = await tracksApi.likeComment(trackId, commentId)
      // Đồng bộ số thực từ server, ép kiểu Number để chắc chắn
      setLiked(!!res.data.liked)
      setCount(Number(res.data.likeCount))
    } catch {
      // Rollback nếu API lỗi
      setLiked(prevLiked)
      setCount(prevCount)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      onClick={handle}
      title={user ? (liked ? 'Bỏ thích' : 'Thích bình luận') : 'Đăng nhập để thích'}
      style={{
        background: 'none',
        border: 'none',
        cursor: user ? 'pointer' : 'default',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '3px',
        fontSize: '0.78rem',
        color: liked ? '#e44' : 'var(--text-muted)',
        padding: '2px 4px',
        borderRadius: '4px',
        transition: 'color 0.12s',
        lineHeight: 1,
      }}
    >
      <i
        className={`bi ${liked ? 'bi-heart-fill' : 'bi-heart'}`}
        style={{ fontSize: '0.82rem' }}
      />
      {/* Luôn giữ chỗ cho số để layout không nhảy — hiển thị 0 khi chưa có */}
      <span style={{ fontVariantNumeric: 'tabular-nums', minWidth: '8px' }}>
        {count > 0 ? count : ''}
      </span>
    </button>
  )
}

// ── ReplyItem ─────────────────────────────────────────────────────
function ReplyItem({ r, user, track, trackId, onDelete }) {
  const canDelete = user && (user.email === r.author.email || track.isOwner)

  return (
    <div style={{ display: 'flex', gap: '10px' }}>
      <Link to={`/profile/${r.author.email}`} style={{ flexShrink: 0 }}>
        <img
          src={r.author.avatarUrl || '/images/default-avatar.png'}
          onError={e => { e.target.src = '/images/default-avatar.png' }}
          style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
          alt=""
        />
      </Link>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Link to={`/profile/${r.author.email}`}
            style={{ fontWeight: 600, fontSize: '0.8rem' }}>{r.author.fullName}</Link>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            {new Date(r.createdAt).toLocaleDateString('vi')}
          </span>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '2px' }}>
            <CommentLikeButton
              trackId={trackId} commentId={r.id}
              initialLiked={r.isLiked} initialCount={r.likeCount} user={user}
            />
            {canDelete && (
              <button
                style={{ background: 'none', border: 'none', color: '#ff5555', cursor: 'pointer',
                         fontSize: '0.78rem', padding: '2px 6px' }}
                onClick={() => onDelete(r.id)}>
                <i className="bi bi-trash"></i>
              </button>
            )}
          </div>
        </div>
        <div style={{ fontSize: '0.845rem', color: 'var(--text-secondary)', marginTop: '3px', lineHeight: 1.5 }}>
          {r.content}
        </div>
      </div>
    </div>
  )
}

// ── CommentItem ───────────────────────────────────────────────────
function CommentItem({ c, user, track, trackId, onDelete, onReplyAdded }) {
  const [showReplyBox, setShowReplyBox] = useState(false)
  const [replyText,    setReplyText]    = useState('')
  const [sending,      setSending]      = useState(false)
  const [showReplies,  setShowReplies]  = useState(true)

  const canDelete = user && (user.email === c.author.email || track.isOwner)
  const replyCount = (c.replies || []).length

  const handleReply = async (e) => {
    e.preventDefault()
    if (!replyText.trim()) return
    setSending(true)
    try {
      const res = await tracksApi.replyComment(trackId, c.id, replyText.trim())
      onReplyAdded(c.id, res.data)
      setReplyText('')
      setShowReplyBox(false)
      setShowReplies(true)
    } catch (err) {
      console.error('Reply error', err)
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ display: 'flex', gap: '12px' }}>
      <Link to={`/profile/${c.author.email}`} style={{ flexShrink: 0 }}>
        <img
          src={c.author.avatarUrl || '/images/default-avatar.png'}
          onError={e => { e.target.src = '/images/default-avatar.png' }}
          style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
          alt=""
        />
      </Link>

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Link to={`/profile/${c.author.email}`}
            style={{ fontWeight: 600, fontSize: '0.875rem' }}>{c.author.fullName}</Link>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {new Date(c.createdAt).toLocaleDateString('vi')}
          </span>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '2px' }}>
            <CommentLikeButton
              trackId={trackId} commentId={c.id}
              initialLiked={c.isLiked} initialCount={c.likeCount} user={user}
            />
            {user && (
              <button
                style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer',
                         fontSize: '0.78rem', padding: '2px 6px' }}
                onClick={() => { setShowReplyBox(v => !v); setReplyText('') }}>
                <i className="bi bi-reply"></i> Trả lời
              </button>
            )}
            {canDelete && (
              <button
                style={{ background: 'none', border: 'none', color: '#ff5555', cursor: 'pointer',
                         fontSize: '0.78rem', padding: '2px 6px' }}
                onClick={() => onDelete(c.id)}>
                <i className="bi bi-trash"></i>
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
          {c.content}
        </div>

        {/* Toggle replies */}
        {replyCount > 0 && (
          <button
            style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer',
                     fontSize: '0.78rem', padding: '6px 0 4px', display: 'flex', alignItems: 'center', gap: '4px' }}
            onClick={() => setShowReplies(v => !v)}>
            <i className={`bi ${showReplies ? 'bi-chevron-up' : 'bi-chevron-down'}`}
               style={{ fontSize: '0.7rem' }}></i>
            {showReplies ? `Ẩn ${replyCount} trả lời` : `Xem ${replyCount} trả lời`}
          </button>
        )}

        {/* Replies */}
        {showReplies && replyCount > 0 && (
          <div style={{ marginTop: '8px', paddingLeft: '12px', borderLeft: '2px solid var(--border)',
                        display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {c.replies.map(r => (
              <ReplyItem
                key={r.id} r={r} user={user} track={track} trackId={trackId}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}

        {/* Reply input */}
        {showReplyBox && (
          <form onSubmit={handleReply} style={{ display: 'flex', gap: '8px', marginTop: '10px', alignItems: 'center' }}>
            <img
              src={user?.avatarUrl || '/images/default-avatar.png'}
              onError={e => { e.target.src = '/images/default-avatar.png' }}
              style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
              alt=""
            />
            <input
              className="form-control"
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder={`Trả lời ${c.author.fullName}...`}
              style={{ flex: 1, fontSize: '0.875rem' }}
              autoFocus
            />
            <button className="btn btn-primary" type="submit" disabled={sending}
              style={{ fontSize: '0.8rem', padding: '6px 12px', flexShrink: 0 }}>
              {sending ? <i className="bi bi-arrow-repeat spin" /> : 'Gửi'}
            </button>
            <button type="button" className="btn btn-outline"
              onClick={() => setShowReplyBox(false)}
              style={{ fontSize: '0.8rem', padding: '6px 10px', flexShrink: 0 }}>
              Huỷ
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

// ── TrackDetail page ──────────────────────────────────────────────
export default function TrackDetail() {
  const { id }    = useParams()
  const { user }  = useAuth()
  const { playTrack, currentTrack, isPlaying } = usePlayer()
  const navigate  = useNavigate()

  const [track,        setTrack]       = useState(null)
  const [liked,        setLiked]       = useState(false)
  const [comment,      setComment]     = useState('')
  const [loading,      setLoading]     = useState(true)
  const [showPlModal,  setShowPlModal] = useState(false)
  const [highlightId,  setHighlightId]  = useState(null)
  const commentRefs = useRef({})

  useEffect(() => {
    tracksApi.getById(id)
      .then(res => {
        setTrack(res.data)
        setLiked(res.data.isLiked ?? false)
      })
      .catch(() => navigate('/'))
      .finally(() => {
        setLoading(false)
        // Highlight comment từ URL hash (#comment-123)
        const hash = window.location.hash
        if (hash.startsWith('#comment-')) {
          const cid = Number(hash.replace('#comment-', ''))
          if (cid) {
            setHighlightId(cid)
            setTimeout(() => {
              const el = document.getElementById(`comment-${cid}`)
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }, 400)
          }
        }
      })
  }, [id])

  const handleLike = async () => {
    if (!user) return
    const res = await tracksApi.like(id)
    setLiked(res.data.liked)
    setTrack(t => ({ ...t, likeCount: res.data.likeCount ?? t.likeCount }))
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!comment.trim() || !user) return
    try {
      const res = await tracksApi.addComment(id, comment.trim())
      setTrack(t => ({ ...t, comments: [...(t.comments || []), { ...res.data, replies: [] }] }))
      setComment('')
    } catch (err) {
      console.error('Comment error', err)
    }
  }

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Xóa bình luận này?')) return
    try {
      await tracksApi.deleteComment(commentId)
      setTrack(t => ({
        ...t,
        comments: t.comments
          .filter(c => c.id !== commentId)
          .map(c => ({ ...c, replies: (c.replies || []).filter(r => r.id !== commentId) }))
      }))
    } catch (err) {
      console.error('Delete comment error', err)
    }
  }

  const handleDeleteTrack = async () => {
    if (!window.confirm('Xóa bài hát này?')) return
    await tracksApi.delete(id)
    navigate(`/profile/${track.uploader.email}`)
  }

  const isActive = currentTrack?.id === Number(id)

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '60px' }}>
      <i className="bi bi-arrow-repeat spin" style={{ fontSize: '2rem' }}></i>
    </div>
  )
  if (!track) return null

  const totalComments = (track.comments || []).reduce(
    (sum, c) => sum + 1 + (c.replies?.length || 0), 0
  )

  return (
    <div style={{ maxWidth: '800px', margin: '32px auto', padding: '0 24px' }}>
      {/* Track header */}
      <div style={{ display: 'flex', gap: '24px', marginBottom: '32px', background: 'var(--bg-surface)',
                    padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
        <img
          src={track.thumbnailUrl || '/images/default-thumb.png'}
          onError={e => { e.target.src = '/images/default-thumb.png' }}
          style={{ width: '160px', height: '160px', borderRadius: 'var(--radius-md)', objectFit: 'cover', flexShrink: 0 }}
          alt={track.title}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--accent)', marginBottom: '4px' }}>{track.genre}</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', marginBottom: '8px' }}>{track.title}</h1>
          <Link to={`/profile/${track.uploader.email}`} style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            {track.artist || track.uploader.fullName}
          </Link>
          <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <span><i className="bi bi-play"></i> {track.playCount}</span>
            <span><i className="bi bi-heart"></i> {track.likeCount}</span>
            <span><i className="bi bi-chat"></i> {totalComments}</span>
          </div>
          {track.description && (
            <p style={{ marginTop: '12px', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {track.description}
            </p>
          )}
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onMouseDown={() => playTrack(track)}>
              <i className={`bi ${isActive && isPlaying ? 'bi-pause-fill' : 'bi-play-fill'}`}></i>
              {isActive && isPlaying ? ' Dừng' : ' Phát'}
            </button>
            {user && (
              <>
                <button className={`btn ${liked ? 'btn-primary' : 'btn-outline'}`} onClick={handleLike}>
                  <i className={`bi ${liked ? 'bi-heart-fill' : 'bi-heart'}`}></i>
                  {liked ? ' Đã thích' : ' Thích'}
                </button>
                <button className="btn btn-outline" onClick={() => setShowPlModal(true)}>
                  <i className="bi bi-collection-play"></i> Thêm vào playlist
                </button>
              </>
            )}
            {track.isOwner && (
              <>
                <Link className="btn btn-outline" to={`/tracks/${id}/edit`}>
                  <i className="bi bi-pencil"></i> Sửa
                </Link>
                <button className="btn btn-outline" style={{ color: '#ff4444' }} onClick={handleDeleteTrack}>
                  <i className="bi bi-trash"></i> Xóa
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Comments section */}
      <div>
        <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '20px' }}>
          Bình luận ({totalComments})
        </h3>

        {/* New comment input */}
        {user ? (
          <form onSubmit={handleComment} style={{ display: 'flex', gap: '10px', marginBottom: '28px', alignItems: 'center' }}>
            <img
              src={user.avatarUrl || '/images/default-avatar.png'}
              onError={e => { e.target.src = '/images/default-avatar.png' }}
              style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
              alt=""
            />
            <input
              className="form-control"
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Viết bình luận..."
              style={{ flex: 1 }}
            />
            <button className="btn btn-primary" type="submit" disabled={!comment.trim()}>Gửi</button>
          </form>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '24px' }}>
            <Link to="/login" style={{ color: 'var(--accent)' }}>Đăng nhập</Link> để bình luận.
          </p>
        )}

        {/* Comment list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {(track.comments || []).length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '24px 0' }}>
              Chưa có bình luận nào. Hãy là người đầu tiên! 💬
            </p>
          ) : (
            (track.comments || []).map(c => (
              <div
                key={c.id}
                id={`comment-${c.id}`}
                style={{
                  borderRadius: '8px',
                  padding: highlightId === c.id ? '8px' : '0',
                  background: highlightId === c.id ? 'rgba(233,30,99,0.08)' : 'transparent',
                  border: highlightId === c.id ? '1px solid rgba(233,30,99,0.3)' : '1px solid transparent',
                  transition: 'background 0.5s, border 0.5s',
                }}
              >
              <CommentItem
                c={c}
                user={user}
                track={track}
                trackId={id}
                onDelete={handleDeleteComment}
                onReplyAdded={(cid, reply) => {
                  setTrack(t => ({
                    ...t,
                    comments: t.comments.map(x =>
                      x.id === cid
                        ? { ...x, replies: [...(x.replies || []), { ...reply, isLiked: false, likeCount: 0 }] }
                        : x
                    )
                  }))
                }}
              />
              </div>
            ))
          )}
        </div>
      </div>

      {showPlModal && (
        <PlaylistModal trackId={Number(id)} onClose={() => setShowPlModal(false)} />
      )}
    </div>
  )
}