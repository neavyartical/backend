async function generate(type) {
  const prompt = document.getElementById("prompt").value;
  const result = document.getElementById("result");

  if (!prompt) {
    result.innerHTML = "❌ Enter something first";
    return;
  }

  result.innerHTML = "⏳ Generating...";

  const res = await fetch("/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ prompt, type })
  });

  const data = await res.json();
  result.innerHTML = data.result;
}

