/*
Game setup logic
*/

// Toggle options dropdown for game modes
function updateModeUI() {
  rushLimit.style.display = "none";
  traditionalOptions.style.display = "none";
  explorationOptions.style.display = "none";

  if (selectedMode === "rush") {
    rushLimit.style.display = "block";
  }

  if (selectedMode === "traditional") {
    traditionalOptions.style.display = "block";
  }

  if (selectedMode === "exploration") {
    explorationOptions.style.display = "block";
  }
}

updateModeUI();

// Return feedback if list can't be used with options
function validateGameSetup() {
  if (!allObjectives.length) {
    return "No objective list loaded.";
  }

  if (selectedMode === "rush") {
    if (allObjectives.length < 3) {
      return "Rush mode requires at least 3 objectives.";
    }
    const limitInput = document.getElementById("rushRoundLimit").value;
    const requestedLimit = limitInput ? Number(limitInput) : null;

    const maxRounds = Math.floor(allObjectives.length / 3);

    if (requestedLimit !== null && requestedLimit > maxRounds) {
      return `Rush limit too high. This list supports at most ${maxRounds} rounds.`;
    }
  }

  if (selectedMode === "traditional") {
    const size = Number(document.getElementById("boardSize").value);
    if (allObjectives.length < size * size) {
      return `Traditional ${size}×${size} requires at least ${
        size * size
      } objectives.`;
    }
  }

  if (selectedMode === "exploration") {
    const size = Number(document.getElementById("exploreSize").value);
    if (allObjectives.length < size * size) {
      return `Exploration ${size}×${size} requires at least ${
        size * size
      } objectives.`;
    }
  }

  return null;
}

// Set UI elements depending on game mode
function updateModeUIVisibility() {
  const progress = document.getElementById("progressContainer");
  const log = document.getElementById("log");
  const score = document.getElementById("score");

  if (selectedMode === "rush") {
    progress.style.display = "block";
    log.style.display = "block";
    score.style.display = "block";
  }

  if (selectedMode === "traditional") {
    progress.style.display = "none";
    log.style.display = "none";
    score.style.display = "block";
  }

  if (selectedMode === "exploration") {
    progress.style.display = "none";
    log.style.display = "none";
    score.style.display = "block";
  }
}

// // Sharing seeds
// function copySeed() {
//   const seed = seedInput.value.trim();
//   if (!seed) {
//     alert("No seed to copy!");
//     return;
//   }

//   navigator.clipboard
//     .writeText(seed)
//     .then(() => {
//       alert(`Seed "${seed}" copied to clipboard!`);
//     })
//     .catch(() => {
//       alert("Failed to copy seed. Try manually.");
//     });
// }
// document.getElementById("copySeedButton").addEventListener("click", copySeed);

// Setup game. Display seed.
function generateGame() {
  const error = validateGameSetup();
  if (error) {
    status.textContent = error;
    return;
  }

  if (allObjectives.length === 0) {
    status.textContent = "No objectives loaded!";
    return;
  }

  gameGenerated = true;

  let seed = seedInput.value.trim();
  if (!seed) {
    seed = generateRandomSeed();
    seedInput.value = seed;
  }

  rng = seededRNG(seed);

  // shiny mode support. set them before board render and tie to seed.
  if (selectedMode === "traditional") {
    bingoSize = Number(document.getElementById("boardSize").value);
    const total = bingoSize * bingoSize;
    const shinyInput = document.getElementById("shinyCount")?.value ?? "";
    const shinyCount = getShinyCount(bingoSize, shinyInput);
    const indices = pickShinyIndices(total, shinyCount, rng);

    indices.forEach((i) => shinySquares.add(`bingo-${i}`));
  }

  if (selectedMode === "exploration") {
    boardSize = Number(document.getElementById("exploreSize").value);
    const total = boardSize * boardSize;
    const shinyInput = document.getElementById("shinyCount")?.value ?? "";
    const shinyCount = getShinyCount(boardSize, shinyInput);
    const indices = pickShinyIndices(total, shinyCount, rng);

    indices.forEach((i) => {
      const r = Math.floor(i / boardSize);
      const c = i % boardSize;
      shinySquares.add(`fog-${r}-${c}`);
    });
  }

  if (selectedMode === "rush" && shinyMode) {
    let totalRounds;
    const limitInput = document.getElementById("rushRoundLimit").value;

    if (limitInput === "") {
      totalRounds = Math.ceil(allObjectives.length / 3);
    } else {
      totalRounds = limitInput;
    }

    const shinyCount = Math.min(10, Math.floor(totalRounds / 4));

    shinyRounds.clear();

    pickShinyRounds(totalRounds, shinyCount, rng).forEach((r) =>
      shinyRounds.add(r)
    );
  }

  // rush mode round limit
  const limitInput = document.getElementById("rushRoundLimit").value;
  rushRoundLimit = limitInput ? Number(limitInput) : null;

  remainingObjectives = [...allObjectives];
  completedObjectives = [];
  completedList.innerHTML = "";

  // set UI elements
  document.getElementById("listPreview").style.display = "none";
  document.getElementById("infoContainer").style.display = "none";

  seedInput.readOnly = true;
  fileInput.disabled = true;
  gameSelect.disabled = true;
  listSelect.disabled = true;
  modeSelect.disabled = true;
  traditionalOptions.disabled = true;
  explorationOptions.disabled = true;
  document.getElementById("rushRoundLimit").readOnly = true;
  document.getElementById("boardSize").disabled = true;
  document.getElementById("exploreSize").disabled = true;
  document.getElementById("exploreStart").disabled = true;
  // document.getElementById("shinyCheckbox").disabled = true;
  document.getElementById("shinyCount").disabled = true;
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach((checkbox) => {
    checkbox.disabled = true;
  });

  // document.getElementById("copySeedButton").style.display = "inline-block";
  document.getElementById("copyShareLink").style.display = "inline-block";

  gameGenerated = true;
  mainButton.textContent = "Start Game";

  status.textContent = `Seed: "${seed}"`;
}

// Start the game. Display the board based on game mode.
function startGame() {
  if (gameStarted) return;

  gameStarted = true;

  // hide generator options
  document.getElementById("infoContainer").style.display = "none";
  document.getElementById("listPreview").style.display = "none";
  document.getElementById("controls").classList.add("hidden");
  document.getElementsByTagName("h1")[0].classList.add("hidden");

  board.style.display = "grid";
  updateModeUIVisibility();

  // updateGameSummary(gameSelect.value, listSelect.value, selectedMode);

  if (selectedMode === "rush") {
    renderRushBoard();
  }

  if (selectedMode === "traditional") {
    startTraditionalBingo();
  }

  if (selectedMode === "exploration") {
    startExplorationBingo();
  }
}
