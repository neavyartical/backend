const admin = require("firebase-admin");

let app;

if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);

    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    console.log("🔥 Firebase Admin initialized");
  } catch (error) {
    console.log("❌ Firebase init error:", error.message);
  }
}

module.exports = admin;
