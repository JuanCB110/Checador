import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
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
import { gruposService, materiasService, usuariosService, horariosService, carrerasService, Carrera } from '../services/supabaseService';
import { supabase } from '../lib/supabase';

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const HORAS = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];

const formatHora = (hora: string) => {
  return `${hora} - ${parseInt(hora.split(':')[0]) + 1}:00`;
};

export default function AlumnoHorarioPage() {
  const [selectedGrupo, setSelectedGrupo] = useState<string>('');
  const [selectedMaestro, setSelectedMaestro] = useState<string>('');
  const [selectedCarreraFilter, setSelectedCarreraFilter] = useState<string>('');
  const [grupos, setGrupos] = useState<any[]>([]);
  const [maestros, setMaestros] = useState<any[]>([]);
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [horarioData, setHorarioData] = useState(new Map<string, any>());

  // Función para filtrar grupos por carrera
  const getGruposFiltrados = () => {
    if (!selectedCarreraFilter) return [];
    return grupos.filter(grupo => grupo.carrera_id?.toString() === selectedCarreraFilter);
  };

  // Limpiar grupo seleccionado cuando cambia la carrera
  useEffect(() => {
    setSelectedGrupo('');
  }, [selectedCarreraFilter]);

  const handleChangeGrupo = (event: any) => {
    setSelectedGrupo(event.target.value);
    setSelectedMaestro('');
  };

  const handleChangeMaestro = (event: any) => {
    setSelectedMaestro(event.target.value);
    setSelectedGrupo('');
  };

  const handleCloseAlert = () => {
    setError(null);
    setSuccess(null);
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const [gruposData, usuariosData, carrerasData] = await Promise.all([
          supabase.from('grupo').select('*'),
          supabase.from('usuarios').select('*'),
          carrerasService.getAll()
        ]);

        const maestrosData = usuariosData.data?.filter(u => u.role === 'Maestro') || [];
        
        setGrupos(gruposData.data || []);
        setMaestros(maestrosData);
        setCarreras(carrerasData);
      } catch (err: any) {
        console.error("Error al cargar datos iniciales:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!selectedGrupo && !selectedMaestro) return;

    const fetchHorario = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('horario-maestro')
          .select(`
            id,
            hora,
            dia,
            materia:materias(id, name),
            maestro:usuarios(id, name),
            grupo:grupo(id, name, classroom, building)
          `);

        if (selectedGrupo) {
          query = query.eq('grupo_id', selectedGrupo);
        } else if (selectedMaestro) {
          query = query.eq('maestro_id', selectedMaestro);
        }

        const { data: horarios, error: horariosError } = await query;

        if (horariosError) throw horariosError;

        const horarioMap = new Map();

        // Inicializar todas las celdas como vacías
        DIAS.forEach(dia => {
          HORAS.forEach(hora => {
            const key = `${dia}-${hora}`;
            horarioMap.set(key, {
              dia,
              hora,
              materia: '',
              maestro: '',
              aula: '',
              edificio: ''
            });
          });
        });

        // Llenar con los horarios existentes
        horarios?.forEach(horario => {
          const key = `${horario.dia}-${horario.hora}`;
          horarioMap.set(key, {
            dia: horario.dia,
            hora: horario.hora,
            materia: horario.materia?.name || '',
            maestro: selectedGrupo ? horario.maestro?.name : horario.grupo?.name,
            aula: horario.grupo?.classroom || '',
            edificio: horario.grupo?.building || '',
            horarioId: horario.id
          });
        });

        setHorarioData(horarioMap);
        setSuccess('Horario cargado correctamente');
      } catch (err: any) {
        console.error("Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHorario();
  }, [selectedGrupo, selectedMaestro]);

  const getHorasNecesarias = (horarioMap: Map<string, any>): string[] => {
    let horasConClase = new Set<string>();
    
    horarioMap.forEach((value) => {
      if (value.materia) {
        horasConClase.add(value.hora);
      }
    });

    const horasOrdenadas = Array.from(horasConClase).sort((a, b) => {
      return parseInt(a.split(':')[0]) - parseInt(b.split(':')[0]);
    });

    if (horasOrdenadas.length === 0) return HORAS;

    const primeraHora = parseInt(horasOrdenadas[0].split(':')[0]);
    const ultimaHora = parseInt(horasOrdenadas[horasOrdenadas.length - 1].split(':')[0]);

    return HORAS.filter(hora => {
      const horaActual = parseInt(hora.split(':')[0]);
      return horaActual >= primeraHora && horaActual <= ultimaHora;
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Horario de Clases
      </Typography>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

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
            <InputLabel id="grupo-label">Grupo</InputLabel>
            <Select
              labelId="grupo-label"
              value={selectedGrupo}
              label="Grupo"
              onChange={handleChangeGrupo}
              disabled={loading || !selectedCarreraFilter}
            >
              <MenuItem value="">
                <em>Seleccione un grupo</em>
              </MenuItem>
              {getGruposFiltrados().map((grupo) => (
                <MenuItem key={grupo.id} value={grupo.id?.toString()}>
                  {grupo.name} - {grupo.classroom} ({grupo.building})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel id="maestro-label">Seleccionar Maestro</InputLabel>
            <Select
              labelId="maestro-label"
              value={selectedMaestro}
              label="Seleccionar Maestro"
              onChange={handleChangeMaestro}
              disabled={loading}
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

      {(selectedGrupo || selectedMaestro) && !loading && (
        <TableContainer component={Paper} sx={{ mb: 4 }}>
          {selectedGrupo && grupos.find(g => g.id?.toString() === selectedGrupo) && (
            <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
              <Typography variant="h6" align="center">
                {`Aula: ${grupos.find(g => g.id?.toString() === selectedGrupo)?.classroom} - 
                  Edificio: ${grupos.find(g => g.id?.toString() === selectedGrupo)?.building}`}
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
                          border: celda?.materia ? '1px solid #e0e0e0' : 'inherit',
                          minWidth: 200
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
                            {selectedMaestro && (
                              <Typography variant="caption" display="block" color="text.secondary">
                                Aula: {celda.aula}
                                {celda.edificio && ` - ${celda.edificio}`}
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
      )}

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