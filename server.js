require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

// --- PRODUCTION SECURITY ---
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

// API Keys - Set in Render Settings
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
const RUNWAY_KEY = process.env.RUNWAY_API_KEY;

// --- MASTER GENERATION GATE ---
app.post('/generate', async (req, res) => {
    const { action, input } = req.body;

    if (!input) return res.status(400).json({ error: "Input required" });

    try {
        // ACTION: CHAT / STORY / PROBLEM SOLVING
        if (action === 'chat') {
            const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
                model: "google/gemini-2.0-flash-001",
                messages: [{ role: "user", content: `You are ReelMind AI Unlimited. Response task: ${input}` }]
            }, {
                headers: { "Authorization": `Bearer ${OPENROUTER_KEY}` }
            });
            return res.json({ type: 'text', data: response.data.choices[0].message.content });
        }

        // ACTION: 4K IMAGE GENERATION (Flux/Pollinations)
        if (action === 'image') {
            const seed = Math.floor(Math.random() * 1000000);
            const imageUrl = `https://pollinations.ai/p/${encodeURIComponent(input + " cinematic lighting 8k resolution unreal engine") }?width=1920&height=1080&model=flux&seed=${seed}`;
            return res.json({ type: 'image', data: imageUrl });
        }

        // ACTION: VIDEO (Runway Gen-3)
        if (action === 'video') {
            const response = await axios.post('https://api.runwayml.com/v1/image_to_video', {
                promptText: input,
                model: "gen3a_turbo"
            }, {
                headers: { "Authorization": `Bearer ${RUNWAY_KEY}` }
            });
            return res.json({ type: 'video', data: response.data.url });
        }

    } catch (err) {
        console.error("ENGINE ERROR:", err.message);
        res.status(500).json({ error: "AI Engine Busy", message: "Retrying in 5 seconds..." });
    }
});

app.get('/', (req, res) => res.send('ReelMind AI Unlimited Engine v2.2.0: ACTIVE'));

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Engine Core Online on ${PORT}`));
