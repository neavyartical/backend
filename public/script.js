function generate(type) {
  const prompt = document.getElementById("prompt").value;
  const result = document.getElementById("result");

  if (!prompt) {
    result.innerHTML = "❌ Enter something first";
    return;
  }

  if (type === "story") {
    result.innerHTML = "📖 Generating story...<br><br>" + prompt;
  } else if (type === "image") {
    result.innerHTML = `<img src="https://via.placeholder.com/300" />`;
  } else {
    result.innerHTML = "✨ Generating...";
  }
}

function askAI() {
  alert("AI coming soon 🚀");
}

function downloadResult() {
  const text = document.getElementById("result").innerText;
  const blob = new Blob([text], { type: "text/plain" });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "result.txt";
  a.click();
}
