const express = require("express");
const router = express.Router();

const admin = require("../firebaseAdmin");
const User = require("../models/User");

/* =========================
   VERIFY TOKEN
========================= */
async function verifyToken(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided"
      });
    }

    const decoded = await admin
      .auth()
      .verifyIdToken(token);

    req.user = decoded;
    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid token"
    });
  }
}

/* =========================
   SYNC USER
========================= */
router.post("/sync", verifyToken, async (req, res) => {
  try {
    const {
      uid,
      email,
      name,
      photoURL
    } = req.body;

    let user = await User.findOne({ uid });

    if (!user) {
      user = await User.create({
        uid,
        email,
        name: name || "User",
        photo: photoURL || "",
        followers: [],
        following: [],
        createdAt: new Date()
      });
    } else {
      user.email = email;
      user.name = name || user.name;
      user.photo = photoURL || user.photo;

      await user.save();
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/* =========================
   GET PROFILE
========================= */
router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({
      uid: req.user.uid
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/* =========================
   UPDATE PROFILE
========================= */
router.put("/profile", verifyToken, async (req, res) => {
  try {
    const updates = req.body;

    const user = await User.findOneAndUpdate(
      { uid: req.user.uid },
      updates,
      { new: true }
    );

    res.json({
      success: true,
      user
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
