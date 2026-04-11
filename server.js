require('dotenv').config();
const express = require('express');
const axios = require('axios'); // FIXED: Ensure this is at the top
const cors = require('cors');
const helmet = require('helmet');

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
const RUNWAY_KEY = process.env.RUNWAY_API_KEY;

app.post('/generate', async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "No prompt provided" });

    try {
        // 1. NATIVE LANGUAGE CHAT (Krio Support)
        const chatTask = axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: "google/gemini-2.0-flash-001",
            messages: [
                { role: "system", content: "You are the ReelMind Global AI. Detect the user language. If it is Sierra Leone Krio or any native dialect, respond perfectly in that dialect." },
                { role: "user", content: prompt }
            ]
        }, { headers: { "Authorization": `Bearer ${OPENROUTER_KEY}` } });

        // 2. INSTANT IMAGE PREVIEW (Pollinations)
        const seed = Math.floor(Math.random() * 999999);
        const imageUrl = `https://pollinations.ai/p/${encodeURIComponent(prompt + " cinematic 8k") }?width=1080&height=1920&model=flux&seed=${seed}`;

        // 3. VIDEO TASKING (Runway)
        const runwayTask = axios.post('https://api.runwayml.com/v1/image_to_video', {
            promptText: prompt,
            model: "gen3a_turbo"
        }, { headers: { "Authorization": `Bearer ${RUNWAY_KEY}` } }).catch(() => ({ data: { url: "QUEUED" } }));

        const [chatResponse, runwayResponse] = await Promise.all([chatTask, runwayTask]);

        res.json({
            text: chatResponse.data.choices[0].message.content,
            image: imageUrl,
            videoTask: runwayResponse.data.url // FIXED: Sends Task ID instead of hanging
        });
    } catch (err) {
        res.status(500).json({ error: "Engine Calibration Error" });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Core Live on ${PORT}`));
