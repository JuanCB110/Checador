import { Box, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { Schedule, ExitToApp } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export default function AlumnoSidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <Box sx={{ width: 240, bgcolor: 'background.paper' }}>
      <List>
        <ListItem button onClick={() => navigate('/alumno/horario')}>
          <ListItemIcon>
            <Schedule />
          </ListItemIcon>
          <ListItemText primary="Horario" />
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