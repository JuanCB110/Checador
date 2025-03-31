import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Button,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { 
  horariosService, 
  usuariosService, 
  materiasService, 
  gruposService, 
  carrerasService,
  HorarioMaestro,
  Usuario,
  Materia,
  Grupo,
  Carrera
} from '../services/supabaseService';

// Días de la semana
const DIAS_SEMANA = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes'
];

// Horas de clase
const HORAS_CLASE = [
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
];

export default function HorariosPage() {
  // Estados para los datos
  const [maestros, setMaestros] = useState<Usuario[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [horarios, setHorarios] = useState<HorarioMaestro[]>([]);
  
  // Estados para los filtros y selección
  const [selectedMaestro, setSelectedMaestro] = useState<string>('');
  const [selectedGrupo, setSelectedGrupo] = useState<string>('');
  const [selectedMateria, setSelectedMateria] = useState<string>('');
  const [selectedDias, setSelectedDias] = useState<string[]>([]);
  const [selectedHora, setSelectedHora] = useState<string>('');
  
  // Estado para control de UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [horarioSeleccionado, setHorarioSeleccionado] = useState<HorarioMaestro | null>(null);
  
  // Agregar estado para carreras y filtros
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [filtroCarrera, setFiltroCarrera] = useState<string>('');
  const [filtroTipo, setFiltroTipo] = useState<'carrera' | 'maestro'>('carrera');
  
  // Agregar estado para grupo filtrado
  const [filtroGrupo, setFiltroGrupo] = useState<string>('');
  
  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Cargar maestros (solo los que tienen rol de Maestro)
        const usuariosData = await usuariosService.getAll();
        const maestrosData = usuariosData.filter(usuario => usuario.role === 'Maestro');
        setMaestros(maestrosData);
        
        // Cargar materias
        const materiasData = await materiasService.getAll();
        setMaterias(materiasData);
        
        // Cargar grupos
        const gruposData = await gruposService.getAll();
        setGrupos(gruposData);
        
        // Cargar horarios existentes
        const horariosData = await horariosService.getAll();
        setHorarios(horariosData);
        
        // Cargar carreras
        const carrerasData = await carrerasService.getAll();
        setCarreras(carrerasData);
      } catch (err: any) {
        setError(err.message || 'Error al cargar datos');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  
  // Manejar cambio de maestro
  const handleChangeMaestro = (event: SelectChangeEvent) => {
    setSelectedMaestro(event.target.value);
  };
  
  // Manejar cambio de grupo
  const handleChangeGrupo = (event: SelectChangeEvent) => {
    setSelectedGrupo(event.target.value);
  };
  
  // Manejar cambio de materia
  const handleChangeMateria = (event: SelectChangeEvent) => {
    setSelectedMateria(event.target.value);
  };
  
  // Manejar cambio de días
  const handleChangeDias = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setSelectedDias(typeof value === 'string' ? value.split(',') : value);
  };
  
  // Manejar cambio de hora
  const handleChangeHora = (event: SelectChangeEvent) => {
    setSelectedHora(event.target.value);
  };
  
  // Agregar manejador para cambio de filtro tipo
  const handleChangeFiltroTipo = (event: SelectChangeEvent) => {
    setFiltroTipo(event.target.value as 'carrera' | 'maestro');
    setFiltroCarrera('');
    setFiltroGrupo('');
    setSelectedMaestro('');
  };
  
  // Actualizar manejador para cambio de carrera
  const handleChangeCarrera = (event: SelectChangeEvent) => {
    setFiltroCarrera(event.target.value);
    setFiltroGrupo(''); // Resetear el grupo seleccionado
  };
  
  // Agregar manejador para cambio de grupo
  const handleChangeFiltroGrupo = (event: SelectChangeEvent) => {
    setFiltroGrupo(event.target.value);
  };
  
  // Abrir diálogo para agregar horario
  const handleOpenDialog = () => {
    setOpenDialog(true);
    setHorarioSeleccionado(null);
    // Limpiar selecciones
    setSelectedMaestro('');
    setSelectedGrupo('');
    setSelectedMateria('');
    setSelectedDias([]);
    setSelectedHora('');
  };
  
  // Cerrar diálogo
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  
  // Verificar si ya existe un horario con la misma información
  const horarioExistente = () => {
    return horarios.some(
      horario => 
        horario.maestro_id === Number(selectedMaestro) &&
        horario.grupo_id === Number(selectedGrupo) &&
        horario.materia_id === Number(selectedMateria) &&
        horario.dia === selectedDias[0] &&
        horario.hora === selectedHora
    );
  };
  
  // Verificar si un maestro ya tiene clase a esa hora y día
  const maestroOcupado = () => {
    return horarios.some(
      horario => 
        horario.maestro_id === Number(selectedMaestro) &&
        horario.dia === selectedDias[0] &&
        horario.hora === selectedHora
    );
  };
  
  // Verificar si un grupo ya tiene clase a esa hora y día
  const grupoOcupado = () => {
    return horarios.some(
      horario => 
        horario.grupo_id === Number(selectedGrupo) &&
        horario.dia === selectedDias[0] &&
        horario.hora === selectedHora
    );
  };
  
  // Obtener grupos filtrados por carrera
  const getGruposPorCarrera = () => {
    if (!filtroCarrera) return [];
    
    // Ahora filtramos por carrera_id en lugar de por el nombre
    const carreraSeleccionada = carreras.find(c => c.nombre === filtroCarrera);
    if (!carreraSeleccionada) return [];
    
    return grupos.filter(grupo => grupo.carrera_id === carreraSeleccionada.id);
  };
  
  // Agregar nuevo horario
  const handleAddHorario = async () => {
    // Validaciones
    if (!selectedMaestro || !selectedGrupo || !selectedMateria || selectedDias.length === 0 || !selectedHora) {
      setError('Debe completar todos los campos');
      return;
    }
    
    if (horarioExistente()) {
      setError('Ya existe un horario con esta misma configuración');
      return;
    }
    
    if (maestroOcupado()) {
      setError('El maestro ya tiene una clase asignada en este horario');
      return;
    }
    
    if (grupoOcupado()) {
      setError('El grupo ya tiene una clase asignada en este horario');
      return;
    }
    
    setLoading(true);
    try {
      // Crear horarios para cada día seleccionado
      for (const dia of selectedDias) {
        if (horarios.some(
          horario => 
            horario.maestro_id === Number(selectedMaestro) &&
            horario.grupo_id === Number(selectedGrupo) &&
            horario.materia_id === Number(selectedMateria) &&
            horario.dia === dia &&
            horario.hora === selectedHora
        )) {
          setError(`Ya existe un horario para el día ${dia} en esta configuración`);
          continue;
        }

        if (horarios.some(
          horario => 
            horario.maestro_id === Number(selectedMaestro) &&
            horario.dia === dia &&
            horario.hora === selectedHora
        )) {
          setError(`El maestro ya tiene una clase asignada el día ${dia} en este horario`);
          continue;
        }

        if (horarios.some(
          horario => 
            horario.grupo_id === Number(selectedGrupo) &&
            horario.dia === dia &&
            horario.hora === selectedHora
        )) {
          setError(`El grupo ya tiene una clase asignada el día ${dia} en este horario`);
          continue;
        }

        const nuevoHorario: HorarioMaestro = {
          maestro_id: Number(selectedMaestro),
          grupo_id: Number(selectedGrupo),
          materia_id: Number(selectedMateria),
          dia: dia,
          hora: selectedHora,
          asistencia: false
        };
        
        await horariosService.create(nuevoHorario);
      }

      setSuccess('Horarios agregados correctamente');
      handleCloseDialog();
      
      // Recargar horarios
      const horariosData = await horariosService.getAll();
      setHorarios(horariosData);
    } catch (err: any) {
      setError(err.message || 'Error al agregar horarios');
    } finally {
      setLoading(false);
    }
  };
  
  // Editar horario existente
  const handleEditHorario = (horario: HorarioMaestro) => {
    setHorarioSeleccionado(horario);
    setSelectedMaestro(horario.maestro_id.toString());
    setSelectedGrupo(horario.grupo_id.toString());
    setSelectedMateria(horario.materia_id.toString());
    setSelectedDias([horario.dia]);
    setSelectedHora(horario.hora);
    setOpenDialog(true);
  };
  
  // Actualizar horario existente
  const handleUpdateHorario = async () => {
    if (!horarioSeleccionado) return;
    
    // Validaciones
    if (!selectedMaestro || !selectedGrupo || !selectedMateria || selectedDias.length === 0 || !selectedHora) {
      setError('Debe completar todos los campos');
      return;
    }
    
    // Verificar si ya existe otro horario con la misma información (excepto el actual)
    const horarioConflicto = horarios.find(
      horario => 
        horario.id !== horarioSeleccionado.id &&
        horario.maestro_id === Number(selectedMaestro) &&
        horario.grupo_id === Number(selectedGrupo) &&
        horario.materia_id === Number(selectedMateria) &&
        horario.dia === selectedDias[0] &&
        horario.hora === selectedHora
    );
    
    if (horarioConflicto) {
      setError('Ya existe un horario con esta misma configuración');
      return;
    }
    
    // Verificar si un maestro ya tiene clase a esa hora y día (excepto el actual)
    const maestroConflicto = horarios.find(
      horario => 
        horario.id !== horarioSeleccionado.id &&
        horario.maestro_id === Number(selectedMaestro) &&
        horario.dia === selectedDias[0] &&
        horario.hora === selectedHora
    );
    
    if (maestroConflicto) {
      setError('El maestro ya tiene una clase asignada en este horario');
      return;
    }
    
    // Verificar si un grupo ya tiene clase a esa hora y día (excepto el actual)
    const grupoConflicto = horarios.find(
      horario => 
        horario.id !== horarioSeleccionado.id &&
        horario.grupo_id === Number(selectedGrupo) &&
        horario.dia === selectedDias[0] &&
        horario.hora === selectedHora
    );
    
    if (grupoConflicto) {
      setError('El grupo ya tiene una clase asignada en este horario');
      return;
    }
    
    setLoading(true);
    try {
      // Actualizar horario
      const horarioActualizado: Partial<HorarioMaestro> = {
        maestro_id: Number(selectedMaestro),
        grupo_id: Number(selectedGrupo),
        materia_id: Number(selectedMateria),
        dia: selectedDias[0],
        hora: selectedHora
      };
      
      await horariosService.update(horarioSeleccionado.id!, horarioActualizado);
      setSuccess('Horario actualizado correctamente');
      handleCloseDialog();
      
      // Recargar horarios
      const horariosData = await horariosService.getAll();
      setHorarios(horariosData);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar horario');
    } finally {
      setLoading(false);
    }
  };
  
  // Eliminar horario
  const handleDeleteHorario = async (id: number) => {
    if (!window.confirm('¿Está seguro de eliminar este horario?')) {
      return;
    }
    
    setLoading(true);
    try {
      await horariosService.delete(id);
      setSuccess('Horario eliminado correctamente');
      
      // Recargar horarios
      const horariosData = await horariosService.getAll();
      setHorarios(horariosData);
    } catch (err: any) {
      setError(err.message || 'Error al eliminar horario');
    } finally {
      setLoading(false);
    }
  };
  
  // Cerrar alertas
  const handleCloseAlert = () => {
    setError(null);
    setSuccess(null);
  };
  
  // Obtener nombre del maestro por ID
  const getMaestroNombre = (id: number) => {
    const maestro = maestros.find(m => m.id === id);
    return maestro ? maestro.name : 'Desconocido';
  };
  
  // Obtener nombre de la materia por ID
  const getMateriaNombre = (id: number) => {
    const materia = materias.find(m => m.id === id);
    return materia ? materia.name : 'Desconocida';
  };
  
  // Obtener nombre del grupo por ID
  const getGrupoNombre = (id: number) => {
    const grupo = grupos.find(g => g.id === id);
    return grupo ? grupo.name : 'Desconocido';
  };
  
  // Actualizar función para filtrar horarios
  const getHorariosFiltrados = () => {
    if (filtroTipo === 'maestro' && selectedMaestro) {
      return horarios.filter(h => h.maestro_id === Number(selectedMaestro));
    }

    if (filtroTipo === 'carrera') {
      let horariosFiltered = [...horarios];
      
      if (filtroGrupo) {
        horariosFiltered = horariosFiltered.filter(h => h.grupo_id === Number(filtroGrupo));
      } else if (filtroCarrera) {
        const gruposCarrera = getGruposPorCarrera();
        const gruposIds = gruposCarrera.map(g => g.id);
        horariosFiltered = horariosFiltered.filter(h => gruposIds.includes(h.grupo_id));
      }
      
      return horariosFiltered;
    }

    return horarios;
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
        <Typography variant="h5" gutterBottom align="center" sx={{ mb: 3 }}>
          Gestión de Horarios
        </Typography>
        
        {/* Agregar filtros */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Ver por</InputLabel>
              <Select
                value={filtroTipo}
                label="Ver por"
                onChange={handleChangeFiltroTipo}
              >
                <MenuItem value="carrera">Carrera y Grupo</MenuItem>
                <MenuItem value="maestro">Maestro</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {filtroTipo === 'carrera' && (
            <>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Carrera</InputLabel>
                  <Select
                    value={filtroCarrera}
                    label="Carrera"
                    onChange={handleChangeCarrera}
                  >
                    {carreras.map((carrera) => (
                      <MenuItem key={carrera.id} value={carrera.nombre}>
                        {carrera.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {filtroCarrera && (
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Grupo</InputLabel>
                    <Select
                      value={filtroGrupo}
                      label="Grupo"
                      onChange={handleChangeFiltroGrupo}
                    >
                      <MenuItem value="">Todos los grupos</MenuItem>
                      {getGruposPorCarrera().map((grupo) => (
                        <MenuItem key={grupo.id} value={grupo.id.toString()}>
                          {grupo.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}
            </>
          )}

          {filtroTipo === 'maestro' && (
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Maestro</InputLabel>
                <Select
                  value={selectedMaestro}
                  label="Maestro"
                  onChange={handleChangeMaestro}
                >
                  {maestros.map((maestro) => (
                    <MenuItem key={maestro.id} value={maestro.id?.toString()}>
                      {maestro.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}
        </Grid>
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleOpenDialog}
          >
            Agregar Horario
          </Button>
        </Box>
        
        {loading && !openDialog ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : getHorariosFiltrados().length === 0 ? (
          <Typography align="center" sx={{ my: 4 }}>
            No hay horarios registrados
          </Typography>
        ) : (
          <TableContainer component={Paper} sx={{ mb: 4 }}>
            <Table>
              <TableHead>
                <TableRow>
                  {filtroTipo === 'carrera' ? (
                    <>
                      <TableCell>Grupo</TableCell>
                      <TableCell>Maestro</TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell>Maestro</TableCell>
                      <TableCell>Grupo</TableCell>
                    </>
                  )}
                  <TableCell>Materia</TableCell>
                  <TableCell>Días</TableCell>
                  <TableCell>Hora</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getHorariosFiltrados().map((horario) => (
                  <TableRow key={horario.id}>
                    {filtroTipo === 'carrera' ? (
                      <>
                        <TableCell>{getGrupoNombre(horario.grupo_id)}</TableCell>
                        <TableCell>{getMaestroNombre(horario.maestro_id)}</TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>{getMaestroNombre(horario.maestro_id)}</TableCell>
                        <TableCell>{getGrupoNombre(horario.grupo_id)}</TableCell>
                      </>
                    )}
                    <TableCell>{getMateriaNombre(horario.materia_id)}</TableCell>
                    <TableCell>{horario.dia}</TableCell>
                    <TableCell>{horario.hora}</TableCell>
                    <TableCell align="center">
                      <Button 
                        color="secondary" 
                        size="small"
                        onClick={() => handleEditHorario(horario)}
                        sx={{ mr: 1 }}
                      >
                        Editar
                      </Button>
                      <Button 
                        color="error" 
                        size="small"
                        onClick={() => handleDeleteHorario(horario.id!)}
                      >
                        Eliminar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
      
      {/* Diálogo para agregar/editar horario */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {horarioSeleccionado ? 'Editar Horario' : 'Agregar Horario'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Maestro</InputLabel>
                <Select
                  value={selectedMaestro}
                  label="Maestro"
                  onChange={handleChangeMaestro}
                >
                  {maestros.map((maestro) => (
                    <MenuItem key={maestro.id} value={maestro.id?.toString()}>
                      {maestro.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Grupo</InputLabel>
                <Select
                  value={selectedGrupo}
                  label="Grupo"
                  onChange={handleChangeGrupo}
                >
                  {grupos.map((grupo) => (
                    <MenuItem key={grupo.id} value={grupo.id?.toString()}>
                      {grupo.name} - {grupo.classroom} ({grupo.building})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Materia</InputLabel>
                <Select
                  value={selectedMateria}
                  label="Materia"
                  onChange={handleChangeMateria}
                >
                  {materias.map((materia) => (
                    <MenuItem key={materia.id} value={materia.id?.toString()}>
                      {materia.name} (Semestre {materia.semestre})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Días</InputLabel>
                <Select
                  multiple
                  value={selectedDias}
                  label="Días"
                  onChange={handleChangeDias}
                  renderValue={(selected) => (selected as string[]).join(', ')}
                >
                  {DIAS_SEMANA.map((dia) => (
                    <MenuItem key={dia} value={dia}>
                      {dia}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Hora</InputLabel>
                <Select
                  value={selectedHora}
                  label="Hora"
                  onChange={handleChangeHora}
                >
                  {HORAS_CLASE.map((hora) => (
                    <MenuItem key={hora} value={hora}>
                      {hora}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog} color="inherit">
            Cancelar
          </Button>
          <Button 
            onClick={horarioSeleccionado ? handleUpdateHorario : handleAddHorario}
            variant="contained" 
            color="primary"
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={24} />
            ) : horarioSeleccionado ? (
              'Actualizar'
            ) : (
              'Agregar'
            )}
          </Button>
        </DialogActions>
      </Dialog>
      
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