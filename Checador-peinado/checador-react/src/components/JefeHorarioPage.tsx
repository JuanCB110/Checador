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

// Constantes para horas y días
const HORAS = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', 
               '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];
const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

interface HorarioData {
  dia: string;
  hora: string;
  materia: string;
  maestro: string;
  asistencia: 'pendiente' | 'presente' | 'ausente';
  horarioId?: number;
}

const formatHora = (hora: string) => {
  return `${hora} - ${parseInt(hora.split(':')[0]) + 1}:00`;
};

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

const DIAS_MAP: { [key: number]: string } = {
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes'
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  // Ajustamos la zona horaria sumando las horas de diferencia
  date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
  return date;
};

export default function JefeHorarioPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [horarioData, setHorarioData] = useState<Map<string, HorarioData>>(new Map());
  const [grupoInfo, setGrupoInfo] = useState<{ name: string; classroom: string; building: string } | null>(null);
  const [diaActual, setDiaActual] = useState<string>('');
  const [fecha, setFecha] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const handleCloseAlert = () => {
    setError(null);
    setSuccess(null);
  };

  useEffect(() => {
    const selectedDateObj = formatDate(selectedDate);
    const diaSemana = selectedDateObj.getDay();
    
    setDiaActual(DIAS_MAP[diaSemana]);
    setFecha(selectedDate);
    cargarHorarios(DIAS_MAP[diaSemana], selectedDate);
  }, [selectedDate]);

  const cargarHorarios = async (dia: string, fechaActual: string) => {
    try {
      setLoading(true);
      const userString = localStorage.getItem('user');
      if (!userString) {
        throw new Error('No se encontró información del usuario');
      }
      const user = JSON.parse(userString);

      // Modificar la consulta para obtener el grupo
      const { data: grupos, error: grupoError } = await supabase
        .from('grupo')
        .select('*')
        .eq('jefe_nocuenta', user.numero_cuenta);

      if (grupoError) throw grupoError;
      if (!grupos || grupos.length === 0) {
        throw new Error('No se encontró ningún grupo asignado al jefe');
      }

      const grupo = grupos[0]; // Tomamos el primer grupo encontrado
      setGrupoInfo({
        name: grupo.name,
        classroom: grupo.classroom || '',
        building: grupo.building || ''
      });

      // Obtener los horarios del grupo para el día actual
      const { data: horarios, error: horariosError } = await supabase
        .from('horario-maestro')
        .select(`
          id,
          hora,
          dia,
          asistencia,
          maestro:maestro_id(name),
          materia:materia_id(name)
        `)
        .eq('grupo_id', grupo.id)
        .eq('dia', dia);

      if (horariosError) throw horariosError;

      // Obtener las asistencias registradas para hoy
      const { data: asistencias, error: asistenciasError } = await supabase
        .from('asistencia_jefe')
        .select('*')
        .eq('fecha', fechaActual)
        .in('horario_id', horarios?.map(h => h.id) || []);

      if (asistenciasError) throw asistenciasError;

      // Crear el mapa de horarios
      const horarioMap = new Map<string, HorarioData>();
      
      // Inicializar todas las celdas del día actual
      HORAS.forEach(hora => {
        const key = `${dia}-${hora}`;
        horarioMap.set(key, {
          dia,
          hora,
          materia: '',
          maestro: '',
          asistencia: 'pendiente'
        });
      });

      // Llenar con los horarios existentes y sus asistencias
      horarios?.forEach(horario => {
        const asistenciaHoy = asistencias?.find(a => a.horario_id === horario.id);
        const key = `${horario.dia}-${horario.hora}`;
        horarioMap.set(key, {
          dia: horario.dia,
          hora: horario.hora,
          materia: horario.materia.name,
          maestro: horario.maestro.name,
          asistencia: asistenciaHoy ? asistenciaHoy.asistencia : 'pendiente',
          horarioId: horario.id
        });
      });

      setHorarioData(horarioMap);
      setSuccess('Horario cargado correctamente');
    } catch (error: any) {
      console.error('Error al cargar horarios:', error);
      setError(error.message);
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
      
      // Primero buscamos si ya existe un registro para esta fecha y horario
      const { data: existingRecord, error: searchError } = await supabase
        .from('asistencia_jefe')
        .select('*')
        .eq('horario_id', horario.horarioId)
        .eq('fecha', selectedDate)
        .single();

      if (searchError && searchError.code !== 'PGRST116') { // PGRST116 es el código cuando no se encuentra registro
        throw searchError;
      }

      let updateError;
      if (existingRecord) {
        // Si existe, actualizamos
        const { error } = await supabase
          .from('asistencia_jefe')
          .update({ asistencia: nuevoEstado })
          .eq('id', existingRecord.id);
        updateError = error;
      } else {
        // Si no existe, insertamos
        const { error } = await supabase
          .from('asistencia_jefe')
          .insert({
            horario_id: horario.horarioId,
            fecha: selectedDate,
            asistencia: nuevoEstado
          });
        updateError = error;
      }

      if (updateError) throw updateError;

      // Actualizar el estado local
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
    const newDate = event.target.value;
    setSelectedDate(newDate);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom align="center">
        Registro de Asistencia
      </Typography>

      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center', gap: 2, alignItems: 'center' }}>
        <TextField
          type="date"
          label="Seleccionar fecha"
          value={selectedDate}
          onChange={handleDateChange}
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
          onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
        >
          HOY
        </Button>
      </Box>

      {grupoInfo && (
        <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white', mb: 3, borderRadius: 1 }}>
          <Typography variant="h6" align="center">
            {diaActual} - {selectedDate}
          </Typography>
          <Typography variant="subtitle1" align="center">
            Grupo: {grupoInfo.name} - Aula: {grupoInfo.classroom} - Edificio: {grupoInfo.building}
          </Typography>
        </Box>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.light' }}>
                <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Hora</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'white' }} align="center">
                  {diaActual}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {getHorasNecesarias(horarioData).map((hora) => {
                const key = `${diaActual}-${hora}`;
                const celda = horarioData.get(key);
                
                return (
                  <TableRow key={hora} hover>
                    <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                      {formatHora(hora)}
                    </TableCell>
                    <TableCell 
                      align="center"
                      sx={{ 
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
                          <Typography 
                            variant="caption" 
                            display="block" 
                            sx={{ 
                              color: celda.asistencia === 'presente' ? 'success.main' : 
                                    celda.asistencia === 'ausente' ? 'error.main' : 
                                    'warning.main',
                              fontWeight: 'bold'
                            }}
                          >
                            Estado: {celda.asistencia.charAt(0).toUpperCase() + celda.asistencia.slice(1)}
                          </Typography>
                          <Box sx={{ mt: 1, display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                            <Button
                              size="small"
                              variant={celda.asistencia === 'presente' ? "contained" : "outlined"}
                              onClick={() => handleToggleAsistencia(diaActual, hora, 'presente')}
                              color="success"
                              sx={{ 
                                minWidth: '90px',
                                bgcolor: celda.asistencia === 'presente' ? 'success.main' : 'transparent',
                                '&:hover': {
                                  bgcolor: celda.asistencia === 'presente' ? 'success.dark' : 'success.light',
                                }
                              }}
                            >
                              Presente
                            </Button>
                            <Button
                              size="small"
                              variant={celda.asistencia === 'ausente' ? "contained" : "outlined"}
                              onClick={() => handleToggleAsistencia(diaActual, hora, 'ausente')}
                              color="error"
                              sx={{ 
                                minWidth: '90px',
                                bgcolor: celda.asistencia === 'ausente' ? 'error.main' : 'transparent',
                                '&:hover': {
                                  bgcolor: celda.asistencia === 'ausente' ? 'error.dark' : 'error.light',
                                }
                              }}
                            >
                              Ausente
                            </Button>
                          </Box>
                        </>
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