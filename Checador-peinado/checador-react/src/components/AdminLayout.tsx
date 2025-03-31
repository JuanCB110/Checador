import { Box } from '@mui/material'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function AdminLayout() {
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        height: '100vh', 
        width: '100vw',
        overflow: 'hidden'
      }}
    >
      <Sidebar />
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