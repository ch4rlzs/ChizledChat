document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    let username = localStorage.getItem('username');
    let peerConnections = {};
    let localStream = null;
    let isVoiceChatting = false;

    // DOM elements
    const usernameContainer = document.getElementById("username-container");
    const usernameInput = document.getElementById("username-input");
    const setUsernameButton = document.getElementById("username-button");
    const messageInput = document.getElementById("message-input");
    const sendButton = document.getElementById("send-button");
    const chatBox = document.getElementById('chat-box-container');
    const chatInterface = document.getElementById('chat-interface');
    
    function handleError(message) {
        console.error(message);
        alert(message);
    }

    function setUsername(name) {
        username = name;
        localStorage.setItem('username', username);
        console.log('Setting username:', username);
        socket.emit("setUsername", username);
        usernameContainer.style.display = "none";
        chatInterface.style.display = "block";
    }

    // Check if username is already set
    if (username) {
        setUsername(username);
    }

    // Set username
    if (setUsernameButton && usernameInput) {
        setUsernameButton.addEventListener("click", () => {
            const name = usernameInput.value.trim();
            if (name) {
                setUsername(name);
            } else {
                handleError('Username is empty');
            }
        });
    } else {
        handleError("Username input or button not found");
    }

    // Send chat message
    if (sendButton && messageInput) {
        sendButton.addEventListener("click", sendMessage);
        messageInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                sendMessage();
            }
        });
    } else {
        handleError("Send button or message input not found");
    }

    function sendMessage() {
        const message = messageInput.value.trim();
        if (message) {
            console.log('Sending message:', message);
            socket.emit("sendMessage", { username, message });
            messageInput.value = "";
        } else {
            console.log('Message is empty');
        }
    }

    // Handle incoming chat messages
    socket.on('message', (data) => {
        appendMessage(data);
    });

    // Receive and display chat history
    socket.on('chatHistory', (history) => {
        chatBox.innerHTML = ''; // Clear chat box before adding history
        history.forEach(message => {
            appendMessage(message);
        });
    });

    function appendMessage(data) {
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
    }

    
});
const startVoiceChatButton = document.getElementById('start-voice-chat');
const disconnectVoiceChatButton = document.getElementById('disconnect-voice-chat');
const voiceChatUsersList = document.getElementById('voice-chat-users');
const speakingStatus = document.getElementById('speaking-status');
const socket = io();
const usernameContainer = document.getElementById("username-container");
const usernameInput = document.getElementById("username-input");
const setUsernameButton = document.getElementById("username-button");
const messageInput = document.getElementById("message-input");
const sendButton = document.getElementById("send-button");
const chatBox = document.getElementById('chat-box-container');
const chatInterface = document.getElementById('chat-interface');
   
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