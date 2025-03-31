import { Box } from '@mui/material'
import { Outlet } from 'react-router-dom'
import JefeSidebar from './JefeSidebar'

export default function JefeLayout() {
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        height: '100vh', 
        width: '100vw',
        overflow: 'hidden'
      }}
    >
      <JefeSidebar />
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
  )
} 