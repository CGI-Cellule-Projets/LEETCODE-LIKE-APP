/**
 * Main Express Server
 * Initializes and configures the REST API
 */
import express, { Request, Response, NextFunction } from 'express';
import { connectDB, disconnectDB } from './config/database';
import { PORT, NODE_ENV } from './config/jwt';
import { errorHandler } from './middleware/errorHandler';
import { initializeDefaultAdmin } from './config/seedData';

// Import routes
import problemRoutes from './routes/problemRoutes';
import submissionRoutes from './routes/submissionRoutes';
import adminRoutes from './routes/adminRoutes';
import authRoutes from './routes/authRoutes';
import contestRoutes from './routes/contestRoutes';

const app = express();
const allowedOrigins = new Set([
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
]);

if (process.env.APP_ORIGIN) {
  allowedOrigins.add(process.env.APP_ORIGIN);
}

function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) {
    return false;
  }

  if (origin === 'null') {
    return NODE_ENV !== 'production';
  }

  if (allowedOrigins.has(origin)) {
    return true;
  }

  if (NODE_ENV !== 'development') {
    return false;
  }

  try {
    const parsed = new URL(origin);
    return ['localhost', '127.0.0.1'].includes(parsed.hostname);
  } catch {
    return false;
  }
}

app.disable('x-powered-by');

// ============== Security + CORS Configuration ==============
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Cross-Origin-Opener-Policy', 'same-origin');
  res.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.header('Referrer-Policy', 'same-origin');
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');

  const origin = req.headers.origin;
  if (origin && isAllowedOrigin(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
  }

  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    if (origin && !isAllowedOrigin(origin)) {
      return res.sendStatus(403);
    }

    return res.sendStatus(204);
  }
  next();
});

// ============== Middleware ==============
app.use(express.json({ limit: '256kb' }));
app.use(express.urlencoded({ extended: true, limit: '256kb' }));

// Request logging middleware (development)
if (NODE_ENV === 'development') {
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// ============== Routes ==============
app.use('/api/auth', authRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contests', contestRoutes);

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Not Found',
    errors: `Route ${req.method} ${req.path} does not exist`,
  });
});

// ============== Error Handler ==============
app.use(errorHandler);

// ============== Server Startup ==============
async function startServer() {
  try {
    // Connect to database
    await connectDB();

    // Initialize default admin user (development only)
    await initializeDefaultAdmin();

    // Start listening
    app.listen(PORT, () => {
      console.log(`\n LeetCode API Server running on http://localhost:${PORT}`);
      console.log(` Environment: ${NODE_ENV}`);
      console.log(` Available endpoints:`);
      console.log(`  - GET    /api/problems`);
      console.log(`  - GET    /api/problems/:id`);
      console.log(`  - POST   /api/submissions`);
      console.log(`  - GET    /api/submissions/:submissionId`);
      console.log(`  - GET    /api/admin/problems`);
      console.log(`  - POST   /api/admin/problems`);
      console.log(`  - PUT    /api/admin/problems/:id`);
      console.log(`  - DELETE /api/admin/problems/:id`);
      console.log(`  - POST   /api/admin/problems/:id/testcases`);
      console.log(`  - GET    /api/health\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\nSIGTERM received, shutting down gracefully...');
  await disconnectDB();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  await disconnectDB();
  process.exit(0);
});

// Start the server
startServer();

export default app;

