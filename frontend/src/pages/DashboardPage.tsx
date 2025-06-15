import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Assignment,
  People,
  Assessment,
  CheckCircle,
  Schedule,
  Warning,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { taskService } from '../services/taskService';
import { evaluationService } from '../services/evaluationService';
import { userService } from '../services/userService';

interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  totalInterns: number;
  averageScore: number;
}

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const fetchedRef = useRef(false);
  const fetchStats = useCallback(async () => {
    if (fetchedRef.current) return; // Prevent duplicate calls
    
    setLoading(true);
    setError('');
      try {      // Fetch task and evaluation stats
      const [taskStats, evaluationStats] = await Promise.all([
        taskService.getStatistics(),
        evaluationService.getStatistics(),
      ]);

      // Fetch user stats separately if admin
      let userStats = null;
      if (user?.role === 'admin') {
        userStats = await userService.getUsers({ role: 'intern' });
      }

      setStats({
        totalTasks: taskStats.overview.total,
        completedTasks: taskStats.overview.completed,
        inProgressTasks: taskStats.overview.inProgress,
        overdueTasks: taskStats.overview.overdue,
        totalInterns: userStats ? userStats.users.length : 0,
        averageScore: evaluationStats.overview.averageScore || 0,
      });

      fetchedRef.current = true;
    } catch (err: any) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    if (user && !fetchedRef.current) {
      fetchStats();
    }
  }, [user, fetchStats]);

  const StatCard: React.FC<{
    title: string;
    value: number | string;
    icon: React.ReactNode;
    color: string;
  }> = ({ title, value, icon, color }) => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center">
          <Box
            sx={{
              backgroundColor: color,
              borderRadius: '50%',
              width: 48,
              height: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2,
            }}
          >
            {icon}
          </Box>
          <Box>
            <Typography variant="h4" component="div">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </Typography>
            <Typography color="text.secondary">{title}</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Header */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h4" gutterBottom>
              Welcome back, {user?.firstName}!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {user?.role === 'admin' 
                ? 'Manage translation tasks and evaluate intern performance'
                : 'Track your translation progress and view feedback'
              }
            </Typography>
          </Paper>
        </Grid>

        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Tasks"
            value={stats?.totalTasks || 0}
            icon={<Assignment sx={{ color: 'white' }} />}
            color="#1976d2"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Completed Tasks"
            value={stats?.completedTasks || 0}
            icon={<CheckCircle sx={{ color: 'white' }} />}
            color="#4caf50"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="In Progress"
            value={stats?.inProgressTasks || 0}
            icon={<Schedule sx={{ color: 'white' }} />}
            color="#ff9800"
          />        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={(stats?.overdueTasks || 0) > 0 ? "Overdue Tasks" : "Average Score"}
            value={(stats?.overdueTasks || 0) > 0 ? (stats?.overdueTasks || 0) : `${(stats?.averageScore || 0).toFixed(1)}%`}
            icon={(stats?.overdueTasks || 0) > 0 ? <Warning sx={{ color: 'white' }} /> : <Assessment sx={{ color: 'white' }} />}
            color={(stats?.overdueTasks || 0) > 0 ? "#f44336" : "#9c27b0"}
          />
        </Grid>

        {/* Admin-only Stats */}
        {user?.role === 'admin' && (
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Interns"
              value={stats?.totalInterns || 0}
              icon={<People sx={{ color: 'white' }} />}
              color="#607d8b"
            />
          </Grid>
        )}

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              {user?.role === 'admin' ? (
                <>
                  <Grid item>
                    <Box
                      sx={{
                        p: 2,
                        border: '1px solid #e0e0e0',
                        borderRadius: 1,
                        cursor: 'pointer',
                        '&:hover': { backgroundColor: '#f5f5f5' },
                      }}
                      onClick={() => window.location.href = '/tasks/create'}
                    >
                      <Typography variant="body2">Create New Task</Typography>
                    </Box>
                  </Grid>
                  <Grid item>
                    <Box
                      sx={{
                        p: 2,
                        border: '1px solid #e0e0e0',
                        borderRadius: 1,
                        cursor: 'pointer',
                        '&:hover': { backgroundColor: '#f5f5f5' },
                      }}
                      onClick={() => window.location.href = '/users'}
                    >
                      <Typography variant="body2">Manage Interns</Typography>
                    </Box>
                  </Grid>
                  <Grid item>
                    <Box
                      sx={{
                        p: 2,
                        border: '1px solid #e0e0e0',
                        borderRadius: 1,
                        cursor: 'pointer',
                        '&:hover': { backgroundColor: '#f5f5f5' },
                      }}
                      onClick={() => window.location.href = '/evaluations'}
                    >
                      <Typography variant="body2">Review Evaluations</Typography>
                    </Box>
                  </Grid>
                </>
              ) : (
                <>
                  <Grid item>
                    <Box
                      sx={{
                        p: 2,
                        border: '1px solid #e0e0e0',
                        borderRadius: 1,
                        cursor: 'pointer',
                        '&:hover': { backgroundColor: '#f5f5f5' },
                      }}
                      onClick={() => window.location.href = '/tasks'}
                    >
                      <Typography variant="body2">View My Tasks</Typography>
                    </Box>
                  </Grid>
                  <Grid item>
                    <Box
                      sx={{
                        p: 2,
                        border: '1px solid #e0e0e0',
                        borderRadius: 1,
                        cursor: 'pointer',
                        '&:hover': { backgroundColor: '#f5f5f5' },
                      }}
                      onClick={() => window.location.href = '/profile'}
                    >
                      <Typography variant="body2">Update Profile</Typography>
                    </Box>
                  </Grid>
                  <Grid item>
                    <Box
                      sx={{
                        p: 2,
                        border: '1px solid #e0e0e0',
                        borderRadius: 1,
                        cursor: 'pointer',
                        '&:hover': { backgroundColor: '#f5f5f5' },
                      }}
                      onClick={() => window.location.href = '/evaluations'}
                    >
                      <Typography variant="body2">View Feedback</Typography>
                    </Box>
                  </Grid>
                </>
              )}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DashboardPage;
