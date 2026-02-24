let teamAName, teamBName;
let teamAScore = 0;
let teamBScore = 0;

let currentQuarter = 1;
let totalQuarters = 4;
let quarterLengthMs = 15 * 60 * 1000;

let quarterEndTime = null;
let isPaused = false;

let stoppageStart = null;
let quarterStoppageTotal = 0;

let centrePassTeam = "A";

let quarters = [];
let lastQuarterA = 0;
let lastQuarterB = 0;

let wakeLock = null;

/* ---------------- SCORE DISPLAY VARIABLES ---------------- */

const teamAScoreDisplay = document.getElementById("teamAScore");
const teamBScoreDisplay = document.getElementById("teamBScore");
const timerDisplay = document.getElementById("timerDisplay");
const stoppageDisplay = document.getElementById("stoppageDisplay");
const centrePassIndicator = document.getElementById("centrePassIndicator");
const quarterLabel = document.getElementById("quarterLabel");
const quarterSummary = document.getElementById("quarterSummary");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");

/* ---------------- START MATCH ---------------- */

document.getElementById("startMatchBtn").onclick = startMatch;

function startMatch() {
  teamAName = document.getElementById("teamAInput").value.trim() || "Team A";
  teamBName = document.getElementById("teamBInput").value.trim() || "Team B";

  totalQuarters =
    parseInt(document.getElementById("quarterCountInput").value) || 4;
  quarterLengthMs =
    (parseInt(document.getElementById("quarterLengthInput").value) || 15) *
    60 *
    1000;

  centrePassTeam = document.getElementById("firstCentrePass").value;

  // Set display names properly
  document.getElementById("teamAName").textContent = teamAName;
  document.getElementById("teamBName").textContent = teamBName;

  document.getElementById("quarterLabel").textContent = `Q${currentQuarter}`;

  resetTimer();
  enableWakeLock();

  document.getElementById("setupSection").classList.add("hidden");
  document.getElementById("matchSection").classList.remove("hidden");
}

/* ---------------- TIMER ENGINE ---------------- */

function resetTimer() {
  quarterEndTime = Date.now() + quarterLengthMs;
  quarterStoppageTotal = 0;
  stoppageStart = null;
  updateStoppageDisplay();
  updateCentrePass();
}

setInterval(() => {
  if (isPaused) return;

  const remaining = quarterEndTime - Date.now();

  if (remaining <= 0) {
    endQuarter();
    return;
  }

  renderTime(remaining);
}, 250);

function renderTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  timerDisplay.textContent = `${mins}:${secs.toString().padStart(2, "0")}`;
}

/* ---------------- PAUSE / STOPPAGE ---------------- */

pauseBtn.onclick = () => {
  if (!isPaused) {
    isPaused = true;
    stoppageStart = Date.now();
    pauseBtn.textContent = "Resume";
  } else {
    const stoppageDuration = Date.now() - stoppageStart;
    quarterStoppageTotal += stoppageDuration;
    isPaused = false;
    pauseBtn.textContent = "Pause";
    updateStoppageDisplay();
  }
};

function updateStoppageDisplay() {
  const secs = Math.floor(quarterStoppageTotal / 1000);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  stoppageDisplay.textContent = `+${m}:${s.toString().padStart(2, "0")}`;
}

/* ---------------- SCORING ---------------- */

document.querySelectorAll(".scoreBtn").forEach((btn) => {
  btn.onclick = () => {
    const team = btn.dataset.team;

    if (team === "A") teamAScore++;
    else teamBScore++;

    updateScores();

    // Alternate centre pass
    centrePassTeam = centrePassTeam === "A" ? "B" : "A";
    updateCentrePass();
  };
});

function updateScores() {
  teamAScoreDisplay.textContent = teamAScore;
  teamBScoreDisplay.textContent = teamBScore;
}

function updateCentrePass() {
  centrePassIndicator.textContent = `Centre Pass: ${centrePassTeam === "A" ? teamAName : teamBName}`;
}

/* ---------------- END QUARTER ---------------- */

function endQuarter() {
  isPaused = true;
  pauseBtn.textContent = "Pause";

  const quarterA = teamAScore - lastQuarterA;
  const quarterB = teamBScore - lastQuarterB;

  quarters.push({
    number: currentQuarter,
    totalA: teamAScore,
    totalB: teamBScore,
    quarterA,
    quarterB,
    stoppage: quarterStoppageTotal,
  });

  lastQuarterA = teamAScore;
  lastQuarterB = teamBScore;

  renderSummary();

  if (currentQuarter >= totalQuarters) {
    showFinalResults();
    return;
  }

  currentQuarter++;
  quarterLabel.textContent = `Q${currentQuarter}`;
  isPaused = false;
  resetTimer();
}

/* ---------------- SUMMARY ---------------- */

function renderSummary() {
  quarterSummary.innerHTML = "";

  quarters.forEach((q) => {
    const div = document.createElement("div");
    div.className = "quarterCard";

    let winner = "Draw";
    if (q.quarterA > q.quarterB) winner = teamAName;
    if (q.quarterB > q.quarterA) winner = teamBName;

    const secs = Math.floor(q.stoppage / 1000);
    const m = Math.floor(secs / 60);
    const s = secs % 60;

    div.innerHTML = `
      <strong>Q${q.number}</strong><br>
      ${teamAName} ${q.totalA} - ${q.totalB} ${teamBName}<br>
      Quarter winner: ${winner} (${q.quarterA} - ${q.quarterB})<br>
      Stoppage: ${m}:${s.toString().padStart(2, "0")}
    `;

    quarterSummary.appendChild(div);
  });
}

/* ---------------- FINAL ---------------- */

function showFinalResults() {
  pauseBtn.style.display = "none";

  const finalCard = document.createElement("div");
  finalCard.className = "card";
  finalCard.innerHTML = `<h2>Match Complete</h2>`;
  quarterSummary.prepend(finalCard);
}

/* ---------------- WAKE LOCK ---------------- */

async function enableWakeLock() {
  try {
    wakeLock = await navigator.wakeLock.request("screen");
  } catch (err) {}
}

/* ---------------- RESET ---------------- */

resetBtn.onclick = () => {
  if (!confirm("Reset match?")) return;
  if (!confirm("Are you sure?")) return;
  location.reload();
};

/* ---------------- PWA ---------------- */

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}
