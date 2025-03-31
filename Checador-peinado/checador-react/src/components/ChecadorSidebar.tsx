import { Box, List, ListItem, ListItemIcon, ListItemText, Typography } from '@mui/material';
import { CalendarMonth, ExitToApp } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

interface User {
  name: string;
}

export default function ChecadorSidebar() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const userString = localStorage.getItem('user');
    if (userString) {
      const userData = JSON.parse(userString);
      setUser(userData);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}>
      {user && (
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" component="div">
            {user.name}
          </Typography>
        </Box>
      )}
      
      <List>
        <ListItem button onClick={() => navigate('/checador')}>
          <ListItemIcon>
            <CalendarMonth />
          </ListItemIcon>
          <ListItemText primary="Control de Asistencia" />
        </ListItem>

        <ListItem button onClick={handleLogout}>
          <ListItemIcon>
            <ExitToApp />
          </ListItemIcon>
          <ListItemText primary="Salir" />
        </ListItem>
      </List>
    </Box>
  );
} 