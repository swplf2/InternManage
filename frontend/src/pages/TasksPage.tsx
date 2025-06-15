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
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  MoreVert,
  Download,
  CheckCircle,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { taskService } from '../services/taskService';
import { Task } from '../types';
import CreateTaskDialog from '../components/CreateTaskDialog';
import TaskWorkspace from '../components/TaskWorkspace';

const TasksPage: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalTasks, setTotalTasks] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [selectedTaskForWork, setSelectedTaskForWork] = useState<Task | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedTaskForMenu, setSelectedTaskForMenu] = useState<Task | null>(null);

  useEffect(() => {
    fetchTasks();  }, [page, rowsPerPage, statusFilter, priorityFilter]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await taskService.getTasks({
        page: page + 1,
        limit: rowsPerPage,
        status: statusFilter || undefined,        priority: priorityFilter || undefined,
      });
      setTasks(response.tasks);
      setTotalTasks(response.total);
      
      // Update selectedTaskForWork if it exists and workspace is open
      if (selectedTaskForWork && workspaceOpen) {
        const updatedTask = response.tasks.find(t => t.id === selectedTaskForWork.id);
        if (updatedTask) {
          setSelectedTaskForWork(updatedTask);
        }
      }
    } catch (err: any) {
      setError('Failed to load tasks');
      console.error('Fetch tasks error:', err);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not_started':
        return 'default';
      case 'in_progress':
        return 'primary';
      case 'submitted':
        return 'warning';
      case 'under_revision':
        return 'error';
      case 'completed':
        return 'success';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'default';
      case 'medium':
        return 'primary';
      case 'high':
        return 'warning';
      case 'urgent':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleViewTask = (task: Task) => {
    setSelectedTask(task);
    setDialogOpen(true);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, task: Task) => {
    setMenuAnchor(event.currentTarget);
    setSelectedTaskForMenu(task);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedTaskForMenu(null);
  };

  const handleSubmitTask = async (task: Task) => {
    try {
      await taskService.submitTask(task.id);
      fetchTasks();
      handleMenuClose();
    } catch (err: any) {
      setError('Failed to submit task');
    }
  };  const handleUpdateTaskStatus = async (task: Task, status: Task['status']) => {
    try {
      await taskService.updateTask(task.id, { status });
      fetchTasks();
      handleMenuClose();
    } catch (err: any) {
      setError('Failed to update task status');
    }
  };

  const canSubmitTask = (task: Task) => {
    return user?.role === 'intern' && 
           task.assignedTo.id === user.id && 
           task.status === 'in_progress';
  };  const canUpdateTask = (task: Task) => {
    return user?.role === 'admin' || 
           (user?.role === 'intern' && task.assignedTo.id === user.id);
  };

  const canWorkOnTask = (task: Task): boolean => {
    if (user?.role !== 'intern') return false;
    if (task.assignedTo.id !== user.id) return false;
    return task.status === 'not_started' || task.status === 'in_progress';
  };

  const handleWorkOnTask = (task: Task) => {
    setSelectedTaskForWork(task);
    setWorkspaceOpen(true);
  };

  const handleCloseWorkspace = () => {
    setWorkspaceOpen(false);
    setSelectedTaskForWork(null);
  };

  if (loading && tasks.length === 0) {
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
          {user?.role === 'admin' ? 'All Tasks' : 'My Tasks'}
        </Typography>{user?.role === 'admin' && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateTaskOpen(true)}
          >
            Create Task
          </Button>
        )}
      </Box>      {error && (
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
        <Box display="flex" gap={2} alignItems="center">
          <TextField
            select
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            size="small"
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="not_started">Not Started</MenuItem>
            <MenuItem value="in_progress">In Progress</MenuItem>
            <MenuItem value="submitted">Submitted</MenuItem>
            <MenuItem value="under_revision">Under Revision</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
          </TextField>

          <TextField
            select
            label="Priority"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            size="small"
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">All Priorities</MenuItem>
            <MenuItem value="low">Low</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="high">High</MenuItem>
            <MenuItem value="urgent">Urgent</MenuItem>
          </TextField>
        </Box>
      </Paper>

      {/* Tasks Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Priority</TableCell>
              {user?.role === 'admin' && <TableCell>Assigned To</TableCell>}
              <TableCell>Languages</TableCell>
              <TableCell>Deadline</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks.map((task) => (
              <TableRow 
                key={task.id} 
                hover
              >
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {task.title}
                  </Typography>
                  {task.description && (
                    <Typography variant="caption" color="text.secondary">
                      {task.description.substring(0, 100)}
                      {task.description.length > 100 ? '...' : ''}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={task.type.charAt(0).toUpperCase() + task.type.slice(1)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={formatStatus(task.status)}
                    color={getStatusColor(task.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    color={getPriorityColor(task.priority)}
                    size="small"
                  />
                </TableCell>
                {user?.role === 'admin' && (
                  <TableCell>
                    {task.assignedTo.firstName} {task.assignedTo.lastName}
                  </TableCell>
                )}
                <TableCell>
                  <Typography variant="body2">
                    {task.sourceLanguage} → {task.targetLanguage}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    color={task.isOverdue ? 'error' : 'text.primary'}
                  >
                    {format(new Date(task.deadline), 'MMM dd, yyyy')}
                  </Typography>
                </TableCell>                <TableCell>
                  <Tooltip title="View Details">
                    <IconButton size="small" onClick={() => handleViewTask(task)}>
                      <Visibility />
                    </IconButton>
                  </Tooltip>
                  {canWorkOnTask(task) && (
                    <Tooltip title="Work on Task">
                      <IconButton 
                        size="small" 
                        onClick={() => handleWorkOnTask(task)}
                        color="primary"
                      >
                        <Edit />
                      </IconButton>
                    </Tooltip>
                  )}
                  {canUpdateTask(task) && (
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, task)}
                    >
                      <MoreVert />
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
          count={totalTasks}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Task Details Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Task Details</DialogTitle>
        <DialogContent>
          {selectedTask && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedTask.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {selectedTask.description}
              </Typography>
              
              <Box display="flex" gap={2} mb={2}>
                <Chip label={`Type: ${selectedTask.type}`} />
                <Chip label={`Status: ${formatStatus(selectedTask.status)}`} color={getStatusColor(selectedTask.status)} />
                <Chip label={`Priority: ${selectedTask.priority}`} color={getPriorityColor(selectedTask.priority)} />
              </Box>

              <Typography variant="body2" paragraph>
                <strong>Languages:</strong> {selectedTask.sourceLanguage} → {selectedTask.targetLanguage}
              </Typography>
              
              <Typography variant="body2" paragraph>
                <strong>Deadline:</strong> {format(new Date(selectedTask.deadline), 'PPP')}
              </Typography>

              {selectedTask.instructions && (
                <Typography variant="body2" paragraph>
                  <strong>Instructions:</strong> {selectedTask.instructions}
                </Typography>
              )}

              {selectedTask.sourceDocument && (
                <Box mt={2}>
                  <Typography variant="body2" gutterBottom>
                    <strong>Source Document:</strong>
                  </Typography>
                  <Button
                    startIcon={<Download />}
                    onClick={() => window.open(`/api/documents/download/${selectedTask.sourceDocument?.filename}`, '_blank')}
                  >
                    {selectedTask.sourceDocument.originalName}
                  </Button>
                </Box>
              )}

              {selectedTask.translatedDocument && (
                <Box mt={2}>
                  <Typography variant="body2" gutterBottom>
                    <strong>Translated Document:</strong>
                  </Typography>
                  <Button
                    startIcon={<Download />}
                    onClick={() => window.open(`/api/documents/download/${selectedTask.translatedDocument?.filename}`, '_blank')}
                  >
                    {selectedTask.translatedDocument.originalName}
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        {selectedTaskForMenu && canSubmitTask(selectedTaskForMenu) && (
          <MenuItem onClick={() => handleSubmitTask(selectedTaskForMenu)}>
            <ListItemIcon>
              <CheckCircle />
            </ListItemIcon>
            <ListItemText>Submit Task</ListItemText>
          </MenuItem>
        )}
        
        {selectedTaskForMenu && user?.role === 'intern' && selectedTaskForMenu.status === 'not_started' && (
          <MenuItem onClick={() => handleUpdateTaskStatus(selectedTaskForMenu, 'in_progress')}>
            <ListItemIcon>
              <Edit />
            </ListItemIcon>
            <ListItemText>Start Task</ListItemText>
          </MenuItem>        )}
      </Menu>      {/* Create Task Dialog */}
      <CreateTaskDialog
        open={createTaskOpen}        onClose={() => setCreateTaskOpen(false)}
        onTaskCreated={() => {
          setCreateTaskOpen(false);
          fetchTasks(); // Refresh tasks list
        }}      />

      {/* Task Workspace */}
      <TaskWorkspace
        open={workspaceOpen}
        task={selectedTaskForWork}
        onClose={handleCloseWorkspace}
        onTaskUpdated={() => {
          fetchTasks(); // Refresh tasks list
        }}
      />
    </Container>
  );
};

export default TasksPage;
