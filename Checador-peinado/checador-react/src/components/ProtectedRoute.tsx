import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'
import { useAuth } from '../contexts/AuthContext'
import { useEffect } from 'react'

type RoleRoutes = {
  [key: string]: {
    allowedPaths: string[];
    defaultPath: string;
  }
}

const ROLE_ROUTES: RoleRoutes = {
  Administrador: {
    allowedPaths: ['/admin'],
    defaultPath: '/admin/dashboard'
  },
  Alumno: {
    allowedPaths: ['/alumno'],
    defaultPath: '/alumno/horario'
  },
  Jefe_de_Grupo: {
    allowedPaths: ['/jefe'],
    defaultPath: '/jefe/horario'
  },
  Checador: {
    allowedPaths: ['/checador'],
    defaultPath: '/checador/horario'
  },
  Maestro: {
    allowedPaths: ['/maestro'],
    defaultPath: '/maestro/horario'
  }
}

export default function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    // Verificar la sesión en cada navegación
    const storedUser = localStorage.getItem('user')
    if (!storedUser) {
      // Si no hay usuario en localStorage, limpiar el historial y redirigir al login
      window.history.replaceState(null, '', '/login')
      navigate('/login', { replace: true })
    }
  }, [location, navigate])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!user) {
    // Limpiar el historial antes de redirigir
    window.history.replaceState(null, '', '/login')
    return <Navigate to="/login" replace />
  }

  const userRole = user.role
  const roleConfig = ROLE_ROUTES[userRole]

  if (!roleConfig) {
    window.history.replaceState(null, '', '/login')
    return <Navigate to="/login" replace />
  }

  // Verificar si la ruta actual está permitida para el rol del usuario
  const isAllowedPath = roleConfig.allowedPaths.some(path => 
    location.pathname.startsWith(path)
  )

  if (!isAllowedPath) {
    window.history.replaceState(null, '', roleConfig.defaultPath)
    return <Navigate to={roleConfig.defaultPath} replace />
  }

  return <Outlet />
} 