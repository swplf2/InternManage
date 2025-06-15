import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  Alert,
  LinearProgress,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import {
  Download,
  Save,
  Send,
  Close,
  Translate,
  RateReview,
  CheckCircle,
  Warning,
  ArrowBack,
  ArrowForward,
} from '@mui/icons-material';
import { Task } from '../types';
import { taskService } from '../services/taskService';

interface TaskWorkspaceProps {
  open: boolean;
  task: Task | null;
  onClose: () => void;
  onTaskUpdated: () => void;
}

interface SentenceData {
  id: string;
  sourceText: string;
  translatedText: string;
  isCompleted: boolean;
  needsReview: boolean;
  comments: string;
}

const TaskWorkspace: React.FC<TaskWorkspaceProps> = ({
  open,
  task,
  onClose,
  onTaskUpdated,
}) => {
  const [sentences, setSentences] = useState<SentenceData[]>([]);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [progress, setProgress] = useState(0);
  const [workNotes, setWorkNotes] = useState('');

  const updateProgress = (sentenceList: SentenceData[]) => {
    const completed = sentenceList.filter(s => s.isCompleted).length;
    const total = sentenceList.length;
    setProgress(total > 0 ? (completed / total) * 100 : 0);
  };

  const initializeSentences = async () => {
    if (!task) return;

    setLoading(true);
    try {
      // Check if task has existing progress
      if (task.workProgress && task.workProgress.sentences && task.workProgress.sentences.length > 0) {
        // Load existing progress
        setSentences(task.workProgress.sentences);
        setWorkNotes(task.workProgress.workNotes || '');
        updateProgress(task.workProgress.sentences);
        console.log('Loaded existing progress:', task.workProgress);
      } else {
        // Create mock sentences for demo
        const mockSentences: SentenceData[] = [
          {
            id: '1',
            sourceText: 'Welcome to our translation management system.',
            translatedText: '',
            isCompleted: false,
            needsReview: false,
            comments: '',
          },
          {
            id: '2',
            sourceText: 'This platform helps manage translation tasks efficiently.',
            translatedText: '',
            isCompleted: false,
            needsReview: false,
            comments: '',
          },
          {
            id: '3',
            sourceText: 'Please complete your assigned tasks on time.',
            translatedText: '',
            isCompleted: false,
            needsReview: false,
            comments: '',
          },
          {
            id: '4',
            sourceText: 'Quality is our top priority in all translation work.',
            translatedText: '',
            isCompleted: false,
            needsReview: false,
            comments: '',
          },
          {
            id: '5',
            sourceText: 'Contact your supervisor if you have any questions.',
            translatedText: '',
            isCompleted: false,
            needsReview: false,
            comments: '',
          },
        ];

        setSentences(mockSentences);
        setWorkNotes('');
        updateProgress(mockSentences);
        console.log('Created new sentences');
      }
    } catch (err) {
      setError('Failed to load document content');
    } finally {
      setLoading(false);
    }
  };

  // Initialize sentences from source document
  useEffect(() => {
    if (open && task) {
      initializeSentences();
    }
  }, [open, task?.id]); // Only re-run when dialog opens or task ID changes

  const handleSentenceUpdate = (index: number, field: keyof SentenceData, value: string | boolean) => {
    const updatedSentences = [...sentences];
    updatedSentences[index] = {
      ...updatedSentences[index],
      [field]: value,
    };

    // Auto-mark as completed if translation is provided
    if (field === 'translatedText' && typeof value === 'string' && value.trim()) {
      updatedSentences[index].isCompleted = true;
    }

    setSentences(updatedSentences);
    updateProgress(updatedSentences);
  };

  const handleSaveProgress = async () => {
    if (!task) return;

    setSaving(true);
    try {
      const progressData = {
        sentences: sentences,
        progress: progress,
        workNotes: workNotes,
      };

      const response = await taskService.saveProgress(task.id, progressData);
      
      // Call onTaskUpdated to refresh the parent component's task data
      onTaskUpdated();
      
      setSuccess(response.message || 'Progress saved successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save progress');
      setTimeout(() => setError(''), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitTask = async () => {
    if (!task) return;

    const uncompletedSentences = sentences.filter(s => !s.isCompleted);
    if (uncompletedSentences.length > 0) {
      setError(`Please complete all sentences. ${uncompletedSentences.length} sentences remaining.`);
      return;
    }

    setSaving(true);
    try {
      await taskService.submitTask(task.id, {
        translatedDocument: 'completed_translation.txt',
      });

      setSuccess('Task submitted successfully!');
      onTaskUpdated();
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError('Failed to submit task');
    } finally {
      setSaving(false);
    }
  };

  const handleStartTask = async () => {
    if (!task) return;

    try {
      await taskService.updateTask(task.id, { status: 'in_progress' });
      onTaskUpdated();
      setSuccess('Task started successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to start task');
    }
  };

  const navigateToSentence = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentSentenceIndex > 0) {
      setCurrentSentenceIndex(currentSentenceIndex - 1);
    } else if (direction === 'next' && currentSentenceIndex < sentences.length - 1) {
      setCurrentSentenceIndex(currentSentenceIndex + 1);
    }
  };

  const currentSentence = sentences[currentSentenceIndex];
  const canSubmit = task && progress === 100 && task.status === 'in_progress';
  const canStart = task && task.status === 'not_started';

  if (!task) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="xl" 
      fullWidth
      PaperProps={{
        sx: { height: '90vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            {task.type === 'translation' ? <Translate color="primary" /> : <RateReview color="primary" />}
            <Typography variant="h6">
              {task.type === 'translation' ? 'Translation Workspace' : 'Review Workspace'}
            </Typography>
            <Chip 
              label={task.status.replace('_', ' ').toUpperCase()} 
              size="small" 
              color={task.status === 'completed' ? 'success' : 'primary'}
            />
          </Box>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <LinearProgress sx={{ width: '100%' }} />
          </Box>
        ) : (
          <Grid container spacing={3}>
            {/* Task Info */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {task.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {task.description}
                  </Typography>
                  <Box display="flex" gap={2} mb={2}>
                    <Chip label={`${task.sourceLanguage} → ${task.targetLanguage}`} size="small" />
                    <Chip label={task.priority.toUpperCase()} size="small" color="primary" />
                    {task.specializedField && (
                      <Chip label={task.specializedField.toUpperCase()} size="small" variant="outlined" />
                    )}
                  </Box>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Typography variant="body2">Progress:</Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={progress} 
                      sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                    />
                    <Typography variant="body2">{Math.round(progress)}%</Typography>
                  </Box>
                </CardContent>
                <CardActions>
                  {task.sourceDocument && (
                    <Button
                      startIcon={<Download />}
                      onClick={() => window.open(`/api/documents/download/${task.sourceDocument?.filename}`, '_blank')}
                      size="small"
                    >
                      Download Source
                    </Button>
                  )}
                  {canStart && (
                    <Button
                      startIcon={<CheckCircle />}
                      onClick={handleStartTask}
                      color="primary"
                      size="small"
                    >
                      Start Task
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>

            {/* Sentence Workspace */}
            {sentences.length > 0 && (
              <>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, height: '600px' }}>
                    <Typography variant="h6" gutterBottom>
                      Sentences ({sentences.filter(s => s.isCompleted).length}/{sentences.length})
                    </Typography>
                    
                    {/* Sentence List */}
                    <Box sx={{ maxHeight: '520px', overflow: 'auto' }}>
                      {sentences.map((sentence, index) => (
                        <Box
                          key={sentence.id}
                          sx={{
                            p: 2,
                            mb: 1,
                            borderRadius: 1,
                            cursor: 'pointer',
                            bgcolor: index === currentSentenceIndex ? 'primary.light' : 'grey.100',
                            border: index === currentSentenceIndex ? 2 : 1,
                            borderColor: index === currentSentenceIndex ? 'primary.main' : 'grey.300',
                            '&:hover': { bgcolor: 'primary.light' },
                          }}
                          onClick={() => setCurrentSentenceIndex(index)}
                        >
                          <Box display="flex" alignItems="center" gap={1} mb={1}>
                            <Typography variant="body2" fontWeight="bold">
                              #{index + 1}
                            </Typography>
                            {sentence.isCompleted ? (
                              <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
                            ) : (
                              <Warning sx={{ fontSize: 16, color: 'warning.main' }} />
                            )}
                            {sentence.needsReview && (
                              <Chip label="Review" size="small" color="warning" />
                            )}
                          </Box>
                          <Typography variant="body2" noWrap>
                            {sentence.sourceText}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={8}>
                  <Paper sx={{ p: 2, height: '600px' }}>
                    <Box display="flex" alignItems="center" justifyContent="between" mb={2}>
                      <Typography variant="h6">
                        Sentence {currentSentenceIndex + 1} of {sentences.length}
                      </Typography>
                      <Box display="flex" gap={1}>
                        <IconButton
                          onClick={() => navigateToSentence('prev')}
                          disabled={currentSentenceIndex === 0}
                          size="small"
                        >
                          <ArrowBack />
                        </IconButton>
                        <IconButton
                          onClick={() => navigateToSentence('next')}
                          disabled={currentSentenceIndex === sentences.length - 1}
                          size="small"
                        >
                          <ArrowForward />
                        </IconButton>
                      </Box>
                    </Box>

                    {currentSentence && (
                      <Box>
                        {/* Source Text */}
                        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, mb: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Source Text ({task.sourceLanguage}):
                          </Typography>
                          <Typography variant="body1">
                            {currentSentence.sourceText}
                          </Typography>
                        </Box>

                        {/* Translation Area */}
                        <TextField
                          fullWidth
                          multiline
                          rows={4}
                          value={currentSentence.translatedText || ''}
                          onChange={(e) => handleSentenceUpdate(currentSentenceIndex, 'translatedText', e.target.value)}
                          placeholder={`Enter your ${task.type === 'translation' ? 'translation' : 'review'} here...`}
                          label={`${task.type === 'translation' ? 'Translation' : 'Review'} (${task.targetLanguage})`}
                          sx={{ mb: 2 }}
                        />

                        {/* Comments */}
                        <TextField
                          fullWidth
                          multiline
                          rows={2}
                          value={currentSentence.comments || ''}
                          onChange={(e) => handleSentenceUpdate(currentSentenceIndex, 'comments', e.target.value)}
                          placeholder="Add comments or notes..."
                          label="Comments"
                          sx={{ mb: 2 }}
                        />

                        {/* Status Buttons */}
                        <Box display="flex" gap={1} mb={2}>
                          <Button
                            variant={currentSentence.isCompleted ? 'contained' : 'outlined'}
                            color={currentSentence.isCompleted ? 'success' : 'primary'}
                            startIcon={<CheckCircle />}
                            onClick={() => handleSentenceUpdate(currentSentenceIndex, 'isCompleted', !currentSentence.isCompleted)}
                            size="small"
                          >
                            {currentSentence.isCompleted ? 'Completed' : 'Mark Complete'}
                          </Button>
                          
                          <Button
                            variant={currentSentence.needsReview ? 'contained' : 'outlined'}
                            color={currentSentence.needsReview ? 'warning' : 'inherit'}
                            startIcon={<Warning />}
                            onClick={() => handleSentenceUpdate(currentSentenceIndex, 'needsReview', !currentSentence.needsReview)}
                            size="small"
                          >
                            {currentSentence.needsReview ? 'Needs Review' : 'Flag for Review'}
                          </Button>
                        </Box>
                      </Box>
                    )}

                    {/* Work Notes */}
                    <Box mt={2}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        value={workNotes}
                        onChange={(e) => setWorkNotes(e.target.value)}
                        placeholder="Add general notes about this task..."
                        label="Work Notes"
                      />
                    </Box>
                  </Paper>
                </Grid>
              </>
            )}
          </Grid>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>
          Close
        </Button>
        <Button
          startIcon={<Save />}
          onClick={handleSaveProgress}
          disabled={saving || loading}
          variant="outlined"
        >
          {saving ? 'Saving...' : 'Save Progress'}
        </Button>
        {canSubmit && (
          <Button
            startIcon={<Send />}
            onClick={handleSubmitTask}
            disabled={saving || loading}
            variant="contained"
            color="primary"
          >
            {saving ? 'Submitting...' : 'Submit Task'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default TaskWorkspace;
