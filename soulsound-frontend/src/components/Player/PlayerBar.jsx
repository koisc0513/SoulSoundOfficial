import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePlayer } from '../../context/PlayerContext'

export default function PlayerBar() {
  const {
    currentTrack,
    isPlaying,
    progress,
    currentTime,
    duration,
    volume,
    shuffle,
    repeat,
    nextUp,
    currentIndex,
    playlist,

    togglePlay,
    seek,
    changeVolume,
    nextTrack,
    prevTrack,
    toggleShuffle,
    toggleRepeat,
    toggleLike,
    isLiked,
    playAtIndex,
    fmt,
  } = usePlayer()

  const [showQueue, setShowQueue] = useState(false)

  if (!currentTrack) return null

  return (
    <>
      {/* ── Next Up Queue Panel ────────────────────────── */}
      {showQueue && (
        <div className="queue-panel">
          <div className="queue-panel__header">
            <span>
              <i className="bi bi-music-note-list" style={{ marginRight: 6 }} />
              Next Up
            </span>
            <button
              className="player-btn"
              onClick={() => setShowQueue(false)}
              style={{ fontSize: '1rem' }}
            >
              <i className="bi bi-x-lg" />
            </button>
          </div>

          {/* Currently playing */}
          <div className="queue-panel__section-label">Đang phát</div>
          <div className="queue-item queue-item--active">
            <img
              src={currentTrack.thumbnailUrl || '/images/default-thumb.png'}
              onError={e => { e.target.src = '/images/default-thumb.png' }}
              alt=""
            />
            <div className="queue-item__info">
              <div className="queue-item__title">{currentTrack.title}</div>
              <div className="queue-item__artist">{currentTrack.artist}</div>
            </div>
            <i className="bi bi-equalizer-fill queue-item__playing-icon" />
          </div>

          {/* Upcoming */}
          {nextUp.length > 0 && (
            <>
              <div className="queue-panel__section-label" style={{ marginTop: 12 }}>
                {shuffle ? 'Ngẫu nhiên' : 'Tiếp theo'}
              </div>
              {nextUp.map((t, i) => (
                <div
                  key={t.id + '-' + i}
                  className="queue-item"
                  onClick={() => { playAtIndex(t._queueIndex); setShowQueue(false) }}
                >
                  <img
                    src={t.thumbnailUrl || '/images/default-thumb.png'}
                    onError={e => { e.target.src = '/images/default-thumb.png' }}
                    alt=""
                  />
                  <div className="queue-item__info">
                    <div className="queue-item__title">{t.title}</div>
                    <div className="queue-item__artist">{t.artist}</div>
                  </div>
                </div>
              ))}
            </>
          )}

          {shuffle && (
            <div style={{ textAlign: 'center', padding: '16px 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <i className="bi bi-shuffle" style={{ marginRight: 6 }} />
              Chế độ ngẫu nhiên — bài tiếp theo sẽ được chọn ngẫu nhiên
            </div>
          )}

          <div className="queue-panel__footer">
            {playlist.length > 0 && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {currentIndex + 1} / {playlist.length} bài
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Player Bar ────────────────────────────────── */}
      <div className="player-bar">

        {/* Controls */}
        <div className="player-bar__controls">

          <button
            className={`player-btn ${shuffle ? 'active' : ''}`}
            onClick={toggleShuffle}
            title="Ngẫu nhiên"
          >
            <i className="bi bi-shuffle" />
          </button>

          <button className="player-btn" onClick={prevTrack} title="Bài trước">
            <i className="bi bi-skip-backward-fill" />
          </button>

          <button
            className="player-btn player-btn--play"
            onMouseDown={e => { e.preventDefault(); togglePlay() }}
            title={isPlaying ? 'Tạm dừng' : 'Phát'}
          >
            <i className={`bi ${isPlaying ? 'bi-pause-fill' : 'bi-play-fill'}`} />
          </button>

          <button className="player-btn" onClick={nextTrack} title="Bài tiếp">
            <i className="bi bi-skip-forward-fill" />
          </button>

          <button
            className={`player-btn ${repeat ? 'active' : ''}`}
            onClick={toggleRepeat}
            title="Lặp lại"
          >
            <i className="bi bi-repeat" />
          </button>

        </div>

        {/* Progress */}
        <div className="player-bar__progress">
          <span>{fmt(currentTime)}</span>
          <div
            className="progress-bar"
            onClick={e => {
              const rect = e.currentTarget.getBoundingClientRect()
              seek(((e.clientX - rect.left) / rect.width) * 100)
            }}
          >
            <div className="progress-bar__fill" style={{ width: `${progress}%` }} />
          </div>
          <span>{fmt(duration)}</span>
        </div>

        {/* Volume */}
        <div className="player-bar__volume">
          <i className="bi bi-volume-up" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={e => changeVolume(parseFloat(e.target.value))}
          />
        </div>

        {/* Track Info */}
        <div className="player-bar__track">
          <img
            src={currentTrack.thumbnailUrl || '/images/default-thumb.png'}
            onError={e => { e.target.src = '/images/default-thumb.png' }}
            alt=""
          />
          <div>
            <div className="player-bar__title">{currentTrack.title}</div>
            <div className="player-bar__artist">{currentTrack.artist}</div>
            <div className="player-bar__meta">
              <span>
                <i className="bi bi-heart" />
                {currentTrack.likeCount ?? 0}
              </span>
              {playlist.length > 0 && (
                <span style={{ marginLeft: 8 }}>
                  <i className="bi bi-music-note-list" />
                  {currentIndex + 1}/{playlist.length}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="player-bar__actions">

          <button className="player-btn" onClick={() => toggleLike()} title="Thích">
            <i
              className={`bi ${isLiked ? 'bi-heart-fill' : 'bi-heart'}`}
              style={{ color: isLiked ? 'var(--accent)' : '' }}
            />
          </button>

          {/* Next Up queue toggle */}
          <button
            className={`player-btn ${showQueue ? 'active' : ''}`}
            onClick={() => setShowQueue(p => !p)}
            title="Hàng chờ"
          >
            <i className="bi bi-music-note-list" />
          </button>

        </div>

      </div>
    </>
  )
}