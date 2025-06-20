import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { createServer } from 'http';
import connectMongoDB from './config/mongodb.js';

import productionPhoneService from './services/productionPhoneService.js';
import websocketService from './services/websocketService.js';
import callTimeoutService from './services/callTimeoutService.js';
import pushNotificationService from './services/pushNotificationService.js';
import callRecordingService from './services/callRecordingService.js';

// Import routes
import authRoutes from './routes/auth.js';
import contactRoutes from './routes/contacts.js';
import callRoutes from './routes/calls.js';
import notificationRoutes from './routes/notifications.js';
import recordingRoutes from './routes/recordings.js';

// Load environment variables
dotenv.config();

if (process.env.NODE_ENV === 'development') {
  dotenv.config({ path: '.env.test' });
}

const app = express();
const PORT = process.env.PORT || 3000;

// Create HTTP server (needed for Socket.IO)
const server = createServer(app);

// Initialize database connections
async function initializeDatabases() {
  try {
    console.log('🔄 Initializing database connections...');
    await connectMongoDB();
    console.log('✅ All databases connected successfully');
  } catch (error) {
    console.error('❌ Critical: Database connection failed:', error);
    if (process.env.NODE_ENV === 'production') {
      console.error('💥 Exiting due to database connection failure in production');
      process.exit(1);
    } else {
      console.log('⚠️ Continuing in development mode without some databases...');
    }
  }
}

// Initialize services
async function initializeServices() {
  try {
    console.log('🔄 Initializing services...');
    
    // Test phone service (includes Firebase)
    const phoneServiceHealth = await productionPhoneService.healthCheck();
    if (phoneServiceHealth.healthy) {
      console.log('✅ Phone service ready (Firebase SMS:', phoneServiceHealth.services.firebaseSms ? 'Enabled' : 'Disabled', ')');
      console.log('✅ Firebase Admin service ready');
    } else {
      console.warn('⚠️ Phone service issues:', phoneServiceHealth.warnings.join(', '));
    }
    
    // Initialize WebSocket service
    websocketService.initialize(server);
    console.log('🔌 WebSocket service initialized');
    
    // Start call timeout service
    callTimeoutService.start();
    console.log('⏰ Call timeout service started');
    
    console.log('✅ All services initialized');
  } catch (error) {
    console.error('❌ Service initialization failed:', error);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
}

// Security middleware
app.use(helmet());
app.use(cors({
  origin: [ 
    'http://localhost:3000',
    'http://localhost:8081',
    'http://localhost:19006',
    'http://localhost:19000',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// Logging
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Phone App Backend API with Firebase Auth',
    version: '1.0.0',
    status: 'running',
    auth: 'firebase',
    firebaseSms: productionPhoneService.smsEnabled
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    auth: 'firebase',
    firebaseSms: productionPhoneService.smsEnabled
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/recordings', recordingRoutes);

// FIXED: Enhanced health check using productionPhoneService
app.get('/health/services', async (req, res) => {
  try {
    // Get phone service health (includes Firebase)
    const phoneServiceHealth = await productionPhoneService.healthCheck();
    
    // Get other service stats
    const wsStats = {
      connectedUsers: websocketService.getOnlineUsersCount(),
      isActive: true
    };
    
    const timeoutStats = callTimeoutService.getStats();
    const pushStats = pushNotificationService.getStats();
    const recordingStats = callRecordingService.getStats();
    
    res.json({
      status: phoneServiceHealth.healthy ? 'healthy' : 'degraded',
      services: {
        phoneService: phoneServiceHealth,
        websocket: wsStats,
        callTimeout: timeoutStats,
        pushNotifications: pushStats,
        callRecording: recordingStats
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Start server
async function startServer() {
  try {
    // Initialize databases first
    await initializeDatabases();
    
    // Initialize services
    await initializeServices();
    
    // Start the HTTP server
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log('📱 Phone App Backend API with Firebase Auth');
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔌 WebSocket ready on ws://localhost:${PORT}`);
      console.log(`🔥 Firebase SMS: ${productionPhoneService.smsEnabled ? 'Enabled' : 'Disabled'}`);
      console.log(`📧 Firebase Admin: ${productionPhoneService.firebaseEnabled ? 'Enabled' : 'Disabled'}`);
    });
    
    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      console.log('📤 SIGTERM received, shutting down gracefully');
      callTimeoutService.stop();
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the application
startServer();

export default app;