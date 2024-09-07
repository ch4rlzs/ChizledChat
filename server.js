const express = require("express");
const http = require("http");
const socketIO = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Array to store chat history
let chatHistory = [];

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

    // Handle disconnect
    socket.on("disconnect", () => {
        console.log("A user disconnected");
    });
});
io.on("connection", (socket) => {
    console.log("A user connected");

    // Handle WebRTC offer
    socket.on("offer", (description) => {
        socket.broadcast.emit("offer", description);
    });

    // Handle WebRTC answer
    socket.on("answer", (description) => {
        socket.broadcast.emit("answer", description);
    });

    // Handle ICE candidates
    socket.on("iceCandidate", (candidate) => {
        socket.broadcast.emit("iceCandidate", candidate);
    });

    socket.on("disconnect", () => {
        console.log("A user disconnected");
    });
});
// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
