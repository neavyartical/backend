const express = require("express");
const fetch = require("node-fetch");

const router = express.Router();

/* =========================
   ENV
========================= */
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
const RUNWAY_KEY = process.env.RUNWAY_API_KEY;

/* =========================
   PROMPT IMPROVER
========================= */
function improvePrompt(prompt, mode) {
  const clean = String(prompt || "").trim();

  if (!clean) return "";

  if (mode === "text") {
    return `${clean}
Write professionally with immersive storytelling and vivid detail.`;
  }

  if (mode === "image") {
    return `${clean}
masterpiece, ultra realistic, cinematic lighting, highly detailed`;
  }

  if (mode === "video") {
    return `${clean}
cinematic motion, smooth camera movement, film quality`;
  }

  return clean;
}

/* =========================
   TEXT - OPENROUTER
========================= */
router.post("/text", async (req, res) => {
  try {
    const prompt = improvePrompt(req.body.prompt, "text");

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });

    const data = await response.json();

    res.json({
      success: true,
      data: {
        content: data.choices?.[0]?.message?.content || ""
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Text generation failed"
    });
  }
});

/* =========================
   IMAGE - POLLINATIONS
========================= */
router.post("/image", async (req, res) => {
  try {
    const prompt = improvePrompt(req.body.prompt, "image");

    const url =
      `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}` +
      `?width=1024&height=1024&seed=${Date.now()}&enhance=true&nologo=true&private=true`;

    res.json({
      success: true,
      data: {
        url
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Image generation failed"
    });
  }
});

/* =========================
   VIDEO - RUNWAY
========================= */
router.post("/video", async (req, res) => {
  try {
    const prompt = improvePrompt(req.body.prompt, "video");

    const response = await fetch("https://api.runwayml.com/v1/video", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RUNWAY_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        promptText: prompt
      })
    });

    const data = await response.json();

    res.json({
      success: true,
      data: {
        url: data.videoUrl || data.url || ""
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Video generation failed"
    });
  }
});

/* =========================
   EDIT IMAGE
========================= */
router.post("/edit-image", async (req, res) => {
  try {
    const prompt = improvePrompt(
      req.body.prompt || "Enhance image",
      "image"
    );

    const url =
      `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}` +
      `?width=1024&height=1024&seed=${Date.now()}&enhance=true&nologo=true&private=true`;

    res.json({
      success: true,
      data: {
        url
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Image editing failed"
    });
  }
});

module.exports = router;
