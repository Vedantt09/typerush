
const passages = [
  {
    level: 1,
    text: "The best way to improve your typing is to practice a little every day. Stay focused, keep a steady rhythm, and remember that accuracy is just as important as speed."
  },
  {
    level: 1,
    text: "Small steps lead to big results. Every word you type is another chance to learn, improve your accuracy, and become a faster and more confident typist."
  },
  {
    level: 1,
    text: "Success does not happen overnight. It comes from patience, dedication, and the willingness to keep going even when a task feels difficult."
  },
  {
    level: 2,
    text: "Technology has changed how people communicate, work, and learn. Strong typing skills help you express ideas faster, finish tasks efficiently, and stay productive throughout the day."
  },
  {
    level: 2,
    text: "A curious mind is always looking for new possibilities. Ask thoughtful questions, explore different ideas, and turn every challenge into an opportunity to grow."
  },
  {
    level: 2,
    text: "Consistency matters more than occasional bursts of effort. Build a daily routine, measure your progress, and celebrate the small improvements that move you toward your goals."
  },
  {
    level: 3,
    text: "Programming transforms logical thinking into practical solutions. Developers combine creativity with careful reasoning to design reliable applications that solve meaningful problems."
  },
  {
    level: 3,
    text: "Efficient communication requires clarity, precision, and attention to detail. Choosing the right words can simplify complicated ideas and make collaboration more productive."
  },
  {
    level: 3,
    text: "The quick brown fox jumps over the lazy dog; meanwhile, a developer tests numbers such as 12345 and symbols like @, #, and ! to verify keyboard accuracy."
  },
  {
    level: 4,
    text: "Modern applications must balance performance, accessibility, and security. Thoughtful design choices create better experiences, while regular testing helps prevent unexpected failures."
  },
  {
    level: 4,
    text: "Complex challenges often become manageable when divided into smaller tasks. Analyze the requirements, test possible solutions, and refine your approach using reliable evidence."
  },
  {
    level: 5,
    text: "Advanced typing requires controlled movement, consistent rhythm, and minimal unnecessary corrections. Precision under pressure improves when attention remains on the next character rather than the previous mistake."
  }
];

const $ = (id) => document.getElementById(id);

const timerEl = $("timer");
const wpmEl = $("wpm");
const accuracyEl = $("accuracy");
const levelEl = $("level");
const passageEl = $("passage");
const passageNumberEl = $("passageNumber");
const inputEl = $("typingInput");
const startBtn = $("startBtn");
const resetBtn = $("resetBtn");
const resultsEl = $("results");

const timeButtons = [...document.querySelectorAll(".time-btn")];

// ===== PLAYER PROFILE & XP =====

const PLAYER_STORAGE_KEY = "typerush_player_v1";

function createNewPlayer() {
  return {
    xp: 0,
    bestWpm: 0,
    testsCompleted: 0,
    lastPlayedDate: null
  };
}

function loadPlayer() {
  try {
    const saved = localStorage.getItem(PLAYER_STORAGE_KEY);

    if (!saved) return createNewPlayer();

    const data = JSON.parse(saved);

    if (
      !data ||
      typeof data !== "object" ||
      !Number.isSafeInteger(data.xp) ||
      data.xp < 0 ||
      !Number.isFinite(data.bestWpm) ||
      data.bestWpm < 0 ||
      !Number.isSafeInteger(data.testsCompleted) ||
      data.testsCompleted < 0
    ) {
      return createNewPlayer();
    }

    return {
      xp: data.xp,
      bestWpm: data.bestWpm,
      testsCompleted: data.testsCompleted,
      lastPlayedDate:
        typeof data.lastPlayedDate === "string"
          ? data.lastPlayedDate
          : null
    };
  } catch {
    return createNewPlayer();
  }
}

let player = loadPlayer();

function savePlayer() {
  try {
    localStorage.setItem(
      PLAYER_STORAGE_KEY,
      JSON.stringify(player)
    );
  } catch (error) {
    console.warn("Could not save TypeRush progress.", error);
  }
}

function getPlayerLevel(xp) {
  return Math.floor(
    (Math.sqrt(1 + (8 * xp) / 100) - 1) / 2
  ) + 1;
}

function getXpAtLevel(level) {
  return 50 * (level - 1) * level;
}

function getPlayerRank(level) {
  if (level >= 20) return "Typing Legend";
  if (level >= 15) return "Keyboard Master";
  if (level >= 10) return "Speed Demon";
  if (level >= 7) return "Typing Pro";
  if (level >= 4) return "Rising Typist";
  if (level >= 2) return "Quick Fingers";
  return "Rookie Typist";
}

function renderPlayerProfile() {
  const level = getPlayerLevel(player.xp);
  const currentLevelXp = getXpAtLevel(level);
  const nextLevelXp = getXpAtLevel(level + 1);
  const progressXp = player.xp - currentLevelXp;
  const requiredXp = nextLevelXp - currentLevelXp;
  const percent = (progressXp / requiredXp) * 100;

  $("playerRank").textContent = getPlayerRank(level);
  $("playerLevel").textContent =
    `Level ${level} · ${player.xp} XP`;

  $("totalXp").textContent = `${player.xp} XP`;
  $("lifetimeXp").textContent = player.xp;
  $("bestWpm").textContent = player.bestWpm;
  $("testsCompleted").textContent = player.testsCompleted;

  $("xpProgressText").textContent =
    `${progressXp} / ${requiredXp} XP`;

  $("xpNextLevel").textContent =
    `${nextLevelXp - player.xp} XP to next level`;

  $("xpProgressFill").style.width = `${percent}%`;

  $("xpProgressBar").setAttribute(
    "aria-valuenow",
    Math.round(percent)
  );

  $("xpProgressBar").setAttribute(
    "aria-valuetext",
    `${progressXp} of ${requiredXp} XP toward level ${level + 1}`
  );
}

function awardSessionXP(wpm, accuracy) {
  const oldLevel = getPlayerLevel(player.xp);

  let earned = 50;

  if (accuracy >= 95) earned += 20;
  if (wpm >= 40) earned += 15;

  player.xp += earned;
  player.testsCompleted += 1;
  player.bestWpm = Math.max(player.bestWpm, wpm);
  player.lastPlayedDate = new Date().toLocaleDateString("en-CA");

  savePlayer();
  renderPlayerProfile();

  const newLevel = getPlayerLevel(player.xp);

  $("xpMessage").textContent =
    newLevel > oldLevel
      ? `🎉 Level up! You're now level ${newLevel}. +${earned} XP earned!`
      : `✨ +${earned} XP earned! Keep going!`;

  return earned;
}

// ===== GAME STATE =====

let selectedMinutes = 1;
let remainingSeconds = 60;
let timerId = null;
let running = false;
let finished = false;
let startTime = null;
let currentPassage = "";
let passageNumber = 0;
let currentLevel = 1;
let usedPassages = [];

let sessionCorrect = 0;
let sessionIncorrect = 0;
let sessionCharacters = 0;

let passageCorrect = 0;
let passageIncorrect = 0;
let passageCharacters = 0;

function getLevel(wpm) {
  return Math.min(5, Math.floor(wpm / 20) + 1);
}

function getLevelName(level) {
  return [
    "",
    "Beginner",
    "Intermediate",
    "Skilled",
    "Advanced",
    "Expert"
  ][level];
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function getElapsedSeconds() {
  if (startTime === null) return 0;

  return Math.min(
    selectedMinutes * 60,
    Math.max(0, (Date.now() - startTime) / 1000)
  );
}

function getWpm() {
  const elapsed = getElapsedSeconds() / 60;

  if (elapsed <= 0) return 0;

  return Math.round((sessionCharacters / 5) / elapsed);
}

function getAccuracy() {
  const attempts = sessionCorrect + sessionIncorrect;

  if (attempts === 0) return 100;

  return Math.round((sessionCorrect / attempts) * 100);
}

function updateStats() {
  const wpm = getWpm();
  const accuracy = getAccuracy();

  currentLevel = getLevel(wpm);

  wpmEl.textContent = wpm;
  accuracyEl.textContent = accuracy;
  levelEl.textContent = currentLevel;

  $("levelName").textContent =
    `Level ${currentLevel} · ${getLevelName(currentLevel)}`;

  const nextThreshold = currentLevel * 20;

  $("nextLevel").textContent =
    currentLevel === 5
      ? "Maximum level reached!"
      : `Next level: ${nextThreshold} WPM`;

  const progress = currentLevel === 5
    ? 100
    : ((wpm - (currentLevel - 1) * 20) / 20) * 100;

  $("levelProgress").style.width =
    `${Math.max(0, Math.min(100, progress))}%`;
}

function choosePassage() {
  const level = getLevel(getWpm());

  let available = passages.filter((p) => p.level <= level);

  let unused = available.filter(
    (p) => !usedPassages.includes(p.text)
  );

  if (unused.length === 0) {
    usedPassages = [];
    unused = available;
  }

  const chosen = unused[
    Math.floor(Math.random() * unused.length)
  ];

  usedPassages.push(chosen.text);
  currentPassage = chosen.text;
  passageNumber++;

  passageNumberEl.textContent =
    `PASSAGE ${String(passageNumber).padStart(2, "0")}`;

  inputEl.value = "";

  passageCorrect = 0;
  passageIncorrect = 0;
  passageCharacters = 0;

  renderPassage();
}

function renderPassage() {
  const typed = inputEl.value;
  passageEl.replaceChildren();

  for (let i = 0; i < currentPassage.length; i++) {
    const span = document.createElement("span");
    span.textContent = currentPassage[i];

    if (i < typed.length) {
      span.className =
        typed[i] === currentPassage[i]
          ? "correct"
          : "incorrect";
    } else if (i === typed.length) {
      span.className = "current";
    }

    passageEl.appendChild(span);
  }
}

function startGame() {
  clearInterval(timerId);
  timerId = null;

  running = false;
  finished = false;
  startTime = null;
  remainingSeconds = selectedMinutes * 60;
  passageNumber = 0;
  currentLevel = 1;
  usedPassages = [];

  sessionCorrect = 0;
  sessionIncorrect = 0;
  sessionCharacters = 0;

  passageCorrect = 0;
  passageIncorrect = 0;
  passageCharacters = 0;

  resultsEl.hidden = true;
  inputEl.disabled = false;
  inputEl.value = "";

  timerEl.textContent = formatTime(remainingSeconds);
  $("typingHint").textContent = "Start typing to begin the timer.";
  startBtn.innerHTML = 'Start game <span>→</span>';

  choosePassage();
  updateStats();
  inputEl.focus();
}

function beginTimer() {
  if (running || finished) return;

  running = true;
  startTime = Date.now();

  $("typingHint").textContent =
    "Game in progress — keep going!";

  startBtn.textContent = "Playing...";

  timerId = setInterval(() => {
    remainingSeconds = Math.max(
      0,
      selectedMinutes * 60 - Math.floor(getElapsedSeconds())
    );

    timerEl.textContent = formatTime(remainingSeconds);
    updateStats();

    if (remainingSeconds <= 0) {
      endGame();
    }
  }, 200);
}

function handleTyping() {
  if (finished) return;

  if (!running && inputEl.value.length > 0) {
    beginTimer();
  }

  if (!running) return;

  let typed = inputEl.value;

  if (typed.length > currentPassage.length) {
    typed = typed.slice(0, currentPassage.length);
    inputEl.value = typed;
  }

  // Recalculate the current passage.
  // Previously completed passages remain included in session totals.
  passageCorrect = 0;
  passageIncorrect = 0;
  passageCharacters = typed.length;

  for (let i = 0; i < typed.length; i++) {
    if (typed[i] === currentPassage[i]) {
      passageCorrect++;
    } else {
      passageIncorrect++;
    }
  }

  sessionCorrect += passageCorrect - (sessionCorrect - sessionCorrect);
  // Replace the current passage contribution with its latest values.
  // These baselines prevent backspace from inflating statistics.
  sessionCorrect = completedCorrect + passageCorrect;
  sessionIncorrect = completedIncorrect + passageIncorrect;
  sessionCharacters = completedCharacters + passageCharacters;

  renderPassage();
  updateStats();

  if (typed.length === currentPassage.length) {
    const completedCorrectly = typed === currentPassage;

    $("typingHint").textContent = completedCorrectly
      ? "Perfect passage! Next one..."
      : "Passage complete. Keep improving!";

    completedCorrect += passageCorrect;
    completedIncorrect += passageIncorrect;
    completedCharacters += passageCharacters;

    choosePassage();
    updateStats();
  }
}

function endGame() {
  if (finished) return;

  clearInterval(timerId);
  timerId = null;

  running = false;
  finished = true;
  remainingSeconds = 0;

  timerEl.textContent = "00:00";
  inputEl.disabled = true;

  updateStats();

  const finalWpm = getWpm();
  const finalAccuracy = getAccuracy();
  const earnedXP = awardSessionXP(finalWpm, finalAccuracy);

  $("typingHint").textContent =
    `Challenge completed! You earned ${earnedXP} XP.`;

  startBtn.textContent = "Game finished";

  $("finalWpm").textContent = `${finalWpm} WPM`;
  $("finalAccuracy").textContent = `${finalAccuracy}%`;
  $("finalLevel").textContent =
    `${currentLevel} · ${getLevelName(currentLevel)}`;
  $("finalChars").textContent = sessionCharacters;
  $("finalXp").textContent = `+${earnedXP} XP`;
  $("finalBest").textContent = `${player.bestWpm} WPM`;

  resultsEl.hidden = false;
  resultsEl.scrollIntoView({
    behavior: "smooth",
    block: "nearest"
  });
}

// Completed passage totals.
let completedCorrect = 0;
let completedIncorrect = 0;
let completedCharacters = 0;

function resetSessionCounters() {
  completedCorrect = 0;
  completedIncorrect = 0;
  completedCharacters = 0;
}

function startFreshGame() {
  resetSessionCounters();
  startGame();
}

timeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (running) return;

    selectedMinutes = Number(button.dataset.minutes);

    timeButtons.forEach((btn) => {
      btn.classList.toggle("active", btn === button);
    });

    startFreshGame();
  });
});

startBtn.addEventListener("click", () => {
  if (finished || running) return;

  inputEl.focus();
});

inputEl.addEventListener("input", handleTyping);

resetBtn.addEventListener("click", startFreshGame);
$("playAgainBtn").addEventListener("click", startFreshGame);

// Initialize.
renderPlayerProfile();
startFreshGame();
