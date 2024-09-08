const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let chatHistory = [];
let users = [];
let voiceChatUsers = [];

app.use(express.static('public'));

io.on('connection', socket => {
    console.log('A user connected:', socket.id);

    // Send chat history when a new user connects
    socket.emit('chatHistory', chatHistory);

    // Set username and notify others
    socket.on('setUsername', username => {
        users.push({ id: socket.id, username });
        console.log(`${username} joined the chat`);

        // Notify others that the user has joined
        socket.broadcast.emit('message', { username: 'System', message: `${username} has joined the chat`, time: getTime() });
    });

    // Handle message sending
    socket.on('sendMessage', data => {
        const messageData = { username: data.username, message: data.message, time: getTime() };
        chatHistory.push(messageData);
        
        // Keep chat history limited to the last 100 messages
        if (chatHistory.length > 100) {
            chatHistory.shift();
        }

        io.emit('message', messageData); // Broadcast message to all users
    });

    // Handle voice chat joining
    socket.on('joinVoiceChat', user => {
        voiceChatUsers.push({ id: socket.id, username: user.username });
        io.emit('updateVoiceChatUsers', voiceChatUsers);
    });

    socket.on('offer', (id, description) => {
        socket.broadcast.emit('offer', id, description);
    });

    socket.on('answer', (id, description) => {
        socket.broadcast.emit('answer', id, description);
    });

    socket.on('iceCandidate', (id, candidate) => {
        socket.broadcast.emit('iceCandidate', id, candidate);
    });

    // Handle user disconnecting from voice chat
    socket.on('disconnect', () => {
        const user = users.find(u => u.id === socket.id);
        if (user) {
            console.log(`${user.username} left the chat`);
            users = users.filter(u => u.id !== socket.id);

            // Notify others that the user has left
            io.emit('message', { username: 'System', message: `${user.username} has left the chat`, time: getTime() });
        }

        voiceChatUsers = voiceChatUsers.filter(user => user.id !== socket.id);
        io.emit('updateVoiceChatUsers', voiceChatUsers);
    });
});

function getTime() {
    const date = new Date();
    return `${date.getHours()}:${date.getMinutes()}`;
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
