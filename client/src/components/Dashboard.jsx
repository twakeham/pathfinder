/**
 * Dashboard Component
 * Main application dashboard after login
 */

import React from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  AppBar,
  Toolbar,
  IconButton,
} from '@mui/material';
import { LogoutOutlined, ChatOutlined, SchoolOutlined, AnalyticsOutlined } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const features = [
    {
      title: 'AI Chat Playground',
      description: 'Interact with LLM models and experiment with different prompts and parameters.',
      icon: <ChatOutlined fontSize="large" />,
      action: () => navigate('/chat'),
      color: '#2196f3',
    },
    {
      title: 'Learning Modules',
      description: 'Access structured learning content and training materials.',
      icon: <SchoolOutlined fontSize="large" />,
      action: () => navigate('/courses'),
      color: '#4caf50',
    },
    {
      title: 'Analytics & Reports',
      description: 'View usage statistics and learning progress analytics.',
      icon: <AnalyticsOutlined fontSize="large" />,
      action: () => navigate('/analytics'),
      color: '#ff9800',
    },
  ];

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Pathfinder - Welcome {user?.firstName || 'User'}
          </Typography>
          <IconButton color="inherit" onClick={handleLogout}>
            <LogoutOutlined />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body1" color="textSecondary" paragraph>
          Welcome to the LLM Playground and Training Tool. Choose a feature below to get started.
        </Typography>

        <Grid container spacing={3} sx={{ mt: 2 }}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    transition: 'transform 0.2s ease-in-out',
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      mb: 2,
                      color: feature.color,
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography gutterBottom variant="h5" component="h2" align="center">
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" align="center">
                    {feature.description}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                  <Button 
                    size="large" 
                    variant="contained" 
                    onClick={feature.action}
                    sx={{ backgroundColor: feature.color }}
                  >
                    Get Started
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {user?.role === 'admin' && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" gutterBottom>
              Admin Features
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => navigate('/admin')}
                  sx={{ p: 2 }}
                >
                  Admin Panel
                </Button>
              </Grid>
              <Grid item xs={12} md={6}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => navigate('/admin/users')}
                  sx={{ p: 2 }}
                >
                  User Management
                </Button>
              </Grid>
            </Grid>
          </Box>
        )}
      </Container>
    </>
  );
}

export default Dashboard;
