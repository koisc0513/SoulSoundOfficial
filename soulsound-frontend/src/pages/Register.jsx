import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/index.js'

export default function Register() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const [form, setForm]     = useState({ fullName:'', email:'', password:'', confirmPassword:'', phoneNumber:'' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) { setError('Mật khẩu xác nhận không khớp.'); return }
    setLoading(true); setError('')
    try {
      const res = await api.post('/auth/register', form)
      login(res.data.token, res.data.user)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Đăng ký thất bại.')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: '24px 0' }}>
      <div style={{ width: '440px', padding: '40px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem' }}>Soul<span style={{ color: 'var(--accent)' }}>Sound</span></h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Tạo tài khoản mới</p>
        </div>

        {error && <div style={{ background: 'rgba(255,50,50,0.1)', color: '#ff4444', padding: '12px', borderRadius: '8px', marginBottom: '16px', borderLeft: '3px solid #ff4444', fontSize: '0.875rem' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          {[['fullName','Họ và tên','text'],['email','Email','email'],['phoneNumber','Số điện thoại (tuỳ chọn)','tel'],
            ['password','Mật khẩu','password'],['confirmPassword','Xác nhận mật khẩu','password']].map(([k,label,type]) => (
            <div className="form-group" key={k} style={{ marginBottom: '14px' }}>
              <label className="form-label">{label}</label>
              <input className="form-control" type={type} value={form[k]} onChange={e=>set(k,e.target.value)} required={k!=='phoneNumber'} />
            </div>
          ))}
          <button className="btn btn-primary" type="submit" disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}>
            {loading ? <><i className="bi bi-arrow-repeat spin"></i> Đang đăng ký...</> : 'Đăng ký'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Đã có tài khoản? <Link to="/login" style={{ color: 'var(--accent)' }}>Đăng nhập</Link>
        </div>
      </div>
    </div>
  )
}