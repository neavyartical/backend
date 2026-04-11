require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

// Security & Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

// API Connections
const API_CONFIG = {
    openRouter: "https://openrouter.ai/api/v1/chat/completions",
    runway: "https://api.runwayml.com/v1/image_to_video"
};

// --- AI LOGIC ---
app.post('/generate', async (req, res) => {
    const { action, input } = req.body;
    if (!input) return res.status(400).json({ error: "Input required" });

    try {
        if (action === 'chat') {
            const response = await axios.post(API_CONFIG.openRouter, {
                model: "google/gemini-2.0-flash-001",
                messages: [{ role: "user", content: input }]
            }, {
                headers: { "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}` }
            });
            return res.json({ type: 'text', data: response.data.choices[0].message.content });
        }

        if (action === 'image') {
            const imageUrl = `https://pollinations.ai/p/${encodeURIComponent(input)}?width=1920&height=1080&model=flux`;
            return res.json({ type: 'image', data: imageUrl });
        }

        if (action === 'video') {
            const response = await axios.post(API_CONFIG.runway, {
                promptText: input, model: "gen3a_turbo"
            }, {
                headers: { "Authorization": `Bearer ${process.env.RUNWAY_API_KEY}` }
            });
            return res.json({ type: 'video', data: response.data.url });
        }
    } catch (err) {
        console.error("Engine Error:", err.message);
        res.status(500).json({ error: "AI Engine busy. Please retry." });
    }
});

// Production Health Check
app.get('/health', (req, res) => res.status(200).send('ReelMind AI: Online'));
app.get('/', (req, res) => res.send('ReelMind API Active'));

// Crash Prevention Safety Net
app.use((err, req, res, next) => {
    console.error("Global Safety Net:", err.stack);
    res.status(500).json({ error: "Server encountered a minor freeze. Keeping system alive." });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 ReelMind Professional Engine live on ${PORT}`);
});
