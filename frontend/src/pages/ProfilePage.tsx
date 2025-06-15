import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
} from '@mui/material';
import { Add, Delete, Edit, Save, Cancel } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/userService';

interface LanguagePair {
  source: string;
  target: string;
}

const ProfilePage: React.FC = () => {
  const { user, updateUser, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editing, setEditing] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [languageDialogOpen, setLanguageDialogOpen] = useState(false);

  // Profile form state
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.profile?.phone || '',
    bio: user?.profile?.bio || '',
    experience: user?.profile?.experience || 'beginner',
    languagePairs: user?.profile?.languagePairs || [],
    specializedFields: user?.profile?.specializedFields || [],
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Language pair state
  const [newLanguagePair, setNewLanguagePair] = useState<LanguagePair>({
    source: '',
    target: '',
  });

  const languages = [
    'English', 'Vietnamese', 'Japanese', 'Chinese', 'Korean', 'French', 
    'German', 'Spanish', 'Italian', 'Portuguese', 'Russian', 'Arabic'
  ];

  const specializedFieldOptions = [
    'economics', 'engineering', 'medical', 'legal', 'technology', 
    'education', 'marketing', 'other'
  ];

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.profile?.phone || '',
        bio: user.profile?.bio || '',
        experience: user.profile?.experience || 'beginner',
        languagePairs: user.profile?.languagePairs || [],
        specializedFields: user.profile?.specializedFields || [],
      });
    }
  }, [user]);  const handleProfileUpdate = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await userService.updateProfile({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        profile: {
          phone: profileData.phone,
          bio: profileData.bio,
          experience: profileData.experience,
          languagePairs: profileData.languagePairs,
          specializedFields: profileData.specializedFields,
        },
      });

      // Refresh user data from server
      await refreshUser();
      
      setSuccess('Profile updated successfully');
      setEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await userService.changePassword(passwordData.currentPassword, passwordData.newPassword);
      setSuccess('Password changed successfully');
      setPasswordDialogOpen(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLanguagePair = () => {
    if (newLanguagePair.source && newLanguagePair.target) {
      setProfileData(prev => ({
        ...prev,
        languagePairs: [...prev.languagePairs, newLanguagePair]
      }));
      setNewLanguagePair({ source: '', target: '' });
      setLanguageDialogOpen(false);
    }
  };

  const handleRemoveLanguagePair = (index: number) => {
    setProfileData(prev => ({
      ...prev,
      languagePairs: prev.languagePairs.filter((_, i) => i !== index)
    }));
  };

  const handleSpecializedFieldChange = (event: any) => {
    const value = event.target.value;
    setProfileData(prev => ({
      ...prev,
      specializedFields: typeof value === 'string' ? value.split(',') : value
    }));
  };

  if (!user) {
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
      <Typography variant="h4" component="h1" gutterBottom>
        My Profile
      </Typography>

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

      <Grid container spacing={3}>
        {/* Basic Information */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="between" alignItems="center" mb={3}>
              <Typography variant="h6">Basic Information</Typography>
              {!editing ? (
                <Button
                  startIcon={<Edit />}
                  onClick={() => setEditing(true)}
                >
                  Edit
                </Button>
              ) : (
                <Box>
                  <Button
                    startIcon={<Save />}
                    onClick={handleProfileUpdate}
                    disabled={loading}
                    sx={{ mr: 1 }}
                  >
                    Save
                  </Button>
                  <Button
                    startIcon={<Cancel />}
                    onClick={() => setEditing(false)}
                  >
                    Cancel
                  </Button>
                </Box>
              )}
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                  disabled={!editing}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                  disabled={!editing}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  value={profileData.email}
                  disabled
                  helperText="Email cannot be changed"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={profileData.phone}
                  onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                  disabled={!editing}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Bio"
                  multiline
                  rows={3}
                  value={profileData.bio}
                  onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                  disabled={!editing}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth disabled={!editing}>
                  <InputLabel>Experience Level</InputLabel>
                  <Select
                    value={profileData.experience}
                    label="Experience Level"
                    onChange={(e) => setProfileData(prev => ({ ...prev, experience: e.target.value as any }))}
                  >
                    <MenuItem value="beginner">Beginner</MenuItem>
                    <MenuItem value="intermediate">Intermediate</MenuItem>
                    <MenuItem value="advanced">Advanced</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Statistics */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Statistics
            </Typography>
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary">
                Tasks Completed
              </Typography>
              <Typography variant="h4">
                {user.statistics.tasksCompleted}
              </Typography>
            </Box>
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary">
                Average Score
              </Typography>
              <Typography variant="h4">
                {user.statistics.averageScore.toFixed(1)}%
              </Typography>
            </Box>
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary">
                Total Evaluations
              </Typography>
              <Typography variant="h4">
                {user.statistics.totalEvaluations}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Language Pairs */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="between" alignItems="center" mb={2}>
              <Typography variant="h6">Language Pairs</Typography>
              {editing && (
                <Button
                  startIcon={<Add />}
                  onClick={() => setLanguageDialogOpen(true)}
                >
                  Add Language Pair
                </Button>
              )}
            </Box>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {profileData.languagePairs.map((pair, index) => (
                <Chip
                  key={index}
                  label={`${pair.source} → ${pair.target}`}
                  onDelete={editing ? () => handleRemoveLanguagePair(index) : undefined}
                />
              ))}
              {profileData.languagePairs.length === 0 && (
                <Typography color="text.secondary">
                  No language pairs added yet
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Specialized Fields */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Specialized Fields
            </Typography>
            <FormControl fullWidth disabled={!editing}>
              <InputLabel>Specialized Fields</InputLabel>
              <Select
                multiple
                value={profileData.specializedFields}
                onChange={handleSpecializedFieldChange}
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
          </Paper>
        </Grid>

        {/* Security */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Security
            </Typography>
            <Button
              variant="outlined"
              onClick={() => setPasswordDialogOpen(true)}
            >
              Change Password
            </Button>
          </Paper>
        </Grid>
      </Grid>

      {/* Password Change Dialog */}
      <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Current Password"
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
              margin="normal"
            />
            <TextField
              fullWidth
              label="New Password"
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Confirm New Password"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              margin="normal"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialogOpen(false)}>Cancel</Button>
          <Button onClick={handlePasswordChange} disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Change Password'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Language Pair Dialog */}
      <Dialog open={languageDialogOpen} onClose={() => setLanguageDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Language Pair</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Source Language</InputLabel>
              <Select
                value={newLanguagePair.source}
                label="Source Language"
                onChange={(e) => setNewLanguagePair(prev => ({ ...prev, source: e.target.value }))}
              >
                {languages.map((lang) => (
                  <MenuItem key={lang} value={lang}>
                    {lang}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>Target Language</InputLabel>
              <Select
                value={newLanguagePair.target}
                label="Target Language"
                onChange={(e) => setNewLanguagePair(prev => ({ ...prev, target: e.target.value }))}
              >
                {languages.map((lang) => (
                  <MenuItem key={lang} value={lang}>
                    {lang}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLanguageDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddLanguagePair}>Add</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProfilePage;
