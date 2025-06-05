import { Server } from 'socket.io';
import authService from './authService.js';

class WebSocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map();
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST']
      }
    });

    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        const decoded = await authService.validateToken(token);
        socket.userId = decoded.userId;
        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });

    this.io.on('connection', (socket) => {
      console.log(`User ${socket.userId} connected`);
      this.connectedUsers.set(socket.userId, socket.id);

      // Handle user presence
      socket.on('user_online', () => {
        socket.broadcast.emit('user_status_change', {
          userId: socket.userId,
          status: 'online'
        });
      });

      socket.on('disconnect', () => {
        console.log(`User ${socket.userId} disconnected`);
        this.connectedUsers.delete(socket.userId);
        
        socket.broadcast.emit('user_status_change', {
          userId: socket.userId,
          status: 'offline'
        });
      });
    });
  }

  // Send incoming call notification
  notifyIncomingCall(toUserId, callData) {
    const socketId = this.connectedUsers.get(toUserId);
    if (socketId) {
      this.io.to(socketId).emit('incoming_call', {
        callId: callData.callId,
        fromUserId: callData.fromUserId,
        fromDisplayName: callData.fromDisplayName,
        callType: callData.callType,
        timestamp: new Date().toISOString()
      });
      return true;
    }
    return false; // User not connected, will need push notification
  }

  // Notify call status changes
  notifyCallStatusChange(userId, callId, status, additionalData = {}) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit('call_status_change', {
        callId,
        status,
        ...additionalData,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Check if user is online
  isUserOnline(userId) {
    return this.connectedUsers.has(userId);
  }

  // Get online users count
  getOnlineUsersCount() {
    return this.connectedUsers.size;
  }
}

export default new WebSocketService();