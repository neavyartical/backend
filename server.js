// MAIN GENERATE FUNCTION
function generate(type) {
  const prompt = document.getElementById("prompt").value;
  const result = document.getElementById("result");

  if (!prompt) {
    result.innerHTML = "<p style='color:red;'>❌ Please enter something first</p>";
    return;
  }

  // 🔄 Loading effect
  result.innerHTML = "<p>⏳ Generating...</p>";

  setTimeout(() => {
    if (type === "story") {
      result.innerHTML = `
        <h3>📖 Story</h3>
        <p>Once upon a time, ${prompt} turned into something amazing. This idea went viral and shocked everyone...</p>
      `;
    }

    else if (type === "image") {
      result.innerHTML = `
        <h3>🖼 Image</h3>
        <img src="https://picsum.photos/400/300" alt="Generated Image">
      `;
    }

    else if (type === "video") {
      result.innerHTML = `
        <h3>🎬 Video Idea</h3>
        <p>Create a viral video about "${prompt}" with dramatic music, fast cuts, and trending captions.</p>
      `;
    }

    else {
      result.innerHTML = `
        <h3>✨ AI Result</h3>
        <p>Here’s a powerful idea based on your input: "${prompt}" — this could easily go viral on TikTok and Reels.</p>
      `;
    }
  }, 1500);
}

// ASK AI BUTTON
function askAI() {
  const result = document.getElementById("result");
  result.innerHTML = "<p>🌍 AI assistant coming soon... stay tuned 🚀</p>";
}

// DOWNLOAD RESULT
function downloadResult() {
  const text = document.getElementById("result").innerText;

  if (!text) {
    alert("Nothing to download!");
    return;
  }

  const blob = new Blob([text], { type: "text/plain" });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "reelmind-result.txt";
  link.click();
}
