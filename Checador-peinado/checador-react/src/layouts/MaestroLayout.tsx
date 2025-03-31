import { Outlet } from 'react-router-dom'
import { Box } from '@mui/material'
import MaestroSidebar from '../components/MaestroSidebar'

export default function MaestroLayout() {
  return (
    <Box sx={{ display: 'flex' }}>
      <MaestroSidebar />
      <Box component="main" sx={{ flexGrow: 1 }}>
        <Outlet />
      </Box>
    </Box>
  )
} 