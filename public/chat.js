const users = [
    { username: "user", password: "userpass", role: "user" },
    { username: "admin", password: "adminpass", role: "admin" }
];

let currentUserRole = null;

function login() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        currentUserRole = user.role;
        if (user.role === "admin") {
            document.getElementById("admin-page").style.display = "block";
        } else {
            document.getElementById("chat-section").style.display = "block";
        }
        document.getElementById("login-section").style.display = "none";
    } else {
        alert("Invalid credentials!");
    }
}

function logout() {
    document.getElementById("chat-section").style.display = "none";
    document.getElementById("admin-page").style.display = "none";
    document.getElementById("login-section").style.display = "block";
    currentUserRole = null;
}

function sendMessage() {
    const message = document.getElementById("message").value;
    if (message.trim() === "") return;

    const chatBox = document.getElementById("chat-box");
    const messageContainer = document.createElement("div");
    messageContainer.className = "message";

    // Display message text
    const messageText = document.createElement("span");
    messageText.innerText = message;
    messageContainer.appendChild(messageText);

    // If user is admin, show delete button
    if (currentUserRole === "admin") {
        const deleteBtn = document.createElement("button");
        deleteBtn.innerText = "Delete";
        deleteBtn.className = "delete-btn";
        deleteBtn.onclick = () => messageContainer.remove();
        messageContainer.appendChild(deleteBtn);
    }

    chatBox.appendChild(messageContainer);
    document.getElementById("message").value = "";
    chatBox.scrollTop = chatBox.scrollHeight;
}
