const socket = io();

document.getElementById('loginButton').addEventListener('click', async () => {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    const response = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    if (response.ok) {
        socket.emit('setUsername', username);
        document.getElementById('loginRegisterContainer').style.display = 'none';
        document.getElementById('chatContainer').style.display = 'block';
    } else {
        document.getElementById('loginMessage').innerText = data.message;
    }
});

socket.on('message', (msg) => {
    const messageEl = document.createElement('div');
    messageEl.innerHTML = `<strong>${msg.username}</strong>: ${msg.text} <span>${msg.time}</span>`;
    document.getElementById('messages').appendChild(messageEl);
});