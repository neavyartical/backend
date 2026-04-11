require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

// --- 1. GLOBAL SECURITY & MEDIA ACCESS ---
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
const RUNWAY_KEY = process.env.RUNWAY_API_KEY;

// --- 2. THE GLOBAL GENERATION GATE ---
app.post('/generate', async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) return res.status(400).json({ error: "No input vision." });

    try {
        console.log(`🌐 GLOBAL ENGINE: Processing ${prompt}`);

        // TASK 1: NATIVE LANGUAGE AI (Supports Krio, Pidgin, Wolof, etc.)
        const chatTask = axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: "google/gemini-2.0-flash-001",
            messages: [{ 
                role: "system", 
                content: "You are the ReelMind Global AI. Detect the user's language and respond fluently. If the user speaks in Sierra Leone Krio, Pidgin, or any native dialect, respond perfectly in that same dialect. Keep it cinematic."
            }, 
            { role: "user", content: prompt }]
        }, {
            headers: { "Authorization": `Bearer ${OPENROUTER_KEY}` }
        });

        // TASK 2: INSTANT PREVIEW (Pollinations)
        const seed = Math.floor(Math.random() * 999999);
        const imageUrl = `https://pollinations.ai/p/${encodeURIComponent(prompt + " cinematic 8k ultra-detailed unreal engine 5") }?width=1920&height=1080&model=flux&seed=${seed}`;

        // TASK 3: VIDEO TASKING (Runway)
        const runwayTask = axios.post('https://api.runwayml.com/v1/image_to_video', {
            promptText: prompt,
            model: "gen3a_turbo"
        }, {
            headers: { "Authorization": `Bearer ${RUNWAY_KEY}`, "Content-Type": "application/json" }
        }).catch(() => ({ data: { url: "QUEUED" } }));

        const [chatResponse, runwayResponse] = await Promise.all([chatTask, runwayTask]);

        res.json({
            text: chatResponse.data.choices[0].message.content,
            image: imageUrl,
            videoTask: runwayResponse.data.url
        });

    } catch (err) {
        console.error("CORE CRASH PREVENTED:", err.message);
        res.status(500).json({ error: "System Calibrating", message: "Retry in 10s." });
    }
});

// --- 3. STABILITY MONITOR ---
app.get('/', (req, res) => res.send('ReelMind Global Core v2.4.0: Active'));

app.use((err, req, res, next) => {
    console.error("CRITICAL ERROR BYPASS:", err.stack);
    res.status(500).json({ error: "Engine recovery active." });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 ReelMind Global Online: ${PORT}`));
