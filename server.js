const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;  // Use the port provided by Render

app.use(express.static(path.join(__dirname, 'public')));

// Routes as previously defined
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/login', (req, res) => {
    const { username, password } = req.query;
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
