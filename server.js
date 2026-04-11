// 1. Imports
require('dotenv').config(); // Loads environment variables from a .env file
const express = require('express');
const cors = require('cors');
const helmet = require('helmet'); // Adds security headers
const storyRoutes = require('./routes/storyRoutes');

const app = express();

// 2. Global Middleware
app.use(helmet()); // Basic security for headers
app.use(cors());   // Allows your frontend to access the API
app.use(express.json()); // Parses incoming JSON requests
app.use(express.urlencoded({ extended: true })); // Parses URL-encoded data

// 3. Health Check Route
// Useful for Render to monitor if your app is "alive"
app.get('/health', (req, res) => {
    res.status(200).send('Server is healthy');
});

// 4. API Routes
app.use('/story', storyRoutes);

// 5. 404 Handler (For routes that don't exist)
app.use((req, res, next) => {
    res.status(404).json({ message: "Route not found" });
});

// 6. Global Error Handling Middleware
// This prevents your server from crashing if a route has an unhandled error
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        message: "Something went wrong on the server",
        error: process.env.NODE_ENV === 'development' ? err.message : {} 
    });
});

// 7. Server Initialization
// Render requires '0.0.0.0' to correctly bind to their network
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`--- Server Started ---`);
    console.log(`Port: ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
