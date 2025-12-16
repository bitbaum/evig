import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { initializeDatabase } from './utils/database';
import authRoutes from './routes/auth';
import contentRoutes from './routes/content';
import adminRoutes from './routes/admin';
import suggestionsRoutes from './routes/suggestions';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './middleware/logger';
import { rateLimiter } from './middleware/rateLimiter';
import { swaggerUi, specs } from './docs/swagger';
import { monitoring, getHealthMetrics } from './utils/monitoring';
import { env } from './utils/env';

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: env.NODE_ENV === 'production'
    ? env.FRONTEND_URL
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
  credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Monitoring middleware
app.use(monitoring.middleware());

// Logging middleware
app.use(logger);

// Rate limiting
app.use('/api/', rateLimiter);

// Health check endpoints
app.get('/health', async (req, res) => {
  const metrics = await getHealthMetrics();
  res.json(metrics);
});

app.get('/health/simple', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/suggestions', suggestionsRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
});

// Error handling middleware
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
async function startServer() {
  try {
    // Initialize database connection
    await initializeDatabase();

    app.listen(env.PORT, () => {
      console.log(`🚀 RevampIT CMS API running on port ${env.PORT}`);
      console.log(`📊 Health check: http://localhost:${env.PORT}/health`);
      console.log(`📊 Simple health: http://localhost:${env.PORT}/health/simple`);
      console.log(`📚 API Docs: http://localhost:${env.PORT}/api-docs`);
      console.log(`🔐 Auth endpoints: http://localhost:${env.PORT}/api/auth`);
      console.log(`📝 Content endpoints: http://localhost:${env.PORT}/api/content`);
      console.log(`⚙️ Admin endpoints: http://localhost:${env.PORT}/api/admin`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();



