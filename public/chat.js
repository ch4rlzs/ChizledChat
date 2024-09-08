const socket = io();
let username = localStorage.getItem('username');
let peerConnections = {};
let localStream = null;
let isVoiceChatting = false;

// DOM elements
const usernameInput = document.getElementById("username-input");
const setUsernameButton = document.getElementById("set-username");
const messageInput = document.getElementById("message-input");
const sendButton = document.getElementById("send-button");
const chatBox = document.getElementById('chat-box');
const startVoiceChatButton = document.getElementById('start-voice-chat');
const disconnectVoiceChatButton = document.getElementById('disconnect-voice-chat');
const voiceChatUsersList = document.getElementById('voice-chat-users');
const speakingStatus = document.getElementById('speaking-status');

// Set username
setUsernameButton.addEventListener("click", () => {
    username = usernameInput.value.trim();
    if (username) {
        localStorage.setItem('username', username);
        socket.emit("setUsername", username);
        setUsernameButton.style.display = "none";
        usernameInput.style.display = "none";
    }
});

// Send chat message
sendButton.addEventListener("click", () => {
    const message = messageInput.value.trim();
    if (message) {
        socket.emit("sendMessage", { username, message });
        messageInput.value = "";
    }
});

// Start voice chat
startVoiceChatButton.addEventListener("click", async () => {
    if (isVoiceChatting) return; // Already in a voice chat

    try {
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        socket.emit('startVoiceChat');

        startVoiceChatButton.style.display = 'none';
        disconnectVoiceChatButton.style.display = 'block';
        isVoiceChatting = true;
    } catch (error) {
        console.error('Error accessing media devices.', error);
    }
});

// Disconnect from voice chat
disconnectVoiceChatButton.addEventListener("click", () => {
    if (!isVoiceChatting) return; // Not in a voice chat

    localStream.getTracks().forEach(track => track.stop());
    socket.emit('disconnectVoiceChat');

    startVoiceChatButton.style.display = 'block';
    disconnectVoiceChatButton.style.display = 'none';
    isVoiceChatting = false;
});

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
