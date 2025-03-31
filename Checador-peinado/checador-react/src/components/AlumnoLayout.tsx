import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import AlumnoSidebar from './AlumnoSidebar';

export default function AlumnoLayout() {
  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <AlumnoSidebar />
      <Box component="main" sx={{ flexGrow: 1, bgcolor: '#F2F3F8', p: 0, overflow: 'auto' }}>
        <Outlet />
      </Box>
    </Box>
  );
} 