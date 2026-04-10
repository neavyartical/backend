const API = "https://YOUR-RENDER-URL.onrender.com"; // 🔁 replace this

// ================= REGISTER =================
async function register() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const res = await fetch(API + "/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  alert(data.message || data.error);
}

// ================= LOGIN =================
async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const res = await fetch(API + "/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();

  if (data.token) {
    localStorage.setItem("token", data.token); // ✅ SAVE TOKEN
    alert("Login successful 🚀");
  } else {
    alert(data.message || "Login failed");
  }
}

// ================= GENERATE =================
async function generate() {
  const prompt = document.getElementById("prompt").value;
  const token = localStorage.getItem("token");

  if (!token) {
    alert("Please login first ❌");
    return;
  }

  const res = await fetch(API + "/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": token // ✅ SEND TOKEN
    },
    body: JSON.stringify({ prompt })
  });

  const data = await res.json();

  if (data.result) {
    document.getElementById("output").innerText = data.result;
  } else {
    document.getElementById("output").innerText = data.message || "Error";
  }
}

// ================= LOGOUT =================
function logout() {
  localStorage.removeItem("token");
  alert("Logged out 👋");
}
