const admin = require("../firebaseAdmin");
const jwt = require("jsonwebtoken");

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: "No token" });
    }

    const token = authHeader.split(" ")[1] || authHeader;

    let decoded;

    // 🔥 TRY FIREBASE FIRST
    try {
      decoded = await admin.auth().verifyIdToken(token);
    } catch (firebaseError) {

      // 🔁 FALLBACK TO JWT (OLD SYSTEM)
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (jwtError) {
        return res.status(401).json({ error: "Invalid token" });
      }
    }

    req.user = decoded;
    next();

  } catch (err) {
    console.error(err);
    res.status(401).json({ error: "Auth failed" });
  }
};
