// Import dependencies
const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');

// Load environment variables from .env
dotenv.config();

// Create an Express application
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Parse POST data
app.use(morgan('combined'));  // Log requests with Morgan
app.use(require('express-session')({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// Setup Passport.js for authentication
passport.use(new LocalStrategy(
  function(username, password, done) {
    // Hardcoded username/password validation
    if (username === 'admin' && password === 'password') {
      return done(null, { username: 'admin' });
    } else {
      return done(null, false, { message: 'Invalid credentials' });
    }
  }
));

// Serialize user into session
passport.serializeUser((user, done) => {
  done(null, user.username);
});

// Deserialize user from session
passport.deserializeUser((username, done) => {
  done(null, { username: username });
});

// POST route for login
app.post('/login', passport.authenticate('local'), (req, res) => {
  res.send(`Welcome, ${req.user.username}`);
});

// GET route for login (query string version)
app.get('/login', (req, res) => {
  const { username, password } = req.query;

  // Validate username and password
  if (username === 'admin' && password === 'password') {
    return res.send(`Welcome, ${username}`);
  } else {
    return res.status(401).send('Invalid credentials');
  }
});

// API route using Axios to fetch data from external API
app.get('/api/posts', async (req, res) => {
  try {
    const response = await axios.get(`${process.env.API_URL}/posts`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching data' });
  }
});

// Real-time communication with Socket.io
io.on('connection', (socket) => {
  console.log('A user connected');
  
  // Send a message to the client
  socket.emit('message', 'Welcome to the Socket.io server!');
  
  // Listen for messages from the client
  socket.on('chat message', (msg) => {
    console.log('Message received: ', msg);
    io.emit('chat message', msg);  // Broadcast the message to all clients
  });

  // Handle user disconnect
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

// Start the server
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
