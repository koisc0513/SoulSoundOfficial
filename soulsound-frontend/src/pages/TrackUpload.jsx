import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { tracksApi } from '../api/index.js'


const GENRES = ['Pop','Rock','Hip-Hop','R&B','Electronic','Jazz','Classical','Indie','Lo-fi','Ballad','EDM','Metal','Acoustic','V-Pop','K-Pop','Khác']

export default function TrackUpload() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ title:'', artist:'', genre:'Pop', description:'', privacy:'PUBLIC' })
  const [audioFile,     setAudioFile]     = useState(null)
  const [thumbnailFile, setThumbnailFile] = useState(null)
  const [error,  setError]  = useState('')
  const [loading,setLoading]= useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!audioFile) { setError('Vui lòng chọn file nhạc .mp3.'); return }
    setLoading(true); setError('')
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k,v]) => fd.append(k, v))
      fd.append('audioFile', audioFile)
      if (thumbnailFile) fd.append('thumbnailFile', thumbnailFile)
      const res = await tracksApi.upload(fd)
      navigate(`/tracks/${res.data.id}`)
    } catch (err) {
      setError(err.response?.data?.error || 'Upload thất bại.')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ maxWidth: '600px', margin: '32px auto', padding: '0 24px' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', marginBottom: '24px' }}>Upload bài hát</h1>

      {error && <div style={{ background: 'rgba(255,50,50,0.1)', color: '#ff4444', padding: '12px', borderRadius: '8px', marginBottom: '16px', borderLeft: '3px solid #ff4444' }}>{error}</div>}

      <form onSubmit={handleSubmit} style={{ background: 'var(--bg-surface)', padding: '28px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
        {[['title','Tên bài hát *'],['artist','Nghệ sĩ']].map(([k,label]) => (
          <div className="form-group" key={k} style={{ marginBottom: '16px' }}>
            <label className="form-label">{label}</label>
            <input className="form-control" value={form[k]} onChange={e=>set(k,e.target.value)} required={k==='title'} />
          </div>
        ))}

        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label className="form-label">Thể loại</label>
          <select className="form-control" value={form.genre} onChange={e=>set('genre',e.target.value)}>
            {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label className="form-label">Quyền riêng tư</label>
          <select className="form-control" value={form.privacy} onChange={e=>set('privacy',e.target.value)}>
            <option value="PUBLIC">Công khai</option>
            <option value="PRIVATE">Riêng tư</option>
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label className="form-label">Mô tả</label>
          <textarea className="form-control" rows={3} value={form.description} onChange={e=>set('description',e.target.value)} style={{ resize: 'vertical' }}></textarea>
        </div>

        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label className="form-label">File nhạc (.mp3) *</label>
          <div className="upload-zone" style={{ border: '2px dashed var(--border)', borderRadius: 'var(--radius-md)', padding: '24px', textAlign: 'center', cursor: 'pointer' }}
            onClick={() => document.getElementById('audio-input').click()}>
            {audioFile ? <><i className="bi bi-music-note" style={{ color: 'var(--accent)', fontSize: '1.5rem' }}></i><div style={{ marginTop: '8px' }}>{audioFile.name}</div></>
              : <><i className="bi bi-cloud-upload" style={{ fontSize: '2rem', color: 'var(--text-muted)' }}></i><div style={{ marginTop: '8px', color: 'var(--text-muted)' }}>Click để chọn file MP3</div></>}
          </div>
          <input id="audio-input" type="file" accept=".mp3,audio/mpeg" style={{ display: 'none' }} onChange={e=>setAudioFile(e.target.files[0])} />
        </div>

        <div className="form-group" style={{ marginBottom: '24px' }}>
          <label className="form-label">Ảnh bìa (tuỳ chọn)</label>
          <div className="upload-zone" style={{ border: '2px dashed var(--border)', borderRadius: 'var(--radius-md)', padding: '24px', textAlign: 'center', cursor: 'pointer' }}
            onClick={() => document.getElementById('thumb-input').click()}>
            {thumbnailFile ? <><i className="bi bi-image" style={{ color: 'var(--accent)', fontSize: '1.5rem' }}></i><div style={{ marginTop: '8px' }}>{thumbnailFile.name}</div></>
              : <><i className="bi bi-image" style={{ fontSize: '2rem', color: 'var(--text-muted)' }}></i><div style={{ marginTop: '8px', color: 'var(--text-muted)' }}>Click để chọn ảnh</div></>}
          </div>
          <input id="thumb-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={e=>setThumbnailFile(e.target.files[0])} />
        </div>

        <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
          {loading ? <><i className="bi bi-arrow-repeat spin"></i> Đang upload...</> : <><i className="bi bi-cloud-upload"></i> Upload bài hát</>}
        </button>
      </form>
    </div>
  )
}