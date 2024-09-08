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
const getcurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

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

    // Handle voice chat start
    socket.on('startVoiceChat', () => {
        const user = users.find(u => u.id === socket.id);
        if (user) {
            voiceChatUsers.push(user);
            io.emit('updateVoiceChatUsers', voiceChatUsers);
        }
    });

    // Handle voice chat disconnection
    socket.on('disconnectVoiceChat', () => {
        voiceChatUsers = voiceChatUsers.filter(u => u.id !== socket.id);
        io.emit('updateVoiceChatUsers', voiceChatUsers);
    });

    // Handle user disconnecting
    socket.on('disconnect', () => {
        const user = users.find(u => u.id === socket.id);
        if (user) {
            console.log(`${user.username} left the chat`);
            users = users.filter(u => u.id !== socket.id);

            // Notify others that the user has left
            io.emit('message', { username: 'System', message: `${user.username} has left the chat`, time: getTime() });

            // Update voice chat users list
            voiceChatUsers = voiceChatUsers.filter(u => u.id !== socket.id);
            io.emit('updateVoiceChatUsers', voiceChatUsers);
        }
    });

    // Handle speaking status (for now, we'll simulate it)
    socket.on('updateSpeakingStatus', (data) => {
        socket.broadcast.emit('speakingStatus', data);
    });
});

function getTime() {
    const date = new Date();
    return `${date.getHours()}:${date.getMinutes()}`;
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
