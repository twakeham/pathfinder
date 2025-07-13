/**
 * WebSocket Server Configuration with Socket.io
 * Handles real-time communication for chat functionality
 */

const { Server } = require('socket.io');
const { config } = require('../config/config');

/**
 * WebSocket Server class for managing Socket.io connections
 */
class SocketServer {
  constructor() {
    this.io = null;
    this.server = null;
    this.connectedUsers = new Map(); // userId -> socket.id mapping
    this.userSockets = new Map();    // socket.id -> user info mapping
    this.activeRooms = new Set();    // Track active chat rooms
    this.connectionCount = 0;
  }

  /**
   * Initialize the Socket.io server
   * @param {Object} httpServer - Express HTTP server instance
   * @returns {Object} Socket.io server instance
   */
  initialize(httpServer) {
    try {
      console.log('🔌 Initializing Socket.io WebSocket server...');
      
      // Create Socket.io server with configuration
      this.io = new Server(httpServer, {
        cors: {
          origin: this.getAllowedOrigins(),
          methods: ['GET', 'POST'],
          allowedHeaders: ['Content-Type', 'Authorization'],
          credentials: true
        },
        transports: ['websocket', 'polling'],
        allowEIO3: true, // Allow Engine.IO v3 clients
        pingTimeout: 60000, // 60 seconds
        pingInterval: 25000, // 25 seconds
        maxHttpBufferSize: 1e6, // 1MB max message size
        allowRequest: (req, callback) => {
          // Optional: Add custom request validation here
          callback(null, true);
        }
      });

      this.server = httpServer;
      this.setupEventHandlers();
      
      console.log('✅ Socket.io server initialized successfully');
      console.log(`🔗 WebSocket server ready for connections`);
      console.log(`📡 Allowed origins: ${this.getAllowedOrigins().join(', ')}`);
      
      return this.io;
      
    } catch (error) {
      console.error('❌ Failed to initialize Socket.io server:', error);
      throw error;
    }
  }

  /**
   * Get allowed CORS origins for WebSocket connections
   * @returns {Array} Array of allowed origin URLs
   */
  getAllowedOrigins() {
    const origins = [
      'http://localhost:3000',  // React dev server
      'http://localhost:5173',  // Vite dev server
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
    ];

    // Add production URLs if configured
    if (config.env.NODE_ENV === 'production' && config.frontend?.url) {
      origins.push(config.frontend.url);
    }

    return origins;
  }

  /**
   * Set up Socket.io event handlers
   */
  setupEventHandlers() {
    if (!this.io) {
      throw new Error('Socket.io server not initialized');
    }

    // Handle new client connections
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });

    // Handle server-level events
    this.io.engine.on('connection_error', (err) => {
      console.error('🔴 Socket.io connection error:', err);
    });

    console.log('✅ Socket.io event handlers configured');
  }

  /**
   * Handle new socket connection
   * @param {Object} socket - Socket.io socket instance
   */
  handleConnection(socket) {
    this.connectionCount++;
    const clientInfo = this.getClientInfo(socket);
    
    console.log(`🟢 Client connected: ${socket.id} from ${clientInfo.ip} (${this.connectionCount} total)`);

    // Set up socket event handlers
    this.setupSocketEventHandlers(socket);

    // Send welcome message
    socket.emit('connected', {
      socketId: socket.id,
      timestamp: new Date().toISOString(),
      message: 'Connected to Pathfinder WebSocket server'
    });

    // Join a general lobby room by default
    socket.join('lobby');
    console.log(`📨 Socket ${socket.id} joined lobby`);
  }

  /**
   * Set up event handlers for individual socket connections
   * @param {Object} socket - Socket.io socket instance
   */
  setupSocketEventHandlers(socket) {
    // Handle client disconnection
    socket.on('disconnect', (reason) => {
      this.handleDisconnection(socket, reason);
    });

    // Handle connection errors
    socket.on('error', (error) => {
      console.error(`🔴 Socket error for ${socket.id}:`, error);
    });

    // Handle authentication (placeholder for future implementation)
    socket.on('authenticate', (data) => {
      this.handleAuthentication(socket, data);
    });

    // Handle joining chat rooms
    socket.on('join-room', (data) => {
      this.handleJoinRoom(socket, data);
    });

    // Handle leaving chat rooms
    socket.on('leave-room', (data) => {
      this.handleLeaveRoom(socket, data);
    });

    // Handle chat messages (placeholder for future implementation)
    socket.on('chat-message', (data) => {
      this.handleChatMessage(socket, data);
    });

    // Handle typing indicators
    socket.on('typing-start', (data) => {
      this.handleTypingStart(socket, data);
    });

    socket.on('typing-stop', (data) => {
      this.handleTypingStop(socket, data);
    });

    // Handle ping for connection testing
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date().toISOString() });
    });
  }

  /**
   * Handle socket disconnection
   * @param {Object} socket - Socket.io socket instance
   * @param {string} reason - Disconnection reason
   */
  handleDisconnection(socket, reason) {
    this.connectionCount--;
    const userInfo = this.userSockets.get(socket.id);
    
    console.log(`🔴 Client disconnected: ${socket.id} (reason: ${reason}) (${this.connectionCount} remaining)`);
    
    // Clean up user mappings
    if (userInfo) {
      this.connectedUsers.delete(userInfo.userId);
      this.userSockets.delete(socket.id);
      
      // Notify other users if this was an authenticated user
      if (userInfo.userId) {
        socket.broadcast.emit('user-offline', {
          userId: userInfo.userId,
          username: userInfo.username,
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  /**
   * Handle user authentication (placeholder)
   * @param {Object} socket - Socket.io socket instance
   * @param {Object} data - Authentication data
   */
  handleAuthentication(socket, data) {
    try {
      // TODO: Implement JWT token validation when auth system is ready
      console.log(`🔐 Authentication attempt for socket ${socket.id}`);
      
      // For now, just acknowledge the authentication request
      socket.emit('authentication-status', {
        success: false,
        message: 'Authentication system not yet implemented',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error(`❌ Authentication error for socket ${socket.id}:`, error);
      socket.emit('authentication-status', {
        success: false,
        message: 'Authentication failed',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Handle joining a chat room
   * @param {Object} socket - Socket.io socket instance
   * @param {Object} data - Room join data
   */
  handleJoinRoom(socket, data) {
    try {
      const { roomId, roomType = 'chat' } = data;
      
      if (!roomId) {
        socket.emit('room-error', { message: 'Room ID is required' });
        return;
      }

      // Leave current rooms (except lobby)
      const currentRooms = Array.from(socket.rooms).filter(room => room !== socket.id && room !== 'lobby');
      currentRooms.forEach(room => {
        socket.leave(room);
        console.log(`📤 Socket ${socket.id} left room: ${room}`);
      });

      // Join new room
      socket.join(roomId);
      this.activeRooms.add(roomId);
      
      console.log(`📥 Socket ${socket.id} joined room: ${roomId} (type: ${roomType})`);
      
      // Notify the client
      socket.emit('room-joined', {
        roomId,
        roomType,
        timestamp: new Date().toISOString()
      });

      // Notify other users in the room
      socket.to(roomId).emit('user-joined-room', {
        roomId,
        socketId: socket.id,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error(`❌ Error joining room for socket ${socket.id}:`, error);
      socket.emit('room-error', {
        message: 'Failed to join room',
        error: error.message
      });
    }
  }

  /**
   * Handle leaving a chat room
   * @param {Object} socket - Socket.io socket instance
   * @param {Object} data - Room leave data
   */
  handleLeaveRoom(socket, data) {
    try {
      const { roomId } = data;
      
      if (!roomId) {
        socket.emit('room-error', { message: 'Room ID is required' });
        return;
      }

      socket.leave(roomId);
      console.log(`📤 Socket ${socket.id} left room: ${roomId}`);
      
      // Notify the client
      socket.emit('room-left', {
        roomId,
        timestamp: new Date().toISOString()
      });

      // Notify other users in the room
      socket.to(roomId).emit('user-left-room', {
        roomId,
        socketId: socket.id,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error(`❌ Error leaving room for socket ${socket.id}:`, error);
      socket.emit('room-error', {
        message: 'Failed to leave room',
        error: error.message
      });
    }
  }

  /**
   * Handle chat messages (placeholder)
   * @param {Object} socket - Socket.io socket instance
   * @param {Object} data - Message data
   */
  handleChatMessage(socket, data) {
    try {
      // TODO: Implement message validation and storage
      console.log(`💬 Chat message from socket ${socket.id}:`, data);
      
      // For now, just echo the message back
      socket.emit('message-status', {
        success: false,
        message: 'Chat message handling not yet implemented',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error(`❌ Error handling chat message for socket ${socket.id}:`, error);
      socket.emit('message-error', {
        message: 'Failed to send message',
        error: error.message
      });
    }
  }

  /**
   * Handle typing start indicator
   * @param {Object} socket - Socket.io socket instance
   * @param {Object} data - Typing data
   */
  handleTypingStart(socket, data) {
    const { roomId } = data;
    if (roomId) {
      socket.to(roomId).emit('user-typing-start', {
        socketId: socket.id,
        roomId,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Handle typing stop indicator
   * @param {Object} socket - Socket.io socket instance
   * @param {Object} data - Typing data
   */
  handleTypingStop(socket, data) {
    const { roomId } = data;
    if (roomId) {
      socket.to(roomId).emit('user-typing-stop', {
        socketId: socket.id,
        roomId,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get client connection information
   * @param {Object} socket - Socket.io socket instance
   * @returns {Object} Client information
   */
  getClientInfo(socket) {
    return {
      id: socket.id,
      ip: socket.handshake.address,
      userAgent: socket.handshake.headers['user-agent'],
      origin: socket.handshake.headers.origin,
      transport: socket.conn.transport.name,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get server statistics
   * @returns {Object} Server statistics
   */
  getStats() {
    return {
      connectedClients: this.connectionCount,
      authenticatedUsers: this.connectedUsers.size,
      activeRooms: this.activeRooms.size,
      serverUptime: process.uptime(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Broadcast message to all connected clients
   * @param {string} event - Event name
   * @param {Object} data - Message data
   */
  broadcast(event, data) {
    if (this.io) {
      this.io.emit(event, data);
      console.log(`📡 Broadcasted ${event} to all clients`);
    }
  }

  /**
   * Send message to specific room
   * @param {string} roomId - Room ID
   * @param {string} event - Event name
   * @param {Object} data - Message data
   */
  sendToRoom(roomId, event, data) {
    if (this.io) {
      this.io.to(roomId).emit(event, data);
      console.log(`📨 Sent ${event} to room: ${roomId}`);
    }
  }

  /**
   * Get Socket.io server instance
   * @returns {Object} Socket.io server instance
   */
  getServer() {
    return this.io;
  }

  /**
   * Close the WebSocket server
   */
  close() {
    if (this.io) {
      console.log('🔌 Closing WebSocket server...');
      this.io.close();
      this.connectedUsers.clear();
      this.userSockets.clear();
      this.activeRooms.clear();
      this.connectionCount = 0;
      console.log('✅ WebSocket server closed');
    }
  }
}

// Create singleton instance
const socketServer = new SocketServer();

module.exports = {
  SocketServer,
  socketServer,
  initializeSocketServer: (httpServer) => socketServer.initialize(httpServer),
  getSocketServer: () => socketServer,
  closeSocketServer: () => socketServer.close()
};
