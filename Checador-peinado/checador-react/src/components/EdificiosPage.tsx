import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
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
import { edificiosService, Edificio } from '../services/supabaseService';
import EditIcon from '@mui/icons-material/Edit';

export default function EdificiosPage() {
  const [edificios, setEdificios] = useState<Edificio[]>([]);
  const [newFacultad, setNewFacultad] = useState('');
  const [newNombre, setNewNombre] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingEdificio, setEditingEdificio] = useState<Edificio | null>(null);
  const [editFacultad, setEditFacultad] = useState('');
  const [editNombre, setEditNombre] = useState('');

  useEffect(() => {
    fetchEdificios();
  }, []);

  const fetchEdificios = async () => {
    setLoading(true);
    try {
      const data = await edificiosService.getAll();
      setEdificios(data);
    } catch (err: any) {
      setError('Error al cargar edificios: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEdificio = async () => {
    if (!newFacultad) {
      setError('Por favor ingrese la facultad');
      return;
    }

    setLoading(true);
    try {
      const nuevoEdificio: Edificio = {
        facultad: newFacultad,
        nombre: newNombre || undefined
      };

      await edificiosService.create(nuevoEdificio);
      await fetchEdificios();
      setNewFacultad('');
      setNewNombre('');
      setSuccess('Edificio creado exitosamente');
    } catch (err: any) {
      setError('Error al crear edificio: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (edificio: Edificio) => {
    setEditingEdificio(edificio);
    setEditFacultad(edificio.facultad);
    setEditNombre(edificio.nombre || '');
  };

  const handleCloseEdit = () => {
    setEditingEdificio(null);
    setEditFacultad('');
    setEditNombre('');
  };

  const handleSaveEdit = async () => {
    if (!editingEdificio || !editFacultad) {
      setError('Por favor complete los campos requeridos');
      return;
    }

    setLoading(true);
    try {
      const edificioActualizado: Edificio = {
        ...editingEdificio,
        facultad: editFacultad,
        nombre: editNombre || undefined
      };

      await edificiosService.update(editingEdificio.id!, edificioActualizado);
      await fetchEdificios();
      setSuccess('Edificio actualizado exitosamente');
      handleCloseEdit();
    } catch (err: any) {
      setError('Error al actualizar edificio: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseAlert = () => {
    setError(null);
    setSuccess(null);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Gestión de Edificios
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Edificios Existentes
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Facultad</TableCell>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Editar</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {edificios.map((edificio) => (
                    <TableRow key={edificio.id}>
                      <TableCell>{edificio.facultad}</TableCell>
                      <TableCell>{edificio.nombre || '-'}</TableCell>
                      <TableCell>
                        <IconButton 
                          onClick={() => handleEditClick(edificio)}
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
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Agregar Nuevo Edificio
            </Typography>
            
            <TextField
              fullWidth
              label="Facultad"
              value={newFacultad}
              onChange={(e) => setNewFacultad(e.target.value)}
              margin="normal"
              required
            />

            <TextField
              fullWidth
              label="Nombre"
              value={newNombre}
              onChange={(e) => setNewNombre(e.target.value)}
              margin="normal"
            />

            <Button
              fullWidth
              variant="contained"
              onClick={handleAddEdificio}
              disabled={loading}
              sx={{ mt: 2 }}
            >
              Agregar Edificio
            </Button>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={!!editingEdificio} onClose={handleCloseEdit} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Edificio</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Facultad"
            value={editFacultad}
            onChange={(e) => setEditFacultad(e.target.value)}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label="Nombre"
            value={editNombre}
            onChange={(e) => setEditNombre(e.target.value)}
            margin="normal"
          />
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