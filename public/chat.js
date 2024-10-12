document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    let username = localStorage.getItem('username');
    let peerConnection;
    let localStream = null;
    let remoteStream = null;
    let isVoiceChatting = false;

    const startVoiceChatButton = document.getElementById('start-voice-chat');
    const disconnectVoiceChatButton = document.getElementById('disconnect-voice-chat');
    const voiceChatUsersList = document.getElementById('voice-chat-users');
    const speakingStatus = document.getElementById('speaking-status');

    // ICE configuration for WebRTC
    const iceConfig = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' } // Google's public STUN server
        ]
    };

    // Start voice chat
    if (startVoiceChatButton) {
        startVoiceChatButton.addEventListener("click", async () => {
            if (isVoiceChatting) return;

            try {
                localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                socket.emit('joinVoiceChat', username);

                peerConnection = new RTCPeerConnection(iceConfig);
                peerConnection.onicecandidate = (event) => {
                    if (event.candidate) {
                        socket.emit('iceCandidate', { candidate: event.candidate, to: targetUserId });
                    }
                };

                peerConnection.ontrack = (event) => {
                    if (!remoteStream) {
                        remoteStream = new Audio();
                        remoteStream.srcObject = event.streams[0];
                        remoteStream.play();
                    }
                };

                localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
                
                const offer = await peerConnection.createOffer();
                await peerConnection.setLocalDescription(offer);
                socket.emit('offer', { offer, to: targetUserId });

                startVoiceChatButton.style.display = 'none';
                disconnectVoiceChatButton.style.display = 'block';
                isVoiceChatting = true;
            } catch (error) {
                console.error('Error accessing media devices.', error);
            }
        });
    }

    // Disconnect voice chat
    if (disconnectVoiceChatButton) {
        disconnectVoiceChatButton.addEventListener("click", () => {
            if (!isVoiceChatting) return;

            localStream.getTracks().forEach(track => track.stop());
            peerConnection.close();
            socket.emit('leaveVoiceChat', username);

            startVoiceChatButton.style.display = 'block';
            disconnectVoiceChatButton.style.display = 'none';
            isVoiceChatting = false;
        });
    }

    // Handle signaling messages
    socket.on('offer', async ({ offer, from }) => {
        peerConnection = new RTCPeerConnection(iceConfig);

        localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
        peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        socket.emit('answer', { answer, to: from });
    });

    socket.on('answer', (answer) => {
        peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on('iceCandidate', (data) => {
        if (data.candidate) {
            peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
    });
});
