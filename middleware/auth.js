const auth = async (req, res, next) => {
  try {
    const bearer = req.headers.authorization;

    if (!bearer || !bearer.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token" });
    }

    const token = bearer.split(" ")[1];

    const decoded = await admin.auth().verifyIdToken(token);

    req.user = decoded;
    next();

  } catch (err) {
    console.error("❌ TOKEN ERROR:", err.message);

    return res.status(401).json({
      error: "Invalid token",
      details: err.message
    });
  }
};
