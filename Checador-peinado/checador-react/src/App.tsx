import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { Box, ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { es } from 'date-fns/locale'

// Components
import Login from './components/Login'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLayout from './components/AdminLayout'
import AdminDashboard from './components/AdminDashboard'
import TemarioPage from './components/TemarioPage'
import UsuariosPage from './components/UsuariosPage'
import GruposPage from './components/GruposPage'
import HorarioPage from './components/HorarioPage'
import MateriasPage from './components/MateriasPage'
import CarrerasPage from './components/CarrerasPage'
import HorariosPage from './components/HorariosPage'
import JefeHorarioPage from './components/JefeHorarioPage'
import ChecadorHorarioPage from './components/ChecadorHorarioPage'
import JefeLayout from './components/JefeLayout'
import BuscarMaestroPage from './components/BuscarMaestroPage'
import MaestroLayout from './layouts/MaestroLayout'
import MaestroHorarioPage from './components/MaestroHorarioPage'
import ChecadorLayout from './components/ChecadorLayout'
import AlumnoLayout from './components/AlumnoLayout'
import AlumnoHorarioPage from './components/AlumnoHorarioPage'
import EdificiosPage from './components/EdificiosPage'
import ConsultaAsistenciasPage from './components/ConsultaAsistenciasPage'
import './App.css'

// Crear un tema personalizado
const theme = createTheme({
  palette: {
    primary: {
      main: '#4285F4',
    },
    secondary: {
      main: '#454646',
    },
    background: {
      default: '#F2F3F8',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
        <CssBaseline />
        <Box className="app-container">
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                <Route path="/login" element={<Login />} />
                
                {/* Rutas protegidas */}
                <Route element={<ProtectedRoute />}>
                  {/* Rutas de Administrador */}
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="horario" element={<HorarioPage />} />
                    <Route path="horarios" element={<HorariosPage />} />
                    <Route path="grupos" element={<GruposPage />} />
                    <Route path="usuarios" element={<UsuariosPage />} />
                    <Route path="materias" element={<MateriasPage />} />
                    <Route path="carreras" element={<CarrerasPage />} />
                    <Route path="temarios" element={<TemarioPage />} />
                    <Route path="checador-horario" element={<ChecadorHorarioPage />} />
                    <Route path="edificios" element={<EdificiosPage />} />
                    <Route path="consulta-asistencias" element={<ConsultaAsistenciasPage />} />
                  </Route>

                  {/* Rutas de Alumno */}
                  <Route path="/alumno" element={<AlumnoLayout />}>
                    <Route path="horario" element={<AlumnoHorarioPage />} />
                  </Route>

                  {/* Rutas de Jefe de Grupo */}
                  <Route path="/jefe" element={<JefeLayout />}>
                    <Route path="horario" element={<JefeHorarioPage />} />
                    <Route path="buscar" element={<BuscarMaestroPage />} />
                  </Route>

                  {/* Rutas de Checador */}
                  <Route path="/checador" element={<ChecadorLayout />}>
                    <Route path="horario" element={<ChecadorHorarioPage />} />
                  </Route>

                  {/* Rutas de Maestro */}
                  <Route path="/maestro" element={<MaestroLayout />}>
                    <Route path="horario" element={<MaestroHorarioPage />} />
                  </Route>
                </Route>
                
                {/* Catch-all route */}
                <Route path="*" element={<div>Página no encontrada</div>} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </Box>
      </LocalizationProvider>
    </ThemeProvider>
  )
}

export default App
