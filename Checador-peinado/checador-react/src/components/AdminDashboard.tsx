import { Box, Typography } from '@mui/material'

export default function AdminDashboard() {
  return (
    <Box sx={{ 
      p: 3, 
      height: '100%', 
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Typography variant="h4" gutterBottom>
        Bienvenido administrador
      </Typography>
      <Typography paragraph>
        Use la barra de la izquierda para desplazarse entre las distintas opciones disponibles
      </Typography>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexGrow: 1,
          mt: 2
        }}
      >
        <Box
          component="img"
          src="/admin.gif"
          alt="Admin GIF"
          sx={{
            maxWidth: '100%',
            maxHeight: '60vh',
            objectFit: 'contain'
          }}
        />
      </Box>
    </Box>
  )
}