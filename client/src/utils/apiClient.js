/**
 * API Client Utility
 * Centralized HTTP client for communicating with the backend API
 */

import axios from 'axios';

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies for authentication
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  register: (userData) => apiClient.post('/auth/register', userData),
  logout: () => apiClient.post('/auth/logout'),
  getProfile: () => apiClient.get('/auth/profile'),
  refreshToken: () => apiClient.post('/auth/refresh'),
};

export const coursesAPI = {
  getAll: () => apiClient.get('/courses'),
  getById: (id) => apiClient.get(`/courses/${id}`),
  create: (courseData) => apiClient.post('/courses', courseData),
  update: (id, courseData) => apiClient.put(`/courses/${id}`, courseData),
  delete: (id) => apiClient.delete(`/courses/${id}`),
};

export const chatAPI = {
  sendMessage: (conversationId, message) => 
    apiClient.post(`/chat/${conversationId}/messages`, { message }),
  getConversations: () => apiClient.get('/chat/conversations'),
  getConversation: (id) => apiClient.get(`/chat/conversations/${id}`),
  createConversation: (data) => apiClient.post('/chat/conversations', data),
  deleteConversation: (id) => apiClient.delete(`/chat/conversations/${id}`),
};

export const adminAPI = {
  getUsers: () => apiClient.get('/admin/users'),
  getAnalytics: () => apiClient.get('/admin/analytics'),
  getSystemStats: () => apiClient.get('/admin/system'),
  updateUser: (id, userData) => apiClient.put(`/admin/users/${id}`, userData),
  deleteUser: (id) => apiClient.delete(`/admin/users/${id}`),
};

export default apiClient;
