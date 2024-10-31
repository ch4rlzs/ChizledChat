const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let chatHistory = [];
let users = [];

// Middleware to parse JSON data
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Route to handle login requests
app.post('/login', (req, res) => {
    const { username } = req.body;

    // Check if username is provided
    if (!username || username.trim() === '') {
        return res.status(400).json({ success: false, message: 'Username is required' });
    }

    // Respond with success and send username back to client
    res.json({ success: true, username });
});

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Send chat history to new user
    socket.emit('chatHistory', chatHistory);

    // Listen for username set by client
    socket.on('setUsername', (username) => {
        users.push({ id: socket.id, username });
        console.log(`${username} joined the chat`);

        // Notify others
        socket.broadcast.emit('message', { username: 'System', message: `${username} has joined the chat`, time: getTime() });
    });

    // Handle incoming messages
    socket.on('sendMessage', (data) => {
        const messageData = { username: data.username, message: data.message, time: getTime() };
        chatHistory.push(messageData);

        // Limit chat history to 100 messages
        if (chatHistory.length > 100) {
            chatHistory.shift();
        }

        // Broadcast message to all users
        io.emit('message', messageData);
    });

    // Handle user disconnection
    socket.on('disconnect', () => {
        const user = users.find((u) => u.id === socket.id);
        if (user) {
            console.log(`${user.username} left the chat`);
            users = users.filter((u) => u.id !== socket.id);

            // Notify others that the user has left
            io.emit('message', { username: 'System', message: `${user.username} has left the chat`, time: getTime() });
        }
    });
});

// Helper function to get current time
function getTime() {
    const date = new Date();
    return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));