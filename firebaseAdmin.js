const admin = require("firebase-admin");

let serviceAccount = null;

try {
  if (!process.env.FIREBASE_KEY) {
    console.warn("⚠️ FIREBASE_KEY is missing");
  } else {
    serviceAccount = JSON.parse(process.env.FIREBASE_KEY);
    console.log("🔥 FIREBASE PROJECT:", serviceAccount.project_id);
  }
} catch (error) {
  console.error("❌ FIREBASE KEY ERROR:", error.message);
}

if (!admin.apps.length && serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

module.exports = admin;
