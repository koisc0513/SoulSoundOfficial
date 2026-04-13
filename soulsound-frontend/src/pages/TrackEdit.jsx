import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { tracksApi } from '../api/index.js'

const GENRES = ['Pop','Rock','Hip-Hop','R&B','Electronic','Jazz','Classical','Indie','Lo-fi','Ballad','EDM','Metal','Acoustic','V-Pop','K-Pop','Khác']

export default function TrackEdit() {
  const { id }   = useParams()
  const navigate = useNavigate()

  const [form, setForm] = useState({ title: '', artist: '', genre: 'Pop', description: '', privacy: 'PUBLIC' })
  const [newAudioFile,     setNewAudioFile]     = useState(null)
  const [newThumbnailFile, setNewThumbnailFile] = useState(null)
  const [currentThumb,     setCurrentThumb]     = useState('')
  const [loading,          setLoading]          = useState(false)
  const [fetchLoading,     setFetchLoading]     = useState(true)
  const [error,            setError]            = useState('')

  useEffect(() => {
    tracksApi.getById(id)
      .then(res => {
        const t = res.data
        if (!t.isOwner) { navigate('/'); return }
        setForm({ title: t.title || '', artist: t.artist || '', genre: t.genre || 'Pop', description: t.description || '', privacy: t.privacy || 'PUBLIC' })
        setCurrentThumb(t.thumbnailUrl || '')
      })
      .catch(() => navigate('/'))
      .finally(() => setFetchLoading(false))
  }, [id])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      if (newAudioFile)     fd.append('newAudioFile',     newAudioFile)
      if (newThumbnailFile) fd.append('newThumbnailFile', newThumbnailFile)
      await tracksApi.update(id, fd)
      navigate(`/tracks/${id}`)
    } catch (err) {
      setError(err.response?.data?.error || 'Cập nhật thất bại.')
    } finally { setLoading(false) }
  }

  if (fetchLoading) return <div style={{ textAlign: 'center', padding: '80px' }}><i className="bi bi-arrow-repeat spin" style={{ fontSize: '2rem' }}></i></div>

  return (
    <div style={{ maxWidth: '600px', margin: '32px auto', padding: '0 24px' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', marginBottom: '24px' }}>Chỉnh sửa bài hát</h1>

      {error && <div style={{ background: 'rgba(255,50,50,0.1)', color: '#ff4444', padding: '12px', borderRadius: '8px', marginBottom: '16px', borderLeft: '3px solid #ff4444' }}>{error}</div>}

      <form onSubmit={handleSubmit} style={{ background: 'var(--bg-surface)', padding: '28px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
        {[['title', 'Tên bài hát *'], ['artist', 'Nghệ sĩ']].map(([k, label]) => (
          <div className="form-group" key={k} style={{ marginBottom: '16px' }}>
            <label className="form-label">{label}</label>
            <input className="form-control" value={form[k]} onChange={e => set(k, e.target.value)} required={k === 'title'} />
          </div>
        ))}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div className="form-group">
            <label className="form-label">Thể loại</label>
            <select className="form-control" value={form.genre} onChange={e => set('genre', e.target.value)}>
              {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Quyền riêng tư</label>
            <select className="form-control" value={form.privacy} onChange={e => set('privacy', e.target.value)}>
              <option value="PUBLIC">Công khai</option>
              <option value="PRIVATE">Riêng tư</option>
            </select>
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label className="form-label">Mô tả</label>
          <textarea className="form-control" rows={3} value={form.description} onChange={e => set('description', e.target.value)} style={{ resize: 'vertical' }}></textarea>
        </div>

        {/* Current thumbnail */}
        {currentThumb && (
          <div style={{ marginBottom: '16px' }}>
            <label className="form-label">Ảnh bìa hiện tại</label>
            <img src={currentThumb} onError={e => { e.target.style.display = 'none' }}
              style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-sm)', objectFit: 'cover', display: 'block' }} alt="" />
          </div>
        )}

        {/* Replace files */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          {[['audio-new', 'Thay file nhạc (tuỳ chọn)', '.mp3,audio/mpeg', setNewAudioFile, newAudioFile, 'bi-music-note'],
            ['thumb-new', 'Thay ảnh bìa (tuỳ chọn)',  'image/*',         setNewThumbnailFile, newThumbnailFile, 'bi-image']
          ].map(([inputId, label, accept, setter, file, icon]) => (
            <div className="form-group" key={inputId}>
              <label className="form-label">{label}</label>
              <div style={{ border: '2px dashed var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px', textAlign: 'center', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-muted)' }}
                onClick={() => document.getElementById(inputId).click()}>
                {file ? <><i className={`bi ${icon}`} style={{ color: 'var(--accent)' }}></i> <span>{file.name}</span></>
                       : <><i className={`bi ${icon}`}></i> <span>Chọn file</span></>}
              </div>
              <input id={inputId} type="file" accept={accept} style={{ display: 'none' }} onChange={e => setter(e.target.files[0])} />
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>
            {loading ? <><i className="bi bi-arrow-repeat spin"></i> Đang lưu...</> : <><i className="bi bi-check-lg"></i> Lưu thay đổi</>}
          </button>
          <button type="button" className="btn btn-outline" onClick={() => navigate(`/tracks/${id}`)}>Huỷ</button>
        </div>
      </form>
    </div>
  )
}