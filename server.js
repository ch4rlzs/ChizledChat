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

io.on("connection", (socket) => {
    console.log("A user connected");

    // Send chat history to the newly connected client
    socket.emit("chatHistory", chatHistory);

    // Listen for incoming messages
    socket.on("chatMessage", (data) => {
        const { username, message } = data;

        // Save message to chat history (limit to the last 100 messages to avoid memory overflow)
        chatHistory.push({ username, message });
        if (chatHistory.length > 100) {
            chatHistory.shift(); // Remove the oldest message when the limit is reached
        }

        // Broadcast the message along with the username to all connected clients
        io.emit("chatMessage", { username, message });
    });

    // Handle disconnect
    socket.on("disconnect", () => {
        console.log("A user disconnected");
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
