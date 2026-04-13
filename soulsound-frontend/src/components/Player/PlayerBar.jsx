import { usePlayer } from '../../context/PlayerContext'

export default function PlayerBar() {
  const {
    currentTrack,
    isPlaying,
    progress,
    currentTime,
    duration,
    volume,
    togglePlay,
    seek,
    changeVolume,
    fmt,
  } = usePlayer()

  if (!currentTrack) return null

  return (
    <div className="player-bar" style={{ display: 'flex' }}>
      <img
        className="player-bar__thumb"
        src={currentTrack.thumbnailUrl || '/images/default-thumb.png'}
        onError={e => { e.target.src = '/images/default-thumb.png' }}
        alt="thumb"
      />

      <div className="player-bar__info">
        <div className="player-bar__title">{currentTrack.title}</div>
        <div className="player-bar__artist">{currentTrack.artist}</div>
      </div>

      <div className="player-bar__controls">
        <button className="player-btn" onMouseDown={e => { e.preventDefault(); togglePlay() }}>
          <i className={`bi ${isPlaying ? 'bi-pause-fill' : 'bi-play-fill'}`}></i>
        </button>
      </div>

      <div className="player-bar__progress">
        <span className="player-bar__time">{fmt(currentTime)}</span>
        <div
          className="progress-bar"
          onClick={e => {
            const rect = e.currentTarget.getBoundingClientRect()
            seek(((e.clientX - rect.left) / rect.width) * 100)
          }}
        >
          <div className="progress-bar__fill" style={{ width: `${progress}%` }}></div>
        </div>
        <span className="player-bar__time">{fmt(duration)}</span>
      </div>

      <div className="player-bar__volume">
        <i className="bi bi-volume-up" style={{ color: 'var(--text-muted)' }}></i>
        <input
          type="range"
          min="0" max="1" step="0.05"
          value={volume}
          onChange={e => changeVolume(parseFloat(e.target.value))}
          style={{ width: '80px', accentColor: 'var(--accent)' }}
        />
      </div>
    </div>
  )
}