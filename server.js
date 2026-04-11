import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

const OPENROUTER_API = process.env.OPENROUTER_API_KEY;
const RUNWAY_API = process.env.RUNWAY_API_KEY;

/* ===== ROOT ===== */
app.get("/", (req, res) => {
  res.send("ReelMind Backend Running 🚀");
});

/* ===== GENERATE ALL ===== */
app.post("/generate", async (req, res) => {
  const { prompt } = req.body;

  try {
    /* ================= STORY ================= */
    let story = "Story failed";

    if (OPENROUTER_API) {
      const storyRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: `Write a cinematic viral story about: ${prompt}`
            }
          ]
        })
      });

      const storyData = await storyRes.json();
      story = storyData.choices?.[0]?.message?.content || "Story failed";
    }

    /* ================= IMAGE ================= */
    const image = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;

    /* ================= VIDEO (RUNWAY REAL) ================= */
    let video = null;

    if (RUNWAY_API) {
      // STEP 1: CREATE JOB
      const create = await fetch("https://api.runwayml.com/v1/image_to_video", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RUNWAY_API}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          promptText: prompt,
          duration: 5,
          ratio: "16:9"
        })
      });

      const createData = await create.json();

      const taskId = createData.id;

      // STEP 2: POLLING
      for (let i = 0; i < 10; i++) {
        await new Promise(r => setTimeout(r, 5000));

        const check = await fetch(`https://api.runwayml.com/v1/tasks/${taskId}`, {
          headers: {
            "Authorization": `Bearer ${RUNWAY_API}`
          }
        });

        const result = await check.json();

        if (result.status === "SUCCEEDED") {
          video = result.output[0];
          break;
        }
      }
    }

    res.json({
      story,
      image,
      video
    });

  } catch (err) {
    console.error(err);
    res.json({
      story: "❌ AI error",
      image: "",
      video: null
    });
  }
});

app.listen(PORT, () => console.log("Server running 🚀"));
