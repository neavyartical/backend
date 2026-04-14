const admin = require("firebase-admin");

let serviceAccount;

try {
  serviceAccount = JSON.parse(process.env.FIREBASE_KEY);
  console.log("🔥 FIREBASE PROJECT:", serviceAccount.project_id);
} catch (e) {
  console.error("❌ FIREBASE KEY ERROR:", e.message);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

module.exports = admin;
