const express = require("express");
const router = express.Router();

/* =========================
   PROMPT IMPROVER
========================= */
function improvePrompt(prompt, mode) {
  const clean = String(prompt || "").trim();

  if (!clean) return "";

  if (mode === "text") {
    return `${clean}
Write professionally with immersive storytelling and engaging detail.`;
  }

  if (mode === "image") {
    return `${clean}
masterpiece, ultra realistic, cinematic lighting, highly detailed`;
  }

  if (mode === "video") {
    return `${clean}
cinematic motion, smooth movement, professional film quality`;
  }

  return clean;
}

/* =========================
   AI TEXT
========================= */
router.post("/text", async (req, res) => {
  try {
    const prompt = improvePrompt(req.body.prompt, "text");

    return res.json({
      success: true,
      type: "text",
      data: {
        content: prompt
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Text generation failed"
    });
  }
});

/* =========================
   AI IMAGE
========================= */
router.post("/image", async (req, res) => {
  try {
    const prompt = improvePrompt(req.body.prompt, "image");

    const imageUrl =
      `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}` +
      `?width=1024&height=1024&seed=${Date.now()}&enhance=true&nologo=true&private=true`;

    return res.json({
      success: true,
      type: "image",
      data: {
        url: imageUrl
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Image generation failed"
    });
  }
});

/* =========================
   AI VIDEO
========================= */
router.post("/video", async (req, res) => {
  try {
    const prompt = improvePrompt(req.body.prompt, "video");

    return res.json({
      success: true,
      type: "video",
      data: {
        prompt,
        preview: "https://www.w3schools.com/html/mov_bbb.mp4"
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Video generation failed"
    });
  }
});

/* =========================
   AI EDIT IMAGE
========================= */
router.post("/edit-image", async (req, res) => {
  try {
    const prompt = improvePrompt(req.body.prompt || "Enhance image", "image");

    const imageUrl =
      `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}` +
      `?width=1024&height=1024&seed=${Date.now()}&enhance=true&nologo=true&private=true`;

    return res.json({
      success: true,
      type: "edit-image",
      data: {
        url: imageUrl
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Image editing failed"
    });
  }
});

module.exports = router;
