import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import authRoutes from './routes/auth.js';
import studentRoutes from './routes/students.js';
import classRoutes from './routes/classes.js';
import scheduleRoutes from './routes/schedules.js';
import attendanceRoutes from './routes/attendance.js';
import gradeRoutes from './routes/grades.js';
import reportRoutes from './routes/reports.js';
import adminRoutes from './routes/admin.js';

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// F3.1: Morgan logging
app.use(morgan('dev'));

// Security headers with helmet
app.use(helmet());

// CORS with credentials for HttpOnly cookies (F5.2)
const defaultOrigins = ['http://localhost:5173', 'http://localhost:8081', 'http://localhost:8082', 'http://localhost:19006'];
const configuredOrigins = (process.env.CLIENT_URLS || process.env.CLIENT_URL || '').split(',')
  .map(origin => origin.trim())
  .filter(Boolean);
const allowedOrigins = Array.from(new Set([...defaultOrigins, ...configuredOrigins.filter(Boolean)]));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.warn(`Blocked CORS origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Body parser & cookie parser
app.use(express.json());
app.use(cookieParser());

// F3.5: Custom headers middleware
app.use((req, res, next) => {
  res.setHeader('X-Powered-By', 'PhysicTutor-API');
  res.setHeader('X-Student-ID', req.headers['x-student-id'] || 'anonymous');
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);

// F3.2: Enhanced health endpoint
app.get('/api/health', (req, res) => {
  const memUsage = process.memoryUsage();
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    memoryUsage: {
      rss: (memUsage.rss / 1024 / 1024).toFixed(2) + ' MB',
      heapUsed: (memUsage.heapUsed / 1024 / 1024).toFixed(2) + ' MB',
      heapTotal: (memUsage.heapTotal / 1024 / 1024).toFixed(2) + ' MB',
    },
    timestamp: new Date().toISOString(),
  });
});

// F3.4: File streaming endpoint
app.get('/api/files/:filename', (req, res) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(__dirname, 'uploads', filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'File not found' });
  }

  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    '.pdf': 'application/pdf', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.png': 'image/png', '.txt': 'text/plain', '.json': 'application/json',
  };
  res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
  // F3.4: User-Agent middleware logging
  console.log(`File request: ${filename} from ${req.headers['user-agent']}`);
  fs.createReadStream(filePath).pipe(res);
});

// F3.5: API gateway - external data transformation
app.get('/api/gateway/physics-facts', async (req, res) => {
  try {
    const response = await fetch('https://uselessfacts.jsph.pl/api/v2/facts/random?language=en');
    if (!response.ok) throw new Error('External API failed');
    const data = await response.json();
    res.json({
      fact: data.text,
      source: data.source_url,
      transformedAt: new Date().toISOString(),
    });
  } catch {
    res.status(502).json({ message: 'Bad Gateway: external service unavailable' });
  }
});

// Query params demo (F3.1)
app.get('/api/search', (req, res) => {
  const { q, page = 1, limit = 10 } = req.query;
  res.json({ query: q, page: Number(page), limit: Number(limit), message: 'Search endpoint' });
});

// F3.3: Global error handler middleware
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 8080;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

    // Graceful shutdown — free the port on stop/restart
    const shutdown = () => {
      server.close(() => {
        mongoose.connection.close(false).then(() => process.exit(0));
      });
      setTimeout(() => process.exit(1), 5000);
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
