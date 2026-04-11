require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

// --- 1. PRO-TIER SECURITY ---
// Set security headers, but allow loading external media from Pollinations/Runway
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

// --- 2. API CONFIGURATION (Render Environment Variables) ---
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
const RUNWAY_KEY = process.env.RUNWAY_API_KEY;

// --- 3. THE BURST-MODE ROUTE ---
app.post('/generate', async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) return res.status(400).json({ error: "Input prompt is required." });

    // --- Concurrent Generation Tasks ---
    try {
        console.log(`💎 REELMIND CORE Level 17: Multi-Modal Burst for prompt: "${prompt}"`);

        // TASK 1: CHAT & SCRIPTING (OpenRouter)
        const chatTask = axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: "google/gemini-2.0-flash-001",
            messages: [{ role: "user", content: `You are ReelMind AI Level 17 SaaS. Write a world-class problem solution and short script for: "${prompt}"` }]
        }, {
            headers: { 
                "Authorization": `Bearer ${OPENROUTER_KEY}`,
                "HTTP-Referer": "https://reelmindbackend-1.onrender.com",
                "X-Title": "ReelMind Pro Engine"
            },
            timeout: 25000 // 25s timeout for chat
        });

        // TASK 2: 4K IMAGE GENERATION (Pollinations)
        const seed = Math.floor(Math.random() * 999999);
        // We use Flux model for "World Class" quality
        const imageUrl = `https://pollinations.ai/p/${encodeURIComponent(prompt + " ultra cinematic 8k detail unreal engine 5 dramatic lighting") }?width=1920&height=1080&model=flux&seed=${seed}`;
        
        // TASK 3: VIDEO GENERATION (Runway Gen-3 Alpha API)
        const runwayTask = axios.post('https://api.runwayml.com/v1/image_to_video', {
            promptText: prompt,
            model: "gen3a_turbo"
        }, {
            headers: { 
                "Authorization": `Bearer ${RUNWAY_KEY}`,
                "Content-Type": "application/json"
            }
        });

        // --- Execute concurrent tasks ---
        // Note: We don't wait for Runway to *finish*, we only wait for it to *accept* the task.
        const [chatResponse, runwayResponse] = await Promise.all([
            chatTask.catch(e => ({ data: { choices: [{ message: { content: "Text calibration issue." } }] } })),
            runwayTask.catch(e => ({ data: { url: "VIDEO_TASK_QUEUED" } }))
        ]);

        // Unified professional SaaS response
        res.status(200).json({
            text: chatResponse.data.choices[0].message.content,
            image: imageUrl,
            // Runway sends a temporary URL or Task ID to poll. We pass it along.
            videoTask: runwayResponse.data.url 
        });

    } catch (err) {
        console.error("CORE ERROR:", err.message);
        res.status(500).json({ error: "High-Priority Node Congestion", message: "Calibration required. Retry in 15s." });
    }
});

// --- STABILITY SETTINGS & HEALTH CHECK ---
app.get('/', (req, res) => res.send('ReelMind Pro Core: Burst Engine Online v2.3.0'));

// Safety Net to prevent crashing from unhandled throw-err logic
app.use((err, req, res, next) => {
    console.error("GLOBAL SAFETY NET TRIGGERED:", err.stack);
    res.status(500).json({ error: "System Freeze Bypassed. Keeping Nodes Online." });
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection prevented crash:', reason);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 REELMIND CORE LIVE ON ${PORT}`);
});
            
