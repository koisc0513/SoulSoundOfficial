import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { playlistsApi } from '../api/index.js'
import { useAuth }       from '../context/AuthContext'
import { usePlayer }     from '../context/PlayerContext'

export default function PlaylistDetail() {
  const { id }    = useParams()
  const { user }  = useAuth()
  const navigate  = useNavigate()
  const { playTrack, currentTrack, isPlaying } = usePlayer()

  const [playlist, setPlaylist] = useState(null)
  const [editing,  setEditing]  = useState(false)
  const [newName,  setNewName]  = useState('')
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    playlistsApi.getById(id)
      .then(res => { setPlaylist(res.data); setNewName(res.data.name) })
      .catch(() => navigate('/playlists'))
      .finally(() => setLoading(false))
  }, [id])

  const handleUpdate = async (e) => {
    e.preventDefault()
    await playlistsApi.update(id, newName, playlist.description)
    setPlaylist(p => ({ ...p, name: newName }))
    setEditing(false)
  }

  const handleRemove = async (trackId) => {
    await playlistsApi.removeTrack(id, trackId)
    setPlaylist(p => ({ ...p, tracks: p.tracks.filter(t => t.id !== trackId), trackCount: p.trackCount - 1 }))
  }

  const handleDelete = async () => {
    if (!confirm('Xóa playlist này?')) return
    await playlistsApi.delete(id)
    navigate('/playlists')
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '80px' }}><i className="bi bi-arrow-repeat spin" style={{ fontSize: '2rem' }}></i></div>
  if (!playlist) return null

  return (
    <div style={{ maxWidth: '800px', margin: '32px auto', padding: '0 24px' }}>
      {/* Header */}
      <div style={{ background: 'var(--bg-surface)', padding: '28px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
          <div style={{ width: '120px', height: '120px', background: 'linear-gradient(135deg,#1a0800,#2d1000)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', flexShrink: 0 }}>🎵</div>
          <div style={{ flex: 1 }}>
            {editing ? (
              <form onSubmit={handleUpdate} style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <input className="form-control" value={newName} onChange={e => setNewName(e.target.value)} autoFocus style={{ flex: 1 }} />
                <button className="btn btn-primary" type="submit"><i className="bi bi-check-lg"></i></button>
                <button type="button" className="btn btn-ghost" onClick={() => setEditing(false)}><i className="bi bi-x-lg"></i></button>
              </form>
            ) : (
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', marginBottom: '8px' }}>{playlist.name}</h1>
            )}
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '16px' }}>
              {playlist.trackCount} bài hát
              {playlist.owner && <> · <span style={{ color: 'var(--accent)' }}>{playlist.owner.fullName}</span></>}
            </div>
            {playlist.isOwner && (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-outline" onClick={() => setEditing(true)}><i className="bi bi-pencil"></i> Đổi tên</button>
                <button className="btn btn-outline" style={{ color: '#ff4444' }} onClick={handleDelete}><i className="bi bi-trash"></i> Xóa playlist</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Track list */}
      {(!playlist.tracks || playlist.tracks.length === 0) ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎵</div>
          <p>Playlist chưa có bài hát.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {playlist.tracks.map((t, idx) => {
            const isActive = currentTrack?.id === t.id
            return (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`, transition: 'border-color .2s' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', width: '24px', textAlign: 'center', flexShrink: 0 }}>
                  {isActive && isPlaying ? <i className="bi bi-volume-up" style={{ color: 'var(--accent)' }}></i> : idx + 1}
                </div>
                <img src={t.thumbnailUrl || '/images/default-thumb.png'} onError={e => { e.target.src = '/images/default-thumb.png' }}
                  style={{ width: '44px', height: '44px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }} alt="" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>{t.artist}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <button className="btn btn-primary" style={{ padding: '6px 12px' }} onMouseDown={() => playTrack(t)}>
                    <i className={`bi ${isActive && isPlaying ? 'bi-pause-fill' : 'bi-play-fill'}`}></i>
                  </button>
                  {playlist.isOwner && (
                    <button className="btn btn-ghost" style={{ padding: '6px 10px', color: 'var(--text-muted)' }} onClick={() => handleRemove(t.id)}>
                      <i className="bi bi-x-lg"></i>
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}