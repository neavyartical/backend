const BACKEND_URL = "https://backend-ppyz.onrender.com";

async function generate() {
  console.log("🔥 Button clicked");

  document.getElementById("status").innerText = "Testing connection...";

  try {
    const res = await fetch(`${BACKEND_URL}/test`);

    console.log("📡 Request sent");

    const data = await res.json();

    console.log("✅ Response:", data);

    document.getElementById("status").innerText = data.message;

  } catch (err) {
    console.error("❌ ERROR:", err);
    document.getElementById("status").innerText = "Connection failed ❌";
  }
}
