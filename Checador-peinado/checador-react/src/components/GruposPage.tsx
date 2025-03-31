import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  SelectChangeEvent,
  Snackbar,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import { gruposService, usuariosService, edificiosService, carrerasService, Grupo, Usuario, Edificio, Carrera } from '../services/supabaseService';
import EditIcon from '@mui/icons-material/Edit';

export default function GruposPage() {
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [jefes, setJefes] = useState<Usuario[]>([]);
  const [aulas, setAulas] = useState<string[]>([]);
  const [edificios, setEdificios] = useState<Edificio[]>([]);
  const [carreras, setCarreras] = useState<Carrera[]>([]);

  const [selectedGroup, setSelectedGroup] = useState('');
  const [newGroup, setNewGroup] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [newRoom, setNewRoom] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [newBuilding, setNewBuilding] = useState('');
  const [selectedJefe, setSelectedJefe] = useState('');
  const [selectedCarrera, setSelectedCarrera] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [editingGroup, setEditingGroup] = useState<Grupo | null>(null);
  const [editName, setEditName] = useState('');
  const [editRoom, setEditRoom] = useState('');
  const [editBuilding, setEditBuilding] = useState('');
  const [editJefe, setEditJefe] = useState('');
  const [editCarrera, setEditCarrera] = useState('');

  const [filtroCarrera, setFiltroCarrera] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [gruposData, aulasData, edificiosData, usuariosData, carrerasData] = await Promise.all([
          gruposService.getAll(),
          gruposService.getClassrooms(),
          edificiosService.getAll(),
          usuariosService.getAll(),
          carrerasService.getAll()
        ]);

        setGrupos(gruposData);
        setAulas(aulasData);
        setEdificios(edificiosData);
        setCarreras(carrerasData);
        
        console.log('Todos los usuarios:', usuariosData);
        const jefesDeGrupo = usuariosData.filter(user => user.role === 'Jefe_de_Grupo');
        console.log('Jefes de grupo filtrados:', jefesDeGrupo);
        
        setJefes(jefesDeGrupo);
      } catch (err: any) {
        console.error('Error completo:', err);
        setError('Error al cargar datos: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    console.log('Estado actual de jefes:', jefes);
  }, [jefes]);

  const handleAddGroup = async () => {
    if (!newGroup || !selectedCarrera) {
      setError('Por favor ingrese un nombre de grupo y seleccione una carrera');
      return;
    }

    setLoading(true);
    try {
      // Verificar si el jefe ya está asignado a otro grupo
      if (selectedJefe) {
        const { data: gruposExistentes, error: jefeError } = await supabase
          .from('grupo')
          .select('id')
          .eq('jefe_nocuenta', selectedJefe);

        if (jefeError) {
          throw new Error('Error al verificar jefe de grupo: ' + jefeError.message);
        }

        if (gruposExistentes && gruposExistentes.length > 0) {
          setError('El jefe de grupo seleccionado ya está asignado a otro grupo');
          setLoading(false);
          return;
        }
      }

      const edificioSeleccionado = edificios.find(e => e.facultad === selectedBuilding);
      const carreraSeleccionada = carreras.find(c => c.id.toString() === selectedCarrera);
      
      const nuevoGrupo: Grupo = {
        name: newGroup,
        classroom: selectedRoom || undefined,
        building: edificioSeleccionado?.nombre || undefined,
        jefe_nocuenta: selectedJefe || undefined,
        carrera_id: carreraSeleccionada?.id
      };

      await gruposService.create(nuevoGrupo);
      const gruposActualizados = await gruposService.getAll();
      setGrupos(gruposActualizados);
      setNewGroup('');
      setSelectedRoom('');
      setSelectedBuilding('');
      setSelectedJefe('');
      setSelectedCarrera('');
      setSuccess('Grupo creado exitosamente');
    } catch (err: any) {
      setError('Error al crear grupo: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (grupo: Grupo) => {
    console.log('Abriendo edición para grupo:', grupo);
    setEditingGroup(grupo);
    setEditName(grupo.name || '');
    setEditRoom(grupo.classroom || '');
    setEditBuilding(grupo.building || '');
    setEditJefe(grupo.jefe_nocuenta || '');
    setEditCarrera(grupo.carrera_id?.toString() || '');
  };

  const handleCloseEdit = () => {
    setEditingGroup(null);
    setEditName('');
    setEditRoom('');
    setEditBuilding('');
    setEditJefe('');
    setEditCarrera('');
    setError('');
    setSuccess('');
  };

  const handleSaveEdit = async () => {
    if (!editingGroup || !editName || !editCarrera) {
      setError('Por favor complete los campos requeridos');
      return;
    }

    setLoading(true);
    try {
      const grupoActualizado: Grupo = {
        id: editingGroup.id,
        name: editName,
        classroom: editRoom || null,
        building: editBuilding || null,
        jefe_nocuenta: editJefe || null,
        carrera_id: parseInt(editCarrera)
      };

      console.log('Grupo a actualizar:', grupoActualizado);

      const grupoResponse = await gruposService.update(grupoActualizado.id, grupoActualizado);
      console.log('Respuesta del servidor:', grupoResponse);
      
      const gruposActualizados = await gruposService.getAll();
      setGrupos(gruposActualizados);
      
      setSuccess('Grupo actualizado exitosamente');
      handleCloseEdit();
    } catch (err: any) {
      console.error('Error al actualizar:', err);
      setError('Error al actualizar grupo: ' + (err.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const handleCloseAlert = () => {
    setError(null);
    setSuccess(null);
  };

  const getCarreraNombre = (carreraId: number | undefined) => {
    if (!carreraId) return '-';
    const carrera = carreras.find(c => c.id === carreraId);
    return carrera ? carrera.nombre : '-';
  };

  const handleChangeFiltroCarrera = (event: SelectChangeEvent) => {
    setFiltroCarrera(event.target.value);
  };

  const getGruposFiltrados = () => {
    if (!filtroCarrera) return grupos;
    
    const carreraSeleccionada = carreras.find(c => c.nombre === filtroCarrera);
    if (!carreraSeleccionada) return grupos;
    
    return grupos.filter(grupo => grupo.carrera_id === carreraSeleccionada.id);
  };

  const EdificioSelect = () => (
    <FormControl fullWidth margin="normal">
      <InputLabel>Edificio</InputLabel>
      <Select
        value={editBuilding || ''}
        onChange={(e) => {
          console.log('Nuevo edificio seleccionado:', e.target.value);
          setEditBuilding(e.target.value);
        }}
        label="Edificio"
      >
        <MenuItem value="">
          <em>Ninguno</em>
        </MenuItem>
        {edificios.map((edificio) => (
          <MenuItem 
            key={edificio.id} 
            value={edificio.nombre}
          >
            {edificio.facultad} - {edificio.nombre}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Gestión de Grupos
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Grupos Existentes
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Carrera</TableCell>
                    <TableCell>Aula</TableCell>
                    <TableCell>Edificio</TableCell>
                    <TableCell>Jefe de Grupo</TableCell>
                    <TableCell>Editar</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {getGruposFiltrados().map((grupo) => (
                    <TableRow key={grupo.id}>
                      <TableCell>{grupo.name}</TableCell>
                      <TableCell>{getCarreraNombre(grupo.carrera_id)}</TableCell>
                      <TableCell>{grupo.classroom || '-'}</TableCell>
                      <TableCell>{grupo.building || '-'}</TableCell>
                      <TableCell>{grupo.jefe_nocuenta || '-'}</TableCell>
                      <TableCell>
                        <IconButton 
                          onClick={() => handleEditClick(grupo)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Filtrar por Carrera</InputLabel>
            <Select
              value={filtroCarrera}
              label="Filtrar por Carrera"
              onChange={handleChangeFiltroCarrera}
            >
              <MenuItem value="">Todas las carreras</MenuItem>
              {carreras.map((carrera) => (
                <MenuItem key={carrera.id} value={carrera.nombre}>
                  {carrera.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Agregar Nuevo Grupo
            </Typography>
            
            <TextField
              fullWidth
              label="Nombre del Grupo"
              value={newGroup}
              onChange={(e) => setNewGroup(e.target.value)}
              margin="normal"
            />

            <TextField
              fullWidth
              label="Aula"
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              margin="normal"
              placeholder="Ejemplo: 301"
            />

            <FormControl fullWidth margin="normal">
              <InputLabel>Edificio</InputLabel>
              <Select
                value={selectedBuilding}
                onChange={(e) => setSelectedBuilding(e.target.value)}
                label="Edificio"
              >
                <MenuItem value="">
                  <em>Ninguno</em>
                </MenuItem>
                {edificios.map((edificio) => (
                  <MenuItem key={edificio.id} value={edificio.facultad}>
                    {edificio.facultad} {edificio.nombre ? `- ${edificio.nombre}` : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel>Jefe de Grupo</InputLabel>
              <Select
                value={selectedJefe}
                onChange={(e) => setSelectedJefe(e.target.value)}
                label="Jefe de Grupo"
              >
                <MenuItem value="">
                  <em>Ninguno</em>
                </MenuItem>
                {jefes.map((jefe) => (
                  <MenuItem key={jefe.id} value={jefe.numero_cuenta || ''}>
                    {jefe.name} - {jefe.numero_cuenta}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel>Carrera</InputLabel>
              <Select
                value={selectedCarrera}
                onChange={(e) => setSelectedCarrera(e.target.value)}
                label="Carrera"
                required
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

            <Button
              fullWidth
              variant="contained"
              onClick={handleAddGroup}
              disabled={loading}
              sx={{ mt: 2 }}
            >
              Agregar Grupo
            </Button>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={!!editingGroup} onClose={handleCloseEdit} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Grupo</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nombre del Grupo"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            margin="normal"
          />

          <TextField
            fullWidth
            label="Aula"
            value={editRoom}
            onChange={(e) => setEditRoom(e.target.value)}
            margin="normal"
            placeholder="Ejemplo: 301"
          />

          <EdificioSelect />

          <FormControl fullWidth margin="normal">
            <InputLabel>Jefe de Grupo</InputLabel>
            <Select
              value={editJefe}
              onChange={(e) => setEditJefe(e.target.value)}
              label="Jefe de Grupo"
            >
              <MenuItem value="">
                <em>Ninguno</em>
              </MenuItem>
              {jefes.map((jefe) => (
                <MenuItem key={jefe.id} value={jefe.numero_cuenta}>
                  {jefe.name} - {jefe.numero_cuenta}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel>Carrera</InputLabel>
            <Select
              value={editCarrera}
              onChange={(e) => setEditCarrera(e.target.value)}
              label="Carrera"
              required
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
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEdit}>Cancelar</Button>
          <Button 
            onClick={handleSaveEdit}
            variant="contained"
            disabled={loading}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseAlert}>
        <Alert onClose={handleCloseAlert} severity="error">
          {error}
        </Alert>
      </Snackbar>

      <Snackbar open={!!success} autoHideDuration={6000} onClose={handleCloseAlert}>
        <Alert onClose={handleCloseAlert} severity="success">
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
}