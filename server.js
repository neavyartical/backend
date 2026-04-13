const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");

// FETCH FIX (Render safe)
const fetch = (...args) =>
import("node-fetch").then(({ default: fetch }) => fetch(...args));

// ================= INIT =================
const app = express();
app.use(express.json());
app.use(cors());

// ================= ENV =================
const JWT_SECRET = process.env.JWT_SECRET || "secret123";
const MONGO_URI = process.env.MONGO_URI;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// ================= DB =================
mongoose.connect(MONGO_URI)
.then(() => console.log("✅ DB Connected"))
.catch(err => console.log("❌ DB Error:", err));

// ================= MODELS =================
const User = mongoose.model("User", {
email: String,
password: String
});

const Project = mongoose.model("Project", {
userId: String,
content: String,
type: String
});

Then put the actual line in this
