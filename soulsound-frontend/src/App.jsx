import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { PlayerProvider } from './context/PlayerContext'
import Layout from './components/Layout/Layout'

// Pages
import Home         from './pages/Home'
import Login        from './pages/Login'
import Register     from './pages/Register'
import TrackDetail  from './pages/TrackDetail'
import TrackUpload  from './pages/TrackUpload'
import TrackEdit    from './pages/TrackEdit'
import Profile      from './pages/Profile'
import ProfileEdit  from './pages/ProfileEdit'
import Search       from './pages/Search'
import Liked        from './pages/Liked'
import History      from './pages/History'
import Playlists    from './pages/Playlists'
import PlaylistDetail from './pages/PlaylistDetail'
import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers   from './pages/admin/Users'
import AdminTracks  from './pages/admin/Tracks'

// Guard: chỉ cho phép authenticated
function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-screen"><i className="bi bi-arrow-repeat spin"></i></div>
  return user ? children : <Navigate to="/login" replace />
}

// Guard: chỉ admin
function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'ADMIN') return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <PlayerProvider>
        <Routes>
          {/* Auth pages (không có Layout) */}
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Main Layout */}
          <Route element={<Layout />}>
            <Route path="/"                  element={<Home />} />
            <Route path="/tracks/:id"        element={<TrackDetail />} />
            <Route path="/search"            element={<Search />} />
            <Route path="/profile/:email"    element={<Profile />} />

            {/* Auth required */}
            <Route path="/tracks/upload" element={
              <PrivateRoute><TrackUpload /></PrivateRoute>
            }/>
            <Route path="/tracks/:id/edit" element={
              <PrivateRoute><TrackEdit /></PrivateRoute>
            }/>
            <Route path="/profile/edit" element={
              <PrivateRoute><ProfileEdit /></PrivateRoute>
            }/>
            <Route path="/liked" element={
              <PrivateRoute><Liked /></PrivateRoute>
            }/>
            <Route path="/history" element={
              <PrivateRoute><History /></PrivateRoute>
            }/>
            <Route path="/playlists" element={
              <PrivateRoute><Playlists /></PrivateRoute>
            }/>
            <Route path="/playlists/:id" element={
              <PrivateRoute><PlaylistDetail /></PrivateRoute>
            }/>

            {/* Admin */}
            <Route path="/admin/dashboard" element={
              <AdminRoute><AdminDashboard /></AdminRoute>
            }/>
            <Route path="/admin/users" element={
              <AdminRoute><AdminUsers /></AdminRoute>
            }/>
            <Route path="/admin/tracks" element={
              <AdminRoute><AdminTracks /></AdminRoute>
            }/>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </PlayerProvider>
    </AuthProvider>
  )
}
