import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/index.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  // Restore từ localStorage khi app load
  useEffect(() => {
    const token    = localStorage.getItem('ss_token')
    const savedUser = localStorage.getItem('ss_user')

    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser))
        // Verify token với server
        api.get('/auth/me')
          .then(res => setUser(res.data))
          .catch(() => { logout() })
          .finally(() => setLoading(false))
      } catch {
        setLoading(false)
      }
    } else {
      setLoading(false)
    }
  }, [])

  const login = (token, userData) => {
    localStorage.setItem('ss_token', token)
    localStorage.setItem('ss_user',  JSON.stringify(userData))
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('ss_token')
    localStorage.removeItem('ss_user')
    setUser(null)
  }

  const updateUser = (userData) => {
    localStorage.setItem('ss_user', JSON.stringify(userData))
    setUser(userData)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)