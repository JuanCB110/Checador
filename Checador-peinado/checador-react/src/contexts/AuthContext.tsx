import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

interface User {
  id: number
  email: string
  name: string
  role: string
  numero_cuenta?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (userData: User) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    // Verificar si hay un usuario en localStorage al cargar
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  const signIn = async (userData: User) => {
    // Guardar usuario en localStorage y en el estado
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  const signOut = async () => {
    // Limpiar localStorage y estado
    localStorage.removeItem('user')
    setUser(null)
    // Redirigir al login
    navigate('/login')
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 