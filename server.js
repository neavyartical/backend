require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

// --- 1. SECURITY & CONFIGURATION ---
// helmet() protects your server headers. 
// We disable CSP specifically for external AI media loading.
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

// API Keys - MUST be set in Render Dashboard > Environment Variables
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
const RUNWAY_KEY = process.env.RUNWAY_API_KEY;

// --- 2. THE AI MULTI-ENGINE ---

const ReelMindEngine = {
    
    // PROBLEM SOLVER (OpenRouter -> Gemini 2.0 / GPT-4)
    solveProblem: async (input) => {
        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: "google/gemini-2.0-flash-001", // High-speed, high-intelligence 2026 model
            messages: [{ role: "user", content: `You are ReelMind AI. Solve this: ${input}` }]
        }, {
            headers: { 
                "Authorization": `Bearer ${OPENROUTER_KEY}`,
                "HTTP-Referer": "https://reelmindbackend-1.onrender.com",
                "X-Title": "ReelMind AI Studio"
            },
            timeout: 25000 // 25s timeout for chat
        });
        return { type: 'text', data: response.data.choices[0].message.content };
    },

    // 4K IMAGE GENERATION (Pollinations Flux Engine)
    generate4K: async (input) => {
        const seed = Math.floor(Math.random() * 999999);
        // Using 'flux' model for world-class cinematic quality
        const imageUrl = `https://pollinations.ai/p/${encodeURIComponent(input)}?width=1920&height=1080&model=flux&seed=${seed}`;
        return { type: 'image', data: imageUrl };
    },

    // VIDEO GENERATION (Runway Gen-3 Alpha API)
    generateVideo: async (input) => {
        const response = await axios.post('https://api.runwayml.com/v1/image_to_video', {
            promptText: input,
            model: "gen3a_turbo",
            spawn_audio: true
        }, {
            headers: { "Authorization": `Bearer ${RUNWAY_KEY}` },
            timeout: 60000 // 60s timeout for video start
        });
        return { type: 'video', data: response.data.url };
    }
};

// --- 3. THE "SMART" ROUTE ---

app.post('/generate', async (req, res) => {
    const { action, input } = req.body;

    if (!input) return res.status(400).json({ error: "No input provided." });

    try {
        let result;
        if (action === 'chat') result = await ReelMindEngine.solveProblem(input);
        else if (action === 'image') result = await ReelMindEngine.generate4K(input);
        else if (action === 'video') result = await ReelMindEngine.generateVideo(input);
        else throw new Error("Unknown action.");

        res.status(200).json(result);
    } catch (err) {
        // Detailed error logging for you, clean error for the user
        console.error("ENGINE ERROR:", err.response?.data || err.message);
        res.status(500).json({ 
            error: "AI Engine Busy", 
            message: "Our high-end models are processing. Please try again in 10 seconds." 
        });
    }
});

// Health check for Render monitoring
app.get('/', (req, res) => res.send('ReelMind Pro Core: Online'));

// --- 4. GLOBAL CRASH PROTECTION ---

// Handle standard 404s
app.use((req, res) => res.status(404).json({ error: "Route not found" }));

// The "Safety Net" - prevents 'Throw Err' from killing the process
app.use((err, req, res, next) => {
    console.error("CRITICAL SAFETY NET TRIGGERED:", err.stack);
    res.status(500).json({ error: "Server encountered a temporary glitch." });
});

// Catch unhandled promise rejections (like API timeouts)
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection prevented crash:', reason);
});

// --- 5. SERVER LAUNCH ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`
    🧊 REELMIND AI CORE ONLINE
    ---------------------------------
    PORT: ${PORT}
    MODE: Production (2026 Standard)
    SECURITY: Enabled (Helmet v7)
    ---------------------------------
    `);
});
                         
