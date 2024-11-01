const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let messages = [];
let users = [];

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.static('public'));

// Load users from users.json if it exists
if (fs.existsSync('users.json')) {
    const data = fs.readFileSync('users.json');
    users = JSON.parse(data);
}

// Route to register a user
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    if (users.find(user => user.username === username)) {
        return res.status(400).json({ message: 'User already exists' });
    }
    users.push({ username, password });
    fs.writeFileSync('users.json', JSON.stringify(users));
    res.status(201).json({ message: 'User registered successfully' });
});

// Route to login a user
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(user => user.username === username && user.password === password);
    if (user) {
        res.json({ message: 'Login successful', isAdmin: username === 'admin' });
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
});

// Socket.io connection
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Handle user login and notify admin of connected users
    socket.on('setUsername', (username) => {
        socket.username = username;
        io.emit('userList', users.map(user => user.username));
    });

    // Broadcast messages
    socket.on('sendMessage', (data) => {
        const message = { id: Date.now(), username: socket.username, text: data.message, time: new Date().toLocaleTimeString() };
        messages.push(message);
        io.emit('message', message);
    });

    // Allow admin to delete messages
    socket.on('deleteMessage', (id) => {
        if (socket.username === 'admin') {
            messages = messages.filter(msg => msg.id !== id);
            io.emit('messageDeleted', id);
        }
    });

    // Handle user disconnect
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        io.emit('userList', users.map(user => user.username));
    });
});

// Serve the admin panel for admin user
app.get('/admin', (req, res) => {
    res.sendFile(__dirname + '/public/admin.html');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));