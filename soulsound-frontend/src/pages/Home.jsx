import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { tracksApi, usersApi, searchApi } from '../api/index.js'
import { useAuth } from "../context/AuthContext"
import { usePlayer } from "../context/PlayerContext"
import TrackCard     from '../components/Track/TrackCard'
import PlaylistModal from '../components/common/PlaylistModal'

const GENRES = ['Pop','Rock','Lo-fi','V-Pop','EDM','R&B','K-Pop','Indie','Jazz','Ballad','Hip-Hop','Classical','Acoustic','Electronic','Metal','Khác']

export default function Home() {
  const { user } = useAuth()
  const { playTrack, setQueue } = usePlayer()

  const [tracks,        setTracks]        = useState([])
  const [totalPages,    setTotalPages]    = useState(0)
  const [currentPage,   setCurrentPage]   = useState(0)
  const [recentPlayed,  setRecentPlayed]  = useState([])
  const [suggested,     setSuggested]     = useState([])
  const [likedIds,      setLikedIds]      = useState(new Set())
  const [loading,       setLoading]       = useState(true)
  const [modalTrackId,  setModalTrackId]  = useState(null)
  const [selectedGenre, setSelectedGenre] = useState('')

  // Expose openPlaylistModal để TrackCard gọi
  window._openPlaylistModal = setModalTrackId

  useEffect(() => {
    loadFeed(0)
    if (user) {
      usersApi.getSuggested().then(r => setSuggested(r.data)).catch(()=>{})
      usersApi.getHistory(0).then(r => {
        setRecentPlayed(r.data.histories?.slice(0,6).map(h=>h.track) ?? [])
      }).catch(()=>{})
      usersApi.getLiked().then(r => {
        setLikedIds(new Set(r.data.map(t=>t.id)))
      }).catch(()=>{})
    } else {
      usersApi.getSuggested().then(r => setSuggested(r.data)).catch(()=>{})
    }
  }, [user])

  const loadFeed = async (page) => {
    setSelectedGenre('')
    setLoading(true)
    try {
      const res = await tracksApi.getFeed(page)
      setTracks(res.data.tracks)
      setQueue(res.data.tracks)
      setTotalPages(res.data.totalPages)
      setCurrentPage(page)
    } finally {
      setLoading(false)
    }
  }

  const loadByGenre = async (genre, page = 0) => {
    setLoading(true)
    try {
      const res = await searchApi.search('', genre, 'track', page)
      const t   = res.data.tracks || []
      setTracks(t)
      setQueue(t)
      setTotalPages(res.data.totalPages || 1)
      setCurrentPage(page)
    } finally {
      setLoading(false)
    }
  }

  const handleGenreClick = (genre) => {
    if (selectedGenre === genre) {
      // Toggle off → về feed gốc
      setSelectedGenre('')
      loadFeed(0)
    } else {
      setSelectedGenre(genre)
      loadByGenre(genre, 0)
    }
  }

  return (
    <div className="layout">
      {/* Main */}
      <section className="layout__main">
        {/* Recently Played */}
        {recentPlayed.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="bi bi-clock-history" style={{ color: 'var(--accent)' }}></i> Recently Played
              </h2>
              <Link to="/history" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Xem tất cả →</Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px' }}>
              {recentPlayed.map(t => t && (
                <div key={t.id}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px',
                           background: 'var(--bg-surface)', borderRadius: '10px', border: '1px solid var(--border)',
                           cursor: 'pointer' }}
                  onMouseOver={e => e.currentTarget.style.borderColor='var(--accent)'}
                  onMouseOut={e  => e.currentTarget.style.borderColor='var(--border)'}
                >
                  <img src={t.thumbnailUrl||'/images/default-thumb.png'} onError={e=>{e.target.src='/images/default-thumb.png'}}
                    style={{ width:'44px',height:'44px',borderRadius:'6px',objectFit:'cover',flexShrink:0 }} alt={t.title} />
                  <div style={{ minWidth:0, flex:1 }}>
                    <div style={{ fontSize:'0.82rem',fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}
                      onClick={() => playTrack(t)}>{t.title}</div>
                    <div style={{ fontSize:'0.74rem',color:'var(--accent)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>{t.artist}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tracks */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="bi bi-music-note-list" style={{ color: 'var(--accent)' }}></i>
              {selectedGenre
                ? <><span>Thể loại</span><span style={{ color: 'var(--accent)' }}>· {selectedGenre}</span></>
                : 'Tracks'}
            </h2>
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <button
                className={`track-card__genre${!selectedGenre ? ' genre--active' : ''}`}
                onClick={() => { setSelectedGenre(''); loadFeed(0) }}
                style={{ fontSize: '0.72rem' }}
              >Tất cả</button>
              {['Pop','Lo-fi','V-Pop','EDM','R&B'].map(g => (
                <button key={g}
                  className={`track-card__genre${selectedGenre === g ? ' genre--active' : ''}`}
                  onClick={() => handleGenreClick(g)}
                  style={{ fontSize: '0.72rem' }}
                >{g}</button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
              <i className="bi bi-arrow-repeat spin"></i>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {tracks.map(t => <TrackCard key={t.id} track={t} likedIds={likedIds} trackList={tracks} />)}
            </div>
          )}

          {!loading && tracks.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎵</div>
              <p>Chưa có bài hát nào.</p>
              {user && <Link className="btn btn-primary" to="/tracks/upload" style={{ display: 'inline-flex', marginTop: '16px' }}>Upload ngay</Link>}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination" style={{ marginTop: '24px' }}>
              {currentPage > 0 && (
                <button className="page-btn"
                  onClick={() => selectedGenre ? loadByGenre(selectedGenre, currentPage-1) : loadFeed(currentPage-1)}>‹</button>
              )}
              {[...Array(totalPages)].map((_,i) => (
                <button key={i} className={`page-btn${i===currentPage?' active':''}`}
                  onClick={() => selectedGenre ? loadByGenre(selectedGenre, i) : loadFeed(i)}>{i+1}</button>
              ))}
              {currentPage < totalPages-1 && (
                <button className="page-btn"
                  onClick={() => selectedGenre ? loadByGenre(selectedGenre, currentPage+1) : loadFeed(currentPage+1)}>›</button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Sidebar */}
      <aside className="layout__sidebar">
        {/* Suggested */}
        <div className="widget">
          <div className="widget__title"><i className="bi bi-people"></i> Gợi ý theo dõi</div>
          {suggested.length > 0 ? suggested.map(u => (
            <SuggestedUser key={u.id} user={u} currentUser={user} />
          )) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', textAlign: 'center', padding: '8px 0' }}>Chưa có gợi ý.</div>
          )}
        </div>

        {user ? (
          <div className="widget">
            <div className="widget__title">⬆️ Chia sẻ nhạc</div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.5 }}>Upload bài hát và chia sẻ với cộng đồng.</p>
            <Link className="btn btn-primary" to="/tracks/upload" style={{ width: '100%', justifyContent: 'center' }}>
              <i className="bi bi-cloud-upload"></i> Upload bài hát
            </Link>
          </div>
        ) : (
          <div className="widget">
            <div className="widget__title">🎤 Tham gia ngay</div>
            <Link className="btn btn-primary" to="/register" style={{ width: '100%', justifyContent: 'center', marginBottom: '8px' }}>Tạo tài khoản</Link>
            <Link className="btn btn-outline" to="/login" style={{ width: '100%', justifyContent: 'center' }}>Đăng nhập</Link>
          </div>
        )}

        <div className="widget">
          <div className="widget__title">🎸 Thể loại</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {GENRES.map(g => (
              <Link
                key={g}
                to={`/search?type=track&genre=${encodeURIComponent(g)}`}
                className="track-card__genre"
              >
                {g}
              </Link>
            ))}
          </div>
        </div>
      </aside>

      {/* Playlist modal */}
      {modalTrackId && <PlaylistModal trackId={modalTrackId} onClose={() => setModalTrackId(null)} />}
    </div>
  )
}

function SuggestedUser({ user: u, currentUser }) {
  const [following,    setFollowing]    = useState(u.following ?? false)
  const [followerCount, setFollowerCount] = useState(u.followerCount ?? 0)
  const [loading,      setLoading]      = useState(false)

  const toggle = async () => {
    if (!currentUser || loading) return

    // Optimistic update
    const wasFollowing   = following
    const prevCount      = followerCount
    setFollowing(!wasFollowing)
    setFollowerCount(c => wasFollowing ? c - 1 : c + 1)
    setLoading(true)

    try {
      const res = await usersApi.follow(u.id)
      // Sync với giá trị thực từ server
      setFollowing(res.data.following)
      setFollowerCount(res.data.followerCount)
    } catch {
      // Rollback nếu lỗi
      setFollowing(wasFollowing)
      setFollowerCount(prevCount)
    } finally {
      setLoading(false)
    }
  }

  let btnLabel
  if (loading)       btnLabel = '...'
  else if (following) btnLabel = 'Following'
  else               btnLabel = 'Follow'

  return (
    <div className="user-row">
      <Link to={`/profile/${u.email}`}>
        <img className="user-row__avatar" src={u.avatarUrl||'/images/default-avatar.png'}
          onError={e=>{e.target.src='/images/default-avatar.png'}} alt={u.fullName} />
      </Link>
      <div style={{ flex: 1, minWidth: 0 }}>
        <Link to={`/profile/${u.email}`} className="user-row__name"
          style={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {u.fullName}
        </Link>
        <div className="user-row__sub">{followerCount.toLocaleString()} followers</div>
      </div>
      {currentUser && (
        <button
          className={`user-row__follow${following ? ' following' : ''}${loading ? ' loading' : ''}`}
          onClick={toggle}
          disabled={loading}
          data-unfollow-label="Unfollow"
        >
          {btnLabel}
        </button>
      )}
    </div>
  )
}