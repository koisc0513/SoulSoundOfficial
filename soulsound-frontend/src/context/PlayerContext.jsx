import { createContext, useContext, useRef, useState, useEffect } from 'react'
import api from '../api/index.js'

const PlayerContext = createContext(null)

// Singleton audio element — tồn tại suốt lifecycle của React app
const audioEl = new Audio()
audioEl.preload = 'metadata'

export function PlayerProvider({ children }) {
  const [currentTrack, setCurrentTrack] = useState(null)
  const [isPlaying,    setIsPlaying]    = useState(false)
  const [progress,     setProgress]     = useState(0)   // 0-100
  const [currentTime,  setCurrentTime]  = useState(0)
  const [duration,     setDuration]     = useState(0)
  const [volume,       setVolume]       = useState(0.8)
  const playTimerRef = useRef(null)

  // Sync audio events với React state
  useEffect(() => {
    const onPlay       = () => setIsPlaying(true)
    const onPause      = () => setIsPlaying(false)
    const onEnded      = () => { setIsPlaying(false); setProgress(0) }
    const onTimeUpdate = () => {
      setCurrentTime(audioEl.currentTime)
      if (audioEl.duration) {
        setProgress((audioEl.currentTime / audioEl.duration) * 100)
      }
    }
    const onLoadedMeta = () => setDuration(audioEl.duration || 0)

    audioEl.addEventListener('play',         onPlay)
    audioEl.addEventListener('pause',        onPause)
    audioEl.addEventListener('ended',        onEnded)
    audioEl.addEventListener('timeupdate',   onTimeUpdate)
    audioEl.addEventListener('loadedmetadata', onLoadedMeta)

    audioEl.volume = volume

    return () => {
      audioEl.removeEventListener('play',         onPlay)
      audioEl.removeEventListener('pause',        onPause)
      audioEl.removeEventListener('ended',        onEnded)
      audioEl.removeEventListener('timeupdate',   onTimeUpdate)
      audioEl.removeEventListener('loadedmetadata', onLoadedMeta)
    }
  }, [])

  const playTrack = (track) => {
    if (!track?.fileUrl) return

    // Cùng track → toggle
    if (currentTrack?.id === track.id) {
      if (isPlaying) audioEl.pause()
      else           audioEl.play().catch(console.warn)
      return
    }

    // Track mới
    setCurrentTrack(track)
    setProgress(0)
    setCurrentTime(0)
    setDuration(0)

    // KHÔNG gọi load() — set src rồi play() luôn
    audioEl.src = track.fileUrl
    audioEl.play().catch(console.warn)

    // Fire-and-forget: ghi play count
    clearTimeout(playTimerRef.current)
    playTimerRef.current = setTimeout(() => {
      api.post(`/tracks/${track.id}/play`).catch(() => {})
    }, 500)
  }

  const togglePlay = () => {
    if (!audioEl.src) return
    if (isPlaying) audioEl.pause()
    else           audioEl.play().catch(console.warn)
  }

  const seek = (pct) => {
    if (!audioEl.duration) return
    audioEl.currentTime = (pct / 100) * audioEl.duration
  }

  const changeVolume = (val) => {
    audioEl.volume = val
    setVolume(val)
  }

  const fmt = (sec) => {
    if (!sec || isNaN(sec)) return '0:00'
    return `${Math.floor(sec / 60)}:${('0' + Math.floor(sec % 60)).slice(-2)}`
  }

  return (
    <PlayerContext.Provider value={{
      currentTrack,
      isPlaying,
      progress,
      currentTime,
      duration,
      volume,
      playTrack,
      togglePlay,
      seek,
      changeVolume,
      fmt,
    }}>
      {children}
    </PlayerContext.Provider>
  )
}

export const usePlayer = () => useContext(PlayerContext)
