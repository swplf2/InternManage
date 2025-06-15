import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  MenuItem,
  Typography,
  Alert,
  CircularProgress,
  Box,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { userService } from '../services/userService';
import { taskService } from '../services/taskService';
import { User, Task } from '../types';

interface EditTaskDialogProps {
  open: boolean;
  onClose: () => void;
  onTaskUpdated: (taskId?: string) => void;
  task: Task | null;
}

interface TaskFormData {
  title: string;
  description: string;
  type: 'translation' | 'review';
  assignedTo: string;
  sourceLanguage: string;
  targetLanguage: string;
  specializedField: string;
  deadline: Date | null;
  instructions: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'not_started' | 'in_progress' | 'submitted' | 'under_revision' | 'completed';
}

const EditTaskDialog: React.FC<EditTaskDialogProps> = ({
  open,
  onClose,
  onTaskUpdated,
  task,
}) => {
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    type: 'translation',
    assignedTo: '',
    sourceLanguage: '',
    targetLanguage: '',
    specializedField: '',
    deadline: null,
    instructions: '',
    priority: 'medium',
    status: 'not_started',
  });

  const [interns, setInterns] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingInterns, setLoadingInterns] = useState(true);

  const languages = [
    'English', 'Vietnamese', 'Japanese', 'Chinese', 'Korean', 'French',
    'German', 'Spanish', 'Italian', 'Portuguese', 'Russian', 'Arabic'
  ];

  const specializedFields = [
    { value: 'economics', label: 'Economics' },
    { value: 'engineering', label: 'Engineering' },
    { value: 'medical', label: 'Medical' },
    { value: 'legal', label: 'Legal' },
    { value: 'technology', label: 'Technology' },
    { value: 'education', label: 'Education' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'other', label: 'Other' },
  ];

  const statusOptions = [
    { value: 'not_started', label: 'Not Started' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'under_revision', label: 'Under Revision' },
    { value: 'completed', label: 'Completed' },
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
  ];

  useEffect(() => {
    if (open) {
      fetchInterns();
      if (task) {
        populateFormData();
      }
    }
  }, [open, task]);

  const populateFormData = () => {
    if (!task) return;

    setFormData({
      title: task.title,
      description: task.description || '',
      type: task.type as 'translation' | 'review',
      assignedTo: task.assignedTo.id,
      sourceLanguage: task.sourceLanguage,
      targetLanguage: task.targetLanguage,
      specializedField: task.specializedField || '',
      deadline: task.deadline ? new Date(task.deadline) : null,
      instructions: task.instructions || '',
      priority: task.priority,
      status: task.status,
    });
  };

  const fetchInterns = async () => {
    try {
      setLoadingInterns(true);
      const response = await userService.getUsers({ role: 'intern' });
      setInterns(response.users);
    } catch (err: any) {
      setError('Failed to load interns list');
      console.error('Fetch interns error:', err);
    } finally {
      setLoadingInterns(false);
    }
  };

  const handleInputChange = (field: keyof TaskFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDateChange = (date: Date | null) => {
    setFormData(prev => ({ ...prev, deadline: date }));
  };

  const handleSubmit = async () => {
    if (!task) return;

    setLoading(true);
    setError('');

    try {
      // Validation
      if (!formData.title || !formData.assignedTo || !formData.sourceLanguage || 
          !formData.targetLanguage || !formData.deadline) {
        setError('Please fill in all required fields');
        return;
      }

      if (formData.deadline <= new Date()) {
        setError('Deadline must be in the future');
        return;
      }      // Prepare update data
      const updateData: any = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        assignedTo: formData.assignedTo,
        sourceLanguage: formData.sourceLanguage,
        targetLanguage: formData.targetLanguage,
        deadline: formData.deadline.toISOString(),
        instructions: formData.instructions,
        priority: formData.priority,
        status: formData.status,
      };

      // Only include specializedField if it has a value
      if (formData.specializedField && formData.specializedField.trim() !== '') {
        updateData.specializedField = formData.specializedField;
      }      await taskService.updateTask(task.id, updateData);
      
      // Call onTaskUpdated with the task ID to refresh the tasks list and close dialog
      onTaskUpdated(task.id);

    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update task');
      console.error('Update task error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    onClose();
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Edit Task</DialogTitle>
        
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {loadingInterns ? (
            <Box display="flex" justifyContent="center" py={2}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {/* Title */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Task Title"
                  required
                  value={formData.title}
                  onChange={handleInputChange('title')}
                />
              </Grid>

              {/* Description */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={handleInputChange('description')}
                />
              </Grid>

              {/* Type and Priority */}
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  select
                  label="Task Type"
                  required
                  value={formData.type}
                  onChange={handleInputChange('type')}
                >
                  <MenuItem value="translation">Translation</MenuItem>
                  <MenuItem value="review">Review</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={6}>
                <TextField
                  fullWidth
                  select
                  label="Priority"
                  value={formData.priority}
                  onChange={handleInputChange('priority')}
                >
                  {priorityOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Status */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Status"
                  value={formData.status}
                  onChange={handleInputChange('status')}
                >
                  {statusOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Assigned To */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Assign To"
                  required
                  value={formData.assignedTo}
                  onChange={handleInputChange('assignedTo')}
                >
                  {interns.map((intern) => (
                    <MenuItem key={intern.id} value={intern.id}>
                      {intern.firstName} {intern.lastName} ({intern.email})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Languages */}
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  select
                  label="Source Language"
                  required
                  value={formData.sourceLanguage}
                  onChange={handleInputChange('sourceLanguage')}
                >
                  {languages.map((lang) => (
                    <MenuItem key={lang} value={lang}>
                      {lang}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={6}>
                <TextField
                  fullWidth
                  select
                  label="Target Language"
                  required
                  value={formData.targetLanguage}
                  onChange={handleInputChange('targetLanguage')}
                >
                  {languages.map((lang) => (
                    <MenuItem key={lang} value={lang}>
                      {lang}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Specialized Field */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Specialized Field"
                  value={formData.specializedField}
                  onChange={handleInputChange('specializedField')}
                >
                  <MenuItem value="">Select Field (Optional)</MenuItem>
                  {specializedFields.map((field) => (
                    <MenuItem key={field.value} value={field.value}>
                      {field.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Deadline */}
              <Grid item xs={12}>
                <DateTimePicker
                  label="Deadline *"
                  value={formData.deadline}
                  onChange={handleDateChange}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      helperText: 'When should this task be completed?'
                    },
                  }}
                />
              </Grid>

              {/* Instructions */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Instructions"
                  multiline
                  rows={4}
                  value={formData.instructions}
                  onChange={handleInputChange('instructions')}
                  helperText="Additional instructions for the translator"
                />
              </Grid>              {/* File information (read-only) */}
              {task && (
                <>
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                      Documents (Read-only)
                    </Typography>
                  </Grid>
                  
                  {task.sourceDocument && (
                    <Grid item xs={12}>
                      <Alert severity="info">
                        Source Document: {task.sourceDocument.originalName || task.sourceDocument.filename}
                      </Alert>
                    </Grid>
                  )}
                  
                  {task.translatedDocument && (
                    <Grid item xs={12}>
                      <Alert severity="info">
                        Translated Document: {task.translatedDocument.originalName || task.translatedDocument.filename}
                      </Alert>
                    </Grid>
                  )}
                </>
              )}
            </Grid>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || loadingInterns}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Updating...' : 'Update Task'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default EditTaskDialog;
