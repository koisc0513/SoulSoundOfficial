import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { usersApi } from '../api/index.js'

export default function ProfileEdit() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    fullName: '', birthYear: '', address: '',
    phoneNumber: '', bio: '',
    currentPassword: '', newPassword: '', confirmPassword: ''
  })
  const [avatarFile, setAvatarFile] = useState(null)
  const [preview,    setPreview]    = useState('')
  const [loading,    setLoading]    = useState(false)
  const [msg,        setMsg]        = useState({ type: '', text: '' })

  useEffect(() => {
    if (user) {
      setForm(f => ({
        ...f,
        fullName:    user.fullName    || '',
        birthYear:   user.birthYear   || '',
        address:     user.address     || '',
        phoneNumber: user.phoneNumber || '',
        bio:         user.bio         || '',
      }))
      setPreview(user.avatarUrl || '')
    }
  }, [user])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setAvatarFile(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      setMsg({ type: 'error', text: 'Mật khẩu mới không khớp.' }); return
    }
    setLoading(true); setMsg({ type: '', text: '' })
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v) })
      if (avatarFile) fd.append('avatarFile', avatarFile)

      const res = await usersApi.updateProfile(fd)
      updateUser({ ...user, ...res.data })
      setMsg({ type: 'success', text: 'Cập nhật hồ sơ thành công!' })
      setTimeout(() => navigate(`/profile/${user.email}`), 1200)
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Cập nhật thất bại.' })
    } finally { setLoading(false) }
  }

  return (
    <div style={{ maxWidth: '600px', margin: '32px auto', padding: '0 24px' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', marginBottom: '24px' }}>Chỉnh sửa hồ sơ</h1>

      {msg.text && (
        <div style={{
          background: msg.type === 'success' ? 'rgba(0,200,100,0.1)' : 'rgba(255,50,50,0.1)',
          color: msg.type === 'success' ? '#00c864' : '#ff4444',
          padding: '12px', borderRadius: '8px', marginBottom: '16px',
          borderLeft: `3px solid ${msg.type === 'success' ? '#00c864' : '#ff4444'}`
        }}>{msg.text}</div>
      )}

      <form onSubmit={handleSubmit} style={{ background: 'var(--bg-surface)', padding: '28px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>

        {/* Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--border)' }}>
          <img
            src={preview || '/images/default-avatar.png'}
            onError={e => { e.target.src = '/images/default-avatar.png' }}
            style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '3px solid var(--border)' }}
            alt="Avatar"
          />
          <div>
            <button type="button" className="btn btn-outline"
              onClick={() => document.getElementById('avatar-input').click()}>
              <i className="bi bi-camera"></i> Đổi ảnh đại diện
            </button>
            <input id="avatar-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
            {avatarFile && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px' }}>{avatarFile.name}</div>}
          </div>
        </div>

        {/* Basic info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div className="form-group">
            <label className="form-label">Họ và tên *</label>
            <input className="form-control" value={form.fullName} onChange={e => set('fullName', e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Năm sinh</label>
            <input className="form-control" type="number" min="1900" max={new Date().getFullYear()}
              value={form.birthYear} onChange={e => set('birthYear', e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div className="form-group">
            <label className="form-label">Số điện thoại</label>
            <input className="form-control" value={form.phoneNumber} onChange={e => set('phoneNumber', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Địa chỉ</label>
            <input className="form-control" value={form.address} onChange={e => set('address', e.target.value)} />
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: '24px' }}>
          <label className="form-label">Giới thiệu bản thân</label>
          <textarea className="form-control" rows={3} value={form.bio}
            onChange={e => set('bio', e.target.value)}
            style={{ resize: 'vertical' }} placeholder="Viết gì đó về bạn..."></textarea>
        </div>

        {/* Password change */}
        <div style={{ paddingTop: '20px', borderTop: '1px solid var(--border)', marginBottom: '24px' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', marginBottom: '16px', color: 'var(--text-muted)' }}>
            ĐỔI MẬT KHẨU (để trống nếu không đổi)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[['currentPassword', 'Mật khẩu hiện tại'], ['newPassword', 'Mật khẩu mới'], ['confirmPassword', 'Xác nhận mật khẩu mới']].map(([k, label]) => (
              <div className="form-group" key={k}>
                <label className="form-label">{label}</label>
                <input className="form-control" type="password" value={form[k]} onChange={e => set(k, e.target.value)} />
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>
            {loading ? <><i className="bi bi-arrow-repeat spin"></i> Đang lưu...</> : <><i className="bi bi-check-lg"></i> Lưu thay đổi</>}
          </button>
          <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>Huỷ</button>
        </div>
      </form>
    </div>
  )
}