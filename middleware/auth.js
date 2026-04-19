onAuthStateChanged(auth, async (user) => {
  if (user) {
    userToken = await user.getIdToken();

    if (el("userEmail")) {
      el("userEmail").innerText = user.email;
    }

    await loadProfile();
  } else {
    userToken = null;

    if (el("userEmail")) {
      el("userEmail").innerText = "Guest Mode";
    }

    if (el("credits")) {
      el("credits").innerText = "0";
    }
  }
});
