import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/index.js'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID'
const FACEBOOK_APP_ID  = import.meta.env.VITE_FACEBOOK_APP_ID  || 'YOUR_FACEBOOK_APP_ID'

export default function Login() {
  const { login } = useAuth()
  const navigate  = useNavigate()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const googleBtnRef = useRef(null)

  // ── Load Google SDK ──────────────────────────────────────────────────────
  useEffect(() => {
    const scriptId = 'google-gsi-script'
    if (document.getElementById(scriptId)) {
      initGoogle()
      return
    }
    const s   = document.createElement('script')
    s.id      = scriptId
    s.src     = 'https://accounts.google.com/gsi/client'
    s.async   = true
    s.defer   = true
    s.onload  = initGoogle
    document.body.appendChild(s)
  }, [])

  // ── Load Facebook SDK ────────────────────────────────────────────────────
  useEffect(() => {
    const scriptId = 'facebook-sdk-script'
    if (document.getElementById(scriptId)) return
    window.fbAsyncInit = () => {
      window.FB.init({ appId: FACEBOOK_APP_ID, cookie: true, xfbml: true, version: 'v19.0' })
    }
    const s  = document.createElement('script')
    s.id     = scriptId
    s.src    = 'https://connect.facebook.net/vi_VN/sdk.js'
    s.async  = true
    s.defer  = true
    document.body.appendChild(s)
  }, [])

  // ── Khởi tạo & render nút Google ────────────────────────────────────────
  function initGoogle() {
    if (!window.google || !googleBtnRef.current) return
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback:  handleGoogleCallback,
    })
    window.google.accounts.id.renderButton(googleBtnRef.current, {
      theme:          'filled_black',
      size:           'large',
      width:          '320',
      text:           'signin_with',
      shape:          'rectangular',
      logo_alignment: 'left',
    })
  }

  // ── Google callback ──────────────────────────────────────────────────────
  async function handleGoogleCallback({ credential }) {
    setLoading(true); setError('')
    try {
      const res = await api.post('/auth/google', { idToken: credential })
      login(res.data.token, res.data.user)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Đăng nhập Google thất bại.')
    } finally { setLoading(false) }
  }

  // ── Facebook login ───────────────────────────────────────────────────────
  function handleFacebookLogin() {
    if (!window.FB) { setError('Facebook SDK chưa tải xong, thử lại sau.'); return }
    setLoading(true); setError('')
    window.FB.login(response => {
      if (response.status === 'connected') {
        api.post('/auth/facebook', { accessToken: response.authResponse.accessToken })
          .then(res => { login(res.data.token, res.data.user); navigate('/') })
          .catch(err => setError(err.response?.data?.error || 'Đăng nhập Facebook thất bại.'))
          .finally(() => setLoading(false))
      } else {
        setError('Bạn đã huỷ đăng nhập Facebook.')
        setLoading(false)
      }
    }, { scope: 'email,public_profile' })
  }

  // ── Form login ───────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await api.post('/auth/login', { email, password })
      login(res.data.token, res.data.user)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Đăng nhập thất bại.')
    } finally { setLoading(false) }
  }

  // ── Styles ───────────────────────────────────────────────────────────────
  const socialBtn = (disabled) => ({
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '11px 16px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    background: 'var(--bg-elevated)',
    color: 'var(--text-primary)',
    fontSize: '0.9rem',
    fontWeight: 500,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'border-color var(--transition), background var(--transition)',
    fontFamily: 'var(--font-body)',
  })

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
      <div style={{ width: '400px', padding: '40px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem' }}>
            Soul<span style={{ color: 'var(--accent)' }}>Sound</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Đăng nhập để tiếp tục</p>
        </div>

        {error && (
          <div style={{ background: 'rgba(255,50,50,0.1)', color: '#ff5555', padding: '12px', borderRadius: 'var(--radius-sm)', marginBottom: '16px', borderLeft: '3px solid #ff5555', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        {/* ── Nút Google – SDK tự render vào ref ────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
          <div ref={googleBtnRef} />
        </div>

        <div style={{ height: '10px' }} />

        {/* ── Nút Facebook ──────────────────────────────────────────────── */}
        <button
          style={socialBtn(loading)}
          onClick={handleFacebookLogin}
          disabled={loading}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-accent)'; e.currentTarget.style.background = 'var(--bg-elevated)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)';        e.currentTarget.style.background = 'var(--bg-elevated)' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
            <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
          </svg>
          Đăng nhập với Facebook
        </button>

        {/* ── Divider ───────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          <span style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          <span>hoặc đăng nhập bằng email</span>
          <span style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        </div>

        {/* ── Form email / password ─────────────────────────────────────── */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-control" type="email" value={email}
              onChange={e => setEmail(e.target.value)} required autoFocus />
          </div>
          <div className="form-group" style={{ marginTop: '16px' }}>
            <label className="form-label">Mật khẩu</label>
            <input className="form-control" type="password" value={password}
              onChange={e => setPassword(e.target.value)} required />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: '24px' }}>
            {loading
              ? <><i className="bi bi-arrow-repeat spin" /> Đang đăng nhập...</>
              : 'Đăng nhập'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Chưa có tài khoản?{' '}
          <Link to="/register" style={{ color: 'var(--accent)' }}>Đăng ký ngay</Link>
        </div>
      </div>
    </div>
  )
}