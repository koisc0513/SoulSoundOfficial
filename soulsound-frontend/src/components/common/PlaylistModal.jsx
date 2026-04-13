import { useState, useEffect } from 'react'
import { playlistsApi } from '../../api/index.js'

export default function PlaylistModal({ trackId, onClose }) {
  const [playlists, setPlaylists] = useState([])
  const [newName,   setNewName]   = useState('')
  const [loading,   setLoading]   = useState(false)
  const [msg,       setMsg]       = useState('')

  useEffect(() => {
    playlistsApi.getAll()
      .then(res => setPlaylists(res.data))
      .catch(() => {})
  }, [])

  const addTo = async (playlistId) => {
    try {
      await playlistsApi.addTrack(playlistId, trackId)
      setMsg('Đã thêm vào playlist!')
      setTimeout(onClose, 1000)
    } catch (e) {
      setMsg(e.response?.data?.error || 'Lỗi.')
    }
  }

  const createAndAdd = async () => {
    if (!newName.trim()) return
    setLoading(true)
    try {
      const res  = await playlistsApi.create(newName.trim())
      await playlistsApi.addTrack(res.data.id, trackId)
      setMsg(`Đã tạo "${newName}" và thêm bài hát!`)
      setTimeout(onClose, 1000)
    } catch (e) {
      setMsg(e.response?.data?.error || 'Lỗi.')
    } finally { setLoading(false) }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,0.75)',
               display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)', padding: '28px', width: '380px',
                    maxHeight: '80vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ fontFamily: 'var(--font-display)' }}>🎵 Thêm vào Playlist</h3>
          <button className="player-btn" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {msg && <div style={{ padding: '8px', background: 'rgba(255,165,0,0.1)', borderRadius: '6px', marginBottom: '12px', fontSize: '0.875rem' }}>{msg}</div>}

        {/* Tạo mới */}
        <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Tạo playlist mới</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input className="form-control" value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Tên playlist..." style={{ flex: 1, height: '36px' }} />
            <button className="btn btn-primary" style={{ height: '36px', padding: '0 14px' }}
              onClick={createAndAdd} disabled={loading}>
              <i className="bi bi-plus-lg"></i> Tạo & Thêm
            </button>
          </div>
        </div>

        {/* Danh sách */}
        <div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Playlist của tôi</div>
          {playlists.length === 0
            ? <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '12px' }}>Chưa có playlist.</p>
            : playlists.map(pl => (
              <div key={pl.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '10px 14px', background: 'var(--bg-surface)',
                                        borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', marginBottom: '6px' }}>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{pl.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{pl.trackCount} bài</div>
                </div>
                <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '0.8rem', height: '30px' }}
                  onClick={() => addTo(pl.id)}>
                  <i className="bi bi-plus-lg"></i> Thêm
                </button>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}