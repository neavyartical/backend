
// ===============================
// CONFIG
// ===============================
const API_URL = "https://reelmindbackend-1.onrender.com";

// ===============================
// GENERATE FUNCTION
// ===============================
async function generate(type = "all") {
  const prompt = document.getElementById("prompt").value;
  const resultDiv = document.getElementById("result");

  if (!prompt) {
    alert("Please enter something!");
    return;
  }

  resultDiv.innerHTML = "⏳ Generating...";

  try {
    const res = await fetch(`${API_URL}/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt, type }),
    });

    const data = await res.json();

    // CLEAR RESULT FIRST
    resultDiv.innerHTML = "";

    // ===============================
    // HANDLE STORY ONLY
    
