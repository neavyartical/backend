
const express = require("express");
const router = express.Router();

/* =========================
   HELPER
========================= */
function improvePrompt(prompt, mode) {
  const clean = String(prompt || "").trim();

  if (!clean) return "";

  if (mode === "image") {
    return `${clean}
masterpiece, ultra realistic, cinematic lighting, highly detailed`;
  }

  if (mode === "video") {
    return `${clean}
cinematic motion, smooth movement, professional film quality`;
  }

  if (mode === "text") {
    return `${clean}
Write professionally with immersive storytelling`;
  }

  return clean;
}

/* =========================
   TEXT GENERATION
========================= */
router.post("/text", async (req, res) => {
  try {
    const prompt = improvePrompt(req.body.prompt, "text");

    res.json({
      success: true,
      type: "text",
      data: {
        content: prompt
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
   IMAGE GENERATION
========================= */
router.post("/image", async (req, res) => {
  try {
    const prompt = improvePrompt(req.body.prompt, "image");

    const imageUrl =
      `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}` +
      `?width=1024&height=1024&seed=${Date.now()}&enhance=true&nologo=true&private=true`;

    res.json({
      success: true,
      type: "image",
      data: {
        url: imageUrl
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
   VIDEO GENERATION
========================= */
router.post("/video", async (req, res) => {
  try {
    const prompt = improvePrompt(req.body.prompt, "video");

    res.json({
      success: true,
      type: "video",
      data: {
        url: "https://www.w3schools.com/html/mov_bbb.mp4",
        prompt
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
   IMAGE EDIT
========================= */
router.post("/edit", async (req, res) => {
  try {
    const prompt = improvePrompt(
      req.body.prompt || "Enhance image",
      "image"
    );

    const imageUrl =
      `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}` +
      `?width=1024&height=1024&seed=${Date.now()}&enhance=true&nologo=true&private=true`;

    res.json({
      success: true,
      type: "edit",
      data: {
        url: imageUrl
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
