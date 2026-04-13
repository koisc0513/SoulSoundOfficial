import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { usersApi } from '../api/index.js'
import TrackCard    from '../components/Track/TrackCard'


export default function Liked() {
  const [tracks, setTracks]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    usersApi.getLiked()
      .then(res => setTracks(res.data))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ maxWidth: '900px', margin: '32px auto', padding: '0 24px' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
        <i className="bi bi-heart-fill" style={{ color: 'var(--accent)' }}></i>
        Đã thích <span style={{ fontWeight: 400, fontSize: '1rem', color: 'var(--text-muted)' }}>({tracks.length} bài)</span>
      </h1>

      {loading ? <div style={{ textAlign: 'center', padding: '60px' }}><i className="bi bi-arrow-repeat spin" style={{ fontSize: '2rem' }}></i></div>
        : tracks.length === 0
          ? <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>❤️</div>
              <p>Chưa có bài hát nào được thích.</p>
              <Link className="btn btn-primary" to="/" style={{ display: 'inline-flex', marginTop: '20px' }}>Khám phá nhạc</Link>
            </div>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {tracks.map(t => <TrackCard key={t.id} track={t} likedIds={new Set(tracks.map(x=>x.id))} />)}
            </div>
      }
    </div>
  )
}