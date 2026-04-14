const admin = require("firebase-admin");

let app;

// 🔥 INIT SAFELY (PREVENT MULTIPLE INIT)
if (!admin.apps.length) {
  try {
    if (!process.env.FIREBASE_KEY) {
      throw new Error("Missing FIREBASE_KEY env");
    }

    const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);

    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    console.log("🔥 Firebase Admin initialized");

  } catch (error) {
    console.error("❌ Firebase init error:", error.message);
  }
} else {
  app = admin.app();
}

// ✅ EXPORT ADMIN + APP
module.exports = admin;
