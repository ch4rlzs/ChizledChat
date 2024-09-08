const socket = io();
let username = localStorage.getItem('username');
let peerConnections = {};
let localStream = null;
let voiceChatUsersList = document.getElementById('voice-chat-users');
let speakingStatus = document.getElementById('speaking-status');

// DOM elements for chat
const usernameInput = document.getElementById("username-input");
const setUsernameButton = document.getElementById("set-username");
const messageInput = document.getElementById("message-input");
const sendButton = document.getElementById("send-button");
const startVoiceChatButton = document.getElementById("start-voice-chat");
const disconnectVoiceChatButton = document.getElementById("disconnect-voice-chat");

// Function to join chat with a username
function joinChat(username) {
    socket.emit("setUsername", username);
}

// Set username
setUsernameButton.addEventListener("click", () => {
    username = usernameInput.value.trim();
    if (username) {
        localStorage.setItem('username', username);
        joinChat(username);
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

// Display incoming messages
socket.on('message', (data) => {
    const chatBox = document.getElementById('chat-box');
    const messageElement = document.createElement('p');
    const time = `[${data.time}] `;
    const sender = `${data.username}: `;
    const messageText = `${data.message}`;
    
    
    
    
    messageElement.textContent = `[${data.time}] ${data.username}: ${data.message}`;
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
});

// Receive and display chat history
socket.on('chatHistory', (history) => {
    const chatBox = document.getElementById('chat-box');
    chatBox.innerHTML = ''; // Clear chat box before adding history
    history.forEach(message => {
        const messageElement = document.createElement('p');
        messageElement.textContent = `[${message.time}] ${message.username}: ${message.message}`;
        chatBox.appendChild(messageElement);
    });
    chatBox.scrollTop = chatBox.scrollHeight;
});

// Start Voice Chat
startVoiceChatButton.addEventListener("click", () => {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            localStream = stream;
            socket.emit('joinVoiceChat', { username });

            // Show disconnect button
            startVoiceChatButton.style.display = 'none';
            disconnectVoiceChatButton.style.display = 'block';
        })
        .catch(error => {
            console.error('Error accessing media devices.', error);
        });
});

// Disconnect from Voice Chat
disconnectVoiceChatButton.addEventListener("click", () => {
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());  // Stop the local audio stream
    }
    socket.emit('leaveVoiceChat', { username });

    // Reset UI
    startVoiceChatButton.style.display = 'block';
    disconnectVoiceChatButton.style.display = 'none';
    speakingStatus.innerHTML = '';
});

// Handle WebRTC signaling
socket.on('offer', async (id, description) => {
    const peerConnection = new RTCPeerConnection();
    peerConnections[id] = peerConnection;
    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            socket.emit('iceCandidate', { id, candidate: event.candidate });
        }
    };
    peerConnection.ontrack = event => {
        const audio = document.createElement('audio');
        audio.srcObject = event.streams[0];
        audio.play();
    };
    await peerConnection.setRemoteDescription(new RTCSessionDescription(description));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit('answer', id, peerConnection.localDescription);
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
});

socket.on('answer', async (id, description) => {
    await peerConnections[id].setRemoteDescription(new RTCSessionDescription(description));
});

socket.on('iceCandidate', async (id, candidate) => {
    await peerConnections[id].addIceCandidate(new RTCIceCandidate(candidate));
});

socket.on('updateVoiceChatUsers', users => {
    voiceChatUsersList.innerHTML = "";
    users.forEach(user => {
        const li = document.createElement("li");
        li.textContent = user.username;
        li.id = `user-${user.username}`;
        voiceChatUsersList.appendChild(li);
    });
});

// Handle user speaking status
socket.on('userSpeaking', data => {
    const userItem = document.getElementById(`user-${data.username}`);
    if (userItem) {
        userItem.style.fontWeight = data.speaking ? "bold" : "normal";
    }
});

