require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const compression = require('compression');
const connectDB = require('./config/database');
const Poll = require('./models/Poll');
const { nanoid } = require('nanoid');

const app = express();
const server = http.createServer(app);

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  process.env.FRONTEND_URL
].filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

// Middleware
app.use(compression()); // Enable gzip compression
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '1mb' })); // Limit payload size

// Connect to MongoDB
connectDB();

// Helper function to get client IP
const getClientIP = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0] || 
         req.headers['x-real-ip'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress;
};

// ANTI-ABUSE MECHANISM #2: Rate Limiting
// In-memory store for vote timestamps (pollId -> {ip -> timestamp})
const voteTimestamps = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 60 seconds in milliseconds

// Clean up old timestamps every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [pollId, ipMap] of voteTimestamps.entries()) {
    for (const [ip, timestamp] of ipMap.entries()) {
      if (now - timestamp > RATE_LIMIT_WINDOW * 2) {
        ipMap.delete(ip);
      }
    }
    if (ipMap.size === 0) {
      voteTimestamps.delete(pollId);
    }
  }
}, 5 * 60 * 1000);

// ========== API ROUTES ==========

// Root route - API status
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Real-Time Poll API is running',
    version: '1.0.0',
    endpoints: {
      createPoll: 'POST /api/polls',
      getPoll: 'GET /api/polls/:pollId',
      vote: 'POST /api/polls/:pollId/vote'
    }
  });
});

// Create a new poll
app.post('/api/polls', async (req, res) => {
  try {
    const { question, options } = req.body;

    // Validation
    if (!question || !options || options.length < 2) {
      return res.status(400).json({ 
        error: 'Question and at least 2 options are required' 
      });
    }

    // Generate unique poll ID
    const pollId = nanoid(10);

    // Create poll
    const poll = new Poll({
      pollId,
      question,
      options: options.map(opt => ({ text: opt, votes: 0 })),
      votedIPs: [],
      totalVotes: 0
    });

    await poll.save();

    res.status(201).json({
      success: true,
      pollId,
      message: 'Poll created successfully'
    });
  } catch (error) {
    console.error('Error creating poll:', error);
    res.status(500).json({ 
      error: 'Failed to create poll',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get poll by ID
app.get('/api/polls/:pollId', async (req, res) => {
  try {
    const { pollId } = req.params;
    
    // Use .lean() for faster read performance
    const poll = await Poll.findOne({ pollId }).lean();

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    // Set cache headers for better performance
    res.set('Cache-Control', 'no-cache');
    
    res.json({
      success: true,
      poll: {
        pollId: poll.pollId,
        question: poll.question,
        options: poll.options,
        totalVotes: poll.totalVotes
      }
    });
  } catch (error) {
    console.error('Error fetching poll:', error);
    res.status(500).json({ error: 'Failed to fetch poll' });
  }
});

// Vote on a poll
app.post('/api/polls/:pollId/vote', async (req, res) => {
  try {
    const { pollId } = req.params;
    const { optionIndex } = req.body;
    const clientIP = getClientIP(req);

    // Find poll
    const poll = await Poll.findOne({ pollId });

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    // Check if option index is valid
    if (optionIndex < 0 || optionIndex >= poll.options.length) {
      return res.status(400).json({ error: 'Invalid option' });
    }

    // ANTI-ABUSE MECHANISM #2: Rate Limiting Check
    // Prevent voting more than once per 60 seconds from same IP
    if (!voteTimestamps.has(pollId)) {
      voteTimestamps.set(pollId, new Map());
    }
    
    const pollVotes = voteTimestamps.get(pollId);
    const lastVoteTime = pollVotes.get(clientIP);
    const now = Date.now();
    
    if (lastVoteTime && (now - lastVoteTime) < RATE_LIMIT_WINDOW) {
      const remainingTime = Math.ceil((RATE_LIMIT_WINDOW - (now - lastVoteTime)) / 1000);
      return res.status(429).json({ 
        error: `Please wait ${remainingTime} seconds before voting again`,
        remainingTime
      });
    }

    // Record this vote timestamp
    pollVotes.set(clientIP, now);

    // Update vote count
    poll.options[optionIndex].votes += 1;
    poll.totalVotes += 1;

    await poll.save();

    // REAL-TIME UPDATE: Broadcast vote to all connected clients
    io.to(pollId).emit('voteUpdate', {
      options: poll.options,
      totalVotes: poll.totalVotes
    });

    res.json({
      success: true,
      message: 'Vote recorded successfully',
      poll: {
        pollId: poll.pollId,
        question: poll.question,
        options: poll.options,
        totalVotes: poll.totalVotes
      }
    });
  } catch (error) {
    console.error('Error recording vote:', error);
    res.status(500).json({ error: 'Failed to record vote' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// ========== SOCKET.IO REAL-TIME ==========

io.on('connection', (socket) => {
  console.log('👤 User connected:', socket.id);

  // Join poll room
  socket.on('joinPoll', (pollId) => {
    socket.join(pollId);
    console.log(`📊 User ${socket.id} joined poll: ${pollId}`);
  });

  // Leave poll room
  socket.on('leavePoll', (pollId) => {
    socket.leave(pollId);
    console.log(`🚪 User ${socket.id} left poll: ${pollId}`);
  });

  socket.on('disconnect', () => {
    console.log('👋 User disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.io ready for real-time updates`);
});
