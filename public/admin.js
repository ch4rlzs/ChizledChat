const socket = io();

socket.on('userList', (users) => {
    document.getElementById('userList').innerHTML = 'Connected Users: ' + users.join(', ');
});

socket.on('message', (msg) => {
    const msgEl = document.createElement('div');
    msgEl.innerHTML = `<strong>${msg.username}</strong>: ${msg.text} <span>${msg.time}</span> <button onclick="deleteMessage(${msg.id})">Delete</button>`;
    document.getElementById('adminMessages').appendChild(msgEl);
});

function deleteMessage(id) {
    socket.emit('deleteMessage', id);
}

socket.on('messageDeleted', (id) => {
    const msgEl = document.querySelector(`[data-id="${id}"]`);
    if (msgEl) msgEl.remove();
});