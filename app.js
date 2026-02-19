let state = {};
let timerInterval = null;
let stoppageInterval = null;
let stoppageAccumulated = 0;

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function saveMatch() {
  localStorage.setItem("netballMatch", JSON.stringify(state));
}

function startMatch() {
  state = {
    config: {
      teamA: teamAInput.value,
      teamB: teamBInput.value,
      quarterLength: +quarterLengthInput.value * 60,
      quarterCount: +quarterCountInput.value,
    },
    match: {
      quarter: 1,
      timeLeft: +quarterLengthInput.value * 60,
      running: false,
      centre: firstCentreSelect.value,
      scoreA: 0,
      scoreB: 0,
      summaries: [],
    },
  };

  setupScreen.classList.add("hidden");
  matchScreen.classList.remove("hidden");

  updateUI();
  saveMatch();
}

function updateUI() {
  teamALabel.textContent = state.config.teamA;
  teamBLabel.textContent = state.config.teamB;
  scoreA.textContent = state.match.scoreA;
  scoreB.textContent = state.match.scoreB;
  gameTimer.textContent = formatTime(state.match.timeLeft);
  stoppageTime.textContent = formatTime(stoppageAccumulated);
  quarterLabel.textContent = `Quarter ${state.match.quarter}`;

  centreBadge.textContent = `Centre: ${state.match.centre === "A" ? state.config.teamA : state.config.teamB}`;

  teamACol.classList.toggle("active", state.match.centre === "A");
  teamBCol.classList.toggle("active", state.match.centre === "B");
}

function toggleTimer() {
  if (state.match.running) {
    clearInterval(timerInterval);
    clearInterval(stoppageInterval);
    state.match.running = false;

    let start = Date.now();
    stoppageInterval = setInterval(() => {
      stoppageAccumulated = Math.floor((Date.now() - start) / 1000);
      updateUI();
    }, 1000);
  } else {
    clearInterval(stoppageInterval);
    state.match.timeLeft += stoppageAccumulated;
    stoppageAccumulated = 0;

    state.match.running = true;
    timerInterval = setInterval(() => {
      if (state.match.timeLeft <= 0) {
        endQuarter();
        return;
      }
      state.match.timeLeft--;
      updateUI();
    }, 1000);
  }
  updateUI();
}

function endQuarter() {
  clearInterval(timerInterval);
  clearInterval(stoppageInterval);
  state.match.running = false;

  state.match.summaries.push({
    quarter: state.match.quarter,
    scoreA: state.match.scoreA,
    scoreB: state.match.scoreB,
  });

  nextQuarterBtn.disabled = false;
  renderSummary();
}

function nextQuarter() {
  if (state.match.quarter >= state.config.quarterCount) return;

  state.match.quarter++;
  state.match.timeLeft = state.config.quarterLength;
  stoppageAccumulated = 0;
  nextQuarterBtn.disabled = true;
  updateUI();
}

function renderSummary() {
  quarterSummary.innerHTML = "";
  state.match.summaries.forEach((q) => {
    quarterSummary.innerHTML += `Q${q.quarter}: ${state.config.teamA} ${q.scoreA} - ${q.scoreB} ${state.config.teamB}<br>`;
  });
}

function resetMatch() {
  if (!confirm("Are you sure?")) return;
  if (!confirm("This cannot be undone.")) return;
  localStorage.removeItem("netballMatch");
  location.reload();
}

function shareMatch() {
  const text = `${state.config.teamA} ${state.match.scoreA} - ${state.match.scoreB} ${state.config.teamB}`;
  navigator.share?.({ text });
}

startMatchBtn.onclick = startMatch;
startStopBtn.onclick = toggleTimer;
nextQuarterBtn.onclick = nextQuarter;
resetBtn.onclick = resetMatch;
shareBtn.onclick = shareMatch;

addA.onclick = () => {
  state.match.scoreA++;
  updateUI();
};
subA.onclick = () => {
  if (state.match.scoreA > 0) state.match.scoreA--;
  updateUI();
};
addB.onclick = () => {
  state.match.scoreB++;
  updateUI();
};
subB.onclick = () => {
  if (state.match.scoreB > 0) state.match.scoreB--;
  updateUI();
};

overrideCentre.onclick = () => {
  state.match.centre = state.match.centre === "A" ? "B" : "A";
  updateUI();
};
