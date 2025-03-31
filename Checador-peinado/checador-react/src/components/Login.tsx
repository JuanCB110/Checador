import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Box, 
  Button, 
  Container, 
  TextField, 
  Typography, 
  Link,
  Alert,
  Paper,
  Avatar,
  CircularProgress
} from '@mui/material'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { authService } from '../services/supabaseService'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { signIn } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      setError(null)

      // Buscar usuario por email y password
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single()

      if (userError) {
        throw new Error('Credenciales inválidas')
      }
      
      if (!userData) {
        throw new Error('Usuario o contraseña incorrectos')
      }

      // Iniciar sesión en el contexto
      await signIn(userData)
      
      // Redirigir según el rol
      const roleRoutes = {
        Administrador: '/admin/dashboard',
        Alumno: '/alumno/horario',
        Jefe_de_Grupo: '/jefe/horario',
        Checador: '/checador/horario',
        Maestro: '/maestro/horario'
      }
      
      navigate(roleRoutes[userData.role] || '/login')
      
    } catch (err: any) {
      console.error('Error en login:', err)
      setError(err.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box 
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        width: '100vw',
        bgcolor: '#F2F3F8'
      }}
    >
      <Container component="main" maxWidth="xs">
        <Paper 
          elevation={3} 
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: 2
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
            <LockOutlinedIcon />
          </Avatar>
          
          <Typography component="h1" variant="h5" mb={2}>
            Checador Login
          </Typography>
          
          <Box 
            component="img" 
            src="/vision2025.jpeg" 
            alt="Logo" 
            sx={{ 
              height: 110, 
              mb: 3,
              maxWidth: '100%'
            }} 
          />
          
          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Correo Electrónico"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Contraseña"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Iniciar Sesión'}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  )
} 