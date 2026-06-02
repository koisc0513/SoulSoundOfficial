// src/components/Layout/NotificationBell.jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { notificationsApi } from '../../api/index.js'

// ── Helpers ───────────────────────────────────────────────────────

function formatDate(isoStr) {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  const now = new Date()
  const diffMs = now - d
  const diffMin = Math.floor(diffMs / 60000)
  const diffH   = Math.floor(diffMs / 3600000)
  const diffD   = Math.floor(diffMs / 86400000)

  if (diffMin < 1)  return 'Vừa xong'
  if (diffMin < 60) return `${diffMin} phút trước`
  if (diffH   < 24) return `${diffH} giờ trước`
  if (diffD   < 7)  return `${diffD} ngày trước`

  return d.toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  })
}

function getIcon(type) {
  switch (type) {
    case 'NEW_FOLLOWER':   return 'bi-person-plus-fill'
    case 'TRACK_UPLOAD':   return 'bi-cloud-check-fill'
    case 'TRACK_LIKED':    return 'bi-heart-fill'
    case 'NEW_COMMENT':    return 'bi-chat-fill'
    case 'COMMENT_LIKED':  return 'bi-heart-fill'
    case 'ACCOUNT_BANNED': return 'bi-slash-circle-fill'
    case 'TRACK_HIDDEN':   return 'bi-eye-slash-fill'
    default:               return 'bi-bell-fill'
  }
}

function getIconColor(type) {
  switch (type) {
    case 'NEW_FOLLOWER':   return '#4CAF50'
    case 'TRACK_UPLOAD':   return '#ff5500'
    case 'TRACK_LIKED':    return '#e91e63'
    case 'NEW_COMMENT':    return '#2196F3'
    case 'COMMENT_LIKED':  return '#e91e63'
    case 'ACCOUNT_BANNED': return '#f44336'
    case 'TRACK_HIDDEN':   return '#FF9800'
    default:               return '#a0a0a0'
  }
}

// ── NotificationItem ──────────────────────────────────────────────

function NotificationItem({ notif, onRead }) {
  const navigate = useNavigate()

  const handleClick = async () => {
    if (!notif.read) onRead(notif.id)

    // Điều hướng tuỳ loại thông báo
    if (notif.type === 'NEW_FOLLOWER' && notif.actorEmail) {
      navigate(`/profile/${notif.actorEmail}`)
    } else if (notif.type === 'TRACK_LIKED' && notif.actorEmail) {
      navigate(`/profile/${notif.actorEmail}`)
    } else if (notif.type === 'NEW_COMMENT' && notif.actorEmail) {
      navigate(`/profile/${notif.actorEmail}`)
    } else if (notif.type === 'COMMENT_LIKED' && notif.trackId) {
      // Điều hướng đến track, thêm #comment-{id} để highlight
      const hash = notif.commentId ? `#comment-${notif.commentId}` : ''
      navigate(`/tracks/${notif.trackId}${hash}`)
    } else if (notif.trackId) {
      navigate(`/tracks/${notif.trackId}`)
    }
  }

  const hasAvatar = notif.actorAvatarUrl || notif.trackThumbnailUrl

  return (
    <div
      className={`notif-item${notif.read ? '' : ' notif-item--unread'}`}
      onClick={handleClick}
      title={notif.message}
    >
      {/* Avatar / thumbnail bên trái */}
      <div className="notif-item__avatar-wrap">
        {notif.actorAvatarUrl ? (
          <img
            className="notif-item__avatar"
            src={notif.actorAvatarUrl}
            alt={notif.actorName}
            onError={e => { e.target.src = '/images/default-avatar.png' }}
          />
        ) : notif.trackThumbnailUrl ? (
          <img
            className="notif-item__avatar notif-item__avatar--thumb"
            src={notif.trackThumbnailUrl}
            alt={notif.trackTitle}
            onError={e => { e.target.src = '/images/default-thumb.png' }}
          />
        ) : (
          <div className="notif-item__avatar notif-item__avatar--placeholder">
            <i className={`bi ${getIcon(notif.type)}`} style={{ color: getIconColor(notif.type) }} />
          </div>
        )}

        {/* Badge icon nhỏ góc phải avatar */}
        {hasAvatar && (
          <span
            className="notif-item__type-badge"
            style={{ background: getIconColor(notif.type) }}
          >
            <i className={`bi ${getIcon(notif.type)}`} />
          </span>
        )}
      </div>

      {/* Nội dung */}
      <div className="notif-item__body">
        <p className="notif-item__msg">{notif.message}</p>
        <span className="notif-item__time">{formatDate(notif.createdAt)}</span>
      </div>

      {/* Chấm xanh chưa đọc */}
      {!notif.read && <span className="notif-item__dot" />}
    </div>
  )
}

// ── NotificationBell (main) ───────────────────────────────────────

export default function NotificationBell() {
  const [open,         setOpen]         = useState(false)
  const [notifications,setNotifications]= useState([])
  const [unread,       setUnread]       = useState(0)
  const [loading,      setLoading]      = useState(false)
  const [page,         setPage]         = useState(0)
  const [totalPages,   setTotalPages]   = useState(1)

  const panelRef = useRef(null)
  const pollRef  = useRef(null)

  // ── Fetch ───────────────────────────────────────────────────────

  const fetchUnread = useCallback(async () => {
    try {
      const res = await notificationsApi.getUnreadCount()
      setUnread(res.data.count ?? 0)
    } catch {}
  }, [])

  const fetchPage = useCallback(async (p = 0) => {
    setLoading(true)
    try {
      const res = await notificationsApi.getAll(p)
      const data = res.data
      if (p === 0) {
        setNotifications(data.notifications ?? [])
      } else {
        setNotifications(prev => [...prev, ...(data.notifications ?? [])])
      }
      setUnread(data.unreadCount ?? 0)
      setTotalPages(data.totalPages ?? 1)
      setPage(p)
    } catch {}
    finally { setLoading(false) }
  }, [])

  // ── SSE: nhận thông báo realtime từ server ────────────────────
  useEffect(() => {
    const token = localStorage.getItem('ss_token')
    if (!token) return

    let es
    let fallbackTimer

    const connect = () => {
      // Truyền JWT qua query param vì EventSource không hỗ trợ custom header
      es = new EventSource(`/api/notifications/stream?token=${token}`)

      es.addEventListener('connected', () => {
        // Kết nối thành công — fetch lại badge count
        fetchUnread()
        // Xóa fallback polling nếu đang chạy
        clearInterval(fallbackTimer)
        // Fallback polling 60s (dự phòng khi SSE mất kết nối)
        fallbackTimer = setInterval(fetchUnread, 60000)
      })

      es.addEventListener('notification', (e) => {
        try {
          const notif = JSON.parse(e.data)
          // Tăng badge ngay lập tức
          setUnread(u => u + 1)
          // Nếu panel đang mở → prepend thông báo mới lên đầu
          setNotifications(prev => [notif, ...prev])
        } catch {}
      })

      es.addEventListener('ping', () => {
        // Keep-alive ping từ server — không làm gì
      })

      es.onerror = () => {
        es.close()
        // Reconnect sau 5 giây
        setTimeout(connect, 5000)
      }
    }

    connect()
    fetchUnread() // fetch ngay lần đầu

    return () => {
      if (es) es.close()
      clearInterval(fallbackTimer)
    }
  }, [fetchUnread])

  // Close khi click outside
  useEffect(() => {
    const handler = e => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Mở panel → fetch trang đầu
  const handleToggle = () => {
    if (!open) fetchPage(0)
    setOpen(o => !o)
  }

  // Đánh dấu 1 thông báo đã đọc
  const handleReadOne = async (id) => {
    try {
      await notificationsApi.readOne(id)
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      )
      setUnread(u => Math.max(0, u - 1))
    } catch {}
  }

  // Đánh dấu tất cả đã đọc
  const handleReadAll = async () => {
    try {
      await notificationsApi.readAll()
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnread(0)
    } catch {}
  }

  const hasMore = page < totalPages - 1

  return (
    <div className="notif-bell" ref={panelRef}>

      {/* ── Nút chuông ── */}
      <button
        className={`notif-bell__btn${open ? ' active' : ''}`}
        onClick={handleToggle}
        title="Thông báo"
      >
        <i className="bi bi-bell-fill" />
        {unread > 0 && (
          <span className="notif-bell__badge">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* ── Dropdown panel ── */}
      {open && (
        <div className="notif-panel">

          <div className="notif-panel__header">
            <span className="notif-panel__title">
              <i className="bi bi-bell-fill" /> Thông báo
            </span>
            {unread > 0 && (
              <button className="notif-panel__read-all" onClick={handleReadAll}>
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          <div className="notif-panel__body">
            {loading && notifications.length === 0 ? (
              <div className="notif-panel__empty">
                <i className="bi bi-arrow-repeat spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="notif-panel__empty">
                <i className="bi bi-bell-slash" />
                <p>Chưa có thông báo nào</p>
              </div>
            ) : (
              <>
                {notifications.map(n => (
                  <NotificationItem
                    key={n.id}
                    notif={n}
                    onRead={handleReadOne}
                  />
                ))}

                {hasMore && (
                  <button
                    className="notif-panel__load-more"
                    onClick={() => fetchPage(page + 1)}
                    disabled={loading}
                  >
                    {loading ? 'Đang tải...' : 'Xem thêm'}
                  </button>
                )}
              </>
            )}
          </div>

        </div>
      )}
    </div>
  )
}