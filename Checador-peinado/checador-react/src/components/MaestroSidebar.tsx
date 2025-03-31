import { useState, useEffect } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
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
} from '@mui/material';
import {
  CalendarMonth as CalendarIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Logout as LogoutIcon,
  ExitToApp
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const drawerWidth = 260;
const closedDrawerWidth = 70;

const StyledListItemButton = styled(ListItemButton)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  margin: '6px 10px',
}));

interface User {
  name: string;
}

export default function MaestroSidebar() {
  const [open, setOpen] = useState(true);
  const { signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  const handleToggleDrawer = () => {
    setOpen(!open);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  useEffect(() => {
    const userString = localStorage.getItem('user');
    if (userString) {
      const userData = JSON.parse(userString);
      setUser(userData);
    }
  }, []);

  const menuItems = [
    { 
      text: 'Mi Horario', 
      icon: <CalendarIcon />, 
      path: '/maestro/horario' 
    }
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: open ? drawerWidth : closedDrawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: open ? drawerWidth : closedDrawerWidth,
          boxSizing: 'border-box',
          transition: 'width 0.2s ease-in-out',
          overflowX: 'hidden'
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
          <Typography variant="h6">
            {user?.name}
          </Typography>
        )}
        <IconButton onClick={handleToggleDrawer}>
          {open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </IconButton>
      </Box>
      
      <Divider />
      
      <List>
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
              <ExitToApp />
            </ListItemIcon>
            {open && <ListItemText primary="Salir" />}
          </StyledListItemButton>
        </ListItem>
      </List>
    </Drawer>
  );
} 