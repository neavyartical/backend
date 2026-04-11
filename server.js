require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

// --- 1. MIDDLEWARE ---
app.use(helmet());
app.use(cors());
app.use(express.json());

// --- 2. THE "STORY" LOGIC ---
// I've wrapped this in a try-catch block to prevent "throw err" crashes
app.get('/story', (req, res) => {
    try {
        // Example Data - Replace with your DB logic if needed
        const stories = [
            { id: 1, title: "The First Reel", content: "Welcome to the story API." }
        ];
        
        res.status(200).json(stories);
    } catch (err) {
        // Instead of throwing the error, we send a JSON response
        console.error("Route Error:", err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// --- 3. HEALTH CHECK (For Render) ---
app.get('/', (req, res) => {
    res.send('Server is active and running.');
});

// --- 4. GLOBAL ERROR HANDLER ---
// This is the "safety net" that catches any error in the entire app
app.use((err, req, res, next) => {
    console.error("Caught by Safety Net:", err.stack);
    res.status(500).send('Something broke! Check the server logs.');
});

// --- 5. SERVER STARTUP ---
// Render uses the PORT env variable; 10000 is the backup.
const PORT = process.env.PORT || 10000;

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`
    ✅ Server is live!
    📍 Port: ${PORT}
    🔗 URL: http://localhost:${PORT}
    `);
});

// Handle unhandled promise rejections (like DB connection failures)
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Application continues running instead of crashing
});
