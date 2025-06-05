import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
// import { fileURLToPath } from 'url';
// import { dirname} from 'path';
import connectMongoDB from './config/mongodb.js';
import productionPhoneService from './services/productionPhoneService.js';

// Load environment variables
dotenv.config();

if (process.env.NODE_ENV === 'development') {
  dotenv.config({ path: '.env.test' });
}


//const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database connections
async function initializeDatabases() {
  try {
    await connectMongoDB();
  } catch (error) {
    console.log('⚠️ Failed to connect to databases, continuing anyway...');
  }
}

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 100 requests per windowMs
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
    message: 'Phone App Backend API',
    version: '1.0.0',
    status: 'running'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Import and use route modules
import authRoutes from './routes/auth.js';
import contactRoutes from './routes/contacts.js';
import callRoutes from './routes/callsManagement.js';

app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/calls', callRoutes);

app.get('/health/services', async (req, res) => {
  try {
    const healthStatus = await productionPhoneService.healthCheck();
    const stats = await productionPhoneService.getStats();
    
    res.json({
      status: healthStatus.healthy ? 'healthy' : 'unhealthy',
      services: healthStatus.services,
      statistics: stats,
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
  console.log(next);
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Start server and initialize databases
async function startServer() {
  try {
    // Initialize databases first
    await initializeDatabases();
    
    // Start the HTTP server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log('📱 Phone App Backend API');
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the application
startServer();

export default app;