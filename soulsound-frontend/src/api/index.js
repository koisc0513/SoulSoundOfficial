// src/api/axios.js
import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

// Tự động đính kèm JWT vào mọi request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('ss_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401: xóa token, redirect login
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ss_token')
      localStorage.removeItem('ss_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api


// ─────────────────────────────────────────────────────────────
// src/api/auth.js
// ─────────────────────────────────────────────────────────────
export const authApi = {
  login:    (email, password) => api.post('/auth/login',    { email, password }),
  register: (data)            => api.post('/auth/register', data),
  me:       ()                => api.get('/auth/me'),
}


// ─────────────────────────────────────────────────────────────
// src/api/tracks.js
// ─────────────────────────────────────────────────────────────
export const tracksApi = {
  getFeed:    (page = 0)          => api.get(`/tracks?page=${page}`),
  getById:    (id)                => api.get(`/tracks/${id}`),
  upload:     (formData)          => api.post('/tracks/upload', formData),
  update:     (id, formData)      => api.put(`/tracks/${id}`, formData),
  delete:     (id)                => api.delete(`/tracks/${id}`),
  play:       (id)                => api.post(`/tracks/${id}/play`),
  like:       (id)                => api.post(`/tracks/${id}/like`),
  addComment: (id, content)       => api.post(`/tracks/${id}/comments`, { content }),
  deleteComment: (commentId)      => api.delete(`/tracks/comments/${commentId}`),
}


// ─────────────────────────────────────────────────────────────
// src/api/users.js
// ─────────────────────────────────────────────────────────────
export const usersApi = {
  getProfile:   (email)    => api.get(`/users/profile/${encodeURIComponent(email)}`),
  updateProfile:(formData) => api.put('/users/profile', formData),
  follow:       (id)       => api.post(`/users/${id}/follow`),
  getFollowers: (id)       => api.get(`/users/${id}/followers`),
  getFollowing: (id)       => api.get(`/users/${id}/following`),
  getLiked:     ()         => api.get('/users/liked'),
  getHistory:   (page = 0) => api.get(`/users/history?page=${page}`),
  getSuggested: ()         => api.get('/users/suggested'),
}


// ─────────────────────────────────────────────────────────────
// src/api/search.js
// ─────────────────────────────────────────────────────────────
export const searchApi = {
  search: (q = '', genre = '', type = 'track', page = 0) =>
    api.get(`/search?q=${encodeURIComponent(q)}&genre=${encodeURIComponent(genre)}&type=${type}&page=${page}`),
}


// ─────────────────────────────────────────────────────────────
// src/api/playlists.js
// ─────────────────────────────────────────────────────────────
export const playlistsApi = {
  getAll:      ()               => api.get('/playlists'),
  getById:     (id)             => api.get(`/playlists/${id}`),
  create:      (name, description) => api.post('/playlists', { name, description }),
  update:      (id, name, description) => api.put(`/playlists/${id}`, { name, description }),
  delete:      (id)             => api.delete(`/playlists/${id}`),
  addTrack:    (id, trackId)    => api.post(`/playlists/${id}/tracks/${trackId}`),
  removeTrack: (id, trackId)    => api.delete(`/playlists/${id}/tracks/${trackId}`),
}


// ─────────────────────────────────────────────────────────────
// src/api/admin.js
// ─────────────────────────────────────────────────────────────
export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers:     (page = 0) => api.get(`/admin/users?page=${page}`),
  getTracks:    (page = 0) => api.get(`/admin/tracks?page=${page}`),
  blockUser:    (id) => api.post(`/admin/users/${id}/toggle-block`),
  hideTrack:    (id) => api.post(`/admin/tracks/${id}/toggle-hidden`),
}
