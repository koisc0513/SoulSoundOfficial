import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { playlistsApi } from '../api/index.js'

export default function Playlists() {
  const [playlists, setPlaylists] = useState([])
  const [name, setName]           = useState('')
  const [loading, setLoading]     = useState(true)
  const [msg, setMsg]             = useState('')

  useEffect(() => {
    playlistsApi.getAll().then(r => setPlaylists(r.data)).finally(() => setLoading(false))
  }, [])

  const create = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    try {
      const res = await playlistsApi.create(name.trim())
      setPlaylists(p => [...p, res.data])
      setName('')
      setMsg('Tạo playlist thành công!')
      setTimeout(() => setMsg(''), 2000)
    } catch (err) {
      setMsg(err.response?.data?.error || 'Lỗi.')
    }
  }

  const del = async (id, e) => {
    e.preventDefault()
    if (!confirm('Xóa playlist này?')) return
    await playlistsApi.delete(id)
    setPlaylists(p => p.filter(x => x.id !== id))
  }

  return (
    <div style={{ maxWidth: '900px', margin: '32px auto', padding: '0 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <i className="bi bi-collection-play-fill" style={{ color: 'var(--accent)' }}></i> Playlist của tôi
        </h1>
        <form onSubmit={create} style={{ display: 'flex', gap: '8px' }}>
          <input className="form-control" value={name} onChange={e=>setName(e.target.value)} placeholder="Tên playlist mới..." style={{ width: '220px', height: '38px', padding: '6px 14px' }} />
          <button className="btn btn-primary" type="submit" style={{ height: '38px' }}><i className="bi bi-plus-lg"></i> Tạo</button>
        </form>
      </div>

      {msg && <div style={{ background: 'rgba(0,200,100,0.1)', color: '#00c864', padding: '12px', borderRadius: '8px', marginBottom: '16px', borderLeft: '3px solid #00c864' }}>{msg}</div>}

      {loading ? <div style={{ textAlign: 'center', padding: '60px' }}><i className="bi bi-arrow-repeat spin" style={{ fontSize: '2rem' }}></i></div>
        : playlists.length === 0
          ? <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎵</div>
              <p>Chưa có playlist. Tạo playlist đầu tiên!</p>
            </div>
          : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '16px' }}>
              {playlists.map(pl => (
                <div key={pl.id} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', transition: 'border-color .2s, transform .2s' }}
                  onMouseOver={e=>{e.currentTarget.style.borderColor='var(--accent)';e.currentTarget.style.transform='translateY(-2px)'}}
                  onMouseOut={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.transform=''}}>
                  <Link to={`/playlists/${pl.id}`} style={{ display: 'block', padding: '20px', textDecoration: 'none' }}>
                    <div style={{ width: '100%', height: '100px', background: 'linear-gradient(135deg,#1a0800,#2d1000)', borderRadius: 'var(--radius-sm)', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>🎵</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pl.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>{pl.trackCount} bài hát</div>
                  </Link>
                  <div style={{ padding: '0 16px 12px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn btn-ghost" style={{ fontSize: '0.75rem', padding: '4px 8px', color: 'var(--text-muted)' }}
                      onClick={e => del(pl.id, e)}>
                      <i className="bi bi-trash"></i> Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>
      }
    </div>
  )
}