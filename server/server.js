const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const documentRoutes = require('./routes/documentRoutes');
const authenticate = require('./middleware/authenticate');
const http = require('http'); // Import http module for the server
const socketIo = require('socket.io'); // Import socket.io
const cors = require('cors');

dotenv.config();
const app = express();

// Create an HTTP server using the Express app
const server = http.createServer(app);


app.use(cors({
  origin: "*",
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
// Integrate socket.io with the server
const io = socketIo(server, {
  cors: {
    origin: "*", // Allow all origins
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true
  }
});

// Connect to MongoDB
connectDB();

app.use(express.json());

// Register authentication routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);

// Protected route example
app.get('/api/protected', authenticate, (req, res) => {
  if (!req.auth) {
    return res.status(401).json({ message: 'User not authenticated' });
  }
  const userId = req.auth.userId;
  return res.json({
    message: "You are authenticated!",
    userId: userId,  // Send the user ID in the response
  });
});

// Set up Socket.IO events
let documentConnections = {}; // To track users in specific document rooms

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Listen for joinDocument event
  socket.on('joinDocument', (docId) => {
    // Add the user to the room for a specific document
    if (!documentConnections[docId]) {
      documentConnections[docId] = [];
    }
    documentConnections[docId].push(socket.id);

    socket.join(docId); // Join the document room
    console.log(`Socket ${socket.id} joined document ${docId}`);

    // Notify others in the room about the new collaborator
    io.to(docId).emit('newCollaborator', { id: socket.id });
  });

  // Listen for real-time markdown update
  socket.on('updateMarkdown', (docId, markdownContent) => {
    // Broadcast the markdown update to everyone in the room
    io.to(docId).emit('markdownUpdated', markdownContent);
  });

  // Handle typing notification
  socket.on('typing', (docId) => {
    io.to(docId).emit('newCollaborator', { id: socket.id, isTyping: true });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);

    // Remove the user from all document rooms
    for (const docId in documentConnections) {
      const index = documentConnections[docId].indexOf(socket.id);
      if (index !== -1) {
        documentConnections[docId].splice(index, 1);
        io.to(docId).emit('removeCollaborator', socket.id); // Notify others of disconnection
      }
    }
  });
});

// Start the server with Socket.IO integration
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
