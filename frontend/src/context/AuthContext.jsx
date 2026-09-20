import { createContext, useContext, useEffect, useState } from 'react'
import { fetchProfile, loginRequest, logoutRequest } from '../services/authApi.js'
import { SESSION_EXPIRED_EVENT, TOKEN_KEY } from '../services/apiClient.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sessionExpired, setSessionExpired] = useState(false)

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY)

    if (!storedToken) {
      setIsLoading(false)
      return
    }

    fetchProfile()
      .then(setUser)
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    function handleSessionExpired() {
      setUser(null)
      setSessionExpired(true)
    }

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired)
  }, [])

  async function login(email, password) {
    const { accessToken, user: loggedInUser } = await loginRequest(email, password)
    localStorage.setItem(TOKEN_KEY, accessToken)
    setUser(loggedInUser)
    setSessionExpired(false)
    return loggedInUser
  }

  async function logout() {
    try {
      await logoutRequest()
    } catch {
      // best-effort : même si l'appel échoue (token déjà expiré par ex.),
      // on nettoie quand même la session côté client.
    }
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
  }

  function updateUserData(updatedFields) {
    setUser((prev) => ({ ...prev, ...updatedFields }))
  }

  function clearSessionExpiredFlag() {
    setSessionExpired(false)
  }

  return (
    <AuthContext.Provider
      value={{ user, isLoading, sessionExpired, login, logout, updateUserData, clearSessionExpiredFlag }}
    >
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