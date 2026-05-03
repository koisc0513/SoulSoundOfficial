// ─────────────────────────────────────────────────────────────
// src/components/Track/TrackCard.jsx
// ─────────────────────────────────────────────────────────────
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePlayer } from '../../context/PlayerContext'
import { useAuth } from '../../context/AuthContext'
import PlaylistModal from '../common/PlaylistModal'

export default function TrackCard({ track, trackList }) {

  const {
    playTrack,
    currentTrack,
    isPlaying,
    likedTracks,
    toggleLike
  } = usePlayer()

  const { user } = useAuth()

  const [loading,     setLoading]     = useState(false)
  const [showPlModal, setShowPlModal] = useState(false)

  const liked =
    likedTracks.includes(track.id)

  const isActive =
    currentTrack?.id === track.id


  const handlePlay = (e) => {
    e.preventDefault()
    playTrack(track, trackList || undefined)
  }


  const handleLike = async (e) => {

    e.stopPropagation()

    if (!user) return

    setLoading(true)

    await toggleLike(track)

    setLoading(false)

  }


  return (

    <div className="track-card">

      <div className="track-card__thumb-wrap">

        <img
          className="track-card__thumb"
          src={
            track.thumbnailUrl
            || '/images/default-thumb.png'
          }
          onError={(e)=>{
            e.target.src =
              '/images/default-thumb.png'
          }}
          alt={track.title}
        />

        <button
          className="track-card__play"
          onMouseDown={handlePlay}
        >

          <i
            className={`bi ${
              isActive && isPlaying
                ? 'bi-pause-fill'
                : 'bi-play-fill'
            }`}
          />

        </button>

      </div>


      <div className="track-card__info">

        <Link
          className="track-card__title"
          to={`/tracks/${track.id}`}
        >
          {track.title}
        </Link>

        <div className="track-card__artist">
          {track.artist}
        </div>

        <div className="track-card__meta">

          <span>
            <i className="bi bi-play"></i>
            {track.playCount ?? 0}
          </span>

          <span>
            <i className="bi bi-heart"></i>
            {track.likeCount ?? 0}
          </span>

        </div>

      </div>


      <div className="track-card__actions">

        {user && (

          <>

            <button
              className="player-btn"
              onClick={handleLike}
              disabled={loading}
              title={liked ? 'Bỏ thích' : 'Thích'}
            >

              <i
                className={`bi ${
                  liked
                    ? 'bi-heart-fill'
                    : 'bi-heart'
                }`}
                style={{
                  color:
                    liked
                      ? 'var(--accent)'
                      : ''
                }}
              />

            </button>

            <button
              className="player-btn"
              onClick={(e) => { e.stopPropagation(); setShowPlModal(true) }}
              title="Thêm vào playlist"
            >
              <i className="bi bi-collection-play" />
            </button>

          </>

        )}

      </div>

      {showPlModal && (
        <PlaylistModal
          trackId={track.id}
          onClose={() => setShowPlModal(false)}
        />
      )}

    </div>

  )

}