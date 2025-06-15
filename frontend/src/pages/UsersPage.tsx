import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Button,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Grid,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  Person,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/userService';
import { User } from '../types';

const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const [roleFilter, setRoleFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'intern' as 'admin' | 'intern',
    profile: {
      phone: '',
      bio: '',
      experience: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
      languagePairs: [] as Array<{ source: string; target: string }>,
      specializedFields: [] as string[],
    },
  });

  useEffect(() => {
    fetchUsers();
  }, [page, rowsPerPage, roleFilter, searchQuery]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getUsers({
        page: page + 1,
        limit: rowsPerPage,
        role: roleFilter || undefined,
        search: searchQuery || undefined,
      });
      setUsers(response.users);
      setTotalUsers(response.total);
    } catch (err: any) {
      setError('Failed to load users');
      console.error('Fetch users error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleCreateUser = () => {
    setIsCreating(true);
    setEditingUser(null);
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      role: 'intern',
      profile: {
        phone: '',
        bio: '',
        experience: 'beginner',
        languagePairs: [],
        specializedFields: [],
      },
    });
    setDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    setIsCreating(false);
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '',
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      profile: {
        phone: user.profile?.phone || '',
        bio: user.profile?.bio || '',
        experience: user.profile?.experience || 'beginner',
        languagePairs: user.profile?.languagePairs || [],
        specializedFields: user.profile?.specializedFields || [],
      },
    });
    setDialogOpen(true);
  };

  const handleSaveUser = async () => {
    try {
      setLoading(true);
      setError('');

      if (isCreating) {
        await userService.createUser({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role,
        });
        setSuccess('User created successfully');
      } else if (editingUser) {
        await userService.updateUser(editingUser.id, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          role: formData.role,
          profile: formData.profile,
        });
        setSuccess('User updated successfully');
      }

      setDialogOpen(false);
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to ${isCreating ? 'create' : 'update'} user`);
    } finally {
      setLoading(false);
    }
  };
  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user? This will also delete all tasks assigned to or created by this user.')) {
      try {
        const response = await userService.deleteUser(userId);
        const deletedTasks = response.deletedTasks || 0;
        
        if (deletedTasks > 0) {
          setSuccess(`User deleted successfully. ${deletedTasks} related tasks were also removed.`);
        } else {
          setSuccess('User deleted successfully');
        }
        
        fetchUsers();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete user');
      }
    }
  };

  const specializedFieldOptions = [
    'economics', 'engineering', 'medical', 'legal', 'technology', 
    'education', 'marketing', 'other'
  ];

  if (currentUser?.role !== 'admin') {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          Access denied. Admin privileges required.
        </Alert>
      </Container>
    );
  }

  if (loading && users.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Users Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateUser}
        >
          Create User
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              placeholder="Search by name or email"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              label="Role"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              size="small"
            >
              <MenuItem value="">All Roles</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="intern">Intern</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* Users Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Experience</TableCell>
              <TableCell>Tasks Completed</TableCell>
              <TableCell>Average Score</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} hover>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <Person sx={{ mr: 1, color: 'action.active' }} />
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {user.firstName} {user.lastName}
                      </Typography>
                      {user.profile?.phone && (
                        <Typography variant="caption" color="text.secondary">
                          {user.profile.phone}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip
                    label={user.role.toUpperCase()}
                    color={user.role === 'admin' ? 'primary' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {user.profile?.experience && (
                    <Chip
                      label={user.profile.experience}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </TableCell>
                <TableCell>{user.statistics.tasksCompleted}</TableCell>
                <TableCell>{user.statistics.averageScore.toFixed(1)}%</TableCell>
                <TableCell>
                  <Chip
                    label={user.isActive ? 'Active' : 'Inactive'}
                    color={user.isActive ? 'success' : 'error'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleEditUser(user)}
                    title="Edit User"
                  >
                    <Edit />
                  </IconButton>
                  {user.id !== currentUser.id && (
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteUser(user.id)}
                      title="Delete User"
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalUsers}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* User Form Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {isCreating ? 'Create New User' : 'Edit User'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  margin="normal"
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  margin="normal"
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  margin="normal"
                  required
                />
              </Grid>
              {isCreating && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    margin="normal"
                    required
                  />
                </Grid>
              )}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={formData.role}
                    label="Role"
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as 'admin' | 'intern' }))}
                  >
                    <MenuItem value="intern">Intern</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Experience Level</InputLabel>
                  <Select
                    value={formData.profile.experience}
                    label="Experience Level"
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      profile: { ...prev.profile, experience: e.target.value as any }
                    }))}
                  >
                    <MenuItem value="beginner">Beginner</MenuItem>
                    <MenuItem value="intermediate">Intermediate</MenuItem>
                    <MenuItem value="advanced">Advanced</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={formData.profile.phone}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    profile: { ...prev.profile, phone: e.target.value }
                  }))}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Specialized Fields</InputLabel>
                  <Select
                    multiple
                    value={formData.profile.specializedFields}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      profile: { 
                        ...prev.profile, 
                        specializedFields: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value
                      }
                    }))}
                    input={<OutlinedInput label="Specialized Fields" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} />
                        ))}
                      </Box>
                    )}
                  >
                    {specializedFieldOptions.map((field) => (
                      <MenuItem key={field} value={field}>
                        {field.charAt(0).toUpperCase() + field.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Bio"
                  multiline
                  rows={3}
                  value={formData.profile.bio}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    profile: { ...prev.profile, bio: e.target.value }
                  }))}
                  margin="normal"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveUser} disabled={loading}>
            {loading ? <CircularProgress size={20} /> : (isCreating ? 'Create' : 'Update')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UsersPage;
