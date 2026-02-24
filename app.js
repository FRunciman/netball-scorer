let teamAName, teamBName;
let teamAScore = 0;
let teamBScore = 0;

let currentQuarter = 1;
let totalQuarters = 4;
let quarterLengthMs = 15 * 60 * 1000;

let quarterEndTime = null;
let isPaused = false;
let matchStarted = false;

let stoppageStart = null;
let quarterStoppageTotal = 0;

let centrePassTeam = "A";

let quarters = [];
let lastQuarterA = 0;
let lastQuarterB = 0;

let wakeLock = null;

/* DOM */
const teamAScoreDisplay = document.getElementById("teamAScore");
const teamBScoreDisplay = document.getElementById("teamBScore");
const timerDisplay = document.getElementById("timerDisplay");
const stoppageDisplay = document.getElementById("stoppageDisplay");
const centrePassIndicator = document.getElementById("centrePassIndicator");
const quarterLabel = document.getElementById("quarterLabel");
const quarterSummary = document.getElementById("quarterSummary");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");
const startBtn = document.getElementById("startBtn");

/* SETUP */
document.getElementById("nextBtn").onclick = () => {
  teamAName = teamAInput.value.trim() || "Team A";
  teamBName = teamBInput.value.trim() || "Team B";

  totalQuarters = parseInt(quarterCountInput.value) || 4;
  quarterLengthMs = (parseInt(quarterLengthInput.value) || 15) * 60 * 1000;

  centrePassTeam = firstCentrePass.value;

  document.getElementById("teamAName").textContent = teamAName;
  document.getElementById("teamBName").textContent = teamBName;

  resetTimer();
  updateCentrePass();

  setupSection.classList.add("hidden");
  matchSection.classList.remove("hidden");

  enableWakeLock();
};

/* TIMER */

function resetTimer() {
  quarterEndTime = null;
  quarterStoppageTotal = 0;
  stoppageStart = null;
  matchStarted = false;
  isPaused = false;
  pauseBtn.textContent = "Pause";
  renderTime(quarterLengthMs);
  renderStoppage(0);
}

startBtn.onclick = () => {
  if (matchStarted) return;
  matchStarted = true;
  quarterEndTime = Date.now() + quarterLengthMs;
  startBtn.style.display = "none";
};

setInterval(() => {
  if (isPaused && stoppageStart) {
    const current = quarterStoppageTotal + (Date.now() - stoppageStart);
    renderStoppage(current);
  } else {
    renderStoppage(quarterStoppageTotal);
  }

  if (!matchStarted || isPaused) return;

  const remaining = quarterEndTime - Date.now();

  if (remaining <= 0) {
    endQuarter();
    return;
  }

  renderTime(remaining);
}, 250);

function renderTime(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  timerDisplay.textContent = `${mins}:${secs.toString().padStart(2, "0")}`;
}

function renderStoppage(ms) {
  const secs = Math.floor(ms / 1000);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  stoppageDisplay.textContent = `+${m}:${s.toString().padStart(2, "0")}`;
}

/* PAUSE */

pauseBtn.onclick = () => {
  if (!matchStarted) return;

  if (!isPaused) {
    isPaused = true;
    stoppageStart = Date.now();
    pauseBtn.textContent = "Resume";
  } else {
    quarterStoppageTotal += Date.now() - stoppageStart;
    stoppageStart = null;
    isPaused = false;
    pauseBtn.textContent = "Pause";
  }
};

/* SCORING */

document.querySelectorAll(".scoreBtn").forEach((btn) => {
  btn.onclick = () => {
    if (!matchStarted) return;

    const team = btn.dataset.team;
    const action = btn.dataset.action;

    if (team === "A") {
      if (action === "plus") teamAScore++;
      if (action === "minus" && teamAScore > 0) teamAScore--;
    } else {
      if (action === "plus") teamBScore++;
      if (action === "minus" && teamBScore > 0) teamBScore--;
    }

    teamAScoreDisplay.textContent = teamAScore;
    teamBScoreDisplay.textContent = teamBScore;

    if (action === "plus") {
      centrePassTeam = centrePassTeam === "A" ? "B" : "A";
      updateCentrePass();
    }
  };
});

function updateCentrePass() {
  centrePassIndicator.classList.remove("flash");
  centrePassIndicator.textContent = `Centre Pass: ${centrePassTeam === "A" ? teamAName : teamBName}`;
  void centrePassIndicator.offsetWidth;
  centrePassIndicator.classList.add("flash");
}

/* END QUARTER */

function endQuarter() {
  matchStarted = false;
  isPaused = false;
  pauseBtn.textContent = "Pause";
  startBtn.style.display = "inline-block";

  const qA = teamAScore - lastQuarterA;
  const qB = teamBScore - lastQuarterB;

  quarters.push({
    number: currentQuarter,
    totalA: teamAScore,
    totalB: teamBScore,
    quarterA: qA,
    quarterB: qB,
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
  resetTimer();
}

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

function showFinalResults() {
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `<h2>Match Complete</h2>`;
  quarterSummary.prepend(card);
}

/* RESET */

resetBtn.onclick = () => {
  if (!confirm("Reset match?")) return;
  if (!confirm("Are you sure?")) return;
  location.reload();
};

/* WAKE LOCK */

async function enableWakeLock() {
  try {
    wakeLock = await navigator.wakeLock.request("screen");
  } catch {}
}

/* PWA */

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}
