
<!DOCTYPE html>
<html>
<head>
  <title>ReelMind AI</title>
  <style>
    body {
      background: #0b1a2a;
      color: white;
      text-align: center;
      font-family: Arial;
      padding: 50px;
    }

    input {
      width: 80%;
      padding: 15px;
      border-radius: 10px;
      border: none;
      font-size: 16px;
    }

    button {
      margin-top: 20px;
      padding: 15px 30px;
      border: none;
      border-radius: 10px;
      background: green;
      color: white;
      font-size: 18px;
    }

    video {
      margin-top: 20px;
      width: 90%;
      border-radius: 10px;
    }
  </style>
</head>

<body>

<h1>🎬 ReelMind AI</h1>

<input id="prompt" placeholder="Describe your video..."/>
<br>

<button onclick="generate()">Generate</button>

<p id="status"></p>

<video id="video" controls></video>

<script>
async function generate() {
  const prompt = document.getElementById("prompt").value;
  const status = document.getElementById("status");
  const video = document.getElementById("video");

  status.innerText = "Generating video... ⏳";

  try {
    const res = await fetch("https://backend-ppyz.onrender.com/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt })
    });

    const data = await res.json();
    console.log(data);

    if (data.video) {
      video.src = data.video;
      status.innerText = "Done ✅";
    } else {
      status.innerText = "Failed ❌";
    }

  } catch (err) {
    console.error(err);
    status.innerText = "Error ❌";
  }
}
</script>

</body>
</html>
