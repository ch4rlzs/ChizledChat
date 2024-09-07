const socket = io();

// DOM elements
const chatBox = document.getElementById("chat-box");
const messageInput = document.getElementById("message-input");
const sendButton = document.getElementById("send-button");
const usernameInput = document.getElementById("username-input");
const usernameButton = document.getElementById("username-button");
const usernameContainer = document.getElementById("username-container");
const chatBoxContainer = document.getElementById("chat-box-container");

let username = "";

// Handle username input and store it in localStorage
usernameButton.addEventListener("click", () => {
    const enteredUsername = usernameInput.value.trim();
    if (enteredUsername) {
        username = enteredUsername;
        localStorage.setItem("username", username); // Save username in localStorage
        usernameContainer.style.display = "none"; // Hide username input
        chatBoxContainer.style.display = "block"; // Show chat
    }
});

// Load the username from localStorage when the page is loaded
window.onload = () => {
    const savedUsername = localStorage.getItem("username");
    if (savedUsername) {
        username = savedUsername;
        usernameInput.value = savedUsername; // Autofill username input
        usernameContainer.style.display = "none"; // Hide username input
        chatBoxContainer.style.display = "block"; // Show chat
    }
};

// Listen for incoming chat history from the server
socket.on("chatHistory", (history) => {
    history.forEach((message) => {
        const messageElement = document.createElement("p");
        messageElement.innerHTML = `<strong>${message.username}</strong> [${message.timestamp}]: ${message.message}`;
        chatBox.appendChild(messageElement);
    });
    chatBox.scrollTop = chatBox.scrollHeight; // Auto scroll to the latest message
});

// Listen for incoming messages from the server
socket.on("chatMessage", (data) => {
    const { username, message, timestamp } = data;
    const messageElement = document.createElement("p");
    messageElement.innerHTML = `<strong>${username}</strong> [${timestamp}]: ${message}`;
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight; // Auto scroll to the latest message
});

// Send message on button click
sendButton.addEventListener("click", () => {
    const message = messageInput.value.trim();
    if (message && username) {
        socket.emit("chatMessage", { username, message });
        messageInput.value = ""; // Clear the input field
    }
});

// Send message on Enter key press
messageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        sendButton.click();
    }
});
