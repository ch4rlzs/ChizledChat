const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let chatHistory = [];
let users = [];
let voiceChatUsers = [];

// Serve static files from the public directory
app.use(express.static("public"));

// Helper function to get the current time in HH:MM format
const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

io.on("connection", (socket) => {
    console.log("A user connected");

    // Send chat history to the newly connected client
    socket.emit("chatHistory", chatHistory);

    // Listen for incoming messages
    socket.on("chatMessage", (data) => {
        const { username, message } = data;
        const timestamp = getCurrentTime();

        // Save message to chat history (limit to the last 100 messages)
        const chatMessage = { username, message, timestamp };
        chatHistory.push(chatMessage);
        if (chatHistory.length > 100) {
            chatHistory.shift();
        }

        // Broadcast the message with the username and timestamp to all connected clients
        io.emit("chatMessage", chatMessage);
    });

    // Handle voice chat joining
    socket.on('joinVoiceChat', user => {
        voiceChatUsers.push({ id: socket.id, username: user.username });
        io.emit('updateVoiceChatUsers', voiceChatUsers);
    });

    // Handle user leaving voice chat
    socket.on('leaveVoiceChat', user => {
        voiceChatUsers = voiceChatUsers.filter(u => u.id !== socket.id);
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

    // Handle user disconnecting from the chat
    socket.on('disconnect', () => {
        const user = users.find(u => u.id === socket.id);
        if (user) {
            console.log(`${user.username} left the chat`);
            users = users.filter(u => u.id !== socket.id);

            // Notify others that the user has left
            io.emit('message', { username: 'System', message: `${user.username} has left the chat`, time: getTime() });
        }

        voiceChatUsers = voiceChatUsers.filter(u => u.id !== socket.id);
        io.emit('updateVoiceChatUsers', voiceChatUsers);
    });

    // Handle user speaking event
    socket.on('userSpeaking', data => {
        io.emit('userSpeaking', data);
    });
});

function getTime() {
    const date = new Date();
    return `${date.getHours()}:${date.getMinutes()}`;
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
