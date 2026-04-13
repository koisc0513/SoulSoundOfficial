import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/index.js'

export default function Login() {
  const { login }    = useAuth()
  const navigate     = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

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

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
      <div style={{ width: '400px', padding: '40px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem' }}>Soul<span style={{ color: 'var(--accent)' }}>Sound</span></h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Đăng nhập để tiếp tục</p>
        </div>

        {error && <div style={{ background: 'rgba(255,50,50,0.1)', color: '#ff4444', padding: '12px', borderRadius: '8px', marginBottom: '16px', borderLeft: '3px solid #ff4444', fontSize: '0.875rem' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-control" type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoFocus />
          </div>
          <div className="form-group" style={{ marginTop: '16px' }}>
            <label className="form-label">Mật khẩu</label>
            <input className="form-control" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: '24px' }}>
            {loading ? <><i className="bi bi-arrow-repeat spin"></i> Đang đăng nhập...</> : 'Đăng nhập'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Chưa có tài khoản? <Link to="/register" style={{ color: 'var(--accent)' }}>Đăng ký ngay</Link>
        </div>
      </div>
    </div>
  )
}