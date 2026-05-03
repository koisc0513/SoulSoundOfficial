import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate }                   from 'react-router-dom'
import { playlistsApi }                             from '../api/index.js'
import { useAuth }                                  from '../context/AuthContext'
import { usePlayer }                                from '../context/PlayerContext'

/* ─── Format helpers ─────────────────────────────────────── */
const fmtSec = (s) => {
  if (!s || s <= 0) return ''
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}

/** Hiển thị tổng thời lượng dạng "X giờ Y phút" hoặc "Y phút Z giây" */
const fmtTotal = (totalSec) => {
  if (!totalSec || totalSec <= 0) return null
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = Math.floor(totalSec % 60)
  if (h > 0) return `${h} giờ ${m} phút`
  if (m > 0) return `${m} phút ${s} giây`
  return `${s} giây`
}

export default function PlaylistDetail() {
  const { id }   = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const {
    playTrack, setQueue,
    currentTrack, isPlaying,
    nextTrack, prevTrack,
    toggleShuffle, toggleRepeat,
    shuffle, repeat,
    playlist: globalPlaylist,
    playAtIndex,
  } = usePlayer()

  /* ─── State ──────────────────────────────────────────── */
  const [playlist,  setPlaylist]  = useState(null)
  const [tracks,    setTracks]    = useState([])
  const [editing,   setEditing]   = useState(false)
  const [newName,   setNewName]   = useState('')
  const [loading,   setLoading]   = useState(true)

  // Cover
  const [coverPreview, setCoverPreview] = useState(null)
  const [coverLoading, setCoverLoading] = useState(false)
  const coverInputRef = useRef(null)

  // Drag-and-drop
  const [dragIdx,     setDragIdx]     = useState(null)
  const [dragOverIdx, setDragOverIdx] = useState(null)
  const [reordering,  setReordering]  = useState(false)

  /* ─── Load ───────────────────────────────────────────── */
  useEffect(() => {
    playlistsApi.getById(id)
      .then(res => {
        setPlaylist(res.data)
        setTracks(res.data.tracks || [])
        setNewName(res.data.name)
        setCoverPreview(res.data.coverUrl || null)
      })
      .catch(() => navigate('/playlists'))
      .finally(() => setLoading(false))
  }, [id])

  /* ─── Is this playlist active in global player? ──────── */
  const isThisActive = useCallback(() => {
    if (!tracks.length || !globalPlaylist.length) return false
    // Coi là active nếu các track id khớp với globalPlaylist
    return tracks.every((t, i) => globalPlaylist[i]?.id === t.id)
  }, [tracks, globalPlaylist])

  /* ─── Inject playlist vào global player khi play ──────── */
  const activateAndPlay = useCallback((track) => {
    setQueue(tracks, track)
    playTrack(track, tracks)
  }, [tracks, setQueue, playTrack])

  const handlePlayAll = useCallback(() => {
    if (!tracks.length) return
    activateAndPlay(tracks[0])
  }, [tracks, activateAndPlay])

  /* ─── Rename ─────────────────────────────────────────── */
  const handleUpdate = async (e) => {
    e.preventDefault()
    await playlistsApi.update(id, newName, playlist.description)
    setPlaylist(p => ({ ...p, name: newName }))
    setEditing(false)
  }

  /* ─── Remove track ───────────────────────────────────── */
  const handleRemove = async (trackId) => {
    await playlistsApi.removeTrack(id, trackId)
    setTracks(prev => prev.filter(t => t.id !== trackId))
    setPlaylist(p => ({ ...p, trackCount: p.trackCount - 1 }))
  }

  /* ─── Delete playlist ────────────────────────────────── */
  const handleDelete = async () => {
    if (!confirm('Xóa playlist này?')) return
    await playlistsApi.delete(id)
    navigate('/playlists')
  }

  /* ─── Cover upload ───────────────────────────────────── */
  const handleCoverChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCoverPreview(URL.createObjectURL(file))
    setCoverLoading(true)
    try {
      const fd = new FormData()
      fd.append('cover', file)
      const res = await playlistsApi.updateCover(id, fd)
      setCoverPreview(res.data.coverUrl)
      setPlaylist(p => ({ ...p, coverUrl: res.data.coverUrl }))
    } catch {
      setCoverPreview(playlist?.coverUrl || null)
    } finally {
      setCoverLoading(false)
      e.target.value = ''
    }
  }

  const handleDeleteCover = async () => {
    if (!confirm('Xóa ảnh bìa?')) return
    await playlistsApi.deleteCover(id)
    setCoverPreview(null)
    setPlaylist(p => ({ ...p, coverUrl: null }))
  }

  /* ─── Drag-and-drop reorder ──────────────────────────── */
  const onDragStart = (e, idx) => {
    setDragIdx(idx)
    e.dataTransfer.effectAllowed = 'move'
  }
  const onDragOver = (e, idx) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (idx !== dragOverIdx) setDragOverIdx(idx)
  }
  const onDrop = async (e, dropIdx) => {
    e.preventDefault()
    if (dragIdx === null || dragIdx === dropIdx) { reset(); return }

    const next = [...tracks]
    const [moved] = next.splice(dragIdx, 1)
    next.splice(dropIdx, 0, moved)
    setTracks(next)
    reset()

    setReordering(true)
    try {
      await playlistsApi.reorder(id, next.map(t => t.id))
      // Nếu playlist này đang active, cập nhật queue theo thứ tự mới
      if (isThisActive()) setQueue(next)
    } catch {
      // Rollback
      playlistsApi.getById(id).then(r => setTracks(r.data.tracks || []))
    } finally {
      setReordering(false)
    }
  }
  const reset = () => { setDragIdx(null); setDragOverIdx(null) }

  /* ─── Guards ─────────────────────────────────────────── */
  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px' }}>
      <i className="bi bi-arrow-repeat spin" style={{ fontSize: '2rem' }}></i>
    </div>
  )
  if (!playlist) return null

  const isOwner = playlist.isOwner
  const active  = isThisActive()
  const totalDuration = tracks.reduce((sum, t) => sum + (t.duration || 0), 0)

  /* ─── Mini player bar controls ──────────────────────── */
  const handleMiniControl = (action) => {
    if (!active) { handlePlayAll(); return }
    action()
  }

  /* ─── Render ─────────────────────────────────────────── */
  return (
    <div className="playlist-detail">

      {/* ══ HEADER ══════════════════════════════════════ */}
      <div className="pl-header">

        {/* Cover */}
        <div className="pl-cover-wrap">
          {coverPreview
            ? <img src={coverPreview} alt="cover" className="pl-cover-img" />
            : <div className="pl-cover-placeholder"><i className="bi bi-music-note-list"></i></div>
          }
          {isOwner && (
            <div className="pl-cover-actions">
              <button
                className="pl-cover-btn"
                onClick={() => coverInputRef.current?.click()}
                disabled={coverLoading}
                title="Đổi ảnh bìa"
              >
                {coverLoading
                  ? <i className="bi bi-arrow-repeat spin"></i>
                  : <i className="bi bi-camera-fill"></i>}
              </button>
              {coverPreview && (
                <button
                  className="pl-cover-btn pl-cover-btn--delete"
                  onClick={handleDeleteCover}
                  title="Xóa ảnh bìa"
                >
                  <i className="bi bi-trash-fill"></i>
                </button>
              )}
            </div>
          )}
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleCoverChange}
          />
        </div>

        {/* Info */}
        <div className="pl-header-info">
          {editing ? (
            <form onSubmit={handleUpdate} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                className="form-control"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                autoFocus
                style={{ flex: 1, fontSize: '1.1rem', fontWeight: 700 }}
              />
              <button className="btn btn-primary" type="submit">
                <i className="bi bi-check-lg"></i>
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setEditing(false)}>
                <i className="bi bi-x-lg"></i>
              </button>
            </form>
          ) : (
            <h1 className="pl-header-name">{playlist.name}</h1>
          )}

          <div className="pl-header-stats">
            <span><i className="bi bi-music-note-beamed"></i> {tracks.length} bài hát</span>
            {fmtTotal(totalDuration) && (
              <span><i className="bi bi-clock"></i> {fmtTotal(totalDuration)}</span>
            )}
            {playlist.owner && (
              <span><i className="bi bi-person"></i> {playlist.owner.fullName}</span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '14px', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              style={{ padding: '7px 18px' }}
              onClick={handlePlayAll}
              disabled={!tracks.length}
            >
              <i className="bi bi-play-circle-fill"></i> Phát tất cả
            </button>
            {isOwner && (
              <>
                <button className="btn btn-outline" onClick={() => setEditing(true)}>
                  <i className="bi bi-pencil"></i> Đổi tên
                </button>
                <button
                  className="btn btn-outline"
                  style={{ color: '#e05252', borderColor: '#e05252' }}
                  onClick={handleDelete}
                >
                  <i className="bi bi-trash"></i> Xóa
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ══ MINI PLAYER BAR ══════════════════════════════ */}
      {tracks.length > 0 && (
        <div className="pl-mini-bar">
          <div className="pl-mini-bar__track">
            {active && currentTrack ? (
              <>
                <img
                  src={currentTrack.thumbnailUrl || '/images/default-thumb.png'}
                  onError={e => { e.target.src = '/images/default-thumb.png' }}
                  className="pl-mini-bar__thumb"
                  alt=""
                />
                <div>
                  <div className="pl-mini-bar__title">{currentTrack.title}</div>
                  <div className="pl-mini-bar__artist">{currentTrack.artist}</div>
                </div>
              </>
            ) : (
              <div className="pl-mini-bar__hint">
                <i className="bi bi-collection-play" style={{ marginRight: 6 }}></i>
                Nhấn phát để điều khiển tại đây
              </div>
            )}
          </div>

          <div className="pl-mini-bar__controls">
            <button
              className={`player-btn${active && shuffle ? ' active' : ''}`}
              onClick={() => handleMiniControl(toggleShuffle)}
              title="Ngẫu nhiên"
            >
              <i className="bi bi-shuffle"></i>
            </button>
            <button
              className="player-btn"
              onClick={() => handleMiniControl(prevTrack)}
              title="Bài trước"
            >
              <i className="bi bi-skip-backward-fill"></i>
            </button>
            <button
              className="player-btn"
              onClick={() => handleMiniControl(nextTrack)}
              title="Bài tiếp"
            >
              <i className="bi bi-skip-forward-fill"></i>
            </button>
            <button
              className={`player-btn${active && repeat ? ' active' : ''}`}
              onClick={() => handleMiniControl(toggleRepeat)}
              title="Lặp lại"
            >
              <i className="bi bi-repeat"></i>
            </button>
          </div>
        </div>
      )}

      {/* ══ TRACK LIST ═══════════════════════════════════ */}
      {tracks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎵</div>
          <p>Playlist chưa có bài hát.</p>
        </div>
      ) : (
        <>
          {isOwner && (
            <div style={{
              fontSize: '0.75rem', color: 'var(--text-muted)',
              marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px'
            }}>
              <i className="bi bi-grip-vertical"></i>
              Kéo để sắp xếp thứ tự
              {reordering && <i className="bi bi-arrow-repeat spin" style={{ marginLeft: 4 }}></i>}
            </div>
          )}

          <div className="pl-track-list">
            {tracks.map((t, idx) => {
              const isActive  = currentTrack?.id === t.id && active
              const isDragged = dragIdx === idx
              const isOver    = dragOverIdx === idx && dragIdx !== idx
              return (
                <div
                  key={t.id}
                  className={[
                    'pl-track-row',
                    isActive  ? 'active'    : '',
                    isDragged ? 'dragging'  : '',
                    isOver    ? 'drag-over' : '',
                  ].filter(Boolean).join(' ')}
                  draggable={isOwner}
                  onDragStart={isOwner ? e => onDragStart(e, idx) : undefined}
                  onDragOver={isOwner  ? e => onDragOver(e, idx)  : undefined}
                  onDrop={isOwner      ? e => onDrop(e, idx)      : undefined}
                  onDragEnd={isOwner   ? reset                    : undefined}
                  onClick={() => activateAndPlay(t)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Drag handle */}
                  {isOwner && (
                    <div className="pl-track-row__drag-handle" title="Kéo để đổi thứ tự" onClick={e => e.stopPropagation()}>
                      <i className="bi bi-grip-vertical"></i>
                    </div>
                  )}

                  {/* Index / playing indicator */}
                  <div className="pl-track-row__idx">
                    {isActive && isPlaying
                      ? <i className="bi bi-equalizer-fill" style={{ color: 'var(--accent)' }}></i>
                      : idx + 1
                    }
                  </div>

                  {/* Thumbnail */}
                  <img
                    src={t.thumbnailUrl || '/images/default-thumb.png'}
                    onError={e => { e.target.src = '/images/default-thumb.png' }}
                    className="pl-track-row__thumb"
                    alt=""
                  />

                  {/* Info */}
                  <div className="pl-track-row__info">
                    <div className="pl-track-row__title">{t.title}</div>
                    <div className="pl-track-row__artist">{t.artist}</div>
                  </div>

                  {/* Duration */}
                  <div className="pl-track-row__duration">
                    {fmtSec(t.duration)}
                  </div>

                  {/* Actions */}
                  <div className="pl-track-row__actions" onClick={e => e.stopPropagation()}>
                    <button
                      className="player-btn"
                      onMouseDown={e => { e.stopPropagation(); activateAndPlay(t) }}
                      title={isActive && isPlaying ? 'Tạm dừng' : 'Phát'}
                    >
                      <i className={`bi ${isActive && isPlaying ? 'bi-pause-fill' : 'bi-play-fill'}`}></i>
                    </button>
                    {isOwner && (
                      <button
                        className="player-btn"
                        style={{ color: 'var(--text-muted)' }}
                        onClick={e => { e.stopPropagation(); handleRemove(t.id) }}
                        title="Xóa khỏi playlist"
                      >
                        <i className="bi bi-x-lg"></i>
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
