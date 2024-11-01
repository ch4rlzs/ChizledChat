// server.js
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const bodyParser = require("body-parser");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// In-memory data store
const users = [
  { username: "admin", password: bcrypt.hashSync("adminpass", 10), isAdmin: true }
];
const messages = [];

// Middleware
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: "your_secret",
  resave: false,
  saveUninitialized: true,
}));

// Routes
app.get("/", (req, res) => {
  if (req.session.username) {
    res.sendFile(__dirname + "/public/chat.html");
  } else {
    res.sendFile(__dirname + "/public/index.html");
  }
});

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const existingUser = users.find(user => user.username === username);
  if (existingUser) {
    return res.send("Username already exists.");
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  users.push({ username, password: hashedPassword, isAdmin: false });
  res.redirect("/");
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = users.find(user => user.username === username);
  if (user && await bcrypt.compare(password, user.password)) {
    req.session.username = username;
    req.session.isAdmin = user.isAdmin;
    res.redirect("/");
  } else {
    res.send("Invalid credentials.");
  }
});

app.post("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

// Socket.IO events
io.on("connection", (socket) => {
  const username = socket.handshake.query.username;
  socket.on("newMessage", (message) => {
    const newMessage = { username, message, timestamp: new Date() };
    messages.push(newMessage);
    io.emit("message", newMessage);
  });

  socket.on("deleteMessage", (timestamp) => {
    if (username === "admin") {
      const index = messages.findIndex(msg => msg.timestamp === timestamp);
      if (index !== -1) {
        messages.splice(index, 1);
        io.emit("deleteMessage", timestamp);
      }
    }
  });

  socket.emit("loadMessages", messages);
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});