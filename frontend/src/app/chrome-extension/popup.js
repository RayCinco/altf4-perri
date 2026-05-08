const typeSelect = document.getElementById("typeSelect");
const modeSelect = document.getElementById("modeSelect");
const analyzeBtn = document.getElementById("analyzeBtn");

const API_BASE_URL =
  "https://chismi-scan-5lu15eibw-raymond-cincos-projects.vercel.app";
const ANALYZE_ENDPOINT = `${API_BASE_URL}/api/analyze`;

const inputs = {
  text: document.getElementById("textInput"),
  url: document.getElementById("urlInput"),
  image: document.getElementById("imageBox"),
};

/* SWITCH TYPE */
typeSelect.addEventListener("change", () => {
  Object.values(inputs).forEach((el) => el.classList.remove("active"));
  inputs[typeSelect.value].classList.add("active");
  status.innerText = "Your analysis will appear here.";
  analysisUI.classList.add("hidden");
});

function setStatus(message, isError = false) {
  status.innerText = message;
  status.classList.toggle("error", isError);
}

/* RESULT UI */
const status = document.getElementById("status");
const analysisUI = document.getElementById("analysisUI");

const meterFill = document.getElementById("meterFill");
const chismisPercent = document.getElementById("chismisPercent");
const realPercent = document.getElementById("realPercent");
const classification = document.getElementById("classification");
const comparison = document.getElementById("comparison");
const sources = document.getElementById("sources");

/* IMAGE SYSTEM */
const imageInput = document.getElementById("imageInput");
const imagePreview = document.getElementById("imagePreview");
const imageDrop = document.getElementById("imageDrop");
const uploadBtn = document.getElementById("uploadBtn");
const removeBtn = document.getElementById("removeImage");

let currentImageFile = null;

/* FILE UPLOAD */
uploadBtn.onclick = () => imageInput.click();

imageInput.onchange = (e) => handleImage(e.target.files[0]);

/* DROP */
imageDrop.ondragover = (e) => e.preventDefault();
imageDrop.ondrop = (e) => {
  e.preventDefault();
  handleImage(e.dataTransfer.files[0]);
};

/* PASTE IMAGE */
document.addEventListener("paste", (e) => {
  for (let item of e.clipboardData.items) {
    if (item.type.includes("image")) {
      handleImage(item.getAsFile());
    }
  }
});

function handleImage(file) {
  if (!file) return;

  currentImageFile = file;

  imagePreview.src = URL.createObjectURL(file);
  imagePreview.classList.remove("hidden");

  imageDrop.style.display = "none";
  removeBtn.classList.remove("hidden");
}

removeBtn.onclick = () => {
  currentImageFile = null;
  imagePreview.classList.add("hidden");
  imageDrop.style.display = "block";
  removeBtn.classList.add("hidden");
};

/* ANALYZE */
analyzeBtn.onclick = async () => {
  const mode = modeSelect.value;
  const type = typeSelect.value;

  if (type === "text" && !inputs.text.value.trim()) {
    setStatus("Please enter text to analyze.", true);
    return;
  }

  if (type === "url" && !inputs.url.value.trim()) {
    setStatus("Please enter a URL to analyze.", true);
    return;
  }

  if (type === "image" && !currentImageFile) {
    setStatus("Please upload or paste an image first.", true);
    return;
  }

  setStatus("Analyzing...");
  analysisUI.classList.add("hidden");
  analyzeBtn.disabled = true;

  try {
    const formData = new FormData();
    formData.append("personality", mode === "genz" ? "marites" : "formal");

    if (type === "text") formData.append("text", inputs.text.value.trim());
    if (type === "url") formData.append("url", inputs.url.value.trim());
    if (type === "image" && currentImageFile) {
      formData.append("file", currentImageFile);
    }

    const response = await fetch(ANALYZE_ENDPOINT, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    if (!response.ok || data.error) {
      throw new Error(data.error || "Analysis failed.");
    }

    render(data);
    setStatus("Analysis complete.");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Network error.";
    setStatus(message, true);
    analysisUI.classList.add("hidden");
  } finally {
    analyzeBtn.disabled = false;
  }
};

/* RENDER */
function render(data) {
  const ch = Math.max(0, Math.min(100, Number(data.chismisLevel || 0)));
  const real = 100 - ch;

  meterFill.style.width = ch + "%";

  if (data.classification === "fact") {
    meterFill.style.background = "linear-gradient(90deg, #14532d, #22c55e)";
  } else if (data.classification === "opinion") {
    meterFill.style.background = "linear-gradient(90deg, #713f12, #f59e0b)";
  } else {
    meterFill.style.background = "linear-gradient(90deg, #7f1d1d, #ef4444)";
  }

  chismisPercent.innerText = `Chismis: ${ch}%`;
  realPercent.innerText = `Real: ${real}%`;

  classification.innerText = (data.classification || "unknown").toUpperCase();

  comparison.innerText =
    data.details ||
    data.message ||
    (ch > 60 ? "Likely misinformation" : "Likely factual");

  sources.innerHTML = "";
  const sourceItems = data?.resibo?.sources || [];

  if (sourceItems.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-sources";
    empty.innerText = "No sources available.";
    sources.appendChild(empty);
  }

  sourceItems.forEach((item) => {
    const a = document.createElement("a");
    a.href = item.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.innerText = item.title || item.url;
    a.className = "source-link";
    sources.appendChild(a);
  });

  analysisUI.classList.remove("hidden");
}
