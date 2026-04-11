require('dotenv').config();
const express = require('express');
const cors = require('cors');
const storyRoutes = require('./routes/storyRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/story', storyRoutes);

// Essential Render Config: Bind to PORT or default to 10000
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
