const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const bodyParser = require('body-parser');
const fs = require('fs');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
let chatHistory = [];
let users = [];

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Load existing users from a file (if exists)
if (fs.existsSync('users.json')) {
    const data = fs.readFileSync('users.json');
    users = JSON.parse(data);
}

// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Handle user registration
try {
    const data = fs.readFileSync('users.json', 'utf8');
    if (data) {
        users = JSON.parse(data); // Only parse if data is not empty
    }
} catch (error) {
    console.error('Error reading or parsing users.json:', error);
    users = []; // Initialize to empty array if there's an error
}

app.post('/register', (req, res) => {
    const { username, password } = req.body;
    
    // Check if user already exists
    if (users.find(user => user.username === username)) {
        return res.status(400).json({ message: 'User already exists' });
    }
    
    // Add new user
    users.push({ username, password });
    fs.writeFileSync('users.json', JSON.stringify(users)); // Save users to file
    res.status(201).json({ message: 'User registered successfully' });
});

// Handle user login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(user => user.username === username && user.password === password);
    
    if (user) {
        res.json({ message: 'Login successful' });
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
});

io.on('connection', socket => {
    console.log('A user connected:', socket.id);
    socket.emit('chatHistory', chatHistory);

    socket.on('sendMessage', data => {
        const messageData = { username: data.username, message: data.message, time: getTime() };
        chatHistory.push(messageData);

        if (chatHistory.length > 100) {
            chatHistory.shift();
        }

        io.emit('message', messageData);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

function getTime() {
    const date = new Date();
    return `${date.getHours()}:${date.getMinutes()}`;
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
