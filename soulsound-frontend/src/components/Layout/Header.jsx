import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Header() {
  const { user, logout } = useAuth()
  const navigate         = useNavigate()
  const [q, setQ]        = useState('')
  const [open, setOpen]  = useState(false)
  const dropRef          = useRef(null)

  // Click outside → đóng dropdown
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    navigate(`/search?q=${encodeURIComponent(q)}`)
  }

  return (
    <header className="header">
      <Link className="header__logo" to="/">Soul<span>Sound</span></Link>

      <form className="header__search" onSubmit={handleSearch}>
        <i className="bi bi-search header__search-icon"></i>
        <input
          type="text"
          placeholder="Tìm bài hát, nghệ sĩ..."
          value={q}
          onChange={e => setQ(e.target.value)}
          autoComplete="off"
        />
      </form>

      <nav className="header__actions">
        <Link className="btn btn-ghost" to="/">
          <i className="bi bi-house-fill"></i>
        </Link>

        {user ? (
          <div className="dropdown" ref={dropRef}>
            <button className="user-menu-btn" onClick={() => setOpen(!open)}>
              <img
                src={user.avatarUrl || '/images/default-avatar.png'}
                onError={e => { e.target.src = '/images/default-avatar.png' }}
                alt="Avatar"
              />
              <span>{user.fullName}</span>
              <i className="bi bi-chevron-down" style={{ fontSize: '0.7rem' }}></i>
            </button>

            <div className={`dropdown__menu${open ? ' open' : ''}`}>
              <Link className="dropdown__item" to={`/profile/${user.email}`} onClick={() => setOpen(false)}>
                <i className="bi bi-person-circle"></i> Hồ sơ của tôi
              </Link>
              <Link className="dropdown__item" to="/liked" onClick={() => setOpen(false)}>
                <i className="bi bi-heart"></i> Đã thích
              </Link>
              <Link className="dropdown__item" to="/playlists" onClick={() => setOpen(false)}>
                <i className="bi bi-collection-play"></i> Playlist
              </Link>
              <Link className="dropdown__item" to="/history" onClick={() => setOpen(false)}>
                <i className="bi bi-clock-history"></i> Lịch sử nghe
              </Link>
              <hr className="dropdown__divider" />
              {user.role === 'ADMIN' && (
                <>
                  <Link className="dropdown__item" to="/admin/dashboard" onClick={() => setOpen(false)}>
                    <i className="bi bi-shield-lock"></i> Admin Panel
                  </Link>
                  <hr className="dropdown__divider" />
                </>
              )}
              <Link className="dropdown__item" to="/profile/edit" onClick={() => setOpen(false)}>
                <i className="bi bi-gear"></i> Cài đặt
              </Link>
              <button
                className="dropdown__item"
                style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: '#ff4444' }}
                onClick={() => { logout(); navigate('/login') }}
              >
                <i className="bi bi-box-arrow-right"></i> Đăng xuất
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link className="btn btn-ghost"   to="/login">Đăng nhập</Link>
            <Link className="btn btn-primary" to="/register">Đăng ký</Link>
          </div>
        )}
      </nav>
    </header>
  )
}