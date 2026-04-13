import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { searchApi, usersApi } from '../api/index.js'
import { useAuth }   from '../context/AuthContext'
import TrackCard     from '../components/Track/TrackCard'

const GENRES = ['Pop','Rock','Hip-Hop','R&B','Electronic','Jazz','Classical','Indie','Lo-fi','Ballad','EDM','Metal','Acoustic','V-Pop','K-Pop','Khác']

export default function Search() {
  const [params, setParams]   = useSearchParams()
  const { user }              = useAuth()
  const q     = params.get('q')    || ''
  const genre = params.get('genre')|| ''
  const type  = params.get('type') || 'track'

  const [tracks,     setTracks]     = useState([])
  const [users,      setUsers]      = useState([])
  const [totalPages, setTotalPages] = useState(0)
  const [curPage,    setCurPage]    = useState(0)
  const [loading,    setLoading]    = useState(false)
  const [likedIds,   setLikedIds]   = useState(new Set())

  useEffect(() => {
    doSearch(0)
    if (user) usersApi.getLiked().then(r => setLikedIds(new Set(r.data.map(t=>t.id)))).catch(()=>{})
  }, [q, genre, type])

  const doSearch = async (page) => {
    setLoading(true)
    try {
      const res = await searchApi.search(q, genre, type, page)
      if (type === 'user') { setUsers(res.data.users); setTotalPages(res.data.totalPages) }
      else { setTracks(res.data.tracks); setTotalPages(res.data.totalPages) }
      setCurPage(page)
    } finally { setLoading(false) }
  }

  const nav = (newParams) => setParams({...Object.fromEntries(params), ...newParams})

  return (
    <div style={{ maxWidth: '900px', margin: '24px auto', padding: '0 24px' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button className={`btn${type==='track'?' btn-primary':' btn-outline'}`} onClick={() => nav({type:'track'})}>
          <i className="bi bi-music-note"></i> Bài hát
        </button>
        <button className={`btn${type==='user'?' btn-primary':' btn-outline'}`} onClick={() => nav({type:'user'})}>
          <i className="bi bi-people"></i> Người dùng
        </button>

        {type === 'track' && (
          <>
            <select className="form-control" style={{ height: '38px', width: 'auto', marginLeft: 'auto' }}
              value={genre} onChange={e => nav({genre: e.target.value})}>
              <option value="">Tất cả thể loại</option>
              {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </>
        )}
      </div>

      {q && <h2 style={{ marginBottom: '16px', fontSize: '1rem', color: 'var(--text-muted)' }}>Kết quả cho: "<span style={{ color: 'var(--text-primary)' }}>{q}</span>"</h2>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}><i className="bi bi-arrow-repeat spin" style={{ fontSize: '2rem' }}></i></div>
      ) : type === 'track' ? (
        <>
          {tracks.length === 0
            ? <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Không tìm thấy bài hát nào.</div>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {tracks.map(t => <TrackCard key={t.id} track={t} likedIds={likedIds} />)}
              </div>
          }
        </>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
          {users.length === 0
            ? <div style={{ color: 'var(--text-muted)', gridColumn: '1/-1', textAlign: 'center', padding: '40px' }}>Không tìm thấy người dùng nào.</div>
            : users.map(u => (
              <Link key={u.id} to={`/profile/${u.email}`}
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                         padding: '20px', textAlign: 'center', textDecoration: 'none', transition: 'border-color .2s' }}
                onMouseOver={e=>e.currentTarget.style.borderColor='var(--accent)'}
                onMouseOut={e=>e.currentTarget.style.borderColor='var(--border)'}>
                <img src={u.avatarUrl||'/images/default-avatar.png'} onError={e=>{e.target.src='/images/default-avatar.png'}}
                  style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', marginBottom: '12px' }} alt={u.fullName} />
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>{u.fullName}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.followerCount} followers</div>
              </Link>
            ))
          }
        </div>
      )}
    </div>
  )
}