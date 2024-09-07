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


// Voice chat variables
let localStream = null;
let peerConnection = null;
const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }; // STUN server for ICE candidates

// DOM elements
const voiceChatButton = document.getElementById("voice-chat-button");
const remoteAudio = document.getElementById("remote-audio");

// Handle voice chat button click
voiceChatButton.addEventListener("click", startVoiceChat);

// Function to start voice chat
function startVoiceChat() {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            localStream = stream;
            setupPeerConnection();
            stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
            voiceChatButton.disabled = true; // Disable the button after starting the voice chat
        })
        .catch(error => console.error("Error accessing media devices.", error));
}

// Function to create and set up a peer connection
function setupPeerConnection() {
    peerConnection = new RTCPeerConnection(configuration);

    // Send any ice candidates to the other peer
    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            socket.emit("iceCandidate", event.candidate);
        }
    };

    // When the remote stream is received, play it
    peerConnection.ontrack = event => {
        remoteAudio.style.display = "block";  // Show the audio element when a remote stream is received
        remoteAudio.srcObject = event.streams[0];
    };

    // Create an offer and send it to the other peer
    peerConnection.createOffer()
        .then(offer => {
            return peerConnection.setLocalDescription(offer);
        })
        .then(() => {
            socket.emit("offer", peerConnection.localDescription);
        });
}

// Handle receiving an offer from another peer
socket.on("offer", description => {
    peerConnection = new RTCPeerConnection(configuration);
    peerConnection.setRemoteDescription(description);

    // Add your local stream to the connection
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    // Create an answer and send it back to the caller
    peerConnection.createAnswer()
        .then(answer => {
            return peerConnection.setLocalDescription(answer);
        })
        .then(() => {
            socket.emit("answer", peerConnection.localDescription);
        });

    // When the remote stream is received, play it
    peerConnection.ontrack = event => {
        remoteAudio.style.display = "block";
        remoteAudio.srcObject = event.streams[0];
    };
});

// Handle receiving an answer from the callee
socket.on("answer", description => {
    peerConnection.setRemoteDescription(description);
});

// Handle ICE candidates
socket.on("iceCandidate", candidate => {
    peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
});
