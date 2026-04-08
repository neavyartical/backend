import express from "express";
import cors from "cors";
import Replicate from "replicate";

const app = express();

app.use(cors());
app.use(express.json());

// ✅ use official replicate client
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// ✅ test route
app.get("/", (req, res) => {
  res.send("ReelMind Backend is running 🚀");
});

// ✅ generate route
app.post("/generate", async (req, res) => {
  const { prompt } = req.body;

  try {
    const output = await replicate.run(
      "stability-ai/sdxl:latest",
      {
        input: {
          prompt: prompt
        }
      }
    );

    res.json({ output });

  } catch (error) {
    console.error(error);
    res.json({ error: "Generation failed", details: error.message });
  }
});

app.listen(3000, () => console.log("Server running 🚀"));
