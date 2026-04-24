const admin = require("firebase-admin");

let serviceAccount = null;

try {
  const rawKey = process.env.FIREBASE_KEY;

  if (!rawKey) {
    console.warn("⚠️ FIREBASE_KEY is missing");
  } else {
    serviceAccount = JSON.parse(rawKey);

    if (serviceAccount.private_key) {
      serviceAccount.private_key =
        serviceAccount.private_key.replace(/\\n/g, "\n");
    }

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
