<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>ReelMind AI</title>
  <style>
    body {
      background: #0f172a;
      color: white;
      text-align: center;
      font-family: Arial;
      padding: 40px;
    }

    input {
      width: 80%;
      padding: 12px;
      border-radius: 10px;
      border: none;
      margin-bottom: 10px;
    }

    button {
      padding: 12px 20px;
      border: none;
      border-radius: 10px;
      background: limegreen;
      color: white;
      font-weight: bold;
      cursor: pointer;
    }

    video {
      margin-top: 20px;
      width: 90%;
      display: none;
      border-radius: 10px;
    }
  </style>
</head>
<body>

  <h1>🎬 ReelMind AI</h1>

  <input id="prompt" placeholder="Describe your video..." />
  <br>
  <button onclick="generate()">Generate</button>

  <p id="status"></p>

  <video id="video" controls></video>

  <script>
    const BACKEND_URL = "https://backend-ppyz.onrender.com";

    async function generate() {
      const prompt = document.getElementById("prompt").value;

      document.getElementById("status").innerText = "Generating...";

      try {
        const res = await fetch(`${BACKEND_URL}/generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt }),
        });

        const data = await res.json();

        if (data.video) {
          document.getElementById("status").innerText = "Done ✅";

          const video = document.getElementById("video");
          video.src = data.video;
          video.style.display = "block";
        } else {
          document.getElementById("status").innerText = "Failed ❌";
          console.log(data);
        }
      } catch (err) {
        document.getElementById("status").innerText = "Error ❌";
        console.error(err);
      }
    }
  </script>

</body>
</html>
