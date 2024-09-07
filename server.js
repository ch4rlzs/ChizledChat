const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let voiceChatUsers = [];

app.use(express.static('public'));

io.on('connection', socket => {
    console.log('A user connected:', socket.id);

    socket.on('joinVoiceChat', user => {
        voiceChatUsers.push({ id: socket.id, username: user.username });
        io.emit('updateVoiceChatUsers', voiceChatUsers);
    });

    socket.on('leaveVoiceChat', () => {
        voiceChatUsers = voiceChatUsers.filter(user => user.id !== socket.id);
        io.emit('updateVoiceChatUsers', voiceChatUsers);
    });

    socket.on('offer', description => {
        socket.broadcast.emit('offer', description);
    });

    socket.on('answer', description => {
        socket.broadcast.emit('answer', description);
    });

    socket.on('iceCandidate', candidate => {
        socket.broadcast.emit('iceCandidate', candidate);
    });

    socket.on('userSpeaking', data => {
        socket.broadcast.emit('userSpeaking', data);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        voiceChatUsers = voiceChatUsers.filter(user => user.id !== socket.id);
        io.emit('updateVoiceChatUsers', voiceChatUsers);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
