import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Snackbar,
  styled,
  Button
} from '@mui/material';
import {
  usuariosService,
  materiasService,
  horariosService,
  asistenciasService,
  gruposService,
  Usuario,
  Materia,
  HorarioMaestro,
  Asistencia
} from '../services/supabaseService';
import { startOfWeek, endOfWeek, addWeeks, subWeeks, format, isSameDay, parseISO, addDays, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// Estilos personalizados
const StyledBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  '& .maestro-info': {
    backgroundColor: '#f5f5f5',
    padding: '15px',
    borderRadius: '10px',
    marginBottom: '20px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
  },
  '& .horario-header': {
    backgroundColor: '#007bff',
    color: 'white',
    textAlign: 'center',
    padding: '10px',
    borderRadius: '5px 5px 0 0',
    marginBottom: '0'
  },
  '& .estado': {
    padding: '5px 10px',
    borderRadius: '50px',
    fontWeight: 'bold',
    fontSize: '14px'
  },
  '& .asistio': {
    backgroundColor: '#d4edda',
    color: '#155724'
  },
  '& .falta': {
    backgroundColor: '#f8d7da',
    color: '#721c24'
  },
  '& .sin-registro': {
    backgroundColor: '#f8d7da',
    color: '#721c24'
  },
  '& .MuiPickersDay-root': {
    '&.Mui-selected': {
      backgroundColor: theme.palette.primary.main,
      color: 'white',
      '&:hover': {
        backgroundColor: theme.palette.primary.dark
      }
    }
  }
}));

// Constante para los días de la semana
const DIAS_SEMANA = [
  { nombre: 'Lunes', index: 1 },
  { nombre: 'Martes', index: 2 },
  { nombre: 'Miércoles', index: 3 },
  { nombre: 'Jueves', index: 4 },
  { nombre: 'Viernes', index: 5 }
];

// Función para organizar los horarios por día
const organizarHorariosPorDia = (
  horarios: any[],
  asistencias: any,
  fechaInicio: Date
) => {
  const horariosPorDia: { [key: string]: any } = {};
  
  // Asegurarse de que fechaInicio sea lunes
  const inicioSemana = startOfWeek(fechaInicio, { weekStartsOn: 1 });

  DIAS_SEMANA.forEach(({ nombre, index }) => {
    const fecha = addDays(inicioSemana, index - 1);
    horariosPorDia[nombre] = {
      fecha,
      horarios: horarios.map(horario => {
        const checadorAsistencia = asistencias.checador.find(a => 
          a.horario_id === horario.id && isSameDay(parseISO(a.fecha), fecha)
        );
        const jefeAsistencia = asistencias.jefe.find(a => 
          a.horario_id === horario.id && isSameDay(parseISO(a.fecha), fecha)
        );
        const maestroAsistencia = asistencias.maestro.find(a => 
          a.horario_id === horario.id && isSameDay(parseISO(a.fecha), fecha)
        );

        return {
          ...horario,
          checadorAsistencia,
          jefeAsistencia,
          maestroAsistencia
        };
      })
    };
  });

  return horariosPorDia;
};

export default function ConsultaAsistenciasPage() {
  // Estados
  const [selectedMaestro, setSelectedMaestro] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [maestros, setMaestros] = useState<Usuario[]>([]);
  const [horarios, setHorarios] = useState<any[]>([]);
  const [asistencias, setAsistencias] = useState<{
    checador: Asistencia[];
    jefe: Asistencia[];
    maestro: Asistencia[];
  }>({ checador: [], jefe: [], maestro: [] });
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(startOfWeek(new Date(), { locale: es }));
  const [weekStats, setWeekStats] = useState<{
    total: number;
    asistencias: {
      checador: number;
      jefe: number;
      maestro: number;
    };
    faltas: {
      checador: number;
      jefe: number;
      maestro: number;
    };
  }>({ total: 0, asistencias: { checador: 0, jefe: 0, maestro: 0 }, faltas: { checador: 0, jefe: 0, maestro: 0 } });
  const [horariosPorDia, setHorariosPorDia] = useState<{ [key: string]: any }>({});

  // Cargar datos iniciales
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const maestrosData = await usuariosService.getAll();
        setMaestros(maestrosData.filter(u => u.role === 'Maestro'));
      } catch (err: any) {
        setError('Error al cargar maestros: ' + err.message);
      }
    };
    fetchInitialData();
  }, []);

  // Función para manejar el cambio de fecha
  const handleDateChange = (date: Date | null) => {
    if (date) {
      // Obtener el inicio de la semana (lunes) para la fecha seleccionada
      const weekStart = startOfWeek(date, { weekStartsOn: 1 });
      setCurrentWeekStart(weekStart);
      setSelectedDate(date);
    }
  };

  // Función para verificar si una fecha está en la semana actual
  const isDateInCurrentWeek = (date: Date) => {
    const start = currentWeekStart;
    const end = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
    return isWithinInterval(date, { start, end });
  };

  // Efecto para cargar asistencias de la semana
  useEffect(() => {
    if (!selectedMaestro) return;

    const fetchWeekData = async () => {
      setLoading(true);
      try {
        const weekEnd = endOfWeek(currentWeekStart, { locale: es });
        
        const result = await asistenciasService.getAsistenciasPorRango(
          selectedMaestro,
          format(currentWeekStart, 'yyyy-MM-dd'),
          format(weekEnd, 'yyyy-MM-dd')
        );

        setHorarios(result.horarios);
        setAsistencias(result.asistencias);

        // Calcular estadísticas para todos los roles
        const total = result.horarios.length;
        
        // Conteo para checador
        const checadorAsistencias = result.asistencias.checador.filter(a => 
          a.asistencia?.toLowerCase() === 'presente'
        ).length;
        const checadorFaltas = result.asistencias.checador.filter(a => 
          a.asistencia?.toLowerCase() === 'ausente'
        ).length;

        // Conteo para jefe de grupo
        const jefeAsistencias = result.asistencias.jefe.filter(a => 
          a.asistencia?.toLowerCase() === 'presente'
        ).length;
        const jefeFaltas = result.asistencias.jefe.filter(a => 
          a.asistencia?.toLowerCase() === 'ausente'
        ).length;

        // Conteo para maestro
        const maestroAsistencias = result.asistencias.maestro.filter(a => 
          a.asistencia?.toLowerCase() === 'presente'
        ).length;
        const maestroFaltas = result.asistencias.maestro.filter(a => 
          a.asistencia?.toLowerCase() === 'ausente'
        ).length;
        
        setWeekStats({
          total,
          asistencias: {
            checador: checadorAsistencias,
            jefe: jefeAsistencias,
            maestro: maestroAsistencias
          },
          faltas: {
            checador: checadorFaltas,
            jefe: jefeFaltas,
            maestro: maestroFaltas
          }
        });

        const horariosPorDia = organizarHorariosPorDia(
          result.horarios,
          result.asistencias,
          currentWeekStart
        );
        setHorariosPorDia(horariosPorDia);

      } catch (err: any) {
        setError('Error al cargar datos de la semana: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWeekData();
  }, [selectedMaestro, currentWeekStart]);

  // Funciones auxiliares para manejar estados
  const getEstadoClass = (estado?: string) => {
    if (!estado) return 'sin-registro';
    switch (estado.toLowerCase()) {
      case 'presente':
        return 'asistio';
      case 'ausente':
        return 'falta';
      case 'pendiente':
        return 'sin-registro';
      default:
        return 'sin-registro';
    }
  };

  const getEstadoText = (estado?: string) => {
    if (!estado || estado.toLowerCase() === 'pendiente') {
      return 'Sin registro';
    }
    return estado;
  };

  return (
    <StyledBox>
      <Typography variant="h4" gutterBottom align="center">
        Sistema de Asistencias
      </Typography>

      <Box className="maestro-info">
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Seleccione al maestro</InputLabel>
          <Select
            value={selectedMaestro}
            label="Seleccione al maestro"
            onChange={(e) => setSelectedMaestro(e.target.value)}
          >
            {maestros.map((maestro) => (
              <MenuItem key={maestro.id} value={maestro.id?.toString()}>
                {maestro.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 3,
          gap: 2
        }}>
          <Button 
            variant="outlined" 
            onClick={() => handleDateChange(addDays(currentWeekStart, -7))}
          >
            Semana Anterior
          </Button>

          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
            <DatePicker
              label="Seleccionar fecha"
              value={selectedDate}
              onChange={handleDateChange}
              format="dd/MM/yyyy"
              sx={{ 
                minWidth: 200,
                '& .MuiInputBase-root': {
                  backgroundColor: 'white'
                }
              }}
              slotProps={{
                day: (props) => ({
                  ...props,
                  sx: {
                    ...props.sx,
                    // Resaltar los días de la semana actual
                    backgroundColor: isDateInCurrentWeek(props.day) ? 
                      'primary.light' : 
                      props.outsideCurrentMonth ? 'grey.100' : 'inherit',
                    color: isDateInCurrentWeek(props.day) ? 
                      'white' : 
                      props.outsideCurrentMonth ? 'grey.500' : 'inherit',
                    '&:hover': {
                      backgroundColor: isDateInCurrentWeek(props.day) ? 
                        'primary.main' : 
                        'grey.200'
                    }
                  }
                })
              }}
            />
          </LocalizationProvider>

          <Button 
            variant="outlined" 
            onClick={() => handleDateChange(addDays(currentWeekStart, 7))}
          >
            Siguiente Semana
          </Button>
        </Box>

        <Typography variant="subtitle1" sx={{ textAlign: 'center', mb: 2 }}>
          Semana del {format(currentWeekStart, "d 'de' MMMM", { locale: es })} al{' '}
          {format(addDays(currentWeekStart, 4), "d 'de' MMMM 'de' yyyy", { locale: es })}
        </Typography>
      </Box>

      {selectedMaestro && (
        <Box sx={{ display: 'flex', justifyContent: 'space-around', my: 2 }}>
          <Typography>
            Total de clases: <strong>{weekStats.total}</strong>
          </Typography>
          <Box>
            <Typography color="success.main">
              Asistencias: <strong>{weekStats.asistencias.checador}</strong> (Checador) |{' '}
              <strong>{weekStats.asistencias.jefe}</strong> (Jefe) |{' '}
              <strong>{weekStats.asistencias.maestro}</strong> (Maestro)
            </Typography>
            <Typography color="error.main">
              Faltas: <strong>{weekStats.faltas.checador}</strong> (Checador) |{' '}
              <strong>{weekStats.faltas.jefe}</strong> (Jefe) |{' '}
              <strong>{weekStats.faltas.maestro}</strong> (Maestro)
            </Typography>
          </Box>
        </Box>
      )}

      <Typography variant="h5" className="horario-header">
        HORARIO DEL MAESTRO
      </Typography>

      {DIAS_SEMANA.map(({ nombre }) => (
        <Box key={nombre} sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ 
            bgcolor: 'primary.main',
            color: 'white', 
            p: 1.5,
            borderRadius: '4px 4px 0 0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>{nombre}</span>
            {horariosPorDia[nombre] && (
              <span style={{ fontSize: '0.9em' }}>
                {format(horariosPorDia[nombre].fecha, "d 'de' MMMM, yyyy", { locale: es })}
              </span>
            )}
          </Typography>
          
          <TableContainer component={Paper} sx={{ borderRadius: '0 0 4px 4px' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Hora</TableCell>
                  <TableCell>Materia</TableCell>
                  <TableCell>Grupo</TableCell>
                  <TableCell>Checador</TableCell>
                  <TableCell>Jefe de Grupo</TableCell>
                  <TableCell>Maestro</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {horariosPorDia[nombre]?.horarios.map((horario: any) => (
                  <TableRow key={`${nombre}-${horario.id}`}>
                    <TableCell>{horario.hora}</TableCell>
                    <TableCell>{horario.materiaNombre}</TableCell>
                    <TableCell>{horario.grupoInfo}</TableCell>
                    <TableCell>
                      <span className={`estado ${getEstadoClass(horario.checadorAsistencia?.asistencia)}`}>
                        {getEstadoText(horario.checadorAsistencia?.asistencia)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`estado ${getEstadoClass(horario.jefeAsistencia?.asistencia)}`}>
                        {getEstadoText(horario.jefeAsistencia?.asistencia)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`estado ${getEstadoClass(horario.maestroAsistencia?.asistencia)}`}>
                        {getEstadoText(horario.maestroAsistencia?.asistencia)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {(!horariosPorDia[nombre]?.horarios.length) && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                      No hay clases programadas para este día
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      ))}

      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </StyledBox>
  );
} 