const express = require("express");
const cors = require("cors");

let Replicate;
let replicate;

try {
  Replicate = require("replicate");
  if (process.env.REPLICATE_API_TOKEN) {
    replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN
    });
  }
} catch (e) {
  console.log("Replicate not ready");
}

const app = express();
app.use(cors());
app.use(express.json());

/* TEST */
app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

/* 🖼 IMAGE (REPLICATE ONLY) */
app.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!replicate) {
      return res.json({
        image: "https://via.placeholder.com/512"
      });
    }

    const output = await replicate.run(
      "stability-ai/sdxl",
      {
        input: { prompt }
      }
    );

    console.log("IMAGE:", output);

    if (!output || !output[0]) {
      return res.json({
        image: "https://via.placeholder.com/512"
      });
    }

    res.json({ image: output[0] });

  } catch (err) {
    console.error(err);
    res.json({
      image: "https://via.placeholder.com/512"
    });
  }
});

/* 🎬 VIDEO */
app.post("/video", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!replicate) {
      return res.json({
        video: "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif"
      });
    }

    const output = await replicate.run(
      "cjwbw/zeroscope-v2-xl",
      {
        input: {
          prompt,
          num_frames: 24,
          fps: 8
        }
      }
    );

    console.log("VIDEO:", output);

    if (!output) {
      return res.json({
        video: "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif"
      });
    }

    res.json({ video: output });

  } catch (err) {
    console.error(err);
    res.json({
      video: "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif"
    });
  }
});

/* START */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server running on " + PORT));
