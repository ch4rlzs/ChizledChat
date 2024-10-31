// Connect to server via Socket.io
const socket = io();

document.getElementById('registerButton').addEventListener('click', function() {
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;

    fetch('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('registerMessage').innerText = data.message;
    })
    .catch(err => {
        document.getElementById('registerMessage').innerText = 'Error registering user.';
    });
});

document.getElementById('loginButton').addEventListener('click', function() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
        if (response.ok) {
            document.getElementById('loginMessage').innerText = data.message;
            // Redirect to chat or load chat interface here
        } else {
            document.getElementById('loginMessage').innerText = data.message;
        }
    })
    .catch(err => {
        document.getElementById('loginMessage').innerText = 'Error logging in.';
    });
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