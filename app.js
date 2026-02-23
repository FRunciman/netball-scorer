let state = {};
let timerInterval = null;
let stoppageInterval = null;
let stoppageAccumulated = 0;

/* ============================= */
/* UTIL */
/* ============================= */
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/* ============================= */
/* MATCH START */
/* ============================= */
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
      totalA: 0,
      totalB: 0,
      quarterA: 0,
      quarterB: 0,
      summaries: [],
    },
  };

  setupScreen.classList.add("hidden");
  matchScreen.classList.remove("hidden");

  updateUI();
}

/* ============================= */
/* UI UPDATE */
/* ============================= */
function updateUI() {
  teamALabel.textContent = state.config.teamA;
  teamBLabel.textContent = state.config.teamB;

  scoreA.textContent = state.match.totalA;
  scoreB.textContent = state.match.totalB;

  gameTimer.textContent = formatTime(state.match.timeLeft);
  stoppageTime.textContent = formatTime(stoppageAccumulated);

  quarterLabel.textContent = `Quarter ${state.match.quarter}`;

  centreBadge.textContent = `Centre: ${state.match.centre === "A" ? state.config.teamA : state.config.teamB}`;

  teamACol.classList.toggle("active", state.match.centre === "A");
  teamBCol.classList.toggle("active", state.match.centre === "B");

  startStopBtn.textContent = state.match.running ? "Pause" : "Start";
}

/* ============================= */
/* TIMER CONTROL */
/* ============================= */
function toggleTimer() {
  if (state.match.running) {
    clearInterval(timerInterval);
    state.match.running = false;

    // Start stoppage clock
    let start = Date.now();
    stoppageInterval = setInterval(() => {
      stoppageAccumulated = Math.floor((Date.now() - start) / 1000);
      updateUI();
    }, 1000);
  } else {
    clearInterval(stoppageInterval);
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

/* ============================= */
/* SCORING */
/* ============================= */
function addScore(team) {
  if (team === "A") {
    state.match.totalA++;
    state.match.quarterA++;
  } else {
    state.match.totalB++;
    state.match.quarterB++;
  }

  // AUTO TOGGLE CENTRE PASS
  state.match.centre = state.match.centre === "A" ? "B" : "A";

  updateUI();
}

addA.onclick = () => addScore("A");
addB.onclick = () => addScore("B");

subA.onclick = () => {
  if (state.match.totalA > 0) state.match.totalA--;
  if (state.match.quarterA > 0) state.match.quarterA--;
  updateUI();
};

subB.onclick = () => {
  if (state.match.totalB > 0) state.match.totalB--;
  if (state.match.quarterB > 0) state.match.quarterB--;
  updateUI();
};

/* ============================= */
/* QUARTER END */
/* ============================= */
function endQuarter() {
  clearInterval(timerInterval);
  clearInterval(stoppageInterval);

  state.match.running = false;

  // Determine winner of this quarter
  let winner = "Draw";
  if (state.match.quarterA > state.match.quarterB) {
    winner = state.config.teamA;
  } else if (state.match.quarterB > state.match.quarterA) {
    winner = state.config.teamB;
  }

  state.match.summaries.push({
    quarter: state.match.quarter,
    scoreA: state.match.quarterA,
    scoreB: state.match.quarterB,
    winner: winner,
    stoppage: stoppageAccumulated,
  });

  // Reset quarter-specific scores
  state.match.quarterA = 0;
  state.match.quarterB = 0;
  stoppageAccumulated = 0;

  nextQuarterBtn.disabled = false;
  startStopBtn.textContent = "Start";

  renderSummary();
  updateUI();
}

/* ============================= */
/* NEXT QUARTER */
/* ============================= */
function nextQuarter() {
  if (state.match.quarter >= state.config.quarterCount) return;

  state.match.quarter++;
  state.match.timeLeft = state.config.quarterLength;

  nextQuarterBtn.disabled = true;

  updateUI();
}

/* ============================= */
/* SUMMARY RENDER */
/* ============================= */
function renderSummary() {
  quarterSummary.innerHTML = "";

  state.match.summaries.forEach((q) => {
    quarterSummary.innerHTML += `
      Q${q.quarter}: 
      ${state.config.teamA} ${q.scoreA} - ${q.scoreB} ${state.config.teamB}
      <br>
      Winner: ${q.winner}
      <br>
      Stoppage: ${formatTime(q.stoppage)}
      <hr>
    `;
  });
}

/* ============================= */
/* RESET */
/* ============================= */
function resetMatch() {
  if (!confirm("Are you sure?")) return;
  if (!confirm("This cannot be undone.")) return;
  location.reload();
}

/* ============================= */
/* SHARE */
/* ============================= */
function shareMatch() {
  const text = `${state.config.teamA} ${state.match.totalA} - ${state.match.totalB} ${state.config.teamB}`;
  navigator.share?.({ text });
}

/* ============================= */
/* EVENTS */
/* ============================= */
startMatchBtn.onclick = startMatch;
startStopBtn.onclick = toggleTimer;
nextQuarterBtn.onclick = nextQuarter;
resetBtn.onclick = resetMatch;
shareBtn.onclick = shareMatch;

overrideCentre.onclick = () => {
  state.match.centre = state.match.centre === "A" ? "B" : "A";
  updateUI();
};
