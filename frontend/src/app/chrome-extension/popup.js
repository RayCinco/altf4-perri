const typeSelect = document.getElementById("typeSelect");

const inputs = {
  text: document.getElementById("textInput"),
  url: document.getElementById("urlInput"),
  image: document.getElementById("imageInput")
};

// Switch input type
typeSelect.addEventListener("change", () => {
  Object.values(inputs).forEach(el => el.classList.remove("active"));
  inputs[typeSelect.value].classList.add("active");
});

// UI Elements
const status = document.getElementById("status");
const analysisUI = document.getElementById("analysisUI");

const meterFill = document.getElementById("meterFill");
const chismisPercent = document.getElementById("chismisPercent");
const realPercent = document.getElementById("realPercent");
const classification = document.getElementById("classification");
const comparison = document.getElementById("comparison");
const sources = document.getElementById("sources");

// Analyze
document.getElementById("analyzeBtn").addEventListener("click", async () => {
  const mode = document.getElementById("modeSelect").value;
  const type = typeSelect.value;

  status.className = "";
  analysisUI.classList.add("hidden");
  status.innerText = "Analyzing...";

  let payload = {
    personality: mode === "genz" ? "marites" : "formal"
  };

  // Validation
  if (type === "text") {
    const text = inputs.text.value.trim();
    if (!text) {
      status.innerText = "⚠️ Please enter text.";
      status.classList.add("error");
      return;
    }
    payload.text = text;
  }

  if (type === "url") {
    const url = inputs.url.value.trim();
    if (!url || !url.startsWith("http")) {
      status.innerText = "⚠️ Enter valid URL (https://...)";
      status.classList.add("error");
      return;
    }
    payload.url = url;
  }

  if (type === "image") {
    const file = inputs.image.files[0];
    if (!file) {
      status.innerText = "⚠️ Upload an image.";
      status.classList.add("error");
      return;
    }
    payload.file = file;
  }

  // API
  try {
    const res = await fetch("https://your-api-endpoint.com/analyze", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" }
    });

    const data = await res.json();

    if (data.error) {
      status.innerText = "⚠️ " + data.error;
      status.classList.add("error");
      return;
    }

    status.innerText = "Analysis complete";
    status.classList.add("success");

    const chismis = data.chismisLevel ?? 50;
    const real = 100 - chismis;

    meterFill.style.width = chismis + "%";

    chismisPercent.innerText = `Chismis: ${chismis}%`;
    realPercent.innerText = `Real: ${real}%`;

    classification.innerText = `Result: ${data.classification.toUpperCase()}`;

    comparison.innerText =
      chismis > 60
        ? "⚠️ Likely misinformation pattern."
        : "✅ Likely factual or verifiable.";

    sources.innerHTML = "";

    (data.resibo || [
      "https://www.rappler.com",
      "https://www.reuters.com",
      "https://www.bbc.com/news"
    ]).forEach(link => {
      const a = document.createElement("a");
      a.href = link;
      a.innerText = link;
      a.target = "_blank";
      sources.appendChild(a);
    });

    analysisUI.classList.remove("hidden");

  } catch {
    status.innerText = "⚠️ Network error.";
    status.classList.add("error");
  }
});