require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

// --- 1. SECURITY & CONFIG ---
app.use(helmet({
    contentSecurityPolicy: false, // Allows loading images/videos from external AI APIs
}));
app.use(cors());
app.use(express.json());

// API Keys from Render Environment Variables
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
const RUNWAY_KEY = process.env.RUNWAY_API_KEY;

// --- 2. THE AI CORE ENGINE ---

const ReelMindEngine = {
    // OpenRouter for GPT-4 / Claude / Gemini (Chat & Logic)
    solveProblem: async (input) => {
        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: "google/gemini-2.0-flash-001", 
            messages: [{ role: "user", content: `You are ReelMind AI, a world-class problem solver. Task: ${input}` }]
        }, {
            headers: { 
                "Authorization": `Bearer ${OPENROUTER_KEY}`,
                "HTTP-Referer": "https://reelmind.ai", // Required by OpenRouter
                "X-Title": "ReelMind AI"
            },
            timeout: 30000 // 30 second timeout
        });
        return { type: 'text', data: response.data.choices[0].message.content };
    },

    // Pollinations for High-End Flux/Stable Diffusion Images
    generate4K: async (input) => {
        // We use Flux model for "World Class" quality
        const seed = Math.floor(Math.random() * 1000000);
        const imageUrl = `https://pollinations.ai/p/${encodeURIComponent(input)}?width=1920&height=1080&model=flux&seed=${seed}`;
        return { type: 'image', data: imageUrl };
    },

    // Runway ML for Professional Video
    generateVideo: async (input) => {
        // Note: Runway often requires a 'Task ID' flow. This starts the generation.
        const response = await axios.post('https://api.runwayml.com/v1/image_to_video', {
            promptText: input,
            model: "gen3a_turbo",
            ratio: "16:9"
        }, {
            headers: { "Authorization": `Bearer ${RUNWAY_KEY}` }
        });
        return { type: 'video', data: response.data.url };
    }
};

// --- 3. ROUTES ---

app.post('/generate', async (req, res) => {
    const { action, input } = req.body;

    if (!input) return res.status(400).json({ error: "Prompt is required" });

    try {
        let result;
        switch (action) {
            case 'chat':
                result = await ReelMindEngine.solveProblem(input);
                break;
            case 'image':
                result = await ReelMindEngine.generate4K(input);
                break;
            case 'video':
                result = await ReelMindEngine.generateVideo(input);
                break;
            default:
                throw new Error("Invalid AI action requested");
        }
        res.status(200).json(result);

    } catch (err) {
        console.error("ENGINE ERROR:", err.response?.data || err.message);
        res.status(500).json({ 
            error: "Generation Failed", 
            details: err.response?.data?.error?.message || "Internal Engine Error" 
        });
    }
});

// Health Check
app.get('/', (req, res) => res.send('ReelMind Pro-Engine: Online'));

// --- 4. ANTI-CRASH SAFETY NET ---

// Catch 404
app.use((req, res) => res.status(404).send("Not Found"));

// Global Error Boundary (Prevents 'Throw Err' from crashing the server)
app.use((err, req, res, next) => {
    console.error("GLOBAL CRASH PREVENTED:", err.stack);
    res.status(500).json({ error: "The engine encountered a temporary freeze. Please retry." });
});

// Process-level protection
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// --- 5. SERVER LAUNCH ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`
    💎 REELMIND AI CORE STARTED 💎
    ------------------------------
    STATUS: World-Class Ready
    PORT: ${PORT}
    BIND: 0.0.0.0
    ------------------------------
    `);
});
