const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const http = require('http'); // Import http module
const { Server } = require("socket.io"); // Import socket.io Server
const jwt = require('jsonwebtoken');
const path = require('path');

const authRouter = require('./routers/authRouter');
const internshipsRouter = require('./routers/internshipsRouter');
const applicationsRouter = require('./routers/applicationsRouter');
const projectsRouter = require('./routers/projectsRouter');
const projectAssignmentsRouter = require('./routers/projectAssignmentsRouter');
const statsRouter = require('./routers/statsRouter');
const blacklistRouter = require('./routers/blacklistRouter');
const reportsRouter = require('./routers/reportsRouter');
const assignmentsRouter = require('./routers/assignmentsRouter');
const attendanceRouter = require('./routers/attendanceRouter');
const profileRouter = require('./routers/profileRouter');

// Import Chat Models
const Conversation = require('./models/Conversation');
const Message = require('./models/Message');
const ProjectAssignment = require('./models/projectAssignmentsModel');
const User = require('./models/usersModel');

const app = express();
const server = http.createServer(app); // Create HTTP server from Express app

// Define allowed origins
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
   'https://tallyintern.vercel.app',
  'https://6f86-110-226-229-161.ngrok-free.app' // ngrok frontend URL
];

const io = new Server(server, { // Attach socket.io to the server
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  },
  transports: ['websocket', 'polling'] // Prioritize websocket
});

// Use CORS with options
app.use(cors({
  origin: allowedOrigins,
  exposedHeaders: ['Content-Disposition']
}));

// Temporarily adjust helmet for ngrok compatibility
app.use(helmet({ crossOriginEmbedderPolicy: false }));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/tally';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB successfully');
    console.log(`📍 Database: ${MONGO_URI.includes('mongodb+srv') ? 'MongoDB Atlas (Cloud)' : 'Local MongoDB'}`);
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Serve static files for profile pictures and other uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/internships', internshipsRouter);
app.use('/api/applications', applicationsRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/project-assignments', projectAssignmentsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/blacklist', blacklistRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/assignments', assignmentsRouter);
app.use('/api/attendance', attendanceRouter); // Register attendanceRouter
app.use('/api/profile', profileRouter);
app.use('/api/chat', require('./routers/chatRouter'));

app.get('/', (req, res) => {
  res.send('API is running...');
});

app.get('/socket-test', (req, res) => {
  res.json({ success: true, message: 'Socket test endpoint is working', time: new Date().toISOString() });
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error: Token not provided'));
  }
  jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
    socket.user = decoded;
    next();
  });
});

io.on('connection', (socket) => {
 //console.log('A user connected:', socket.id, 'User:', socket.user.email);

  // Event for a user to join a project-specific chat room
  socket.on('joinProjectRoom', async (projectAssignmentId) => {
    socket.join(projectAssignmentId);
    //console.log(`User ${socket.user.email} joined room: ${projectAssignmentId}`);
  });

  // Event for sending a message
  socket.on('sendMessage', async ({ projectAssignmentId, content }) => {
    try {

        // Security Check: Verify the user is part of this project assignment
        const assignment = await ProjectAssignment.findById(projectAssignmentId);
        if (!assignment) {
            socket.emit('error', { message: 'Project assignment not found.' });
            return;
        }

        const isParticipant = 
            assignment.assignedInterns.some(i => i.userId.toString() === socket.user.userId.toString()) ||
            assignment.assignedDevelopers.some(d => d.userId.toString() === socket.user.userId.toString()) ||
            assignment.panelists.some(p => p.userId.toString() === socket.user.userId.toString()) ||
            ['hr', 'admin'].includes(socket.user.type);

        // Additional company check for hr users
        if (socket.user.type === 'hr' && assignment.company !== socket.user.company) {
            socket.emit('error', { message: 'You can only access chat for projects from your own company.' });
            return;
        }

        if (!isParticipant) {
            socket.emit('error', { message: 'You are not a participant in this project\'s chat.' });
            return;
        }


        let conversation = await Conversation.findOne({ projectAssignment: projectAssignmentId });
        if (!conversation) {
            conversation = new Conversation({ projectAssignment: projectAssignmentId, participants: [] });
            await conversation.save();
        }

        const message = new Message({
            conversation: conversation._id,
            sender: socket.user.userId,
            content: content,
        });

        await message.save();
        const populatedMessage = await Message.findById(message._id).populate('sender', 'name type');
        io.to(projectAssignmentId).emit('receiveMessage', populatedMessage);
    } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message.' });
    }
  });

  socket.on('disconnect', () => {
  });
});



const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {});

