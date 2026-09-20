import { createContext, useContext, useEffect, useState } from 'react'
import { fetchProfile, loginRequest } from '../services/authApi.js'

const AuthContext = createContext(null)
const TOKEN_KEY = 'emit_access_token'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY)

    if (!storedToken) {
      setIsLoading(false)
      return
    }

    fetchProfile(storedToken)
      .then(setUser)
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setIsLoading(false))
  }, [])

  async function login(email, password) {
    const { accessToken, user: loggedInUser } = await loginRequest(email, password)
    localStorage.setItem(TOKEN_KEY, accessToken)
    setUser(loggedInUser)
    return loggedInUser
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth doit être utilisé à l'intérieur de <AuthProvider>.")
  }
  return context
}