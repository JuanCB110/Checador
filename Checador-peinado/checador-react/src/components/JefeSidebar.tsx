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
  styled,
  Typography
} from '@mui/material'
import {
  CalendarMonth as CalendarIcon,
  Search as SearchIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Logout as LogoutIcon
} from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

const drawerWidth = 260
const closedDrawerWidth = 70

const StyledListItemButton = styled(ListItemButton)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  margin: '6px 10px',
}))

export default function JefeSidebar() {
  const [open, setOpen] = useState(true)
  const { signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [grupoInfo, setGrupoInfo] = useState<{ name: string } | null>(null)

  useEffect(() => {
    const cargarGrupo = async () => {
      const userString = localStorage.getItem('user');
      if (!userString) return;
      
      const user = JSON.parse(userString);
      
      const { data: grupos, error } = await supabase
        .from('grupo')
        .select('name')
        .eq('jefe_nocuenta', user.numero_cuenta);

      if (error) {
        console.error('Error al cargar grupo:', error);
        return;
      }

      if (grupos && grupos.length > 0) {
        setGrupoInfo(grupos[0]);
      }
    };

    cargarGrupo();
  }, []);

  const handleToggleDrawer = () => {
    setOpen(!open)
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

  const menuItems = [
    { 
      text: 'Horario', 
      icon: <CalendarIcon />, 
      path: '/jefe/horario' 
    },
    { 
      text: 'Buscar Maestro', 
      icon: <SearchIcon />, 
      path: '/jefe/buscar' 
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
        {open && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h6">Grupo</Typography>
            <Typography variant="h6" color="primary" sx={{ ml: 1 }}>
              {grupoInfo?.name || 'Cargando...'}
            </Typography>
          </Box>
        )}
        <IconButton onClick={handleToggleDrawer}>
          {open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </IconButton>
      </Box>
      
      <Divider />
      
      <List sx={{ flexGrow: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <RouterLink 
              to={item.path} 
              style={{ 
                textDecoration: 'none', 
                width: '100%', 
                color: 'inherit' 
              }}
            >
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