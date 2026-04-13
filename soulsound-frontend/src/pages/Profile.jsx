// src/pages/Profile.jsx
import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { usersApi }  from '../api/index.js'
import { tracksApi } from '../api/index.js'
import { useAuth }   from '../context/AuthContext'
import TrackCard     from '../components/Track/TrackCard'

export default function Profile() {
  const { email }  = useParams()
  const { user }   = useAuth()
  const navigate   = useNavigate()

  const [data,         setData]         = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [tab,          setTab]          = useState('tracks')
  const [following,    setFollowing]    = useState(false)
  const [modal,        setModal]        = useState(null)   // 'followers' | 'following'
  const [modalUsers,   setModalUsers]   = useState([])
  const [modalLoading, setModalLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    setTab('tracks')
    usersApi.getProfile(email)
      .then(res => {
        setData(res.data)
        setFollowing(res.data.isFollowing ?? false)
      })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false))
  }, [email])

  const handleFollow = async () => {
    if (!user) return navigate('/login')
    const res = await usersApi.follow(data.user.id)
    setFollowing(res.data.following)
    setData(d => ({ ...d, user: { ...d.user, followerCount: res.data.followerCount } }))
  }

  const openModal = async (type) => {
    setModal(type)
    setModalUsers([])
    setModalLoading(true)
    try {
      const fn  = type === 'followers' ? usersApi.getFollowers : usersApi.getFollowing
      const res = await fn(data.user.id)
      setModalUsers(res.data)
    } catch {
      setModalUsers([])
    } finally {
      setModalLoading(false)
    }
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
      <i className="bi bi-arrow-repeat spin" style={{ fontSize: '2rem' }}></i>
    </div>
  )
  if (!data) return null

  const {
    user: u,
    tracks           = [],
    likedTracks      = [],
    playlists        = [],
    receivedComments = [],
    isOwner
  } = data

  const likedIds = new Set(likedTracks.map(t => t.id))

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '40px' }}>

      {/* ── Banner ── */}
      <div className="profile-banner"></div>

      {/* ── Avatar + Info ── */}
      <div className="profile-info">
        <img
          className="profile-avatar"
          src={u.avatarUrl || '/images/default-avatar.png'}
          onError={e => { e.target.src = '/images/default-avatar.png' }}
          alt={u.fullName}
        />
        <div style={{ flex: 1, paddingBottom: '8px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800 }}>
            {u.fullName}
          </h1>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '2px' }}>
            {u.email}
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px',
                      alignItems: 'flex-end', paddingBottom: '8px' }}>
          {isOwner ? (
            <Link className="btn btn-outline" to="/profile/edit">
              <i className="bi bi-pencil"></i> Chỉnh sửa hồ sơ
            </Link>
          ) : (
            user && (
              <button
                className={`btn ${following ? 'btn-primary' : 'btn-outline'}`}
                onClick={handleFollow}
              >
                {following ? 'Following' : 'Follow'}
              </button>
            )
          )}
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="profile-stats" style={{ padding: '16px 24px' }}>
        <div className="stat">
          <div className="stat__number">{tracks.length}</div>
          <div className="stat__label">Bài hát</div>
        </div>
        <button className="stat stat-clickable" onClick={() => openModal('followers')} title="Xem followers">
          <div className="stat__number">{u.followerCount}</div>
          <div className="stat__label">
            Followers&nbsp;<i className="bi bi-chevron-right" style={{ fontSize: '0.6rem', opacity: 0.5 }}></i>
          </div>
        </button>
        <button className="stat stat-clickable" onClick={() => openModal('following')} title="Xem following">
          <div className="stat__number">{u.followingCount}</div>
          <div className="stat__label">
            Following&nbsp;<i className="bi bi-chevron-right" style={{ fontSize: '0.6rem', opacity: 0.5 }}></i>
          </div>
        </button>
      </div>

      {/* Bio */}
      {u.bio && (
        <p style={{ padding: '0 24px 16px', color: 'var(--text-secondary)',
                    fontSize: '0.875rem', lineHeight: 1.6, maxWidth: '600px' }}>
          {u.bio}
        </p>
      )}

      {/* ── Tabs ── */}
      <div className="tabs">
        {[
          ['tracks',   'bi bi-music-note-list', 'Bài hát',              tracks.length],
          ['playlists','bi bi-collection-play',  'Playlist',             playlists.length],
          ['liked',    'bi bi-heart',            'Đã thích',             likedTracks.length],
          ['comments', 'bi bi-chat-dots',        'Bình luận nhận được',  receivedComments.length],
        ].map(([id, icon, label, count]) => (
          <div key={id} className={`tab ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>
            <i className={icon}></i> {label} ({count})
          </div>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <div style={{ padding: '24px' }}>

        {/* Tracks */}
        {tab === 'tracks' && (
          tracks.length === 0
            ? <Empty icon="🎵" text="Chưa có bài hát nào.">
                {isOwner && (
                  <Link className="btn btn-primary" to="/tracks/upload"
                    style={{ display: 'inline-flex', marginTop: '16px' }}>
                    <i className="bi bi-cloud-upload"></i> Upload ngay
                  </Link>
                )}
              </Empty>
            : <>
                {isOwner && (
                  <div style={{ marginBottom: '12px' }}>
                    <Link className="btn btn-outline" to="/tracks/upload" style={{ fontSize: '0.85rem' }}>
                      <i className="bi bi-plus-lg"></i> Upload thêm
                    </Link>
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {tracks.map(t => <TrackCard key={t.id} track={t} likedIds={likedIds} />)}
                </div>
              </>
        )}

        {/* Playlists */}
        {tab === 'playlists' && (
          playlists.length === 0
            ? <Empty icon="🎵" text="Chưa có playlist." />
            : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: '12px' }}>
                {playlists.map(pl => (
                  <Link key={pl.id} to={`/playlists/${pl.id}`}
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)',
                             borderRadius: 'var(--radius-md)', padding: '16px',
                             textDecoration: 'none', transition: 'border-color .2s' }}
                    onMouseOver={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                    onMouseOut={e  => e.currentTarget.style.borderColor = 'var(--border)'}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600,
                                  marginBottom: '4px', whiteSpace: 'nowrap',
                                  overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {pl.name}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {pl.trackCount} bài hát
                    </div>
                  </Link>
                ))}
              </div>
        )}

        {/* Liked */}
        {tab === 'liked' && (
          likedTracks.length === 0
            ? <Empty icon="❤️" text="Chưa thích bài nào." />
            : <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {likedTracks.map(t => <TrackCard key={t.id} track={t} likedIds={likedIds} />)}
              </div>
        )}

        {/* ── Comments tab — khớp layout Thymeleaf cũ ── */}
        {tab === 'comments' && (
          receivedComments.length === 0
            ? <Empty icon="💬" text="Chưa có bình luận nào." />
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {receivedComments.map(c => (
                  <CommentItem
                    key={c.id}
                    comment={c}
                    currentUser={user}
                    isOwner={isOwner}
                    onDelete={id => setData(d => ({
                      ...d,
                      receivedComments: d.receivedComments.filter(x => x.id !== id)
                    }))}
                  />
                ))}
              </div>
            )
        )}
      </div>

      {/* ── Followers / Following Modal ── */}
      {modal && (
        <UserListModal
          title={modal === 'followers'
            ? `Followers của ${u.fullName}`
            : `${u.fullName} đang theo dõi`}
          users={modalUsers}
          loading={modalLoading}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}


// ─────────────────────────────────────────────────────────────
// CommentItem — layout giống Thymeleaf cũ:
//  [avatar]  [Tên tác giả]  bình luận về  [Tên track]    [ngày]   [🗑]
//            [nội dung comment]
// ─────────────────────────────────────────────────────────────
function CommentItem({ comment: c, currentUser, isOwner, onDelete }) {
  const [deleted, setDeleted] = useState(false)

  if (deleted) return null

  const handleDelete = async () => {
    if (!confirm('Xóa bình luận này?')) return
    try {
      await tracksApi.deleteComment(c.id)
      setDeleted(true)
      onDelete?.(c.id)
    } catch {}
  }

  const canDelete = currentUser && (
    currentUser.email === c.author.email || isOwner
  )

  const dateStr = (() => {
    try {
      return new Date(c.createdAt).toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    } catch { return '' }
  })()

  return (
    <div style={{
      display: 'flex',
      gap: '12px',
      padding: '14px',
      background: 'var(--bg-surface)',
      borderRadius: 'var(--radius-sm)',
      border: '1px solid var(--border)',
    }}>

      {/* Avatar tác giả */}
      <Link to={`/profile/${c.author.email}`} style={{ flexShrink: 0 }}>
        <img
          src={c.author.avatarUrl || '/images/default-avatar.png'}
          onError={e => { e.target.src = '/images/default-avatar.png' }}
          style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
          alt={c.author.fullName}
        />
      </Link>

      {/* Nội dung */}
      <div style={{ flex: 1, minWidth: 0 }}>

        {/* Row 1: tên · "bình luận về" · track · ngày · xóa */}
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: '6px',
          flexWrap: 'wrap',
          marginBottom: '5px',
        }}>
          {/* Tên tác giả */}
          <Link
            to={`/profile/${c.author.email}`}
            style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}
          >
            {c.author.fullName}
          </Link>

          {/* "bình luận về [track]" */}
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            bình luận về&nbsp;
            <Link
              to={`/tracks/${c.track.id}`}
              style={{ color: 'var(--accent)', fontWeight: 500 }}
            >
              {c.track.title}
            </Link>
          </span>

          {/* Ngày */}
          <span style={{
            fontSize: '0.75rem', color: 'var(--text-muted)',
            marginLeft: 'auto', whiteSpace: 'nowrap',
          }}>
            {dateStr}
          </span>

          {/* Nút xóa */}
          {canDelete && (
            <button
              onClick={handleDelete}
              title="Xóa bình luận"
              style={{
                background: 'none', border: 'none',
                color: 'var(--text-muted)', cursor: 'pointer',
                fontSize: '0.8rem', padding: '0 2px',
                transition: 'color .15s',
              }}
              onMouseOver={e => e.currentTarget.style.color = '#ff4444'}
              onMouseOut={e  => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              <i className="bi bi-trash"></i>
            </button>
          )}
        </div>

        {/* Row 2: nội dung bình luận */}
        <div style={{
          fontSize: '0.875rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.55,
          wordBreak: 'break-word',
        }}>
          {c.content}
        </div>
      </div>
    </div>
  )
}


// ─────────────────────────────────────────────────────────────
// UserListModal — Followers / Following
// ─────────────────────────────────────────────────────────────
function UserListModal({ title, users, loading, onClose }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 3000,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        width: '400px', maxHeight: '70vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: 'var(--shadow)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px 16px',
          borderBottom: '1px solid var(--border)', flexShrink: 0,
        }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem' }}>{title}</h3>
          <button className="player-btn" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* Danh sách */}
        <div style={{ overflowY: 'auto', padding: '12px 16px', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
              <i className="bi bi-arrow-repeat spin"></i> Đang tải...
            </div>
          ) : users.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
              Chưa có ai.
            </div>
          ) : (
            users.map(mu => (
              <Link
                key={mu.id}
                to={`/profile/${mu.email}`}
                onClick={onClose}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '10px 8px',
                  borderRadius: 'var(--radius-sm)',
                  textDecoration: 'none',
                  transition: 'background .15s',
                }}
                onMouseOver={e => e.currentTarget.style.background = 'var(--bg-surface)'}
                onMouseOut={e  => e.currentTarget.style.background = ''}
              >
                <img
                  src={mu.avatarUrl || '/images/default-avatar.png'}
                  onError={e => { e.target.src = '/images/default-avatar.png' }}
                  style={{ width: '42px', height: '42px', borderRadius: '50%',
                           objectFit: 'cover', flexShrink: 0 }}
                  alt={mu.fullName}
                />
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {mu.fullName}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {mu.followerCount} followers
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}


// ─────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────
function Empty({ icon, text, children }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>{icon}</div>
      <p>{text}</p>
      {children}
    </div>
  )
}
