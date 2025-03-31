import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import ChecadorSidebar from './ChecadorSidebar';

export default function ChecadorLayout() {
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        height: '100vh', 
        width: '100vw',
        overflow: 'hidden'
      }}
    >
      <ChecadorSidebar />
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          bgcolor: '#F2F3F8',
          overflow: 'auto',
          height: '100%',
          padding: 0
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
} 