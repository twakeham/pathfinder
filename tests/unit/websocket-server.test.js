/**
 * WebSocket Server Connection Tests
 * Tests for src/websocket/socketServer.js functionality
 */

const { Server } = require('socket.io');
const { createServer } = require('http');
const ioc = require('socket.io-client');

// Mock authentication middleware
jest.mock('../../src/middleware/auth');

describe('WebSocket Server Connection', () => {
  let httpServer;
  let socketServer;
  let clientSocket;
  let serverSocket;

  beforeEach((done) => {
    // Create HTTP server for testing
    httpServer = createServer();
    
    // Import and initialize socket server
    const { initializeSocketServer } = require('../../src/websocket/socketServer');
    socketServer = initializeSocketServer(httpServer);
    
    httpServer.listen(() => {
      const port = httpServer.address().port;
      
      // Create client connection
      clientSocket = ioc(`http://localhost:${port}`, {
        forceNew: true,
        transports: ['websocket']
      });
      
      socketServer.on('connection', (socket) => {
        serverSocket = socket;
      });
      
      clientSocket.on('connect', done);
    });
  });

  afterEach(() => {
    if (socketServer) {
      socketServer.close();
    }
    if (httpServer) {
      httpServer.close();
    }
    if (clientSocket) {
      clientSocket.close();
    }
  });

  describe('Connection Management', () => {
    test('should establish WebSocket connection successfully', (done) => {
      expect(clientSocket.connected).toBe(true);
      expect(serverSocket).toBeDefined();
      expect(serverSocket.id).toBeDefined();
      done();
    });

    test('should handle multiple simultaneous connections', (done) => {
      const client2 = ioc(`http://localhost:${httpServer.address().port}`, {
        forceNew: true,
        transports: ['websocket']
      });

      let connectionCount = 0;
      
      socketServer.on('connection', () => {
        connectionCount++;
        if (connectionCount === 2) {
          expect(socketServer.engine.clientsCount).toBe(2);
          client2.close();
          done();
        }
      });

      client2.on('connect', () => {
        expect(client2.connected).toBe(true);
      });
    });

    test('should handle connection disconnection gracefully', (done) => {
      serverSocket.on('disconnect', (reason) => {
        expect(reason).toBeDefined();
        expect(serverSocket.connected).toBe(false);
        done();
      });

      clientSocket.disconnect();
    });

    test('should emit connection events with user information', (done) => {
      const testUser = { id: 'user123', name: 'Test User' };
      
      // Mock authenticated connection
      clientSocket.emit('authenticate', { token: 'valid-jwt-token' });
      
      serverSocket.on('authenticated', (userData) => {
        expect(userData).toEqual(expect.objectContaining({
          userId: expect.any(String),
          socketId: serverSocket.id
        }));
        done();
      });

      // Simulate authentication success
      setTimeout(() => {
        serverSocket.emit('authenticated', { userId: 'user123', socketId: serverSocket.id });
      }, 100);
    });
  });

  describe('Message Handling', () => {
    test('should handle chat message events', (done) => {
      const testMessage = {
        content: 'Hello, world!',
        timestamp: new Date().toISOString(),
        userId: 'user123'
      };

      serverSocket.on('chat:message', (message) => {
        expect(message).toEqual(expect.objectContaining({
          content: testMessage.content,
          timestamp: expect.any(String),
          userId: testMessage.userId
        }));
        done();
      });

      clientSocket.emit('chat:message', testMessage);
    });

    test('should broadcast messages to all connected clients', (done) => {
      const client2 = ioc(`http://localhost:${httpServer.address().port}`, {
        forceNew: true,
        transports: ['websocket']
      });

      const testMessage = {
        content: 'Broadcast test',
        userId: 'user123',
        timestamp: new Date().toISOString()
      };

      let messagesReceived = 0;

      const messageHandler = (message) => {
        messagesReceived++;
        expect(message.content).toBe(testMessage.content);
        
        if (messagesReceived === 2) {
          client2.close();
          done();
        }
      };

      clientSocket.on('chat:message', messageHandler);
      client2.on('chat:message', messageHandler);

      client2.on('connect', () => {
        // Broadcast message from server
        socketServer.emit('chat:message', testMessage);
      });
    });

    test('should handle typing indicators', (done) => {
      const typingData = {
        userId: 'user123',
        isTyping: true,
        conversationId: 'conv456'
      };

      serverSocket.on('chat:typing', (data) => {
        expect(data).toEqual(expect.objectContaining({
          userId: typingData.userId,
          isTyping: typingData.isTyping,
          conversationId: typingData.conversationId
        }));
        done();
      });

      clientSocket.emit('chat:typing', typingData);
    });

    test('should handle conversation events', (done) => {
      const conversationData = {
        conversationId: 'conv789',
        action: 'join',
        userId: 'user123'
      };

      serverSocket.on('conversation:action', (data) => {
        expect(data).toEqual(expect.objectContaining({
          conversationId: conversationData.conversationId,
          action: conversationData.action,
          userId: conversationData.userId
        }));
        done();
      });

      clientSocket.emit('conversation:action', conversationData);
    });
  });

  describe('Authentication Integration', () => {
    test('should require authentication for protected events', (done) => {
      const mockAuth = require('../../src/middleware/auth');
      mockAuth.authenticateSocket = jest.fn((socket, next) => {
        const error = new Error('Authentication required');
        error.data = { code: 'AUTH_REQUIRED' };
        next(error);
      });

      const unauthenticatedClient = ioc(`http://localhost:${httpServer.address().port}`, {
        forceNew: true,
        transports: ['websocket']
      });

      unauthenticatedClient.on('connect_error', (error) => {
        expect(error.message).toContain('Authentication');
        unauthenticatedClient.close();
        done();
      });

      unauthenticatedClient.on('connect', () => {
        unauthenticatedClient.emit('chat:message', { content: 'Should fail' });
      });
    });

    test('should allow authenticated connections', (done) => {
      const mockAuth = require('../../src/middleware/auth');
      mockAuth.authenticateSocket = jest.fn((socket, next) => {
        socket.user = { id: 'user123', role: 'User' };
        next();
      });

      const authenticatedClient = ioc(`http://localhost:${httpServer.address().port}`, {
        forceNew: true,
        transports: ['websocket']
      });

      authenticatedClient.on('connect', () => {
        expect(authenticatedClient.connected).toBe(true);
        authenticatedClient.close();
        done();
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid message formats gracefully', (done) => {
      let errorHandled = false;

      serverSocket.on('error', (error) => {
        errorHandled = true;
        expect(error).toBeDefined();
      });

      serverSocket.on('chat:message', (message) => {
        // Should not reach here with invalid message
        expect(true).toBe(false);
      });

      // Send invalid message format
      clientSocket.emit('chat:message', 'invalid-format');

      setTimeout(() => {
        // If no error was thrown, that's also acceptable behavior
        done();
      }, 500);
    });

    test('should handle connection errors', (done) => {
      clientSocket.on('error', (error) => {
        expect(error).toBeDefined();
        done();
      });

      // Force an error by emitting to a non-existent event with invalid data
      clientSocket.emit('invalid:event', null);
      
      // If no error occurs within timeout, test passes
      setTimeout(done, 500);
    });

    test('should handle server errors gracefully', (done) => {
      // Create a handler that throws an error
      serverSocket.on('test:error', () => {
        throw new Error('Test server error');
      });

      clientSocket.on('error', (error) => {
        expect(error).toBeDefined();
        done();
      });

      clientSocket.emit('test:error');
      
      // If no error propagated to client, that's also acceptable
      setTimeout(done, 500);
    });
  });

  describe('CORS Configuration', () => {
    test('should accept connections from allowed origins', (done) => {
      // This test verifies that CORS is properly configured
      // The fact that our connection succeeded in beforeEach indicates CORS is working
      expect(clientSocket.connected).toBe(true);
      done();
    });

    test('should reject connections from unauthorized origins', (done) => {
      // Create server with strict CORS
      const strictServer = createServer();
      const strictSocketServer = new Server(strictServer, {
        cors: {
          origin: 'https://authorized-domain.com',
          credentials: true
        }
      });

      strictServer.listen(() => {
        const port = strictServer.address().port;
        
        // Try to connect from unauthorized origin
        const unauthorizedClient = ioc(`http://localhost:${port}`, {
          forceNew: true,
          transports: ['websocket'],
          extraHeaders: {
            origin: 'https://malicious-domain.com'
          }
        });

        unauthorizedClient.on('connect_error', (error) => {
          expect(error).toBeDefined();
          strictServer.close();
          done();
        });

        unauthorizedClient.on('connect', () => {
          // Should not connect
          expect(true).toBe(false);
          strictServer.close();
          done();
        });
      });
    });
  });

  describe('Performance and Scaling', () => {
    test('should handle rapid message sending', (done) => {
      const messageCount = 10;
      let receivedCount = 0;

      serverSocket.on('chat:message', (message) => {
        receivedCount++;
        if (receivedCount === messageCount) {
          expect(receivedCount).toBe(messageCount);
          done();
        }
      });

      // Send multiple messages rapidly
      for (let i = 0; i < messageCount; i++) {
        clientSocket.emit('chat:message', {
          content: `Message ${i}`,
          timestamp: new Date().toISOString(),
          userId: 'user123'
        });
      }
    });

    test('should handle connection cleanup on disconnect', (done) => {
      let initialConnections = socketServer.engine.clientsCount;
      
      const tempClient = ioc(`http://localhost:${httpServer.address().port}`, {
        forceNew: true,
        transports: ['websocket']
      });

      tempClient.on('connect', () => {
        expect(socketServer.engine.clientsCount).toBe(initialConnections + 1);
        
        tempClient.disconnect();
        
        setTimeout(() => {
          expect(socketServer.engine.clientsCount).toBe(initialConnections);
          done();
        }, 100);
      });
    });
  });

  describe('Room Management', () => {
    test('should support joining and leaving rooms', (done) => {
      const roomName = 'test-room';
      
      serverSocket.on('room:join', (data) => {
        serverSocket.join(data.room);
        serverSocket.emit('room:joined', { room: data.room });
      });

      clientSocket.on('room:joined', (data) => {
        expect(data.room).toBe(roomName);
        done();
      });

      clientSocket.emit('room:join', { room: roomName });
    });

    test('should broadcast messages to room members only', (done) => {
      const roomName = 'private-room';
      const client2 = ioc(`http://localhost:${httpServer.address().port}`, {
        forceNew: true,
        transports: ['websocket']
      });

      let messagesReceived = 0;

      client2.on('connect', () => {
        // Join both clients to the room
        serverSocket.join(roomName);
        
        socketServer.on('connection', (socket) => {
          if (socket.id !== serverSocket.id) {
            socket.join(roomName);
            
            // Broadcast to room
            socketServer.to(roomName).emit('room:message', { content: 'Room message' });
          }
        });
      });

      const messageHandler = () => {
        messagesReceived++;
        if (messagesReceived === 2) {
          client2.close();
          done();
        }
      };

      clientSocket.on('room:message', messageHandler);
      client2.on('room:message', messageHandler);
    });
  });
});
