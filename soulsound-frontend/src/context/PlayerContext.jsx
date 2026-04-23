import { createContext, useContext, useRef, useState, useEffect, useCallback } from 'react'
import api, { tracksApi } from '../api/index.js'

const PlayerContext = createContext(null)

const audioEl = new Audio()
audioEl.preload = 'metadata'

export function PlayerProvider({ children }) {

  const [currentTrack, setCurrentTrack] = useState(null)
  const [playlist, setPlaylist]         = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)

  const [isPlaying,  setIsPlaying]  = useState(false)
  const [progress,   setProgress]   = useState(0)
  const [currentTime,setCurrentTime]= useState(0)
  const [duration,   setDuration]   = useState(0)
  const [volume,     setVolume]     = useState(0.8)

  const [shuffle, setShuffle] = useState(false)
  const [repeat,  setRepeat]  = useState(false)

  const [likedTracks, setLikedTracks] = useState([])

  // Refs: avoid stale closures in audio event handlers
  const playlistRef     = useRef([])
  const currentIndexRef = useRef(0)
  const shuffleRef      = useRef(false)
  const repeatRef       = useRef(false)
  const currentTrackRef = useRef(null)
  const playTimerRef    = useRef(null)

  useEffect(() => { playlistRef.current     = playlist     }, [playlist])
  useEffect(() => { currentIndexRef.current = currentIndex }, [currentIndex])
  useEffect(() => { shuffleRef.current      = shuffle      }, [shuffle])
  useEffect(() => { repeatRef.current       = repeat       }, [repeat])
  useEffect(() => { currentTrackRef.current = currentTrack }, [currentTrack])

  // Auto-load all tracks as default queue on mount
  useEffect(() => {
    const loadAllTracks = async () => {
      try {
        const res   = await tracksApi.getFeed(0)
        let all     = res.data.tracks || []
        const total = res.data.totalPages || 1

        if (total > 1) {
          const pages = await Promise.all(
            Array.from({ length: total - 1 }, (_, i) => tracksApi.getFeed(i + 1))
          )
          pages.forEach(r => { all = [...all, ...(r.data.tracks || [])] })
        }

        if (playlistRef.current.length === 0 && all.length > 0) {
          setPlaylist(all)
        }
      } catch (err) {
        console.warn('[Player] Could not load all tracks:', err)
      }
    }
    loadAllTracks()
  }, [])

  // Core: play by index (no stale closure risk)
  const playAtIndex = useCallback((index) => {
    const list = playlistRef.current
    if (!list.length || index < 0 || index >= list.length) return
    const track = list[index]
    if (!track?.fileUrl) return

    setCurrentTrack(track)
    setCurrentIndex(index)
    currentIndexRef.current = index
    setProgress(0)
    setCurrentTime(0)
    setDuration(0)

    audioEl.src = track.fileUrl
    audioEl.play().catch(console.warn)

    clearTimeout(playTimerRef.current)
    playTimerRef.current = setTimeout(
      () => api.post(`/tracks/${track.id}/play`).catch(() => {}),
      500
    )
  }, [])

  // Compute next/prev index
  const getNextIndex = useCallback(() => {
    const list = playlistRef.current
    if (!list.length) return -1
    if (shuffleRef.current && list.length > 1) {
      let idx
      do { idx = Math.floor(Math.random() * list.length) }
      while (idx === currentIndexRef.current)
      return idx
    }
    return (currentIndexRef.current + 1) % list.length
  }, [])

  const getPrevIndex = useCallback(() => {
    const list = playlistRef.current
    if (!list.length) return -1
    if (shuffleRef.current && list.length > 1) {
      let idx
      do { idx = Math.floor(Math.random() * list.length) }
      while (idx === currentIndexRef.current)
      return idx
    }
    return (currentIndexRef.current - 1 + list.length) % list.length
  }, [])

  const nextTrack = useCallback(() => {
    const idx = getNextIndex()
    if (idx !== -1) playAtIndex(idx)
  }, [getNextIndex, playAtIndex])

  const prevTrack = useCallback(() => {
    if (audioEl.currentTime > 3) { audioEl.currentTime = 0; return }
    const idx = getPrevIndex()
    if (idx !== -1) playAtIndex(idx)
  }, [getPrevIndex, playAtIndex])

  // Audio events — uses refs, never stale
  useEffect(() => {
    const onPlay       = () => setIsPlaying(true)
    const onPause      = () => setIsPlaying(false)
    const onEnded      = () => {
      if (repeatRef.current) {
        audioEl.currentTime = 0
        audioEl.play().catch(console.warn)
      } else {
        const idx = getNextIndex()
        if (idx !== -1) playAtIndex(idx)
      }
    }
    const onTimeUpdate = () => {
      setCurrentTime(audioEl.currentTime)
      if (audioEl.duration) setProgress((audioEl.currentTime / audioEl.duration) * 100)
    }
    const onLoadedMeta = () => setDuration(audioEl.duration || 0)

    audioEl.addEventListener('play',           onPlay)
    audioEl.addEventListener('pause',          onPause)
    audioEl.addEventListener('ended',          onEnded)
    audioEl.addEventListener('timeupdate',     onTimeUpdate)
    audioEl.addEventListener('loadedmetadata', onLoadedMeta)
    audioEl.volume = volume

    return () => {
      audioEl.removeEventListener('play',           onPlay)
      audioEl.removeEventListener('pause',          onPause)
      audioEl.removeEventListener('ended',          onEnded)
      audioEl.removeEventListener('timeupdate',     onTimeUpdate)
      audioEl.removeEventListener('loadedmetadata', onLoadedMeta)
    }
  }, [getNextIndex, playAtIndex])

  // playTrack: public API for components
  const playTrack = useCallback((track, list) => {
    if (!track?.fileUrl) return

    if (list && list.length > 0) {
      setPlaylist(list)
      playlistRef.current = list
      const idx = list.findIndex(t => t.id === track.id)
      const safeIdx = idx !== -1 ? idx : 0
      setCurrentIndex(safeIdx)
      currentIndexRef.current = safeIdx
      setCurrentTrack(track)
      setProgress(0); setCurrentTime(0); setDuration(0)
      audioEl.src = track.fileUrl
      audioEl.play().catch(console.warn)
      clearTimeout(playTimerRef.current)
      playTimerRef.current = setTimeout(
        () => api.post(`/tracks/${track.id}/play`).catch(() => {}), 500
      )
      return
    }

    if (currentTrackRef.current?.id === track.id) {
      if (audioEl.paused) audioEl.play().catch(console.warn)
      else audioEl.pause()
      return
    }

    const curList = playlistRef.current
    const idx = curList.findIndex(t => t.id === track.id)
    if (idx !== -1) {
      playAtIndex(idx)
    } else {
      const newList = [track, ...curList]
      setPlaylist(newList)
      playlistRef.current = newList
      setCurrentIndex(0)
      currentIndexRef.current = 0
      setCurrentTrack(track)
      setProgress(0); setCurrentTime(0); setDuration(0)
      audioEl.src = track.fileUrl
      audioEl.play().catch(console.warn)
      clearTimeout(playTimerRef.current)
      playTimerRef.current = setTimeout(
        () => api.post(`/tracks/${track.id}/play`).catch(() => {}), 500
      )
    }
  }, [playAtIndex])

  // setQueue: pages inject their track list
  const setQueue = useCallback((list, startTrack) => {
    if (!list?.length) return
    setPlaylist(list)
    playlistRef.current = list
    if (startTrack) {
      const idx = list.findIndex(t => t.id === startTrack.id)
      const safeIdx = idx !== -1 ? idx : 0
      setCurrentIndex(safeIdx)
      currentIndexRef.current = safeIdx
    }
  }, [])

  // Controls
  const togglePlay    = () => {
    if (!audioEl.src) return
    if (audioEl.paused) audioEl.play().catch(console.warn)
    else audioEl.pause()
  }
  const toggleShuffle = () => setShuffle(p => !p)
  const toggleRepeat  = () => setRepeat(p => !p)

  const seek = pct => {
    if (!audioEl.duration) return
    audioEl.currentTime = (pct / 100) * audioEl.duration
  }

  const changeVolume = val => {
    audioEl.volume = val
    setVolume(val)
  }

  // Like
  const toggleLike = async (track) => {
    const target = track || currentTrack
    if (!target) return
    try {
      const res   = await tracksApi.like(target.id)
      const liked = res.data.liked
      setLikedTracks(prev =>
        liked ? [...new Set([...prev, target.id])] : prev.filter(id => id !== target.id)
      )
      setCurrentTrack(prev =>
        prev?.id === target.id
          ? { ...prev, likeCount: (prev.likeCount || 0) + (liked ? 1 : -1) }
          : prev
      )
      setPlaylist(prev =>
        prev.map(t =>
          t.id === target.id
            ? { ...t, likeCount: (t.likeCount || 0) + (liked ? 1 : -1) }
            : t
        )
      )
    } catch (err) {
      console.error('Like error', err)
    }
  }

  const isLiked = likedTracks.includes(currentTrack?.id)

  // Next Up (5 tracks ahead)
  const nextUp = (() => {
    if (!playlist.length || shuffle) return []
    const result = []
    for (let i = 1; i <= 5; i++) {
      const idx = (currentIndex + i) % playlist.length
      const t   = playlist[idx]
      if (t && t.id !== currentTrack?.id) result.push({ ...t, _queueIndex: idx })
      if (result.length >= 5) break
    }
    return result
  })()

  const fmt = sec => {
    if (!sec || isNaN(sec)) return '0:00'
    return `${Math.floor(sec / 60)}:${('0' + Math.floor(sec % 60)).slice(-2)}`
  }

  return (
    <PlayerContext.Provider
      value={{
        currentTrack, playlist, currentIndex, isPlaying,
        progress, currentTime, duration, volume,
        shuffle, repeat,
        playTrack, nextTrack, prevTrack, playAtIndex, setQueue,
        togglePlay, toggleShuffle, toggleRepeat,
        toggleLike, likedTracks, isLiked,
        seek, changeVolume,
        nextUp, fmt,
      }}
    >
      {children}
    </PlayerContext.Provider>
  )
}

export const usePlayer = () => useContext(PlayerContext)