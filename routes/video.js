import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import videoRoutes from "./routes/video.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

/* =========================
   API ROUTES
========================= */
app.use("/videos", videoRoutes);

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
