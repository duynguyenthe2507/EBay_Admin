const express = require("express");
const { connect } = require("mongoose");
const router = require("./src/routers/index.js");
const dotenv = require("dotenv");
const cors = require("cors");
const { initScheduler } = require("./src/config/scheduler");
const http = require("http");
const { initSocketServer } = require("./src/services/socketService");
const cookieParser = require('cookie-parser');

const app = express();
dotenv.config(); // Move dotenv.config() before using process.env

// CORS configuration - support multiple origins for deployment
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map(url => url.trim())
  : ['http://localhost:3000'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

  // Log request body for POST/PUT requests
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log('Request body:', JSON.stringify(req.body));
  }

  // Capture the original send
  const originalSend = res.send;

  // Override send to log response
  res.send = function (body) {
    console.log(`[${new Date().toISOString()}] Response ${res.statusCode} for ${req.url}`);

    // Restore original send and call it
    res.send = originalSend;
    return res.send(body);
  };

  next();
});

const PORT = process.env.PORT || 9999;
const MONGO_URI = process.env.MONGO_URI;

// Validate required environment variables
if (!MONGO_URI) {
  console.error('MONGO_URI is not defined in environment variables');
  process.exit(1);
}

// Improve MongoDB connection with error handling
console.log('Connecting to MongoDB...');
// Explicitly set the target database to avoid defaulting to `test` when
// the connection string omits a database name (common with Atlas URIs).
connect(MONGO_URI, { dbName: 'ebay_admin' })
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

app.use("/api", router);

// Health check endpoint for Render
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Fallback route for handling payment redirects
app.get('/', (req, res) => {
  const { paymentStatus } = req.query;
  const frontendUrl = process.env.CLIENT_URL || 'http://localhost:3000';

  if (paymentStatus) {
    // Redirect to frontend with payment status
    return res.redirect(`${frontendUrl}?paymentStatus=${paymentStatus}`);
  }

  // Default redirect to frontend
  res.redirect(frontendUrl);
});

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = initSocketServer(server);

// Store io instance on app for potential use in request handlers
app.set('io', io);

// Listen on server (not app)
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running at PORT ${PORT}`);
  console.log(`WebSocket server is running`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

  // Initialize schedulers after server starts
  initScheduler();
});
