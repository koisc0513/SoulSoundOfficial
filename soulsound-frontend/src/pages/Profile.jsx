// src/pages/Profile.jsx
import { useState, useEffect, useRef } from 'react'
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
  const [modal,        setModal]        = useState(null)
  const [modalUsers,   setModalUsers]   = useState([])
  const [modalLoading, setModalLoading] = useState(false)

  // ✅ FIX: move hook lên đây
  const [cropSrc, setCropSrc] = useState(null)

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

  const likedIds = new Set(likedTracks?.map(t => t.id) || [])

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '40px' }}>

      {/* ── Banner ── */}
      <div
        className="profile-banner"
        style={u.bannerUrl ? {
          backgroundImage:    `url(${u.bannerUrl})`,
          backgroundSize:     'cover',
          backgroundPosition: 'center',
        } : undefined}
      >
        {isOwner && (
          <>
            <input
              id="banner-file-input"
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files[0]
                if (!file) return
                const reader = new FileReader()
                reader.onload = (ev) => setCropSrc(ev.target.result)
                reader.readAsDataURL(file)
                e.target.value = ''
              }}
            />

            <button
                          onClick={() => document.getElementById('banner-file-input').click()}
                          style={{
                            position: 'absolute', top: '12px', right: '25px',
                            display: 'flex', alignItems: 'center', gap: '6px',
                            background: 'rgba(0,0,0,0.55)',
                            backdropFilter: 'blur(6px)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '6px',
                            color: '#fff', fontSize: '0.8rem', fontWeight: 600,
                            padding: '7px 14px', cursor: 'pointer',
                            transition: 'background .2s',
                          }}
                          onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.8)'}
                          onMouseOut={e  => e.currentTarget.style.background = 'rgba(0,0,0,0.55)'}
                        >
                          <i className="bi bi-camera"></i> Update image
                        </button>
          </>
        )}
      </div>

      {/* Banner Crop Modal */}
      {cropSrc && (
        <BannerCropModal
          src={cropSrc}
          onClose={() => setCropSrc(null)}
          onSave={async (blob) => {
            const fd = new FormData()
            fd.append('bannerFile', blob, 'banner.jpg')

            try {
              const res = await usersApi.updateBanner(fd)
              setData(d => ({
                ...d,
                user: { ...d.user, bannerUrl: res.data.bannerUrl }
              }))
            } catch {}

            setCropSrc(null)
          }}
        />
      )}

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

      {/* ── Stats + Bio — SoundCloud layout ── */}
      <div style={{ padding: '20px 24px 0', borderBottom: '1px solid var(--border)' }}>

        {/* Stats: label trên, số dưới, căn trái */}
        <div className="profile-stats" style={{ gap: '32px', border: 'none', marginBottom: '16px', alignItems: 'flex-end' }}>
        <button className="stat" style={{ minWidth: '60px', background: 'none', border: 'none', cursor: 'default', fontFamily: 'var(--font-body)', textAlign: 'left', padding: 0 }}>
          <div className="stat__label">Tracks</div>
          <div className="stat__number">{tracks.length}</div>
        </button>
          <button className="stat stat-clickable" onClick={() => openModal('followers')} style={{ minWidth: '60px' }}>
            <div className="stat__label">Followers</div>
            <div className="stat__number">{u.followerCount}</div>
          </button>
          <button className="stat stat-clickable" onClick={() => openModal('following')} style={{ minWidth: '60px' }}>
            <div className="stat__label">Following</div>
            <div className="stat__number">{u.followingCount}</div>
          </button>
        </div>

        {/* Bio: plain text, không box, giống SoundCloud */}
        <BioBio bio={u.bio} />

      </div>

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
// BannerCropModal — kéo + cắt ảnh banner trước khi lưu
// Tỉ lệ cố định theo banner thực tế (1000 × 180px ≈ 5.56 : 1)
// ─────────────────────────────────────────────────────────────
const BANNER_RATIO = 1000 / 180   // width / height

function BannerCropModal({ src, onClose, onSave }) {
  const canvasRef     = useRef(null)
  const containerRef  = useRef(null)
  const imgRef        = useRef(null)
  const dragRef       = useRef(null)   // { startX, startY, origOffX, origOffY }

  const [imgNatural, setImgNatural] = useState({ w: 0, h: 0 })
  const [scale,      setScale]      = useState(1)      // zoom
  const [offset,     setOffset]     = useState({ x: 0, y: 0 }) // pan
  const [saving,     setSaving]     = useState(false)

  // Container width cố định 760px, height = width / ratio
  const CONTAINER_W = 760
  const CONTAINER_H = Math.round(CONTAINER_W / BANNER_RATIO)

  // Load ảnh, set scale mặc định vừa khít container
  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      setImgNatural({ w: img.naturalWidth, h: img.naturalHeight })
      // scale để ảnh vừa fill đủ container (cover)
      const scaleW = CONTAINER_W  / img.naturalWidth
      const scaleH = CONTAINER_H  / img.naturalHeight
      const initScale = Math.max(scaleW, scaleH)
      setScale(initScale)
      setOffset({ x: 0, y: 0 })
      imgRef.current = img
    }
    img.src = src
  }, [src])

  // Vẽ canvas preview mỗi khi scale/offset thay đổi
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !imgRef.current || imgNatural.w === 0) return
    const ctx = canvas.getContext('2d')
    canvas.width  = CONTAINER_W
    canvas.height = CONTAINER_H
    ctx.clearRect(0, 0, CONTAINER_W, CONTAINER_H)

    const drawW = imgNatural.w * scale
    const drawH = imgNatural.h * scale

    // clamp offset: không cho kéo ra ngoài
    const minX = Math.min(0, CONTAINER_W  - drawW)
    const minY = Math.min(0, CONTAINER_H  - drawH)
    const maxX = 0
    const maxY = 0
    const clampedX = Math.min(maxX, Math.max(minX, offset.x))
    const clampedY = Math.min(maxY, Math.max(minY, offset.y))

    ctx.drawImage(imgRef.current, clampedX, clampedY, drawW, drawH)
  }, [scale, offset, imgNatural])

  // ── Drag to pan ───────────────────────────────────────────
  const onMouseDown = (e) => {
    e.preventDefault()
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origOffX: offset.x,
      origOffY: offset.y,
    }
  }

  const onMouseMove = (e) => {
    if (!dragRef.current) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    setOffset({
      x: dragRef.current.origOffX + dx,
      y: dragRef.current.origOffY + dy,
    })
  }

  const onMouseUp = () => { dragRef.current = null }

  // Touch support
  const onTouchStart = (e) => {
    const t = e.touches[0]
    dragRef.current = { startX: t.clientX, startY: t.clientY,
                        origOffX: offset.x, origOffY: offset.y }
  }
  const onTouchMove = (e) => {
    if (!dragRef.current) return
    const t = e.touches[0]
    const dx = t.clientX - dragRef.current.startX
    const dy = t.clientY - dragRef.current.startY
    setOffset({ x: dragRef.current.origOffX + dx, y: dragRef.current.origOffY + dy })
  }

  // ── Save: export canvas → Blob → gọi onSave ──────────────
  const handleSave = () => {
    setSaving(true)
    const canvas = canvasRef.current
    canvas.toBlob(
      (blob) => { onSave(blob) },
      'image/jpeg',
      0.92
    )
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 4000,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        width: `${CONTAINER_W + 48}px`,
        maxWidth: '100%',
        boxShadow: 'var(--shadow)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: '2px' }}>
              Chỉnh sửa ảnh banner
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
              Kéo để di chuyển · Dùng thanh zoom để phóng to/thu nhỏ
            </p>
          </div>
          <button className="player-btn" onClick={onClose} disabled={saving}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* Canvas crop area */}
        <div
          ref={containerRef}
          style={{
            width: `${CONTAINER_W}px`, height: `${CONTAINER_H}px`,
            overflow: 'hidden', borderRadius: '6px',
            border: '2px dashed var(--accent)',
            cursor: 'grab', userSelect: 'none',
            position: 'relative',
          }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onMouseUp}
        >
          <canvas
            ref={canvasRef}
            style={{ display: 'block', width: '100%', height: '100%' }}
          />
          {/* Rule-of-thirds grid */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)
            `,
            backgroundSize: `${CONTAINER_W/3}px ${CONTAINER_H/3}px`,
          }} />
        </div>

        {/* Zoom slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '14px' }}>
          <i className="bi bi-zoom-out" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}></i>
          <input
            type="range"
            min={Math.max(CONTAINER_W / (imgNatural.w || 1), CONTAINER_H / (imgNatural.h || 1))}
            max={4}
            step={0.01}
            value={scale}
            onChange={e => {
              setScale(parseFloat(e.target.value))
              setOffset(o => ({ ...o }))   // trigger redraw
            }}
            style={{ flex: 1, accentColor: 'var(--accent)' }}
          />
          <i className="bi bi-zoom-in" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}></i>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', minWidth: '36px' }}>
            {Math.round(scale * 100)}%
          </span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button className="btn btn-outline" onClick={onClose} disabled={saving}>
            Huỷ
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving
              ? <><i className="bi bi-arrow-repeat spin"></i> Đang lưu...</>
              : <><i className="bi bi-check-lg"></i> Lưu banner</>}
          </button>
        </div>
      </div>
    </div>
  )
}


// ─────────────────────────────────────────────────────────────
// BioBio — SoundCloud-style bio section
// Hiển thị bio với "Xem thêm / Thu gọn" nếu dài
// ─────────────────────────────────────────────────────────────
const BIO_LIMIT = 180

function BioBio({ bio }) {
  const [expanded, setExpanded] = useState(false)
  const trimmed = (bio || '').trim()
  if (!trimmed) return null

  const isLong    = trimmed.length > BIO_LIMIT
  const displayed = (!isLong || expanded) ? trimmed : trimmed.slice(0, BIO_LIMIT)

  return (
    <div style={{ paddingBottom: '20px' }}>
      <p style={{
        fontSize: '0.9rem',
        color: 'var(--text-primary)',
        lineHeight: 1.65,
        whiteSpace: 'pre-line',
        wordBreak: 'break-word',
        margin: '0 0 10px 0',
      }}>
        {displayed}
        {isLong && !expanded && <span style={{ color: 'var(--text-muted)' }}>…</span>}
      </p>

      {isLong && (
        <button onClick={() => setExpanded(v => !v)} style={{
          background: 'none', border: 'none',
          color: 'var(--text-primary)', fontSize: '0.875rem',
          fontWeight: 700, cursor: 'pointer', padding: 0,
          textDecoration: 'underline', textUnderlineOffset: '3px',
        }}>
          {expanded ? 'Show less' : 'Show more'}
        </button>
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
