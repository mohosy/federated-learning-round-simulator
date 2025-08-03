const clientsInput = document.getElementById("clientsInput");
const dropoutInput = document.getElementById("dropoutInput");
const advInput = document.getElementById("advInput");
const epochsInput = document.getElementById("epochsInput");

const clientsValue = document.getElementById("clientsValue");
const dropoutValue = document.getElementById("dropoutValue");
const advValue = document.getElementById("advValue");
const epochsValue = document.getElementById("epochsValue");

const stepBtn = document.getElementById("stepBtn");
const autoBtn = document.getElementById("autoBtn");
const resetBtn = document.getElementById("resetBtn");

const roundText = document.getElementById("roundText");
const lossText = document.getElementById("lossText");
const activeText = document.getElementById("activeText");
const convText = document.getElementById("convText");

const lossCanvas = document.getElementById("lossChart");
const updateCanvas = document.getElementById("updateChart");
const lctx = lossCanvas.getContext("2d");
const uctx = updateCanvas.getContext("2d");

let round = 0;
let loss = 1.0;
let losses = [loss];
let lastUpdates = [];
let auto = null;

function randn() {
  const u = 1 - Math.random();
  const v = 1 - Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function runRound() {
  const nClients = Number(clientsInput.value);
  const dropout = Number(dropoutInput.value);
  const adv = Number(advInput.value);
  const epochs = Number(epochsInput.value);

  const updates = [];

  for (let i = 0; i < nClients; i += 1) {
    if (Math.random() < dropout) continue;

    const isAdv = Math.random() < adv;
    const localNoise = randn() * 0.008;
    const baseProgress = (0.028 + Math.random() * 0.022) * Math.log1p(epochs);

    let delta = isAdv ? -baseProgress * (0.5 + Math.random()) : baseProgress + localNoise;
    delta *= Math.max(0.3, 1 - round * 0.01);

    updates.push(delta);
  }

  lastUpdates = updates;
  const active = updates.length;
  const avgUpdate = active ? updates.reduce((a, b) => a + b, 0) / active : 0;

  loss = Math.max(0.02, loss - avgUpdate);
  round += 1;
  losses.push(loss);
  if (losses.length > 120) losses.shift();

  roundText.textContent = String(round);
  lossText.textContent = loss.toFixed(3);
  activeText.textContent = String(active);

  const convergence = Math.max(0, Math.min(100, (1 - loss) * 100));
  convText.textContent = `${convergence.toFixed(1)}%`;

  drawLoss();
  drawUpdates();
}

function drawLoss() {
  const w = lossCanvas.width;
  const h = lossCanvas.height;
  lctx.clearRect(0, 0, w, h);
  lctx.fillStyle = "#071217";
  lctx.fillRect(0, 0, w, h);

  const minL = Math.min(...losses) * 0.95;
  const maxL = Math.max(...losses) * 1.05;

  const pad = 28;
  const innerW = w - pad * 2;
  const innerH = h - pad * 2;

  lctx.strokeStyle = "rgba(160,230,250,0.16)";
  for (let i = 0; i <= 6; i += 1) {
    const y = pad + (i / 6) * innerH;
    lctx.beginPath();
    lctx.moveTo(pad, y);
    lctx.lineTo(w - pad, y);
    lctx.stroke();
  }

  lctx.beginPath();
  losses.forEach((v, i) => {
    const x = pad + (i / Math.max(1, losses.length - 1)) * innerW;
    const y = h - pad - ((v - minL) / (maxL - minL + 1e-9)) * innerH;
    if (i === 0) lctx.moveTo(x, y);
    else lctx.lineTo(x, y);
  });
  lctx.strokeStyle = "#87e7ff";
  lctx.lineWidth = 2;
  lctx.stroke();
}

function drawUpdates() {
  const w = updateCanvas.width;
  const h = updateCanvas.height;
  uctx.clearRect(0, 0, w, h);
  uctx.fillStyle = "#071217";
  uctx.fillRect(0, 0, w, h);

  if (!lastUpdates.length) return;

  const maxAbs = Math.max(0.02, ...lastUpdates.map((v) => Math.abs(v)));
  const centerY = h / 2;

  uctx.strokeStyle = "rgba(200,230,255,0.25)";
  uctx.beginPath();
  uctx.moveTo(12, centerY);
  uctx.lineTo(w - 12, centerY);
  uctx.stroke();

  const barW = (w - 40) / lastUpdates.length;
  lastUpdates.forEach((v, i) => {
    const x = 20 + i * barW;
    const bh = (Math.abs(v) / maxAbs) * (h * 0.42);

    uctx.fillStyle = v >= 0 ? "#8ff7c4" : "#ff8ea5";
    if (v >= 0) uctx.fillRect(x, centerY - bh, barW - 1, bh);
    else uctx.fillRect(x, centerY, barW - 1, bh);
  });
}

function reset() {
  round = 0;
  loss = 1.0;
  losses = [loss];
  lastUpdates = [];
  roundText.textContent = "0";
  lossText.textContent = "1.000";
  activeText.textContent = "0";
  convText.textContent = "0%";
  drawLoss();
  drawUpdates();
}

function syncLabels() {
  clientsValue.textContent = clientsInput.value;
  dropoutValue.textContent = Number(dropoutInput.value).toFixed(2);
  advValue.textContent = Number(advInput.value).toFixed(2);
  epochsValue.textContent = epochsInput.value;
}

[clientsInput, dropoutInput, advInput, epochsInput].forEach((el) => el.addEventListener("input", syncLabels));

stepBtn.addEventListener("click", runRound);
autoBtn.addEventListener("click", () => {
  if (auto) {
    clearInterval(auto);
    auto = null;
    autoBtn.textContent = "Auto Run";
    return;
  }
  auto = setInterval(runRound, 220);
  autoBtn.textContent = "Stop";
});
resetBtn.addEventListener("click", reset);

syncLabels();
reset();
