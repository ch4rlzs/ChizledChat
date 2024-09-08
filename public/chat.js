document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    let username = localStorage.getItem('username');
    let peerConnections = {};
    let localStream = null;
    let isVoiceChatting = false;

    // DOM elements
    const usernameInput = document.getElementById("username-input");
    const usernameButton = document.getElementById("username-button");
    const messageInput = document.getElementById("message-input");
    const sendButton = document.getElementById("send-button");
    const chatBox = document.getElementById("chat-box-container");
    const startVoiceChatButton = document.getElementById('start-voice-chat');
    const disconnectVoiceChatButton = document.getElementById('disconnect-voice-chat');
    const voiceChatUsersList = document.getElementById('voice-chat-users');
    const speakingStatus = document.getElementById('speaking-status');
    const usernameContainer = document.getElementById("username-container");

    
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

    // Start voice chat
    if (startVoiceChatButton) {
        startVoiceChatButton.addEventListener("click", async () => {
            if (isVoiceChatting) return; // Already in a voice chat

            try {
                localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                console.log('Starting voice chat');
                socket.emit('startVoiceChat');

                startVoiceChatButton.style.display = 'none';
                disconnectVoiceChatButton.style.display = 'block';
                isVoiceChatting = true;
            } catch (error) {
                console.error('Error accessing media devices.', error);
            }
        });
    }

    // Disconnect from voice chat
    if (disconnectVoiceChatButton) {
        disconnectVoiceChatButton.addEventListener("click", () => {
            if (!isVoiceChatting) return; // Not in a voice chat

            localStream.getTracks().forEach(track => track.stop());
            console.log('Disconnecting voice chat');
            socket.emit('disconnectVoiceChat');

            startVoiceChatButton.style.display = 'block';
            disconnectVoiceChatButton.style.display = 'none';
            isVoiceChatting = false;
        });
    }

    // Handle incoming chat messages
    socket.on('message', (data) => {
        const messageElement = document.createElement('p');
        const time = `[${data.time}] `;
        const sender = `${data.username}: `;
        const messageText = `${data.message}`;

        messageElement.innerHTML = `${time}<strong>${sender}</strong>${messageText}`;
        messageElement.classList.add('message');
        if (data.username === 'System') {
            messageElement.classList.add('system-message');
        }
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;
    });

    // Receive and display chat history
    socket.on('chatHistory', (history) => {
        chatBox.innerHTML = ''; // Clear chat box before adding history
        history.forEach(message => {
            const messageElement = document.createElement('p');
            const time = `[${message.time}] `;
            const sender = `${message.username}: `;
            const messageText = `${message.message}`;

            messageElement.innerHTML = `${time}<strong>${sender}</strong>${messageText}`;
            messageElement.classList.add('message');
            if (message.username === 'System') {
                messageElement.classList.add('system-message');
            }
            chatBox.appendChild(messageElement);
        });
        chatBox.scrollTop = chatBox.scrollHeight;
    });

    // Update voice chat users
    socket.on('updateVoiceChatUsers', (users) => {
        voiceChatUsersList.innerHTML = ''; // Clear existing users list
        users.forEach(user => {
            const userElement = document.createElement('li');
            userElement.textContent = user.username;
            voiceChatUsersList.appendChild(userElement);
        });
    });

    // Show speaking status
    socket.on('speakingStatus', (data) => {
        speakingStatus.textContent = data.isSpeaking ? `${data.username} is speaking` : '';
    });
});
