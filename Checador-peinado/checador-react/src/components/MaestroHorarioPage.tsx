import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Snackbar,
  Alert,
  Button,
  TextField
} from '@mui/material';
import { supabase } from '../lib/supabase';

interface HorarioData {
  dia: string;
  hora: string;
  materia: string;
  grupo: string;
  aula?: string;
  edificio?: string;
  asistencia: 'pendiente' | 'presente' | 'ausente';
  horarioId?: number;
}

const HORAS = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', 
               '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

const DIAS_COMPLETOS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DIAS_BD = {
  'Domingo': 'Domingo',
  'Lunes': 'Lunes',
  'Martes': 'Martes',
  'Miércoles': 'Miércoles',
  'Jueves': 'Jueves',
  'Viernes': 'Viernes',
  'Sábado': 'Sábado'
};

const formatHora = (hora: string) => {
  return `${hora} - ${parseInt(hora.split(':')[0]) + 1}:00`;
};

export default function MaestroHorarioPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [horarioData, setHorarioData] = useState<Map<string, HorarioData>>(new Map());
  const [diaActual, setDiaActual] = useState<string>('');
  const [horasNecesarias, setHorasNecesarias] = useState<string[]>([]);

  // Función para obtener la fecha actual en formato YYYY-MM-DD
  const getToday = () => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localDate = new Date(today.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  };

  // Inicializar selectedDate con la fecha actual local
  const [selectedDate, setSelectedDate] = useState<string>(getToday());

  useEffect(() => {
    const selectedDateObj = new Date(selectedDate + 'T00:00:00');
    const diaSemana = selectedDateObj.getDay();
    const diaActualNombre = DIAS_COMPLETOS[diaSemana];
    
    console.log('Fecha seleccionada:', {
      fecha: selectedDate,
      diaSemana,
      diaActualNombre,
      dateObj: selectedDateObj
    });

    setDiaActual(diaActualNombre);
    cargarHorarios(diaActualNombre, selectedDate);
  }, [selectedDate]);

  const cargarHorarios = async (dia: string, fecha: string) => {
    try {
      setLoading(true);
      const userString = localStorage.getItem('user');
      if (!userString) {
        throw new Error('No se encontró información del usuario');
      }
      const user = JSON.parse(userString);

      console.log('Consultando horarios para:', {
        dia,
        fecha,
        diaBD: DIAS_BD[dia as keyof typeof DIAS_BD]
      });

      // Obtener los horarios del maestro solo para el día seleccionado
      const { data: horarios, error: horariosError } = await supabase
        .from('horario-maestro')
        .select(`
          id,
          hora,
          dia,
          materia:materias!inner(name),
          grupo:grupo!inner(name, classroom, building)
        `)
        .eq('maestro_id', user.id)
        .eq('dia', DIAS_BD[dia as keyof typeof DIAS_BD]);

      console.log('Respuesta de la base de datos:', {
        horarios,
        error: horariosError
      });

      if (horariosError) throw horariosError;

      // Calcular el rango de horas necesario
      if (horarios && horarios.length > 0) {
        const horas = horarios.map(h => h.hora);
        const horaMin = Math.min(...horas.map(h => parseInt(h.split(':')[0])));
        const horaMax = Math.max(...horas.map(h => parseInt(h.split(':')[0])));
        
        const horasRango = HORAS.filter(h => {
          const hora = parseInt(h.split(':')[0]);
          return hora >= horaMin && hora <= horaMax;
        });
        
        setHorasNecesarias(horasRango);
      } else {
        setHorasNecesarias([]);
      }

      // Obtener las asistencias registradas para la fecha seleccionada
      const { data: asistencias, error: asistenciasError } = await supabase
        .from('asistencia_maestro')
        .select('*')
        .eq('fecha', fecha)
        .in('horario_id', horarios?.map(h => h.id) || []);

      console.log('Asistencias:', {
        fecha,
        error: asistenciasError,
        asistencias: asistencias
      });

      if (asistenciasError) throw asistenciasError;

      const horarioMap = new Map<string, HorarioData>();

      // Inicializar el mapa solo con las horas necesarias para el día actual
      horasNecesarias.forEach(hora => {
        const key = `${dia}-${hora}`;
        horarioMap.set(key, {
          dia,
          hora,
          materia: '',
          grupo: '',
          asistencia: 'pendiente'
        });
      });

      console.log('Horarios antes de procesar:', horarios);

      // Llenar el mapa con los horarios reales
      horarios?.forEach(horario => {
        const asistenciaHoy = asistencias?.find(a => a.horario_id === horario.id);
        const key = `${horario.dia}-${horario.hora}`;
        
        console.log('Procesando horario:', {
          horario,
          key,
          asistenciaHoy
        });

        horarioMap.set(key, {
          dia: horario.dia,
          hora: horario.hora,
          materia: horario.materia.name,
          grupo: horario.grupo.name,
          aula: horario.grupo.classroom,
          edificio: horario.grupo.building,
          asistencia: asistenciaHoy?.asistencia || 'pendiente',
          horarioId: horario.id
        });
      });

      console.log('HorarioMap final:', {
        mapSize: horarioMap.size,
        mapEntries: Array.from(horarioMap.entries())
      });

      setHorarioData(horarioMap);
    } catch (error: any) {
      console.error('Error completo:', error);
      setError('Error al cargar horario: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAsistencia = async (dia: string, hora: string, nuevoEstado: 'pendiente' | 'presente' | 'ausente') => {
    const key = `${dia}-${hora}`;
    const horario = horarioData.get(key);
    
    if (!horario?.horarioId) return;

    try {
      setLoading(true);
      
      // Buscar si ya existe un registro
      const { data: existingRecord, error: searchError } = await supabase
        .from('asistencia_maestro')
        .select('*')
        .eq('horario_id', horario.horarioId)
        .eq('fecha', selectedDate)
        .single();

      if (searchError && searchError.code !== 'PGRST116') {
        throw searchError;
      }

      let updateError;
      if (existingRecord) {
        const { error } = await supabase
          .from('asistencia_maestro')
          .update({ asistencia: nuevoEstado })
          .eq('id', existingRecord.id);
        updateError = error;
      } else {
        const { error } = await supabase
          .from('asistencia_maestro')
          .insert({
            horario_id: horario.horarioId,
            fecha: selectedDate,
            asistencia: nuevoEstado
          });
        updateError = error;
      }

      if (updateError) throw updateError;

      const newHorarioData = new Map(horarioData);
      newHorarioData.set(key, {
        ...horario,
        asistencia: nuevoEstado
      });
      
      setHorarioData(newHorarioData);
      setSuccess(`Asistencia actualizada a: ${nuevoEstado}`);
    } catch (error: any) {
      setError('Error al actualizar asistencia: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(event.target.value);
  };

  const handleCloseAlert = () => {
    setError(null);
    setSuccess(null);
  };

  // Actualizar el manejador del botón HOY
  const handleHoyClick = () => {
    setSelectedDate(getToday());
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom align="center">
        Mi Horario
      </Typography>

      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center', gap: 2, alignItems: 'center' }}>
        <TextField
          type="date"
          label="Seleccionar fecha"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          InputLabelProps={{
            shrink: true,
          }}
          inputProps={{
            max: new Date().toISOString().split('T')[0] // Restringe fechas futuras
          }}
          sx={{ width: 200 }}
        />
        <Button 
          variant="contained" 
          onClick={handleHoyClick}
        >
          HOY
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ maxWidth: '100%', overflow: 'auto' }}>
          <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 250px)' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>
                    Hora
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>
                    {diaActual}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {horasNecesarias.map((hora) => {
                  const key = `${diaActual}-${hora}`;
                  const horario = horarioData.get(key);
                  
                  return (
                    <TableRow key={hora} hover>
                      <TableCell sx={{ fontWeight: 'bold' }}>
                        {formatHora(hora)}
                      </TableCell>
                      <TableCell 
                        sx={{ 
                          bgcolor: horario?.materia ? 'rgba(200, 230, 255, 0.2)' : 'inherit',
                          border: '1px solid rgba(224, 224, 224, 1)'
                        }}
                      >
                        {horario?.materia ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {horario.materia}
                            </Typography>
                            <Typography variant="caption">
                              Grupo: {horario.grupo}
                            </Typography>
                            {horario.aula && (
                              <Typography variant="caption" color="text.secondary">
                                Aula: {horario.aula}
                                {horario.edificio && ` - Edificio: ${horario.edificio}`}
                              </Typography>
                            )}
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: horario.asistencia === 'presente' ? 'success.main' : 
                                      horario.asistencia === 'ausente' ? 'error.main' : 
                                      'warning.main',
                                fontWeight: 'bold'
                              }}
                            >
                              Estado: {horario.asistencia.charAt(0).toUpperCase() + horario.asistencia.slice(1)}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                              <Button
                                size="small"
                                variant={horario.asistencia === 'presente' ? "contained" : "outlined"}
                                onClick={() => handleToggleAsistencia(diaActual, hora, 'presente')}
                                color="success"
                              >
                                Presente
                              </Button>
                              <Button
                                size="small"
                                variant={horario.asistencia === 'ausente' ? "contained" : "outlined"}
                                onClick={() => handleToggleAsistencia(diaActual, hora, 'ausente')}
                                color="error"
                              >
                                Ausente
                              </Button>
                            </Box>
                          </Box>
                        ) : (
                          <Typography variant="caption" color="textSecondary">
                            Sin clase
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

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