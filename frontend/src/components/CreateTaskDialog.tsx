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
import { User } from '../types';

interface CreateTaskDialogProps {
  open: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
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
  sourceDocument?: File | null;
  targetDocument?: File | null; // For review tasks - existing translation
}

const CreateTaskDialog: React.FC<CreateTaskDialogProps> = ({
  open,
  onClose,
  onTaskCreated,
}) => {  const [formData, setFormData] = useState<TaskFormData>({
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
    sourceDocument: null,
    targetDocument: null,
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

  useEffect(() => {
    if (open) {
      fetchInterns();
    }
  }, [open]);

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

  const handleFileChange = (field: 'sourceDocument' | 'targetDocument') => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0] || null;
    setFormData(prev => ({
      ...prev,
      [field]: file
    }));
  };

  const handleDateChange = (date: Date | null) => {
    setFormData(prev => ({ ...prev, deadline: date }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');    try {
      // Validation
      if (!formData.title || !formData.assignedTo || !formData.sourceLanguage || 
          !formData.targetLanguage || !formData.deadline) {
        setError('Please fill in all required fields');
        return;
      }

      if (!formData.sourceDocument) {
        setError('Please upload a source document');
        return;
      }

      if (formData.type === 'review' && !formData.targetDocument) {
        setError('Please upload the translated document for review');
        return;
      }

      if (formData.deadline <= new Date()) {
        setError('Deadline must be in the future');
        return;
      }      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('type', formData.type);
      submitData.append('assignedTo', formData.assignedTo);
      submitData.append('sourceLanguage', formData.sourceLanguage);
      submitData.append('targetLanguage', formData.targetLanguage);
      
      // Only append specializedField if it has a value
      if (formData.specializedField && formData.specializedField.trim() !== '') {
        submitData.append('specializedField', formData.specializedField);
      }
      
      submitData.append('deadline', formData.deadline!.toISOString());
      submitData.append('instructions', formData.instructions);
      submitData.append('priority', formData.priority);
      
      if (formData.sourceDocument) {
        submitData.append('sourceDocument', formData.sourceDocument);
      }
      
      if (formData.targetDocument) {
        submitData.append('targetDocument', formData.targetDocument);
      }

      await taskService.createTask(submitData as any);
      onTaskCreated();
      onClose();
        // Reset form
      setFormData({
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
        sourceDocument: null,
        targetDocument: null,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create task');
      console.error('Create task error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>Create New Task</DialogTitle>
        
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
              </Grid>              {/* Type and Priority */}
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
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
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
              </Grid>              {/* File Uploads - Dynamic based on task type */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Documents
                </Typography>
              </Grid>

              {/* Source Document - Required for both types */}
              <Grid item xs={12}>
                <Box>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    {formData.type === 'translation' 
                      ? 'Source Document to Translate *' 
                      : 'Original Document to Review *'
                    }
                  </Typography>
                  <Button
                    variant="outlined"
                    component="label"
                    fullWidth
                    sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                  >
                    {formData.sourceDocument ? formData.sourceDocument.name : 'Choose file...'}
                    <input
                      type="file"
                      hidden
                      onChange={handleFileChange('sourceDocument')}
                      accept=".pdf,.doc,.docx,.txt,.rtf"
                    />
                  </Button>
                </Box>
              </Grid>

              {/* Target Document - Only for review tasks */}
              {formData.type === 'review' && (
                <Grid item xs={12}>
                  <Box>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Translated Document to Review *
                    </Typography>
                    <Button
                      variant="outlined"
                      component="label"
                      fullWidth
                      sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                    >
                      {formData.targetDocument ? formData.targetDocument.name : 'Choose file...'}
                      <input
                        type="file"
                        hidden
                        onChange={handleFileChange('targetDocument')}
                        accept=".pdf,.doc,.docx,.txt,.rtf"
                      />
                    </Button>
                  </Box>
                </Grid>
              )}

              {/* Task Type Explanation */}
              <Grid item xs={12}>
                <Alert severity="info">
                  {formData.type === 'translation' 
                    ? 'Translation task: Intern will translate the source document and upload the result.'
                    : 'Review task: Intern will review the translation quality and provide feedback.'
                  }
                </Alert>
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
              </Grid>
            </Grid>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || loadingInterns}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Creating...' : 'Create Task'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default CreateTaskDialog;
