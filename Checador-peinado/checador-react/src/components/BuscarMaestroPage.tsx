import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  FormControl,
  Select,
  MenuItem,
  SelectChangeEvent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Snackbar,
  Alert,
} from '@mui/material';
import { usuariosService, Usuario } from '../services/supabaseService';
import { supabase } from '../lib/supabase';

interface HorarioData {
  dia: string;
  hora: string;
  materia: string;
  grupo: string;
  aula?: string;
  edificio?: string;
}

const HORAS = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', 
               '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];
const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

const formatHora = (hora: string) => {
  return `${hora} - ${parseInt(hora.split(':')[0]) + 1}:00`;
};

const getHorasNecesarias = (horarioMap: Map<string, HorarioData>): string[] => {
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

export default function BuscarMaestroPage() {
  const [maestros, setMaestros] = useState<Usuario[]>([]);
  const [selectedMaestro, setSelectedMaestro] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [horarioData, setHorarioData] = useState<Map<string, HorarioData>>(new Map());

  useEffect(() => {
    const fetchMaestros = async () => {
      setLoading(true);
      try {
        const usuarios = await usuariosService.getAll();
        const soloMaestros = usuarios.filter(user => user.role === 'Maestro');
        setMaestros(soloMaestros);
        if (soloMaestros.length > 0) {
          setSelectedMaestro(soloMaestros[0].id?.toString() || '');
          await cargarHorarioMaestro(soloMaestros[0].id?.toString() || '');
        }
      } catch (err: any) {
        setError('Error al cargar maestros: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMaestros();
  }, []);

  const cargarHorarioMaestro = async (maestroId: string) => {
    try {
      setLoading(true);
      
      const { data: horarios, error: horariosError } = await supabase
        .from('horario-maestro')
        .select(`
          id,
          hora,
          dia,
          materia:materia_id(name),
          grupo:grupo_id(name, classroom, building)
        `)
        .eq('maestro_id', maestroId);

      if (horariosError) throw horariosError;

      const horarioMap = new Map<string, HorarioData>();

      horarios?.forEach(horario => {
        const key = `${horario.dia}-${horario.hora}`;
        horarioMap.set(key, {
          dia: horario.dia,
          hora: horario.hora,
          materia: horario.materia.name,
          grupo: horario.grupo.name,
          aula: horario.grupo.classroom,
          edificio: horario.grupo.building
        });
      });

      setHorarioData(horarioMap);
    } catch (err: any) {
      setError('Error al cargar horario: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMaestroChange = (event: SelectChangeEvent) => {
    const maestroId = event.target.value;
    setSelectedMaestro(maestroId);
    cargarHorarioMaestro(maestroId);
  };

  const handleCloseAlert = () => {
    setError(null);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom align="center">
        Buscar Horario de Maestro
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <FormControl fullWidth margin="normal">
          <Select
            value={selectedMaestro}
            onChange={handleMaestroChange}
            displayEmpty
          >
            {maestros.map((maestro) => (
              <MenuItem key={maestro.id} value={maestro.id?.toString()}>
                {maestro.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TableContainer sx={{ mt: 3 }}>
          <Table>
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
                          bgcolor: celda?.materia ? 'rgba(200, 230, 255, 0.2)' : 'inherit',
                          padding: '16px',
                          border: celda?.materia ? '1px solid #e0e0e0' : 'inherit'
                        }}
                      >
                        {celda?.materia ? (
                          <Box sx={{ minWidth: '150px' }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {celda.materia}
                            </Typography>
                            <Typography variant="caption" display="block">
                              Grupo: {celda.grupo}
                            </Typography>
                            <Typography variant="caption" display="block" color="text.secondary">
                              Aula: {celda.aula} - Edificio: {celda.edificio}
                            </Typography>
                          </Box>
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
      </Paper>

      <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseAlert}>
        <Alert onClose={handleCloseAlert} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
} 