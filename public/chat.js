// Connect to server via Socket.io
const socket = io();

document.getElementById('login-button').addEventListener('click', () => {
    const username = document.getElementById('username').value.trim();

    if (username) {
        // Send POST request to server to handle login
        fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Login successful, show chat container
                document.getElementById('login-container').style.display = 'none';
                document.getElementById('chat-container').style.display = 'block';

                // Set username and inform server
                socket.emit('setUsername', username);
            } else {
                alert(data.message || 'Login failed');
            }
        })
        .catch(error => console.error('Error:', error));
    } else {
        alert('Please enter a username');
    }
});

// Handle sending messages
document.getElementById('send-button').addEventListener('click', () => {
    const messageInput = document.getElementById('message-input');
    const message = messageInput.value.trim();

    if (message) {
        socket.emit('sendMessage', { username, message });
        messageInput.value = ''; // Clear input
    }
});

// Display incoming messages
socket.on('message', (data) => {
    const messageElement = document.createElement('div');
    messageElement.textContent = `[${data.time}] ${data.username}: ${data.message}`;
    document.getElementById('messages').appendChild(messageElement);
});

// Display chat history on load
socket.on('chatHistory', (history) => {
    const messagesContainer = document.getElementById('messages');
    history.forEach((msg) => {
        const messageElement = document.createElement('div');
        messageElement.textContent = `[${msg.time}] ${msg.username}: ${msg.message}`;
        messagesContainer.appendChild(messageElement);
    });
});