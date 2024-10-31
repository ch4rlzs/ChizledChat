const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, 'public'))); // Serve static files (HTML, CSS, JS)

// Route for the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route for the admin page
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Sample endpoint to validate login (for simplicity, replace this with a real authentication method)
app.get('/login', (req, res) => {
    const { username, password } = req.query;

    // Simple hardcoded validation (replace with real authentication)
    if (username === 'admin' && password === 'adminpass') {
        res.json({ success: true, role: 'admin' });
    } else if (username === 'user' && password === 'userpass') {
        res.json({ success: true, role: 'user' });
    } else {
        res.json({ success: false });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
