const NetballApp = (() => {
  const state = {
    config: {},
    match: {},
  };

  let timerInterval;

  function init() {
    attachEvents();
  }

  function attachEvents() {
    document.getElementById("startMatchBtn").onclick = setupMatch;
    document.getElementById("startBtn").onclick = startTimer;
    document.getElementById("pauseBtn").onclick = pauseTimer;

    document.getElementById("addA").onclick = () => addGoal("A");
    document.getElementById("addB").onclick = () => addGoal("B");
    document.getElementById("subA").onclick = () => subtractGoal("A");
    document.getElementById("subB").onclick = () => subtractGoal("B");

    document.getElementById("overrideCentre").onclick = toggleCentrePass;
    document.getElementById("shareBtn").onclick = shareMatch;
    document.getElementById("resetBtn").onclick = resetMatch;
  }

  function setupMatch() {
    state.config = {
      teamAName: teamAName.value,
      teamBName: teamBName.value,
      quarterLength: parseInt(quarterLength.value) * 60,
      totalQuarters: parseInt(totalQuarters.value),
      firstCentrePass: firstCentrePass.value,
    };

    state.match = {
      currentQuarter: 1,
      remainingTime: state.config.quarterLength,
      isRunning: false,
      stoppage: {
        total: 0,
        start: null,
      },
      centrePass: state.config.firstCentrePass,
      quarters: [],
    };

    updateUISetup();
  }

  function startTimer() {
    if (!state.match.isRunning) {
      state.match.isRunning = true;
      state.match.startTimestamp = Date.now();
      timerInterval = setInterval(updateTimer, 1000);
    }
  }

  function pauseTimer() {
    if (state.match.isRunning) {
      state.match.isRunning = false;
      clearInterval(timerInterval);

      const elapsed = Math.floor(
        (Date.now() - state.match.startTimestamp) / 1000,
      );
      state.match.remainingTime -= elapsed;

      state.match.stoppage.start = Date.now();
      trackStoppage();
    }
  }

  function trackStoppage() {
    const interval = setInterval(() => {
      if (state.match.isRunning) {
        const pauseDuration = Math.floor(
          (Date.now() - state.match.stoppage.start) / 1000,
        );
        state.match.stoppage.total += pauseDuration;
        clearInterval(interval);
        render();
      } else {
        const livePause = Math.floor(
          (Date.now() - state.match.stoppage.start) / 1000,
        );
        document.getElementById("stoppageDisplay").innerText =
          `+ ${formatTime(state.match.stoppage.total + livePause)} Stoppage`;
      }
    }, 1000);
  }

  function updateTimer() {
    const elapsed = Math.floor(
      (Date.now() - state.match.startTimestamp) / 1000,
    );
    const remaining = state.match.remainingTime - elapsed;

    if (remaining <= 0) {
      endQuarter();
    } else {
      document.getElementById("timerDisplay").innerText = formatTime(remaining);
    }
  }

  function endQuarter() {
    clearInterval(timerInterval);
    state.match.isRunning = false;

    state.match.quarters.push({
      A: parseInt(scoreA.innerText),
      B: parseInt(scoreB.innerText),
      stoppage: state.match.stoppage.total,
    });

    if (state.match.currentQuarter >= state.config.totalQuarters) {
      alert("Match Finished");
      return;
    }

    state.match.currentQuarter++;
    state.match.remainingTime = state.config.quarterLength;
    state.match.stoppage.total = 0;
    scoreA.innerText = 0;
    scoreB.innerText = 0;

    renderBreakdown();
  }

  function addGoal(team) {
    const el = team === "A" ? scoreA : scoreB;
    el.innerText = parseInt(el.innerText) + 1;
    toggleCentrePass();
  }

  function subtractGoal(team) {
    const el = team === "A" ? scoreA : scoreB;
    const current = parseInt(el.innerText);
    if (current > 0) el.innerText = current - 1;
  }

  function toggleCentrePass() {
    state.match.centrePass = state.match.centrePass === "A" ? "B" : "A";
    const indicator = document.getElementById("centrePassIndicator");
    indicator.style.transform = "scale(1.1)";
    indicator.style.opacity = "0.7";
    setTimeout(() => {
      indicator.style.transform = "scale(1)";
      indicator.style.opacity = "1";
    }, 150);
    indicator.innerText = `Centre: ${state.match.centrePass === "A" ? state.config.teamAName : state.config.teamBName}`;
  }

  function shareMatch() {
    let text = `Netball Match Result\n\n`;
    state.match.quarters.forEach((q, i) => {
      text += `Q${i + 1}: ${q.A} - ${q.B} (+${formatTime(q.stoppage)} stoppage)\n`;
    });

    if (navigator.share) {
      navigator.share({ text });
    } else {
      navigator.clipboard.writeText(text);
      alert("Copied to clipboard");
    }
  }

  function resetMatch() {
    if (confirm("Are you sure?") && confirm("Really reset match?")) {
      location.reload();
    }
  }

  function formatTime(seconds) {
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${m}:${s}`;
  }

  function updateUISetup() {
    setupScreen.classList.add("hidden");
    matchScreen.classList.remove("hidden");
    teamALabel.innerText = state.config.teamAName;
    teamBLabel.innerText = state.config.teamBName;
    document.getElementById("quarterDisplay").innerText =
      `Quarter ${state.match.currentQuarter} of ${state.config.totalQuarters}`;
    document.getElementById("timerDisplay").innerText = formatTime(
      state.config.quarterLength,
    );
  }

  function renderBreakdown() {
    const container = document.getElementById("quarterBreakdown");
    container.innerHTML = "";
    state.match.quarters.forEach((q, i) => {
      container.innerHTML += `<div>Q${i + 1}: ${q.A} - ${q.B} (+${formatTime(q.stoppage)} stoppage)</div>`;
    });
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", NetballApp.init);
