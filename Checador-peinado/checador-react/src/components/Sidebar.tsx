import { useState, useEffect } from 'react'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Divider,
  styled
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  CalendarMonth as CalendarIcon,
  Groups as GroupsIcon,
  Person as PersonIcon,
  MenuBook as BookIcon,
  Bookmark as BookmarkIcon,
  School as SchoolIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Logout as LogoutIcon,
  Business as BusinessIcon,
  Schedule as ScheduleIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
} from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'
import { Usuario } from '../services/supabaseService'

const drawerWidth = 260
const closedDrawerWidth = 70

// Estilizando el ListItemButton para usarlo directamente
const StyledListItemButton = styled(ListItemButton)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  margin: '6px 10px',
}))

export default function Sidebar() {
  const [open, setOpen] = useState(true)
  const { signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [userName, setUserName] = useState('Admin')
  
  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const userData = JSON.parse(userStr) as Usuario
        if (userData?.name) {
          setUserName(userData.name)
        }
      } catch (e) {
        console.error('Error parsing user data', e)
      }
    }
  }, [])
  
  const handleToggleDrawer = () => {
    setOpen(!open)
  }

  const handleSignOut = async () => {
    try {
      // Cerrar sesión en Supabase
      await signOut()
      // Eliminar los datos del localStorage
      localStorage.removeItem('user')
      // Redireccionar al login
      navigate('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const menuItems = [
    { text: 'Gestión de Horarios', icon: <CalendarIcon />, path: '/admin/horarios' },
    { text: 'Consulta de Horarios', icon: <ScheduleIcon />, path: '/admin/horario' },
    { text: 'Grupos', icon: <GroupsIcon />, path: '/admin/grupos' },
    { text: 'Usuarios', icon: <PersonIcon />, path: '/admin/usuarios' },
    { text: 'Materias', icon: <BookIcon />, path: '/admin/materias' },
    { text: 'Carreras', icon: <SchoolIcon />, path: '/admin/carreras' },
    { text: 'Temario', icon: <BookmarkIcon />, path: '/admin/temarios' },
    { text: 'Edificios', icon: <BusinessIcon />, path: '/admin/edificios' },
    {
      text: 'Consulta de Asistencias',
      icon: <AssignmentTurnedInIcon />,
      path: '/admin/consulta-asistencias'
    },
  ]

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: open ? drawerWidth : closedDrawerWidth,
        flexShrink: 0,
        height: '100vh',
        '& .MuiDrawer-paper': {
          width: open ? drawerWidth : closedDrawerWidth,
          boxSizing: 'border-box',
          transition: 'width 0.2s ease-in-out',
          overflowX: 'hidden',
          height: '100%',
          border: 'none'
        },
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: open ? 'space-between' : 'center',
        py: 2,
        px: open ? 2 : 0
      }}>
        {open && <Box component="span" sx={{ fontSize: 20, fontWeight: 'bold' }}>{userName}</Box>}
        <IconButton onClick={handleToggleDrawer}>
          {open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </IconButton>
      </Box>
      <Divider />
      
      <List sx={{ flexGrow: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <RouterLink to={item.path} style={{ textDecoration: 'none', width: '100%', color: 'inherit' }}>
              <StyledListItemButton selected={location.pathname === item.path}>
                <ListItemIcon sx={{ minWidth: open ? 40 : 'auto', ml: open ? 0 : 1 }}>
                  {item.icon}
                </ListItemIcon>
                {open && <ListItemText primary={item.text} />}
              </StyledListItemButton>
            </RouterLink>
          </ListItem>
        ))}
      </List>
      
      <Divider />
      <List>
        <ListItem disablePadding>
          <StyledListItemButton onClick={handleSignOut}>
            <ListItemIcon sx={{ minWidth: open ? 40 : 'auto', ml: open ? 0 : 1 }}>
              <LogoutIcon />
            </ListItemIcon>
            {open && <ListItemText primary="Salir" />}
          </StyledListItemButton>
        </ListItem>
      </List>
    </Drawer>
  )
}