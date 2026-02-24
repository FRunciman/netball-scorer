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
/* START MATCH */
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
/* UPDATE UI */
/* ============================= */
function updateUI() {
  teamALabel.textContent = state.config.teamA;
  teamBLabel.textContent = state.config.teamB;

  scoreA.textContent = state.match.totalA;
  scoreB.textContent = state.match.totalB;

  gameTimer.textContent = formatTime(state.match.timeLeft);
  stoppageTime.textContent = formatTime(stoppageAccumulated);

  quarterLabel.textContent =
    state.match.quarter <= state.config.quarterCount
      ? `Quarter ${state.match.quarter}`
      : "Full Time";

  centreBadge.textContent = `Centre: ${
    state.match.centre === "A" ? state.config.teamA : state.config.teamB
  }`;

  teamACol.classList.toggle("active", state.match.centre === "A");
  teamBCol.classList.toggle("active", state.match.centre === "B");

  startStopBtn.textContent = state.match.running ? "Pause" : "Start";
}

/* ============================= */
/* TIMER */
/* ============================= */
function toggleTimer() {
  if (state.match.running) {
    clearInterval(timerInterval);
    state.match.running = false;

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
  if (!state.match.running) return;

  if (team === "A") {
    state.match.totalA++;
    state.match.quarterA++;
  } else {
    state.match.totalB++;
    state.match.quarterB++;
  }

  // AUTO centre toggle
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
/* END QUARTER */
/* ============================= */
function endQuarter() {
  clearInterval(timerInterval);
  clearInterval(stoppageInterval);
  state.match.running = false;

  const cumulativeA = state.match.totalA;
  const cumulativeB = state.match.totalB;

  let winner = "Draw";
  if (state.match.quarterA > state.match.quarterB) {
    winner = state.config.teamA;
  } else if (state.match.quarterB > state.match.quarterA) {
    winner = state.config.teamB;
  }

  state.match.summaries.push({
    quarter: state.match.quarter,
    cumulativeA,
    cumulativeB,
    quarterA: state.match.quarterA,
    quarterB: state.match.quarterB,
    winner,
    stoppage: stoppageAccumulated,
  });

  // Reset quarter values
  state.match.quarterA = 0;
  state.match.quarterB = 0;
  stoppageAccumulated = 0;

  // Move to next quarter
  state.match.quarter++;

  if (state.match.quarter > state.config.quarterCount) {
    showFinalResults();
    return;
  }

  // Reset timer for next quarter
  state.match.timeLeft = state.config.quarterLength;
  startStopBtn.textContent = "Start";

  updateUI();
}

/* ============================= */
/* FINAL RESULTS */
/* ============================= */
function showFinalResults() {
  document.querySelector(".timer-card").style.display = "none";
  document.querySelector(".scoreboard-card").style.display = "none";

  renderSummary(true);
}

/* ============================= */
/* RENDER SUMMARY */
/* ============================= */
function renderSummary(final = false) {
  quarterSummary.innerHTML = "";

  state.match.summaries.forEach((q) => {
    quarterSummary.innerHTML += `
      <strong>
        Q${q.quarter}: 
        ${state.config.teamA} ${q.cumulativeA} - ${q.cumulativeB} ${state.config.teamB}
      </strong>
      <br>
      Quarter winner: ${q.winner} (${q.quarterA} - ${q.quarterB})
      <br>
      Stoppage: ${formatTime(q.stoppage)}
      <br><br>
    `;
  });

  if (final) {
    const finalWinner =
      state.match.totalA > state.match.totalB
        ? state.config.teamA
        : state.match.totalB > state.match.totalA
          ? state.config.teamB
          : "Draw";

    quarterSummary.innerHTML =
      `<h2>Full Time</h2>
       <h3>
       ${state.config.teamA} ${state.match.totalA} - ${state.match.totalB} ${state.config.teamB}
       </h3>
       <p><strong>Match Winner: ${finalWinner}</strong></p>
       <hr><br>` + quarterSummary.innerHTML;
  }
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
resetBtn.onclick = resetMatch;
shareBtn.onclick = shareMatch;

overrideCentre.onclick = () => {
  state.match.centre = state.match.centre === "A" ? "B" : "A";
  updateUI();
};
