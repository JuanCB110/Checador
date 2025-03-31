import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import { Link } from 'react-router-dom';
import { gruposService, materiasService, usuariosService, horariosService, carrerasService, Grupo, Materia, Usuario, HorarioMaestro, Carrera } from '../services/supabaseService';

// Estructura para los datos del horario
interface HorarioData {
  dia: string;
  hora: string;
  materia: string;
  maestro: string;
  asistencia: boolean;
  horarioId?: number;
  aula?: string;
  edificio?: string;
}

// Horas y días para el horario
const HORAS = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', 
               '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];
const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

// Función para mostrar la hora en formato legible
const formatHora = (hora: string) => {
  return `${hora} - ${parseInt(hora.split(':')[0]) + 1}:00`;
};

export default function HorarioPage() {
  const [selectedCarreraFilter, setSelectedCarreraFilter] = useState<string>('');
  const [selectedGrupo, setSelectedGrupo] = useState<string>('');
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [horarioData, setHorarioData] = useState<Map<string, HorarioData>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [maestros, setMaestros] = useState<Usuario[]>([]);
  const [selectedMaestro, setSelectedMaestro] = useState<string>('');
  const [horarios, setHorarios] = useState<HorarioMaestro[]>([]);
  const [carreras, setCarreras] = useState<Carrera[]>([]);

  const handleChangeGrupo = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedGrupo(event.target.value);
    setSelectedMaestro('');
  };

  const handleChangeMaestro = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMaestro(event.target.value);
    setSelectedGrupo('');
  };

  const handleCloseAlert = () => {
    setError(null);
    setSuccess(null);
  };

  // Cargar los grupos al iniciar
  useEffect(() => {
    const fetchGrupos = async () => {
      setLoading(true);
      try {
        const data = await gruposService.getAll();
        setGrupos(data);
      } catch (err: any) {
        setError('Error al cargar grupos: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchMaterias = async () => {
      try {
        const data = await materiasService.getAll();
        setMaterias(data);
      } catch (err: any) {
        setError('Error al cargar materias: ' + err.message);
      }
    };

    const fetchMaestros = async () => {
      try {
        const data = await usuariosService.getAll();
        // Filtrar solo maestros
        const maestrosData = data.filter(u => u.role === 'Maestro');
        setMaestros(maestrosData);
      } catch (err: any) {
        setError('Error al cargar maestros: ' + err.message);
      }
    };

    const fetchData = async () => {
      setLoading(true);
      try {
        const [usuariosData, materiasData, horariosData, carrerasData] = await Promise.all([
          usuariosService.getAll(),
          materiasService.getAll(),
          horariosService.getAll(),
          carrerasService.getAll()
        ]);

        const maestrosData = usuariosData.filter(usuario => usuario.role === 'Maestro');
        setMaestros(maestrosData);
        setMaterias(materiasData);
        setHorarios(horariosData);
        setCarreras(carrerasData);
        console.log("Horarios cargados:", horariosData);
      } catch (err: any) {
        console.error("Error al cargar datos:", err);
        setError(err.message || 'Error al cargar datos');
      } finally {
        setLoading(false);
      }
    };

    fetchGrupos();
    fetchMaterias();
    fetchMaestros();
    fetchData();
  }, []);

  // Actualizar el useEffect para el grupo
  useEffect(() => {
    if (!selectedGrupo) return;

    const fetchHorarioGrupo = async () => {
      setLoading(true);
      try {
        const data = await horariosService.getAll();
        const horariosGrupo = data.filter(h => h.grupo_id.toString() === selectedGrupo);
        
        const horarioMap = new Map<string, HorarioData>();
        
        DIAS.forEach(dia => {
          HORAS.forEach(hora => {
            const key = `${dia}-${hora}`;
            horarioMap.set(key, {
              dia,
              hora,
              materia: '',
              maestro: '',
              asistencia: false
            });
          });
        });
        
        horariosGrupo.forEach((horario: HorarioMaestro) => {
          const materia = materias.find(m => m.id === horario.materia_id);
          const maestro = maestros.find(m => m.id === horario.maestro_id);
          const grupo = grupos.find(g => g.id === horario.grupo_id);
          
          if (materia && maestro && grupo && horario.dia && horario.hora) {
            const key = `${horario.dia}-${horario.hora}`;
            horarioMap.set(key, {
              dia: horario.dia,
              hora: horario.hora,
              materia: materia.name,
              maestro: maestro.name,
              asistencia: horario.asistencia || false,
              horarioId: horario.id,
              aula: grupo.classroom,
              edificio: grupo.building
            });
          }
        });
        
        setHorarioData(horarioMap);
        setSuccess('Horario del grupo cargado correctamente');
      } catch (err: any) {
        console.error("Error cargando horarios del grupo:", err);
        setError('Error al cargar horario del grupo: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHorarioGrupo();
  }, [selectedGrupo, materias, maestros, grupos]);

  // Actualizar el useEffect para el maestro
  useEffect(() => {
    if (!selectedMaestro) return;

    const fetchHorarioMaestro = async () => {
      setLoading(true);
      try {
        const data = await horariosService.getAll();
        const horariosMaestro = data.filter(h => h.maestro_id.toString() === selectedMaestro);
        
        const horarioMap = new Map<string, HorarioData>();
        
        DIAS.forEach(dia => {
          HORAS.forEach(hora => {
            const key = `${dia}-${hora}`;
            horarioMap.set(key, {
              dia,
              hora,
              materia: '',
              maestro: '',
              asistencia: false
            });
          });
        });
        
        horariosMaestro.forEach((horario: HorarioMaestro) => {
          const materia = materias.find(m => m.id === horario.materia_id);
          const grupo = grupos.find(g => g.id === horario.grupo_id);
          
          if (materia && grupo && horario.dia && horario.hora) {
            const key = `${horario.dia}-${horario.hora}`;
            horarioMap.set(key, {
              dia: horario.dia,
              hora: horario.hora,
              materia: materia.name,
              maestro: grupo.name,
              asistencia: horario.asistencia || false,
              horarioId: horario.id,
              aula: grupo.classroom,
              edificio: grupo.building
            });
          }
        });
        
        setHorarioData(horarioMap);
        setSuccess('Horario del maestro cargado correctamente');
      } catch (err: any) {
        console.error("Error cargando horarios del maestro:", err);
        setError('Error al cargar horario del maestro: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHorarioMaestro();
  }, [selectedMaestro, materias, grupos]);

  // Limpiar horarioData cuando se cambia de selección
  useEffect(() => {
    if (selectedGrupo) {
      setSelectedMaestro('');
    } else if (selectedMaestro) {
      setSelectedGrupo('');
    }
    setHorarioData(new Map());
  }, [selectedGrupo, selectedMaestro]);

  // Filtrar horarios por maestro
  const filteredHorarios = selectedMaestro
    ? horarios.filter(horario => horario.maestro_id.toString() === selectedMaestro)
    : [];

  // Función para obtener el nombre de la materia
  const getMateriaNombre = (materiaId: number) => {
    const materia = materias.find(m => m.id === materiaId);
    return materia ? materia.name : 'Materia no encontrada';
  };

  const handleToggleAsistencia = async (dia: string, hora: string) => {
    const key = `${dia}-${hora}`;
    const horario = horarioData.get(key);
    
    if (!horario || !horario.horarioId) return;
    
    setLoading(true);
    try {
      const updatedHorario: Partial<HorarioMaestro> = {
        asistencia: !horario.asistencia
      };
      
      await horariosService.update(horario.horarioId, updatedHorario);
      
      // Actualizar el estado local
      const newHorarioData = new Map(horarioData);
      newHorarioData.set(key, {
        ...horario,
        asistencia: !horario.asistencia
      });
      
      setHorarioData(newHorarioData);
      setSuccess('Asistencia actualizada correctamente');
    } catch (err: any) {
      setError('Error al actualizar asistencia: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener el rango de horas necesarias
  const getHorasNecesarias = (horarioMap: Map<string, HorarioData>): string[] => {
    let horasConClase = new Set<string>();
    
    // Recolectar todas las horas que tienen clases
    horarioMap.forEach((value) => {
      if (value.materia) {
        horasConClase.add(value.hora);
      }
    });

    // Convertir a array y ordenar
    const horasOrdenadas = Array.from(horasConClase).sort((a, b) => {
      return parseInt(a.split(':')[0]) - parseInt(b.split(':')[0]);
    });

    if (horasOrdenadas.length === 0) return HORAS;

    // Obtener la primera y última hora
    const primeraHora = parseInt(horasOrdenadas[0].split(':')[0]);
    const ultimaHora = parseInt(horasOrdenadas[horasOrdenadas.length - 1].split(':')[0]);

    // Crear array con el rango completo de horas
    return HORAS.filter(hora => {
      const horaActual = parseInt(hora.split(':')[0]);
      return horaActual >= primeraHora && horaActual <= ultimaHora;
    });
  };

  // Función para obtener grupos filtrados por carrera
  const getGruposFiltrados = () => {
    if (!selectedCarreraFilter) return [];
    return grupos.filter(grupo => grupo.carrera_id?.toString() === selectedCarreraFilter);
  };

  // Modificar el useEffect para limpiar la selección de grupo cuando cambia la carrera
  useEffect(() => {
    setSelectedGrupo('');
  }, [selectedCarreraFilter]);

  // Modificar la sección de la tabla para grupos y maestros
  const renderHorarioTable = () => {
    // Obtener el grupo seleccionado para mostrar su información
    const grupoSeleccionado = selectedGrupo ? grupos.find(g => g.id?.toString() === selectedGrupo) : null;

    return (
      <TableContainer component={Paper} sx={{ mb: 4 }}>
        {/* Agregar encabezado con información del grupo si estamos en vista de grupo */}
        {selectedGrupo && grupoSeleccionado && (
          <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
            <Typography variant="h6" align="center">
              Aula: {grupoSeleccionado.classroom} - Edificio: {grupoSeleccionado.building}
            </Typography>
          </Box>
        )}
        
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: 'primary.light' }}>
              <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Hora</TableCell>
              {DIAS.map((dia) => (
                <TableCell key={dia} align="center" sx={{ fontWeight: 'bold', color: 'white' }}>
                  {dia}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {getHorasNecesarias(horarioData).map((hora) => (
              <TableRow key={hora} hover>
                <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                  {formatHora(hora)}
                </TableCell>
                {DIAS.map((dia) => {
                  const key = `${dia}-${hora}`;
                  const celda = horarioData.get(key);
                  
                  return (
                    <TableCell 
                      key={key} 
                      align="center" 
                      sx={{ 
                        position: 'relative',
                        bgcolor: celda?.materia ? 'rgba(200, 230, 255, 0.2)' : 'inherit',
                        padding: '16px',
                        border: celda?.materia ? '1px solid #e0e0e0' : 'inherit'
                      }}
                    >
                      {celda?.materia ? (
                        <>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {celda.materia}
                          </Typography>
                          <Typography variant="caption" display="block">
                            {celda.maestro}
                          </Typography>
                          {/* Mostrar aula y edificio solo en vista de maestros */}
                          {selectedMaestro && (
                            <Typography variant="caption" display="block" color="text.secondary">
                              Aula: {celda.aula} - Edificio: {celda.edificio}
                            </Typography>
                          )}
                        </>
                      ) : (
                        <Typography variant="caption" color="textSecondary">
                          Sin clase
                        </Typography>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom align="center">
        Horario de Clases
      </Typography>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Carrera</InputLabel>
            <Select
              value={selectedCarreraFilter}
              label="Carrera"
              onChange={(e) => setSelectedCarreraFilter(e.target.value)}
              disabled={loading}
            >
              <MenuItem value="">
                <em>Seleccione una carrera</em>
              </MenuItem>
              {carreras.map((carrera) => (
                <MenuItem key={carrera.id} value={carrera.id.toString()}>
                  {carrera.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Grupo</InputLabel>
            <Select
              value={selectedGrupo}
              label="Grupo"
              onChange={handleChangeGrupo}
              disabled={loading || !selectedCarreraFilter}
            >
              <MenuItem value="">
                <em>Seleccione un grupo</em>
              </MenuItem>
              {getGruposFiltrados().map((grupo) => (
                <MenuItem key={grupo.id} value={grupo.id?.toString() || ''}>
                  {grupo.name} - {grupo.classroom} ({grupo.building})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Seleccionar Maestro</InputLabel>
            <Select
              value={selectedMaestro}
              label="Seleccionar Maestro"
              onChange={handleChangeMaestro}
            >
              <MenuItem value="">
                <em>Seleccione un maestro</em>
              </MenuItem>
              {maestros.map((maestro) => (
                <MenuItem key={maestro.id} value={maestro.id?.toString()}>
                  {maestro.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {(selectedGrupo || selectedMaestro) && !loading && renderHorarioTable()}

      {/* Alertas de éxito y error */}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseAlert}>
        <Alert onClose={handleCloseAlert} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar open={!!success} autoHideDuration={6000} onClose={handleCloseAlert}>
        <Alert onClose={handleCloseAlert} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
} 