const socket = io();

let localStream = null;
let peerConnection = null;
let audioContext = null;
let analyser = null;
let speaking = false;
let speakingInterval = null;
let currentUsers = [];
const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

// DOM elements
const voiceChatButton = document.getElementById("voice-chat-button");
const disconnectButton = document.getElementById("disconnect-button");
const voiceChatUsersList = document.getElementById("voice-chat-users");
const remoteAudio = document.getElementById("remote-audio");

// Handle voice chat button click
voiceChatButton.addEventListener("click", startVoiceChat);
disconnectButton.addEventListener("click", disconnectVoiceChat);

function startVoiceChat() {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            localStream = stream;
            setupPeerConnection();
            stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
            startVoiceDetection(stream);

            socket.emit("joinVoiceChat", { username: "TestUser" }); // Replace "TestUser" with actual username if available

            voiceChatButton.style.display = "none";
            disconnectButton.style.display = "inline-block";
        })
        .catch(error => console.error("Error accessing media devices.", error));
}

function disconnectVoiceChat() {
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }

    localStream.getTracks().forEach(track => track.stop());

    socket.emit("leaveVoiceChat");

    voiceChatButton.style.display = "inline-block";
    disconnectButton.style.display = "none";
    remoteAudio.style.display = "none";

    stopVoiceDetection();
}

function setupPeerConnection() {
    peerConnection = new RTCPeerConnection(configuration);

    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            socket.emit("iceCandidate", event.candidate);
        }
    };

    peerConnection.ontrack = event => {
        remoteAudio.style.display = "block";
        remoteAudio.srcObject = event.streams[0];
    };

    peerConnection.createOffer()
        .then(offer => {
            return peerConnection.setLocalDescription(offer);
        })
        .then(() => {
            socket.emit("offer", peerConnection.localDescription);
        });
}

function startVoiceDetection(stream) {
    audioContext = new AudioContext();
    analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    microphone.connect(analyser);
    analyser.fftSize = 512;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    speakingInterval = setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        let sum = dataArray.reduce((acc, val) => acc + val, 0);
        let isSpeaking = sum > 1000;

        if (isSpeaking && !speaking) {
            speaking = true;
            socket.emit("userSpeaking", { username: "TestUser", speaking: true });
        } else if (!isSpeaking && speaking) {
            speaking = false;
            socket.emit("userSpeaking", { username: "TestUser", speaking: false });
        }
    }, 100);
}

function stopVoiceDetection() {
    if (speakingInterval) {
        clearInterval(speakingInterval);
    }
    if (audioContext) {
        audioContext.close();
    }
}

socket.on("offer", description => {
    peerConnection = new RTCPeerConnection(configuration);
    peerConnection.setRemoteDescription(description);

    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    peerConnection.createAnswer()
        .then(answer => {
            return peerConnection.setLocalDescription(answer);
        })
        .then(() => {
            socket.emit("answer", peerConnection.localDescription);
        });

    peerConnection.ontrack = event => {
        remoteAudio.style.display = "block";
        remoteAudio.srcObject = event.streams[0];
    };
});

socket.on("answer", description => {
    peerConnection.setRemoteDescription(description);
});

socket.on("iceCandidate", candidate => {
    peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
});

socket.on("updateVoiceChatUsers", users => {
    currentUsers = users;
    updateVoiceChatUserList();
});

socket.on("userSpeaking", data => {
    const userItem = document.getElementById(`user-${data.username}`);
    if (userItem) {
        userItem.style.fontWeight = data.speaking ? "bold" : "normal";
    }
});

function updateVoiceChatUserList() {
    voiceChatUsersList.innerHTML = "";
    currentUsers.forEach(user => {
        const li = document.createElement("li");
        li.textContent = user.username;
        li.id = `user-${user.username}`;
        voiceChatUsersList.appendChild(li);
    });
}
