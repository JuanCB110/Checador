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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  CircularProgress
} from '@mui/material';
import { carrerasService, Carrera } from '../services/supabaseService';

export default function CarrerasPage() {
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [selectedCarrera, setSelectedCarrera] = useState<string>('');
  const [newCarrera, setNewCarrera] = useState('');
  const [numSemestres, setNumSemestres] = useState<number>(0);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const carrerasData = await carrerasService.getAll();
        setCarreras(carrerasData);
        
        if (carrerasData.length > 0) {
          setSelectedCarrera(carrerasData[0].id?.toString() || '');
          setNumSemestres(carrerasData[0].semestres || 0);
        }
      } catch (err: any) {
        setError(err.message || 'Error al cargar datos');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCarreraChange = (event: SelectChangeEvent) => {
    setSelectedCarrera(event.target.value);
    
    // Actualizar el número de semestres al seleccionar una carrera
    const carreraSeleccionada = carreras.find(c => c.id?.toString() === event.target.value);
    if (carreraSeleccionada) {
      setNumSemestres(carreraSeleccionada.semestres || 0);
    }
  };

  const handleAddCarrera = async () => {
    if (!newCarrera) {
      setError('Debe ingresar un nombre para la carrera');
      return;
    }

    if (numSemestres <= 0) {
      setError('El número de semestres debe ser mayor a 0');
      return;
    }

    setLoading(true);
    try {
      await carrerasService.create({
        nombre: newCarrera,
        semestres: numSemestres
      });
      
      setSuccess('Carrera agregada correctamente');
      setNewCarrera('');
      setNumSemestres(0);
      
      // Recargar carreras
      const carrerasData = await carrerasService.getAll();
      setCarreras(carrerasData);
    } catch (err: any) {
      setError(err.message || 'Error al agregar carrera');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCarrera = async () => {
    if (!selectedCarrera) {
      setError('Debe seleccionar una carrera');
      return;
    }

    if (!newCarrera) {
      setError('Debe ingresar un nombre para la carrera');
      return;
    }

    if (numSemestres <= 0) {
      setError('El número de semestres debe ser mayor a 0');
      return;
    }

    setLoading(true);
    try {
      await carrerasService.update(Number(selectedCarrera), {
        nombre: newCarrera,
        semestres: numSemestres
      });
      
      setSuccess('Carrera actualizada correctamente');
      setNewCarrera('');
      setNumSemestres(0);
      
      // Recargar carreras
      const carrerasData = await carrerasService.getAll();
      setCarreras(carrerasData);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar carrera');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCarrera = async () => {
    if (!selectedCarrera) {
      setError('Debe seleccionar una carrera');
      return;
    }

    setLoading(true);
    try {
      await carrerasService.delete(Number(selectedCarrera));
      setSuccess('Carrera eliminada correctamente');
      
      // Recargar carreras
      const carrerasData = await carrerasService.getAll();
      setCarreras(carrerasData);
      
      if (carrerasData.length > 0) {
        setSelectedCarrera(carrerasData[0].id?.toString() || '');
        setNumSemestres(carrerasData[0].semestres || 0);
      } else {
        setSelectedCarrera('');
        setNumSemestres(0);
      }
      
      setNewCarrera('');
    } catch (err: any) {
      setError(err.message || 'Error al eliminar carrera');
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
      <Paper sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
        <Typography variant="h5" gutterBottom align="center" sx={{ mb: 3 }}>
          Gestión de Carreras
        </Typography>

        <FormControl fullWidth margin="normal">
          <InputLabel>Carrera</InputLabel>
          <Select
            value={selectedCarrera}
            label="Carrera"
            onChange={handleCarreraChange}
            disabled={carreras.length === 0}
          >
            {carreras.map((carrera) => (
              <MenuItem key={carrera.id} value={carrera.id?.toString()}>
                {carrera.nombre} ({carrera.semestres} semestres)
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          fullWidth
          margin="normal"
          label="Nombre de carrera"
          value={newCarrera}
          onChange={(e) => setNewCarrera(e.target.value)}
          placeholder="Ingrese el nombre de la carrera"
        />
        
        <TextField
          fullWidth
          margin="normal"
          label="Número de semestres"
          type="number"
          value={numSemestres || ''}
          onChange={(e) => setNumSemestres(Number(e.target.value))}
          placeholder="Ingrese el número de semestres"
          InputProps={{
            inputProps: { min: 1, max: 12 }
          }}
        />

        <Grid container spacing={2} sx={{ mt: 3 }}>
          <Grid item xs={4}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={handleAddCarrera}
              disabled={!newCarrera || numSemestres <= 0 || loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Agregar'}
            </Button>
          </Grid>
          <Grid item xs={4}>
            <Button
              variant="contained"
              color="secondary"
              fullWidth
              onClick={handleUpdateCarrera}
              disabled={!selectedCarrera || !newCarrera || numSemestres <= 0 || loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Actualizar'}
            </Button>
          </Grid>
          <Grid item xs={4}>
            <Button
              variant="outlined"
              color="error"
              fullWidth
              onClick={handleDeleteCarrera}
              disabled={!selectedCarrera || loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Eliminar'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

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