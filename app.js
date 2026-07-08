import { locations } from './locations.js';
import { synth } from './audio.js';

// Game state variables
let map = null;
let currentRoundIndex = 0;
let totalRounds = 5;
let score = 0;
let activeLocations = [];
let currentTarget = null;
let currentAttempt = 3;
let elapsedTime = 0;
let roundTimer = null;
let guessLatLng = null;
let isAudioMuted = false;
let isRoundActive = false;
let hint4Unlocked = false;

// Statistics for Game Over
let totalGameTime = 0;
let perfectGuessesCount = 0;
let distancesList = [];

// Leaflet marker references
let guessMarker = null;
let targetMarker = null;
let connectionLine = null;

// DOM Elements
const startMenu = document.getElementById('start-menu');
const gameplayArena = document.getElementById('gameplay-arena');
const gameOverScreen = document.getElementById('game-over');
const summaryOverlay = document.getElementById('summary-overlay');
const scoresModal = document.getElementById('scores-modal');

const btnStart = document.getElementById('btn-start');
const btnShowScores = document.getElementById('btn-show-scores');
const btnCloseScores = document.getElementById('btn-close-scores');
const btnConfirmGuess = document.getElementById('btn-confirm-guess');
const btnNextRound = document.getElementById('btn-next-round');
const btnRestart = document.getElementById('btn-restart');
const btnReturnMenu = document.getElementById('btn-return-menu');
const btnMute = document.getElementById('btn-mute');
const btnAbort = document.getElementById('btn-abort');
const btnSubmitHighscore = document.getElementById('btn-submit-highscore');

const hudRoundVal = document.getElementById('hud-round-val');
const hudTimerVal = document.getElementById('hud-timer-val');
const hudMultVal = document.getElementById('hud-mult-val');
const hudScoreVal = document.getElementById('hud-score-val');
const muteIcon = document.getElementById('mute-icon');

const targetCityName = document.getElementById('target-city-name');
const hintProgressBar = document.getElementById('hint-progress-bar');
const guessInstructionMsg = document.getElementById('guess-instruction-msg');
const attemptsLives = document.getElementById('attempts-lives');

const thermalCursor = document.getElementById('thermal-cursor');
const leaderboardBody = document.getElementById('leaderboard-body');
const noScoresMsg = document.getElementById('no-scores-msg');
const playerNameInput = document.getElementById('player-name-input');

/* ----------------------------------------------------
   INITIALIZATION & LOBBY LOGIC
   ---------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Load High Scores Table
  loadHighScores();

  // Attach Event Listeners
  btnStart.addEventListener('click', startGame);
  btnShowScores.addEventListener('click', () => {
    synth.playConfirm();
    openHighScoresModal();
  });
  btnCloseScores.addEventListener('click', () => {
    synth.playConfirm();
    closeHighScoresModal();
  });
  btnConfirmGuess.addEventListener('click', confirmGuess);
  btnNextRound.addEventListener('click', nextRound);
  btnRestart.addEventListener('click', () => {
    synth.playConfirm();
    startGame();
  });
  btnReturnMenu.addEventListener('click', () => {
    synth.playConfirm();
    transitionToScreen('start-menu');
  });
  btnMute.addEventListener('click', toggleMute);
  btnAbort.addEventListener('click', abortGame);
  btnSubmitHighscore.addEventListener('click', submitHighScore);

  // Audio hovers
  document.querySelectorAll('button, select, input').forEach(el => {
    el.addEventListener('mouseenter', () => synth.playHover());
  });

  // Track global mouse coordinates for custom cursor
  window.addEventListener('mousemove', (e) => {
    if (hint4Unlocked && isRoundActive) {
      thermalCursor.style.left = e.clientX + 'px';
      thermalCursor.style.top = e.clientY + 'px';
    }
  });
});

function transitionToScreen(screenId) {
  startMenu.classList.add('hidden');
  gameplayArena.classList.add('hidden');
  gameOverScreen.classList.add('hidden');
  summaryOverlay.classList.add('hidden');

  if (screenId === 'start-menu') {
    startMenu.classList.remove('hidden');
    startMenu.classList.add('active-state');
  } else if (screenId === 'gameplay-arena') {
    gameplayArena.classList.remove('hidden');
    gameplayArena.classList.add('active-state');
  } else if (screenId === 'game-over') {
    gameOverScreen.classList.remove('hidden');
    gameOverScreen.classList.add('active-state');
  }
}

/* ----------------------------------------------------
   GAMEPLAY SYSTEM ENGINE
   ---------------------------------------------------- */
function startGame() {
  synth.playConfirm();
  const roundSelect = document.getElementById('round-select');
  totalRounds = parseInt(roundSelect.value, 10);
  
  // Reset Stats
  currentRoundIndex = 0;
  score = 0;
  perfectGuessesCount = 0;
  totalGameTime = 0;
  distancesList = [];
  
  // Pick random locations
  activeLocations = shuffleArray([...locations]).slice(0, totalRounds);
  
  // Transition UI
  transitionToScreen('gameplay-arena');
  
  // Initialize Map if not done
  initMap();

  // Load Round 1
  loadRound();
}

function initMap() {
  if (map) return;

  // Create Map
  map = L.map('map', {
    center: [20, 0],
    zoom: 2,
    minZoom: 2,
    maxZoom: 9,
    zoomControl: true,
    attributionControl: true,
    maxBounds: L.latLngBounds(L.latLng(-85, -180), L.latLng(85, 180)),
    maxBoundsViscosity: 0.8
  });

  // Load Custom styled tiles: CartoDB Dark Matter No Labels
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/dark_nolabels/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
  }).addTo(map);

  // Map click handler to place guess marker
  map.on('click', onMapClick);

  // Map mousemove handler for thermal tracking
  map.on('mousemove', onMapMouseMove);
}

function loadRound() {
  isRoundActive = true;
  elapsedTime = 0;
  currentAttempt = 3;
  guessLatLng = null;
  hint4Unlocked = false;

  // Clear previous markers
  if (guessMarker) {
    map.removeLayer(guessMarker);
    guessMarker = null;
  }
  if (targetMarker) {
    map.removeLayer(targetMarker);
    targetMarker = null;
  }
  if (connectionLine) {
    map.removeLayer(connectionLine);
    connectionLine = null;
  }

  // Set current target city
  currentTarget = activeLocations[currentRoundIndex];
  
  // Reset Map View
  map.setView([20, 0], 2);
  document.getElementById('map').classList.remove('map-thermal-active');
  thermalCursor.classList.add('hidden');

  // Update UI Elements
  targetCityName.textContent = `Target: ${currentTarget.name}`;
  targetCityName.classList.add('accent-text');
  hudRoundVal.textContent = `${currentRoundIndex + 1} / ${totalRounds}`;
  hudTimerVal.textContent = "00:00";
  hudScoreVal.textContent = formatNumber(score);
  
  updateAttemptsUI();
  resetHintsUI();
  unlockHint(1, true); // Unlock famous fact immediately, silently
  updateSpeedMultiplierUI();

  // Disable Confirm Button
  btnConfirmGuess.classList.add('disabled');
  btnConfirmGuess.disabled = true;
  guessInstructionMsg.textContent = "Click on the map to place your guess";

  // Start Timer Loop
  if (roundTimer) clearInterval(roundTimer);
  roundTimer = setInterval(tickTimer, 1000);
}

function tickTimer() {
  elapsedTime++;
  totalGameTime++;
  
  // Update Timer Display
  const minutes = Math.floor(elapsedTime / 60).toString().padStart(2, '0');
  const seconds = (elapsedTime % 60).toString().padStart(2, '0');
  hudTimerVal.textContent = `${minutes}:${seconds}`;

  // Update speed multiplier
  updateSpeedMultiplierUI();

  // Progress Bar for hints
  // Hints unlock at: 0s (Hint 1 - Immediate), 15s (Hint 2), 30s (Hint 3), 45s (Hint 4)
  if (elapsedTime <= 45) {
    const segmentTime = elapsedTime % 15;
    const progress = (segmentTime / 15) * 100;
    // If exact milestone, fill progress to 100% momentarily
    hintProgressBar.style.width = (elapsedTime > 0 && elapsedTime % 15 === 0) ? '100%' : `${progress}%`;
  } else {
    hintProgressBar.style.width = '100%';
  }

  // Trigger Hint unlocks
  if (elapsedTime === 15) {
    unlockHint(2);
  } else if (elapsedTime === 30) {
    unlockHint(3);
  } else if (elapsedTime === 45) {
    unlockHint(4);
  }
}

function updateSpeedMultiplierUI() {
  // Starts at x2.00, decays by 0.015 per second, minimum x1.00
  const mult = Math.max(1.0, 2.0 - elapsedTime * 0.015);
  hudMultVal.textContent = `x${mult.toFixed(2)}`;
}

function updateAttemptsUI() {
  let heartsHtml = '';
  for (let i = 1; i <= 3; i++) {
    if (i <= currentAttempt) {
      heartsHtml += '<i data-lucide="heart" class="heart-icon filled"></i>';
    } else {
      heartsHtml += '<i data-lucide="heart" class="heart-icon"></i>';
    }
  }
  attemptsLives.innerHTML = heartsHtml;
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function resetHintsUI() {
  // Reset hint cards to locked state and clear previous texts
  for (let i = 1; i <= 4; i++) {
    const hintRow = document.getElementById(`hint-${i}`);
    hintRow.className = 'hint-row locked';
    
    if (i === 1) {
      hintRow.querySelector('.text-val').textContent = '';
    } else if (i === 2) {
      hintRow.querySelector('.text-val').textContent = '';
    } else if (i === 3) {
      hintRow.querySelector('.text-val').textContent = '';
    }
  }
}

function unlockHint(number, silent = false) {
  if (!silent) {
    synth.playHint();
  }
  const hintRow = document.getElementById(`hint-${number}`);
  hintRow.classList.remove('locked');

  if (number === 1) {
    hintRow.querySelector('.text-val').textContent = currentTarget.fact;
  } else if (number === 2) {
    hintRow.querySelector('.text-val').textContent = currentTarget.continent;
  } else if (number === 3) {
    hintRow.querySelector('.text-val').textContent = currentTarget.neighbors;
  } else if (number === 4) {
    // Enable Thermal Cursor
    hint4Unlocked = true;
    document.getElementById('map').classList.add('map-thermal-active');
    thermalCursor.classList.remove('hidden');
  }
}

/* ----------------------------------------------------
   MAP INTERACTION & THERMAL INTERPOLATION
   ---------------------------------------------------- */
function onMapClick(e) {
  if (!isRoundActive) return;

  synth.playConfirm();
  guessLatLng = e.latlng;

  // Custom DivIcon for guess marker
  const guessIcon = L.divIcon({
    className: 'custom-guess-marker',
    html: '<div class="marker-pin"></div>',
    iconSize: [24, 24],
    iconAnchor: [12, 24]
  });

  if (!guessMarker) {
    guessMarker = L.marker(guessLatLng, { icon: guessIcon }).addTo(map);
  } else {
    guessMarker.setLatLng(guessLatLng);
  }

  // Enable Confirm button
  btnConfirmGuess.classList.remove('disabled');
  btnConfirmGuess.disabled = false;
  guessInstructionMsg.innerHTML = `Guess placed: <span class="accent-text font-numeric">${guessLatLng.lat.toFixed(2)}°, ${guessLatLng.lng.toFixed(2)}°</span>`;
}

function onMapMouseMove(e) {
  if (!hint4Unlocked || !isRoundActive || !currentTarget) return;

  const mouseLatLng = e.latlng;
  const targetLatLng = L.latLng(currentTarget.coords[0], currentTarget.coords[1]);
  const distance = map.distance(mouseLatLng, targetLatLng); // distance in meters

  const distanceKm = distance / 1000;
  
  // Set scaling boundary (0 km to 8,000 km)
  // Closer means redder (hue ~ 0), Farther means colder/bluer (hue ~ 240)
  const maxThermalDist = 8000; // km
  const ratio = Math.min(1, distanceKm / maxThermalDist); // 0 = exactly on target, 1 = extremely far

  // Hue calculation (220 is ice blue, 0 is red)
  const hue = ratio * 220; 
  
  // Glow size scaling: close = larger glow, far = smaller/standard glow
  // Scale from 1.0 (far) to 2.2 (extremely close)
  const scale = 1.0 + (1.0 - ratio) * 1.2;
  const glow = 10 + (1.0 - ratio) * 20;

  // Update cursor style
  thermalCursor.style.backgroundColor = `hsla(${hue}, 100%, 50%, 0.4)`;
  thermalCursor.style.borderColor = `hsla(${hue}, 100%, 75%, 1)`;
  thermalCursor.style.boxShadow = `0 0 ${glow}px ${glow / 2}px hsla(${hue}, 100%, 50%, 0.7)`;
  thermalCursor.style.transform = `translate(-50%, -50%) scale(${scale})`;
}

/* ----------------------------------------------------
   GUESS VALIDATION & SCORING
   ---------------------------------------------------- */
function confirmGuess() {
  if (!guessLatLng || !isRoundActive) return;

  const targetLatLng = L.latLng(currentTarget.coords[0], currentTarget.coords[1]);
  const distance = map.distance(guessLatLng, targetLatLng); // in meters
  const distanceKm = Math.round(distance / 1000);

  // Accuracy Check: Successful guess is defined within 1000 km
  const successThreshold = 1000; // km

  if (distanceKm <= successThreshold) {
    // Success! Reveal and show scores
    successRound(distanceKm);
  } else {
    // Incorrect guess
    currentAttempt--;
    updateAttemptsUI();

    if (currentAttempt > 0) {
      // Prompt retry
      synth.playFailure();
      guessInstructionMsg.innerHTML = `<span class="accent-text text-glow-red font-numeric">${distanceKm.toLocaleString()} km</span> away. Too far! Try again.`;
      
      // Quick flash animation on map or layout could go here
    } else {
      // Out of attempts, fail round
      failRound(distanceKm);
    }
  }
}

function successRound(distanceKm) {
  isRoundActive = false;
  clearInterval(roundTimer);
  synth.playSuccess();
  synth.speak(currentTarget.name);

  distancesList.push(distanceKm);
  if (distanceKm <= 50) {
    perfectGuessesCount++;
  }

  // Calculate Scores
  // 1. Accuracy Score (up to 1000 pts)
  // Linear decay within 1000km: 0km = 1000pts, 1000km = 0pts
  const accScore = Math.max(0, 1000 - Math.round(distanceKm));

  // 2. Speed Score (up to 1000 pts base, decaying by 10 pts per second, multiplied)
  const baseSpeedScore = Math.max(0, 1000 - elapsedTime * 10);
  const mult = Math.max(1.0, 2.0 - elapsedTime * 0.015);
  const speedScore = Math.round(baseSpeedScore * mult);

  const roundTotal = accScore + speedScore;
  score += roundTotal;

  // Render modal summary
  showRoundSummaryModal(distanceKm, accScore, speedScore, roundTotal, true);
  revealTargetOnMap();
}

function failRound(distanceKm) {
  isRoundActive = false;
  clearInterval(roundTimer);
  synth.playFailure();

  distancesList.push(distanceKm);

  // 0 points for this round
  showRoundSummaryModal(distanceKm, 0, 0, 0, false);
  revealTargetOnMap();
}

function revealTargetOnMap() {
  // Reveal actual target name
  targetCityName.textContent = `Target: ${currentTarget.name}`;

  const targetLatLng = L.latLng(currentTarget.coords[0], currentTarget.coords[1]);

  // Target Custom Icon (Gold marker)
  const targetIcon = L.divIcon({
    className: 'custom-target-marker',
    html: '<div class="pulse-target"></div><div class="marker-pin"></div>',
    iconSize: [24, 24],
    iconAnchor: [12, 24]
  });

  targetMarker = L.marker(targetLatLng, { icon: targetIcon }).addTo(map);

  // Draw connecting line if guess exists
  if (guessLatLng) {
    connectionLine = L.polyline([guessLatLng, targetLatLng], {
      color: '#ffb703',
      weight: 3,
      opacity: 0.8,
      dashArray: '8, 8'
    }).addTo(map);

    // Zoom out map bounds to show both markers nicely
    const bounds = L.latLngBounds([guessLatLng, targetLatLng]);
    map.fitBounds(bounds, { padding: [100, 100] });
  } else {
    // If no guess was even placed, just focus on target
    map.setView(targetLatLng, 5);
  }

  // Hide thermal cursor elements
  document.getElementById('map').classList.remove('map-thermal-active');
  thermalCursor.classList.add('hidden');
}

function showRoundSummaryModal(distanceKm, accScore, speedScore, roundTotal, isSuccess) {
  const title = document.getElementById('summary-title');
  const subtitle = document.getElementById('summary-subtitle');
  const distVal = document.getElementById('summary-distance-val');
  const scoreAcc = document.getElementById('summary-score-acc');
  const scoreSpeed = document.getElementById('summary-score-speed');
  const scoreTotal = document.getElementById('summary-score-total');
  const tipsBox = document.getElementById('summary-tips-box');
  const nextBtnText = document.getElementById('next-btn-text');

  if (isSuccess) {
    title.textContent = "Location Secured";
    title.style.color = "var(--accent-cyan)";
    subtitle.textContent = "Target identified within threshold";
  } else {
    title.textContent = "Mission Compromised";
    title.style.color = "var(--accent-red)";
    subtitle.textContent = "Target location lost (out of attempts)";
  }

  distVal.textContent = `${distanceKm.toLocaleString()} km`;
  scoreAcc.textContent = `+${accScore}`;
  scoreSpeed.textContent = `+${speedScore}`;
  scoreTotal.textContent = `+${roundTotal.toLocaleString()}`;

  // Smart tip generator
  let tipText = "";
  if (distanceKm <= 50) {
    tipText = `🎯 <strong>Bullseye!</strong> Incredible spatial accuracy! You were spot on target (${distanceKm} km).`;
  } else if (distanceKm <= 200) {
    tipText = `⚡ <strong>Superb!</strong> Just a short distance off (${distanceKm} km). You navigated the map with expertise.`;
  } else if (distanceKm <= 1000) {
    tipText = `👍 <strong>Confirmed.</strong> Good enough to secure target data. Try to lock it in faster next round.`;
  } else {
    tipText = `⚠️ <strong>Intelligence Failure.</strong> The target city was <strong>${currentTarget.name}</strong>, located in the continent of <strong>${currentTarget.continent}</strong>.`;
  }
  tipsBox.innerHTML = tipText;

  // Rename button on last round
  if (currentRoundIndex === totalRounds - 1) {
    nextBtnText.textContent = "VIEW FINAL RESULTS";
  } else {
    nextBtnText.textContent = "NEXT LOCATION";
  }

  // Open modal overlay
  summaryOverlay.classList.remove('hidden');
}

function nextRound() {
  synth.playConfirm();
  summaryOverlay.classList.add('hidden');

  currentRoundIndex++;
  if (currentRoundIndex < totalRounds) {
    loadRound();
  } else {
    gameOver();
  }
}

/* ----------------------------------------------------
   GAME OVER STATE & SUMMARY REPORT
   ---------------------------------------------------- */
function gameOver() {
  transitionToScreen('game-over');
  synth.playVictory();

  // Final Stats Calculations
  const finalScoreVal = document.getElementById('final-score-val');
  const finalAvgDistVal = document.getElementById('final-avg-dist-val');
  const finalPerfectGuesses = document.getElementById('final-perfect-guesses-val');
  const finalTotalTime = document.getElementById('final-total-time-val');
  const highscoreSubmitForm = document.getElementById('highscore-submit-form');

  // Average Distance
  const avgDistance = distancesList.reduce((a, b) => a + b, 0) / distancesList.length;

  // Inject stats
  finalScoreVal.textContent = formatNumber(score);
  finalAvgDistVal.textContent = `${Math.round(avgDistance).toLocaleString()} km`;
  finalPerfectGuesses.textContent = perfectGuessesCount;
  finalTotalTime.textContent = `${totalGameTime}s`;

  // Display submit form if score is positive, otherwise hide
  if (score > 0) {
    highscoreSubmitForm.classList.remove('hidden');
    playerNameInput.focus();
  } else {
    highscoreSubmitForm.classList.add('hidden');
  }
}

function abortGame() {
  synth.playConfirm();
  if (confirm("Are you sure you want to abort the current game session? Your progress will be lost.")) {
    clearInterval(roundTimer);
    isRoundActive = false;
    transitionToScreen('start-menu');
  }
}

/* ----------------------------------------------------
   LEADERBOARD & LOCAL STORAGE CACHE
   ---------------------------------------------------- */
function loadHighScores() {
  const scores = getScoresFromCache();
  renderLeaderboardTable(scores);
}

function getScoresFromCache() {
  const cached = localStorage.getItem('geoclash_highscores');
  return cached ? JSON.parse(cached) : [];
}

function saveScoresToCache(scores) {
  localStorage.setItem('geoclash_highscores', JSON.stringify(scores));
}

function renderLeaderboardTable(scores) {
  leaderboardBody.innerHTML = '';
  
  if (scores.length === 0) {
    noScoresMsg.classList.remove('hidden');
    return;
  }

  noScoresMsg.classList.add('hidden');
  scores.forEach((entry, idx) => {
    const row = document.createElement('tr');
    
    // Rank
    const rankTd = document.createElement('td');
    let rankBadge = idx + 1;
    if (idx === 0) rankBadge = '🥇';
    else if (idx === 1) rankBadge = '🥈';
    else if (idx === 2) rankBadge = '🥉';
    rankTd.innerHTML = rankBadge;
    row.appendChild(rankTd);

    // Player
    const playerTd = document.createElement('td');
    playerTd.textContent = entry.name;
    row.appendChild(playerTd);

    // Score
    const scoreTd = document.createElement('td');
    scoreTd.textContent = formatNumber(entry.score);
    scoreTd.className = 'font-numeric';
    row.appendChild(scoreTd);

    // Accuracy (Avg Distance)
    const accTd = document.createElement('td');
    accTd.textContent = `${entry.accuracy.toLocaleString()} km`;
    accTd.className = 'font-numeric';
    row.appendChild(accTd);

    // Date
    const dateTd = document.createElement('td');
    dateTd.textContent = entry.date;
    row.appendChild(dateTd);

    leaderboardBody.appendChild(row);
  });
}

function submitHighScore() {
  const name = playerNameInput.value.trim() || "Anonymous Agent";
  synth.playConfirm();

  const avgDistance = Math.round(distancesList.reduce((a, b) => a + b, 0) / distancesList.length);
  const dateStr = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  const newEntry = {
    name: name,
    score: score,
    accuracy: avgDistance,
    date: dateStr
  };

  const scores = getScoresFromCache();
  scores.push(newEntry);
  
  // Sort descending by score, ascending by accuracy if score tied
  scores.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.accuracy - b.accuracy;
  });

  // Keep top 10 scores
  const topScores = scores.slice(0, 10);
  saveScoresToCache(topScores);

  // Update Score tables
  renderLeaderboardTable(topScores);

  // Hide form, show leaderboard modal
  document.getElementById('highscore-submit-form').classList.add('hidden');
  openHighScoresModal();
}

function openHighScoresModal() {
  scoresModal.classList.remove('hidden');
}

function closeHighScoresModal() {
  scoresModal.classList.add('hidden');
}

/* ----------------------------------------------------
   AUDIO UTILITIES & TOGGLES
   ---------------------------------------------------- */
function toggleMute() {
  const muted = synth.toggleMute();
  isAudioMuted = muted;

  if (muted) {
    muteIcon.setAttribute('data-lucide', 'volume-x');
  } else {
    muteIcon.setAttribute('data-lucide', 'volume-2');
    synth.playConfirm();
  }
  
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

/* ----------------------------------------------------
   GENERAL HELPER FUNCTIONS
   ---------------------------------------------------- */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function formatNumber(num) {
  return num.toString().padStart(5, '0');
}
