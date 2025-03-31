import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormControl,
  Select,
  MenuItem,
  Button,
  Paper,
  SelectChangeEvent,
  Grid,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import { carrerasService, materiasService, Carrera, Materia } from '../services/supabaseService';
import { supabase } from '../lib/supabase';

export default function TemarioPage() {
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [selectedCarrera, setSelectedCarrera] = useState<string>('');
  const [semestresDisponibles, setSemestresDisponibles] = useState<string[]>([]);
  const [semester, setSemester] = useState<string>('1');
  const [subject, setSubject] = useState<string>('');
  const [subjects, setSubjects] = useState<Materia[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Cargar carreras al montar el componente
  useEffect(() => {
    const fetchCarreras = async () => {
      setLoading(true);
      try {
        const carrerasData = await carrerasService.getAll();
        setCarreras(carrerasData);
        
        if (carrerasData.length > 0) {
          setSelectedCarrera(carrerasData[0].id?.toString() || '');
          setSemestresDisponibles(Array.from({ length: carrerasData[0].semestres }, (_, i) => (i + 1).toString()));
        }
      } catch (err: any) {
        setError(err.message || 'Error al cargar carreras');
      } finally {
        setLoading(false);
      }
    };

    fetchCarreras();
  }, []);

  // Manejar cambio de carrera
  const handleCarreraChange = async (event: SelectChangeEvent) => {
    const carreraId = event.target.value;
    setSelectedCarrera(carreraId);
    
    // Obtener la carrera seleccionada para cargar los semestres
    const carreraSeleccionada = await carrerasService.getById(Number(carreraId));
    if (carreraSeleccionada) {
      setSemestresDisponibles(Array.from({ length: carreraSeleccionada.semestres }, (_, i) => (i + 1).toString()));
    }
  };

  // Manejar cambio de semestre
  const handleSemesterChange = async (event: SelectChangeEvent) => {
    const semestre = event.target.value;
    setSemester(semestre);
    
    // Cargar materias según la carrera y semestre seleccionados
    if (selectedCarrera) {
      const materiasData = await materiasService.getBySemestreAndCarrera(Number(semestre), Number(selectedCarrera));
      setSubjects(materiasData);
      setSubject(materiasData.length > 0 ? materiasData[0].id?.toString() || '' : '');
    }
  };

  // Manejar cambio de materia
  const handleSubjectChange = (event: SelectChangeEvent) => {
    setSubject(event.target.value as string);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
    }
  };

  const handleCloseAlert = () => {
    setError(null);
    setSuccess(null);
  };

  const handleFileUpload = async () => {
    if (!file || !subject) return;

    try {
      setLoading(true);
      
      // Generar un nombre único para el archivo
      const fileExt = file.name.split('.').pop();
      const fileName = `temario_${subject}_${Date.now()}.${fileExt}`;

      console.log('Intentando subir archivo:', {
        fileName,
        fileSize: file.size,
        fileType: file.type
      });

      // Subir el archivo al bucket 'temarios'
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('temarios')
        .upload(fileName, file, {
          cacheControl: '3600',
          contentType: file.type,
          upsert: true // Permitir sobrescribir si existe
        });

      if (uploadError) {
        console.error('Error al subir archivo:', uploadError);
        throw new Error(`Error al subir archivo: ${uploadError.message}`);
      }

      console.log('Archivo subido exitosamente:', uploadData);

      // Obtener la URL pública del archivo
      const { data: { publicUrl } } = supabase.storage
        .from('temarios')
        .getPublicUrl(fileName);

      console.log('URL pública generada:', publicUrl);

      // Actualizar la URL del temario en la tabla materias
      const { error: updateError } = await supabase
        .from('materias')
        .update({ temario_url: publicUrl })
        .eq('id', subject);

      if (updateError) {
        console.error('Error al actualizar materia:', updateError);
        // Si falla la actualización de la BD, eliminar el archivo subido
        await supabase.storage
          .from('temarios')
          .remove([fileName]);
        throw new Error(`Error al actualizar materia: ${updateError.message}`);
      }

      setSuccess('Temario subido exitosamente');
      setFile(null);
      
      // Limpiar el input de archivo
      const fileInput = document.getElementById('contained-button-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
    } catch (error: any) {
      console.error('Error completo:', error);
      setError(error.message || 'Error al subir el temario');
    } finally {
      setLoading(false);
    }
  };

  const handleViewTemario = async () => {
    try {
      // Obtener la URL del temario de la materia seleccionada
      const { data, error } = await supabase
        .from('materias')
        .select('temario_url')
        .eq('id', subject)
        .single();

      if (error) throw error;

      if (!data?.temario_url) {
        setError('Esta materia no tiene temario');
        return;
      }

      // Abrir el temario en una nueva pestaña
      window.open(data.temario_url, '_blank');
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleDeleteTemario = async () => {
    try {
      setLoading(true);

      // Obtener la URL actual del temario
      const { data, error: fetchError } = await supabase
        .from('materias')
        .select('temario_url')
        .eq('id', subject)
        .single();

      if (fetchError) throw fetchError;

      if (!data?.temario_url) {
        setError('Esta materia no tiene temario');
        return;
      }

      // Extraer el nombre del archivo de la URL
      const fileName = data.temario_url.split('/').pop();

      // Eliminar el archivo del bucket
      const { error: deleteStorageError } = await supabase.storage
        .from('temarios')
        .remove([fileName]);

      if (deleteStorageError) throw deleteStorageError;

      // Actualizar la referencia en la base de datos
      const { error: updateError } = await supabase
        .from('materias')
        .update({ temario_url: null })
        .eq('id', subject);

      if (updateError) throw updateError;

      setSuccess('Temario eliminado exitosamente');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 4, height: '100%' }}>
      <Paper elevation={2} sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
        <Typography variant="h5" gutterBottom align="center" sx={{ mb: 4 }}>
          Seleccione la carrera
        </Typography>

        <FormControl fullWidth sx={{ mb: 4 }}>
          <Select
            value={selectedCarrera}
            onChange={handleCarreraChange}
          >
            {carreras.map((carrera) => (
              <MenuItem key={carrera.id} value={carrera.id?.toString()}>
                {carrera.nombre} ({carrera.semestres} semestres)
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Typography variant="h5" gutterBottom align="center" sx={{ mb: 4 }}>
          Seleccione el semestre
        </Typography>

        <FormControl fullWidth sx={{ mb: 4 }}>
          <Select
            value={semester}
            onChange={handleSemesterChange}
          >
            {semestresDisponibles.map((semestre) => (
              <MenuItem key={semestre} value={semestre}>
                {semestre}° semestre
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Typography variant="h5" gutterBottom align="center" sx={{ mb: 4 }}>
          Seleccione la materia
        </Typography>

        <FormControl fullWidth sx={{ mb: 4 }}>
          <Select
            value={subject}
            onChange={handleSubjectChange}
          >
            {subjects.map((materia) => (
              <MenuItem key={materia.id} value={materia.id?.toString()}>
                {materia.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box sx={{ mb: 3 }}>
          <input
            accept="application/pdf"
            style={{ display: 'none' }}
            id="contained-button-file"
            type="file"
            onChange={handleFileChange}
          />
          <label htmlFor="contained-button-file">
            <Box 
              component="div"
              sx={{ 
                border: '1px solid #ccc', 
                p: 2, 
                borderRadius: 1, 
                textAlign: 'center',
                cursor: 'pointer'
              }}
            >
              {file ? file.name : "Seleccionar archivo"}
            </Box>
          </label>
        </Box>

        <Grid container spacing={2} justifyContent="flex-end">
          <Grid item>
            <Button 
              variant="outlined" 
              color="error"
              onClick={handleDeleteTemario}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Eliminar'}
            </Button>
          </Grid>
          <Grid item>
            <Button 
              variant="contained" 
              onClick={handleViewTemario}
              disabled={loading}
            >
              Ver
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              onClick={handleFileUpload}
              disabled={!file || loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Subir'}
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