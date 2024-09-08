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

function getTime() {
    const date = new Date();
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

io.on('connection', socket => {
    console.log('A user connected:', socket.id);


    // Send chat history when a new user connects
    socket.emit('chatHistory', chatHistory)

    // Set username and notify others
    socket.on('setUsername', username => {
        const user = { id: socket.id, username };
        users.push(user);
        console.log(`${username} joined the chat`);

        // Notify others that the user has joined
        const systemMessage = { username: 'System', message: `${username} has joined the chat`, time: getTime() };
        chatHistory.push(systemMessage);
        io.emit('message', systemMessage);
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
    socket.on('joinVoiceChat', (username) => {
        voiceChatUsers.push({ id: socket.id, username });
        io.emit('userJoinedVoiceChat', username);
        io.emit('updateVoiceChatUsers', voiceChatUsers.map(u => u.username));
    });

    socket.on('leaveVoiceChat', (username) => {
        voiceChatUsers = voiceChatUsers.filter(u => u.id !== socket.id);
        io.emit('userLeftVoiceChat', username);
        io.emit('updateVoiceChatUsers', voiceChatUsers.map(u => u.username));
    });

    socket.on('offer', ({ offer, to }) => {
        socket.to(to).emit('offer', { offer, from: socket.id });
    });

    socket.on('answer', ({ answer, to }) => {
        socket.to(to).emit('answer', { answer, from: socket.id });
    });

    socket.on('iceCandidate', ({ candidate, to }) => {
        socket.to(to).emit('iceCandidate', { candidate, from: socket.id });
    });

    socket.on('speaking', (data) => {
        socket.broadcast.emit('speakingStatus', data);
    });

    // Handle user disconnecting
    socket.on('disconnect', () => {
        const user = users.find(u => u.id === socket.id);
        if (user) {
            console.log(`${user.username} left the chat`);
            users = users.filter(u => u.id !== socket.id);

            // Notify others that the user has left
            const systemMessage = { username: 'System', message: `${user.username} has left the chat`, time: getTime() };
            chatHistory.push(systemMessage);
            io.emit('message', systemMessage);

            // Update voice chat users list
            const voiceChatUser = voiceChatUsers.find(u => u.id === socket.id);
            if (voiceChatUser) {
                voiceChatUsers = voiceChatUsers.filter(u => u.id !== socket.id);
                io.emit('userLeftVoiceChat', voiceChatUser.username);
                io.emit('updateVoiceChatUsers', voiceChatUsers.map(u => u.username));
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));