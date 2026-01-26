const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
require('dotenv').config();

// Import routes
const apiRoutes = require('./routes');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
// Enhanced logging with colors and details
app.use(morgan((tokens, req, res) => {
  const status = tokens.status(req, res);
  const statusColor = status >= 500 ? '\x1b[31m' : status >= 400 ? '\x1b[33m' : status >= 300 ? '\x1b[36m' : '\x1b[32m';
  const resetColor = '\x1b[0m';
  
  return [
    statusColor,
    tokens.method(req, res),
    resetColor,
    tokens.url(req, res),
    statusColor,
    status,
    resetColor,
    '-',
    tokens['response-time'](req, res), 'ms',
    '-',
    tokens.res(req, res, 'content-length'), 'bytes'
  ].join(' ');
}));
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb' }));

// Routes
app.use('/api', apiRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

module.exports = app;

