const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config/config');

// Create Express application
const app = express();

// Trust proxy (for deployment behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware - Helmet for security headers
app.use(helmet({
  crossOriginEmbedderPolicy: false, // Allow embedding for development
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'"],
    },
  },
}));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',  // React dev server
      'http://localhost:5173',  // Vite dev server
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
    ];
    
    // In production, add production URLs
    if (config.NODE_ENV === 'production') {
      allowedOrigins.push(config.FRONTEND_URL);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies/auth headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));

// Request logging with Morgan
if (config.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' })); // JSON payloads
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // URL-encoded data

// Health check endpoint
app.get('/health', (req, res) => {
  const uptime = process.uptime();
  const memUsage = process.memoryUsage();
  
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    uptime: uptime,
    memory: {
      used: memUsage.heapUsed,
      total: memUsage.heapTotal
    }
  });
});

// API routes placeholder
app.get('/api', (req, res) => {
  res.json({
    message: 'Pathfinder LLM Playground API',
    version: '1.0.0',
    environment: config.NODE_ENV
  });
});

// Catch-all for undefined routes - must be the last middleware
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  // CORS error handling
  if (err.message === 'Not allowed by CORS') {
    return res.status(500).json({
      success: false,
      error: 'CORS Error'
    });
  }
  
  // Default error handling
  const statusCode = err.statusCode || 500;
  const message = config.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;
  
  console.error('Error:', err);
  
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(config.NODE_ENV === 'development' && { stack: err.stack })
  });
});

module.exports = app;
