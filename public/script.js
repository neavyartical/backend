function generate() {
  const prompt = document.getElementById("prompt").value;
  document.getElementById("result").innerHTML =
    "<p>Generating content for: <b>" + prompt + "</b></p>";
}

function generateType(type) {
  const prompt = document.getElementById("prompt").value;
  document.getElementById("result").innerHTML =
    `<p>Generating ${type} for: <b>${prompt}</b></p>`;
}

function askAI() {
  document.getElementById("result").innerHTML =
    "<p>Ask AI feature coming soon 🚀</p>";
}
