const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const { getStatus } = require('./controllers/security.controller');
const prisma = require('./prisma');
const errorHandler = require('./middleware/error.middleware');
const routes = require('./routes');
const { sendSuccess } = require('./utils/response.util');

const app = express();

app.use(helmet());

const allowedOrigins = [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000'].filter(Boolean);
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow during development
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());

// Health check
app.get('/health', async (req, res) => {
  let dbStatus = 'disconnected';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (error) {}

  res.json({
    status: 'ok',
    database: dbStatus,
    version: '1.0.0'
  });
});

// Security status
app.get('/api/security/status', getStatus);

// API Routes
app.use('/api', routes);

// Swagger Documentation
// A simple openapi.json will be served
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(require('../swagger.json')));

// Global Error Handler
app.use(errorHandler);

module.exports = app;
