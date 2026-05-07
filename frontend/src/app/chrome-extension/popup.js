const typeSelect = document.getElementById("typeSelect");

const inputs = {
  text: document.getElementById("textInput"),
  url: document.getElementById("urlInput"),
  image: document.getElementById("imageBox")
};

/* SWITCH TYPE */
typeSelect.addEventListener("change", () => {
  Object.values(inputs).forEach(el => el.classList.remove("active"));
  inputs[typeSelect.value].classList.add("active");
});

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

imageInput.onchange = e => handleImage(e.target.files[0]);

/* DROP */
imageDrop.ondragover = e => e.preventDefault();
imageDrop.ondrop = e => {
  e.preventDefault();
  handleImage(e.dataTransfer.files[0]);
};

/* PASTE IMAGE */
document.addEventListener("paste", e => {
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
document.getElementById("analyzeBtn").onclick = async () => {
  const mode = document.getElementById("modeSelect").value;
  const type = typeSelect.value;

  status.innerText = "Analyzing...";
  analysisUI.classList.add("hidden");

  let payload = {
    personality: mode === "genz" ? "marites" : "formal"
  };

  if (type === "text") payload.text = inputs.text.value;
  if (type === "url") payload.url = inputs.url.value;
  if (type === "image") payload.file = currentImageFile;

  // FAKE RESPONSE (replace with API)
  const data = {
    chismisLevel: Math.floor(Math.random() * 100),
    classification: "chismis",
    resibo: [
      "https://reuters.com",
      "https://bbc.com/news"
    ]
  };

  render(data);
};

/* RENDER */
function render(data) {
  const ch = data.chismisLevel;
  const real = 100 - ch;

  meterFill.style.width = ch + "%";

  chismisPercent.innerText = `Chismis: ${ch}%`;
  realPercent.innerText = `Real: ${real}%`;

  classification.innerText = data.classification.toUpperCase();

  comparison.innerText =
    ch > 60 ? "⚠️ Likely misinformation" : "✅ Likely factual";

  sources.innerHTML = "";
  data.resibo.forEach(l => {
    const a = document.createElement("a");
    a.href = l;
    a.target = "_blank";
    a.innerText = l;
    sources.appendChild(a);
  });

  analysisUI.classList.remove("hidden");
}