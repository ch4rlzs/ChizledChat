// Connect to the server using Socket.io
const socket = io();

document.getElementById('login-button').addEventListener('click', () => {
    const username = document.getElementById('username').value.trim();

    if (username) {
        // Emit the username to the server
        socket.emit('setUsername', username);

        // Hide the login container and show the chat container
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('chat-container').style.display = 'block';
    } else {
        alert('Please enter a username');
    }
});

// Handle sending a message
document.getElementById('send-button').addEventListener('click', () => {
    const messageInput = document.getElementById('message-input');
    const message = messageInput.value.trim();

    if (message) {
        // Emit the message to the server
        socket.emit('sendMessage', { username, message });
        messageInput.value = ''; // Clear input
    }
});

// Display incoming messages
socket.on('message', data => {
    const messageElement = document.createElement('div');
    messageElement.textContent = `[${data.time}] ${data.username}: ${data.message}`;
    document.getElementById('messages').appendChild(messageElement);
});

// Show chat history on load
socket.on('chatHistory', history => {
    const messagesContainer = document.getElementById('messages');
    history.forEach(msg => {
        const messageElement = document.createElement('div');
        messageElement.textContent = `[${msg.time}] ${msg.username}: ${msg.message}`;
        messagesContainer.appendChild(messageElement);
    });
});