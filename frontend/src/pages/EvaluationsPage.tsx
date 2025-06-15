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
  Rating,
  Divider,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  Assessment,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { evaluationService } from '../services/evaluationService';
import { taskService } from '../services/taskService';
import { userService } from '../services/userService';
import { Evaluation, Task, User } from '../types';

const EvaluationsPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalEvaluations, setTotalEvaluations] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [interns, setInterns] = useState<User[]>([]);

  // Form state for creating evaluation
  const [formData, setFormData] = useState({
    taskId: '',
    internId: '',
    criteria: {
      accuracy: { score: 8, comments: '' },
      grammar: { score: 8, comments: '' },
      style: { score: 8, comments: '' },
      terminology: { score: 8, comments: '' },
      formatting: { score: 8, comments: '' },
      adherence: { score: 8, comments: '' },
    },
    overallComments: '',
    recommendations: '',
  });

  useEffect(() => {
    fetchEvaluations();
    if (currentUser?.role === 'admin') {
      fetchAvailableTasks();
      fetchInterns();
    }
  }, [page, rowsPerPage, currentUser]);

  const fetchEvaluations = async () => {
    try {
      setLoading(true);
      const response = await evaluationService.getEvaluations({
        page: page + 1,
        limit: rowsPerPage,
      });
      setEvaluations(response.evaluations);
      setTotalEvaluations(response.total);
    } catch (err: any) {
      setError('Failed to load evaluations');
      console.error('Fetch evaluations error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableTasks = async () => {
    try {
      const response = await taskService.getTasks({ status: 'submitted' });
      setAvailableTasks(response.tasks);
    } catch (err: any) {
      console.error('Fetch available tasks error:', err);
    }
  };

  const fetchInterns = async () => {
    try {
      const response = await userService.getInterns();
      setInterns(response.interns);
    } catch (err: any) {
      console.error('Fetch interns error:', err);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewEvaluation = (evaluation: Evaluation) => {
    setSelectedEvaluation(evaluation);
    setDialogOpen(true);
  };

  const handleCreateEvaluation = () => {
    setFormData({
      taskId: '',
      internId: '',
      criteria: {
        accuracy: { score: 8, comments: '' },
        grammar: { score: 8, comments: '' },
        style: { score: 8, comments: '' },
        terminology: { score: 8, comments: '' },
        formatting: { score: 8, comments: '' },
        adherence: { score: 8, comments: '' },
      },
      overallComments: '',
      recommendations: '',
    });
    setCreateDialogOpen(true);
  };

  const handleSaveEvaluation = async () => {
    try {
      setLoading(true);
      setError('');

      await evaluationService.createEvaluation(formData);
      setSuccess('Evaluation created successfully');
      setCreateDialogOpen(false);
      fetchEvaluations();
      fetchAvailableTasks(); // Refresh available tasks
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create evaluation');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvaluation = async (evaluationId: string) => {
    if (window.confirm('Are you sure you want to delete this evaluation?')) {
      try {
        await evaluationService.deleteEvaluation(evaluationId);
        setSuccess('Evaluation deleted successfully');
        fetchEvaluations();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete evaluation');
      }
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 9) return 'success';
    if (score >= 7) return 'primary';
    if (score >= 5) return 'warning';
    return 'error';
  };

  const getCriteriaLabel = (key: string) => {
    const labels: { [key: string]: string } = {
      accuracy: 'Accuracy',
      grammar: 'Grammar & Spelling',
      style: 'Style & Tone',
      terminology: 'Terminology',
      formatting: 'Formatting',
      adherence: 'Adherence to Guidelines',
    };
    return labels[key] || key;
  };

  if (loading && evaluations.length === 0) {
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
          {currentUser?.role === 'admin' ? 'All Evaluations' : 'My Evaluations'}
        </Typography>
        {currentUser?.role === 'admin' && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreateEvaluation}
          >
            Create Evaluation
          </Button>
        )}
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

      {/* Evaluations Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Task</TableCell>
              <TableCell>Intern</TableCell>
              <TableCell>Overall Score</TableCell>
              <TableCell>Top Criteria</TableCell>
              <TableCell>Evaluated By</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {evaluations.map((evaluation) => {
              const topCriteria = Object.entries(evaluation.criteria)
                .sort(([,a], [,b]) => b.score - a.score)
                .slice(0, 2);

              return (
                <TableRow key={evaluation.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {evaluation.task.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {evaluation.task.type} - {evaluation.task.sourceLanguage} → {evaluation.task.targetLanguage}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Assessment sx={{ mr: 1, color: 'action.active' }} />
                      <Box>
                        <Typography variant="body2">
                          {evaluation.intern.firstName} {evaluation.intern.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {evaluation.intern.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Typography variant="h6" sx={{ mr: 1 }}>
                        {evaluation.percentage.toFixed(1)}%
                      </Typography>
                      <Chip
                        label={evaluation.percentage >= 80 ? 'Excellent' : 
                              evaluation.percentage >= 70 ? 'Good' :
                              evaluation.percentage >= 60 ? 'Fair' : 'Needs Improvement'}
                        color={getScoreColor(evaluation.percentage / 10)}
                        size="small"
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      {topCriteria.map(([key, criterion]) => (
                        <Typography key={key} variant="caption" display="block">
                          {getCriteriaLabel(key)}: {criterion.score}/10
                        </Typography>
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {evaluation.evaluatedBy.firstName} {evaluation.evaluatedBy.lastName}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {format(new Date(evaluation.createdAt), 'MMM dd, yyyy')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleViewEvaluation(evaluation)}
                      title="View Details"
                    >
                      <Visibility />
                    </IconButton>
                    {currentUser?.role === 'admin' && (
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteEvaluation(evaluation.id)}
                        title="Delete Evaluation"
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalEvaluations}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Evaluation Details Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Evaluation Details</DialogTitle>
        <DialogContent>
          {selectedEvaluation && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Task Information
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Title:</strong> {selectedEvaluation.task.title}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Type:</strong> {selectedEvaluation.task.type}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Languages:</strong> {selectedEvaluation.task.sourceLanguage} → {selectedEvaluation.task.targetLanguage}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Overall Score
                  </Typography>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Typography variant="h4" sx={{ mr: 2 }}>
                      {selectedEvaluation.percentage.toFixed(1)}%
                    </Typography>
                    <Chip
                      label={selectedEvaluation.percentage >= 80 ? 'Excellent' : 
                            selectedEvaluation.percentage >= 70 ? 'Good' :
                            selectedEvaluation.percentage >= 60 ? 'Fair' : 'Needs Improvement'}
                      color={getScoreColor(selectedEvaluation.percentage / 10)}
                    />
                  </Box>
                  <Typography variant="body2">
                    <strong>Total Score:</strong> {selectedEvaluation.totalScore}/{selectedEvaluation.maxScore}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Detailed Criteria Scores
              </Typography>
              <Grid container spacing={2}>
                {Object.entries(selectedEvaluation.criteria).map(([key, criterion]) => (
                  <Grid item xs={12} sm={6} key={key}>
                    <Paper sx={{ p: 2 }}>
                      <Box display="flex" justifyContent="between" alignItems="center" mb={1}>
                        <Typography variant="body2" fontWeight="medium">
                          {getCriteriaLabel(key)}
                        </Typography>
                        <Typography variant="h6">
                          {criterion.score}/10
                        </Typography>
                      </Box>
                      <Rating value={criterion.score / 2} readOnly size="small" />
                      {criterion.comments && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {criterion.comments}
                        </Typography>
                      )}
                    </Paper>
                  </Grid>
                ))}
              </Grid>

              {selectedEvaluation.overallComments && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Overall Comments
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="body2">
                      {selectedEvaluation.overallComments}
                    </Typography>
                  </Paper>
                </Box>
              )}

              {selectedEvaluation.recommendations && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Recommendations
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'primary.50' }}>
                    <Typography variant="body2">
                      {selectedEvaluation.recommendations}
                    </Typography>
                  </Paper>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Create Evaluation Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Evaluation</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Task"
                  value={formData.taskId}
                  onChange={(e) => {
                    const selectedTask = availableTasks.find(t => t.id === e.target.value);
                    setFormData(prev => ({ 
                      ...prev, 
                      taskId: e.target.value,
                      internId: selectedTask?.assignedTo.id || ''
                    }));
                  }}
                  margin="normal"
                  required
                >
                  {availableTasks.map((task) => (
                    <MenuItem key={task.id} value={task.id}>
                      {task.title} - {task.assignedTo.firstName} {task.assignedTo.lastName}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Intern"
                  value={interns.find(i => i.id === formData.internId)?.firstName + ' ' + interns.find(i => i.id === formData.internId)?.lastName || ''}
                  margin="normal"
                  disabled
                  helperText="Automatically selected based on task"
                />
              </Grid>
            </Grid>

            <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
              Evaluation Criteria (1-10 scale)
            </Typography>

            <Grid container spacing={2}>
              {Object.entries(formData.criteria).map(([key, criterion]) => (
                <Grid item xs={12} key={key}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="body2" fontWeight="medium" gutterBottom>
                      {getCriteriaLabel(key)}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <Typography variant="body2">Score:</Typography>
                      <Rating
                        value={criterion.score / 2}
                        onChange={(_, newValue) => {
                          setFormData(prev => ({
                            ...prev,
                            criteria: {
                              ...prev.criteria,
                              [key as keyof typeof prev.criteria]: { 
                                ...prev.criteria[key as keyof typeof prev.criteria], 
                                score: (newValue || 0) * 2 
                              }
                            }
                          }));
                        }}
                        max={5}
                      />
                      <Typography variant="h6">
                        {criterion.score}/10
                      </Typography>
                    </Box>
                    <TextField
                      fullWidth
                      label="Comments"
                      multiline
                      rows={2}
                      value={criterion.comments}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          criteria: {
                            ...prev.criteria,
                            [key as keyof typeof prev.criteria]: { 
                              ...prev.criteria[key as keyof typeof prev.criteria], 
                              comments: e.target.value 
                            }
                          }
                        }));
                      }}
                      size="small"
                    />
                  </Paper>
                </Grid>
              ))}
            </Grid>

            <TextField
              fullWidth
              label="Overall Comments"
              multiline
              rows={3}
              value={formData.overallComments}
              onChange={(e) => setFormData(prev => ({ ...prev, overallComments: e.target.value }))}
              margin="normal"
            />

            <TextField
              fullWidth
              label="Recommendations"
              multiline
              rows={3}
              value={formData.recommendations}
              onChange={(e) => setFormData(prev => ({ ...prev, recommendations: e.target.value }))}
              margin="normal"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveEvaluation} disabled={loading || !formData.taskId}>
            {loading ? <CircularProgress size={20} /> : 'Create Evaluation'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EvaluationsPage;
