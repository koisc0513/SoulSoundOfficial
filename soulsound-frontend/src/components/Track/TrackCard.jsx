// ─────────────────────────────────────────────────────────────
// src/components/Track/TrackCard.jsx
// ─────────────────────────────────────────────────────────────
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePlayer } from '../../context/PlayerContext'
import { useAuth }   from '../../context/AuthContext'
import { tracksApi } from '../../api/index.js'

export default function TrackCard({ track, likedIds = new Set(), onLikeChange }) {
  const { playTrack, currentTrack, isPlaying } = usePlayer()
  const { user } = useAuth()
  const [liked, setLiked]   = useState(likedIds.has(track.id))
  const [loading, setLoading] = useState(false)

  const isActive = currentTrack?.id === track.id

  const handlePlay = (e) => {
    e.preventDefault()
    playTrack(track)
  }

  const handleLike = async (e) => {
    e.stopPropagation()
    if (!user) return
    setLoading(true)
    try {
      const res = await tracksApi.like(track.id)
      setLiked(res.data.liked)
      onLikeChange?.(track.id, res.data.liked)
    } catch {}
    finally { setLoading(false) }
  }

  return (
    <div className="track-card">
      {/* Thumbnail + play overlay */}
      <div style={{ position: 'relative', flexShrink: 0, width: '80px', height: '80px' }}>
        <img
          className="track-card__thumb"
          src={track.thumbnailUrl || '/images/default-thumb.png'}
          onError={e => { e.target.src = '/images/default-thumb.png' }}
          alt={track.title}
        />
        <button
          className="player-btn player-btn--play"
          onMouseDown={handlePlay}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%',
                   borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}
        >
          <i className={`bi ${isActive && isPlaying ? 'bi-pause-fill' : 'bi-play-fill'}`}></i>
        </button>
      </div>

      {/* Info */}
      <div className="track-card__info">
        <Link className="track-card__title" to={`/tracks/${track.id}`}>
          {track.title}
        </Link>
        <div className="track-card__artist">{track.artist}</div>
        <div className="track-card__meta">
          <span><i className="bi bi-play"></i> {track.playCount ?? 0}</span>
          <span><i className="bi bi-heart"></i> {track.likeCount ?? 0}</span>
          {track.genre && <span className="track-card__genre">{track.genre}</span>}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        {user && (
          <button
            className="player-btn"
            onClick={handleLike}
            disabled={loading}
            title="Thích"
          >
            <i
              className={`bi ${liked ? 'bi-heart-fill' : 'bi-heart'}`}
              style={{ color: liked ? 'var(--accent)' : '' }}
            ></i>
          </button>
        )}
        {user && (
          <button
            className="player-btn"
            onClick={e => { e.stopPropagation(); window._openPlaylistModal?.(track.id) }}
            title="Thêm vào playlist"
          >
            <i className="bi bi-plus-circle"></i>
          </button>
        )}
      </div>
    </div>
  )
}


