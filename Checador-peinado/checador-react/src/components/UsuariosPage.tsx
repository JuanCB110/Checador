import { useState, useEffect } from 'react';
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
  Tabs,
  Tab,
  SelectChangeEvent,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import { Usuario, usuariosService, UserRole } from '../services/supabaseService';
import { supabase } from '../lib/supabase';

export default function UsuariosPage() {
  const [tabValue, setTabValue] = useState(1);
  const [accountNumber, setAccountNumber] = useState('');
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('Alumno');
  const [searchAccount, setSearchAccount] = useState('');
  const [numeroCuenta, setNumeroCuenta] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [, setUsuarios] = useState<Usuario[]>([]);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);

  const roles: UserRole[] = [
    'Alumno',
    'Jefe_de_Grupo',
    'Checador',
    'Maestro',
    'Administrador'
  ];

  useEffect(() => {
    // Cargar la lista de usuarios al iniciar
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const data = await usuariosService.getAll();
        setUsuarios(data);
      } catch (err: any) {
        setError('Error al cargar usuarios: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    // Limpiar formulario al cambiar de tab
    if (newValue === 0) {
      clearForm();
    }
  };

  const handleRoleChange = (event: SelectChangeEvent) => {
    setRole(event.target.value as UserRole);
  };

  const clearForm = () => {
    setAccountNumber('');
    setUserName('');
    setEmail('');
    setPassword('');
    setRole('Alumno');
    setSearchAccount('');
    setSelectedUser(null);
    setNumeroCuenta('');
  };

  const handleSearch = async () => {
    if (!searchAccount) {
      setError('Por favor ingrese un número de cuenta para buscar');
      return;
    }

    setLoading(true);
    try {
      // Primero intentamos buscar por número de cuenta
      const { data: usersByNumCuenta } = await supabase
        .from('usuarios')
        .select('*')
        .eq('numero_cuenta', searchAccount)
        .single();

      if (usersByNumCuenta) {
        setSelectedUser(usersByNumCuenta);
        setAccountNumber(usersByNumCuenta.id?.toString() || '');
        setUserName(usersByNumCuenta.name);
        setEmail(usersByNumCuenta.email || '');
        setPassword(''); // Dejar el campo de contraseña vacío
        setRole(usersByNumCuenta.role || 'Alumno');
        setNumeroCuenta(usersByNumCuenta.numero_cuenta || '');
        setSuccess('Usuario encontrado');
        return;
      }

      // Si no se encuentra por número de cuenta, intentamos por ID
      const userId = Number(searchAccount);
      const user = await usuariosService.getById(userId);
      
      if (!user) {
        throw new Error('Usuario no encontrado');
      }
      
      setSelectedUser(user);
      setAccountNumber(user.id?.toString() || '');
      setUserName(user.name);
      setEmail(user.email || '');
      setPassword(''); // Dejar el campo de contraseña vacío
      setRole(user.role || 'Alumno');
      setNumeroCuenta(user.numero_cuenta || '');
      
      setSuccess('Usuario encontrado');
    } catch (err: any) {
      setError('Error al buscar usuario: ' + err.message);
      clearForm();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedUser) {
      setError('Primero debe buscar un usuario');
      return;
    }

    if (!userName || !email) {
      setError('Por favor complete al menos el nombre y el correo electrónico');
      return;
    }

    setLoading(true);
    try {
      const updatedUser: Partial<Usuario> = {
        name: userName,
        email,
        role: role as UserRole,
        numero_cuenta: numeroCuenta
      };
      
      // Solo incluir la contraseña si se ha ingresado una nueva
      if (password.trim() !== '') {
        updatedUser.password = password;
      }
      
      await usuariosService.update(Number(accountNumber), updatedUser);
      setSuccess('Usuario actualizado correctamente');
      
      // Actualizar el selectedUser con los nuevos datos
      setSelectedUser({
        ...selectedUser,
        ...updatedUser,
        id: Number(accountNumber)
      });
      
      // Limpiar el campo de contraseña después de guardar
      setPassword('');
    } catch (err: any) {
      setError('Error al guardar usuario: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) {
      setError('Primero debe buscar un usuario');
      return;
    }

    if (!window.confirm('¿Está seguro de eliminar este usuario?')) {
      return;
    }

    setLoading(true);
    try {
      await usuariosService.delete(Number(accountNumber));
      setSuccess('Usuario eliminado correctamente');
      clearForm();
    } catch (err: any) {
      setError('Error al eliminar usuario: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!userName || !email || !password) {
      setError('Por favor complete el nombre, correo electrónico y contraseña');
      return;
    }

    setLoading(true);
    try {
      const newUser: Usuario = {
        name: userName,
        email,
        password,
        role: role as UserRole,
        numero_cuenta: numeroCuenta
      };
      
      await usuariosService.create(newUser);
      setSuccess('Usuario creado correctamente');
      clearForm();
    } catch (err: any) {
      setError('Error al crear usuario: ' + err.message);
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
      <Paper sx={{ mb: 3, borderRadius: 1, overflow: 'hidden' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          textColor="primary"
          indicatorColor="primary"
          sx={{ 
            '& .MuiTabs-flexContainer': {
              flexDirection: 'row-reverse'
            }
          }}
        >
          <Tab label="Editar" />
          <Tab label="Agregar" />
        </Tabs>
      </Paper>

      {tabValue === 1 ? (
        <Paper sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
          <Typography variant="h5" gutterBottom align="center">
            Agregar nuevo usuario
          </Typography>

          <Box component="form" sx={{ mt: 3 }}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Rol</InputLabel>
              <Select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                label="Rol"
              >
                {roles.map((role) => (
                  <MenuItem key={role} value={role}>
                    {role}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              margin="normal"
              label="Número de Cuenta"
              value={numeroCuenta}
              onChange={(e) => setNumeroCuenta(e.target.value)}
              helperText="Este campo es opcional"
            />
            
            <TextField
              fullWidth
              margin="normal"
              label="Nombre del usuario"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              required
            />
            
            <TextField
              fullWidth
              margin="normal"
              label="Correo Electrónico"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            
            <TextField
              fullWidth
              margin="normal"
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            
            <Button 
              fullWidth
              variant="contained"
              onClick={handleAddUser}
              disabled={loading}
              sx={{ mt: 3 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Crear usuario'}
            </Button>
          </Box>
        </Paper>
      ) : (
        <Paper sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
          <Typography variant="h5" gutterBottom align="center">
            Editar usuario
          </Typography>

          <Grid container spacing={2} sx={{ mb: 4, mt: 2 }}>
            <Grid item xs>
              <TextField
                fullWidth
                label="Buscar por número de cuenta o ID"
                value={searchAccount}
                onChange={(e) => setSearchAccount(e.target.value)}
              />
            </Grid>
            <Grid item>
              <Button 
                variant="contained" 
                onClick={handleSearch}
                sx={{ height: '100%' }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Buscar'}
              </Button>
            </Grid>
          </Grid>

          <Box component="form" sx={{ mt: 3 }}>
            <TextField
              fullWidth
              margin="normal"
              label="ID"
              value={accountNumber}
              disabled={true}
            />
            
            <FormControl fullWidth margin="normal">
              <InputLabel>Rol</InputLabel>
              <Select
                value={role}
                onChange={handleRoleChange}
                label="Rol"
                disabled={!selectedUser}
              >
                {roles.map((role) => (
                  <MenuItem key={role} value={role}>
                    {role}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              margin="normal"
              label="Número de cuenta"
              value={numeroCuenta}
              onChange={(e) => setNumeroCuenta(e.target.value)}
              disabled={!selectedUser}
            />
            
            <TextField
              fullWidth
              margin="normal"
              label="Nombre del usuario"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              disabled={!selectedUser}
            />
            
            <TextField
              fullWidth
              margin="normal"
              label="Correo Electrónico"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!selectedUser}
            />
            
            <TextField
              fullWidth
              margin="normal"
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={!selectedUser}
              helperText="Dejar en blanco para mantener la contraseña actual"
            />
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 2 }}>
              <Button 
                variant="outlined" 
                color="error"
                onClick={handleDelete}
                disabled={!selectedUser || loading}
              >
                Eliminar
              </Button>
              <Button 
                variant="contained"
                onClick={handleSave}
                disabled={!selectedUser || loading}
              >
                Guardar
              </Button>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Alertas */}
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