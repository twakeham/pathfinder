#!/usr/bin/env node

/**
 * Pathfinder LLM Playground - Server Entry Point
 * Starts the Express server with database connection and graceful shutdown
 */

const app = require('./app');
const { config } = require('./config/config');
const { initializeDatabase, closeDatabaseConnection } = require('./config/database');
const { initializeSocketServer, closeSocketServer } = require('./websocket/socketServer');

// Configure uncaught exception handling
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  console.error('Stack:', err.stack);
  process.exit(1);
});

// Configure unhandled promise rejection handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

/**
 * Start the server
 */
async function startServer() {
  try {
    // Validate environment configuration
    console.log('🔧 Validating environment configuration...');
    
    // Connect to database
    console.log('🔌 Connecting to database...');
    await initializeDatabase();
    console.log('✅ Database connected successfully');
    
    // Start HTTP server
    const port = config.env.port;
    const host = config.env.host || 'localhost';
    
    const server = app.listen(port, host, () => {
      console.log('🚀 Pathfinder server started successfully!');
      console.log(`📍 Server running at: http://${host}:${port}`);
      console.log(`🌍 Environment: ${config.env.NODE_ENV}`);
      console.log(`🏥 Health check: http://${host}:${port}/health`);
      console.log(`🔗 API endpoint: http://${host}:${port}/api`);
      
      if (config.env.NODE_ENV === 'development') {
        console.log(`🎨 Frontend dev server: http://localhost:5173`);
        console.log(`📚 API documentation will be available at: http://${host}:${port}/api-docs`);
      }
      
      console.log('✨ Server ready to accept connections!');
    });

    // Configure server timeouts
    server.timeout = 120000; // 2 minutes
    server.keepAliveTimeout = 120000;
    server.headersTimeout = 121000;

    // Initialize WebSocket server  
    console.log('🔌 Initializing WebSocket server...');
    const socketServer = initializeSocketServer(server);
    console.log('✅ WebSocket server integrated with HTTP server');

    // Handle server errors
    server.on('error', (error) => {
      if (error.syscall !== 'listen') {
        throw error;
      }

      const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

      switch (error.code) {
        case 'EACCES':
          console.error(`❌ ${bind} requires elevated privileges`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          console.error(`❌ ${bind} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });

    // Handle graceful shutdown
    const gracefulShutdown = async (signal) => {
      console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
      
      // Stop accepting new connections
      server.close(async () => {
        console.log('🔌 HTTP server closed');
        
        try {
          // Close WebSocket server
          closeSocketServer();
          console.log('🔌 WebSocket server closed');
          
          // Close database connection
          await closeDatabaseConnection();
          console.log('💾 Database connection closed');
          
          console.log('✅ Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force close after 30 seconds
      setTimeout(() => {
        console.error('⚠️  Forcing shutdown due to timeout');
        process.exit(1);
      }, 30000);
    };

    // Register shutdown handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Keep the process alive
    return server;

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    console.error('Stack:', error.stack);
    
    // Ensure connections are closed on startup failure
    try {
      closeSocketServer();
      await closeDatabaseConnection();
    } catch (cleanupError) {
      console.error('❌ Error during startup failure cleanup:', cleanupError);
    }
    
    process.exit(1);
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  startServer().catch((error) => {
    console.error('❌ Fatal error starting server:', error);
    process.exit(1);
  });
}

module.exports = { startServer };
