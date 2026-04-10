import React, { createContext, useState, useContext } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user")) || null)
  const [token, setToken] = useState(() => localStorage.getItem("token") || null)

  const login = (userData, token) => {
    setUser(userData)
    setToken(token)
    localStorage.setItem("user", JSON.stringify(userData))
    localStorage.setItem("token", token)
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem("user")
    localStorage.removeItem("token")
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider

export const useAuth = () => useContext(AuthContext)
