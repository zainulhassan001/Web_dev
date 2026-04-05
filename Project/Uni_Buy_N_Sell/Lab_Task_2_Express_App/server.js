const express = require('express');
const app = express();
const PORT = 3000;

// Set EJS as view engine
app.set('view engine', 'ejs');
app.set('views', './views');

// Serve static files (CSS, JS, images, etc.)
app.use(express.static('public'));

// Route for home page
app.get('/', (req, res) => {
    res.render('index');
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
