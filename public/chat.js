document.addEventListener('DOMContentLoaded', () => {
    let socket = new WebSocket('wss://your-server-url'); // Ensure correct URL
    
    let username = localStorage.getItem('username');
    let peerConnection;
    let localStream = null;
    let remoteStream = null;
    let isVoiceChatting = false;

    const startVoiceChatButton = document.getElementById('start-voice-chat');
    const disconnectVoiceChatButton = document.getElementById('disconnect-voice-chat');
    const voiceChatUsersList = document.getElementById('voice-chat-users');
    const speakingStatus = document.getElementById('speaking-status');

    // WebSocket connection state handling
    socket.onopen = () => {
        console.log("WebSocket connection opened.");
    };

    socket.onerror = (error) => {
        console.error('WebSocket Error:', error);
    };

    socket.onclose = () => {
        console.log('WebSocket connection closed.');
    };

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
                if (socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({ type: 'joinVoiceChat', username }));
                } else {
                    console.error('WebSocket not open, cannot join voice chat.');
                }

                peerConnection = new RTCPeerConnection(iceConfig);
                peerConnection.onicecandidate = (event) => {
                    if (event.candidate && socket.readyState === WebSocket.OPEN) {
                        socket.send(JSON.stringify({ type: 'iceCandidate', candidate: event.candidate }));
                    } else {
                        console.error('WebSocket not open, cannot send candidate.');
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
                if (socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({ type: 'offer', offer }));
                } else {
                    console.error('WebSocket not open, cannot send offer.');
                }

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
            if (socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ type: 'leaveVoiceChat', username }));
            } else {
                console.error('WebSocket not open, cannot leave voice chat.');
            }

            startVoiceChatButton.style.display = 'block';
            disconnectVoiceChatButton.style.display = 'none';
            isVoiceChatting = false;
        });
    }

    // Handle signaling messages
    socket.onmessage = async (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'offer') {
            peerConnection = new RTCPeerConnection(iceConfig);
            localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
            await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);

            if (socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ type: 'answer', answer, to: data.from }));
            } else {
                console.error('WebSocket not open, cannot send answer.');
            }
        }

        if (data.type === 'answer') {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
        }

        if (data.type === 'iceCandidate') {
            if (data.candidate) {
                peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
            }
        }
    };
});
