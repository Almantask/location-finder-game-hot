import { locations } from './locations.js';
import { synth } from './audio.js';
import { t, getTranslatedTarget } from './i18n.js';

// Game state variables
let map = null;
let currentRoundIndex = 0;
let totalRounds = 5;
let score = 0;
let activeLocations = [];
let currentTarget = null;
let currentRawLocation = null;
let currentAttempt = 5;
let elapsedTime = 0;
let roundTimer = null;
let guessLatLng = null;
let isAudioMuted = false;
let isRoundActive = false;
let hint4Unlocked = false;
let currentLanguage = localStorage.getItem('geoclash_lang') || 'en';

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
const summaryImages = document.getElementById('summary-images');
const imageLightbox = document.getElementById('image-lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const btnCloseLightbox = document.getElementById('btn-close-lightbox');

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

const hintsHeaderBtn = document.getElementById('hints-header-btn');
const hintsListCard = document.querySelector('.hints-list-card');
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

/* ----------------------------------------------------
   I18N DOM HELPERS
   ---------------------------------------------------- */
function updateLanguageUI() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const translation = t(key, currentLanguage);
    if (translation) {
      if (translation.includes('<strong') || translation.includes('<span') || translation.includes('<ol') || translation.includes('<li') || translation.includes('<i')) {
        el.innerHTML = translation;
      } else {
        el.textContent = translation;
      }
    }
  });

  const btnMute = document.getElementById('btn-mute');
  const btnAbort = document.getElementById('btn-abort');
  const nameInput = document.getElementById('player-name-input');
  
  if (btnMute) btnMute.title = t('hud_mute_tooltip', currentLanguage);
  if (btnAbort) btnAbort.title = t('hud_quit_tooltip', currentLanguage);
  if (nameInput) nameInput.placeholder = t('enter_agent_name', currentLanguage);

  document.title = `GeoClash // ${t('title_sub', currentLanguage)}`;

  document.getElementById('lang-btn-en').classList.toggle('active', currentLanguage === 'en');
  document.getElementById('lang-btn-lt').classList.toggle('active', currentLanguage === 'lt');
}

async function reloadRoundTranslations() {
  const rawTarget = activeLocations[currentRoundIndex];
  if (!rawTarget) return;

  // Show loading indicators inside hints temporarily
  for (let i = 1; i <= 3; i++) {
    const hintRow = document.getElementById(`hint-${i}`);
    if (hintRow && !hintRow.classList.contains('locked')) {
      const textValEl = hintRow.querySelector('.text-val');
      if (textValEl) textValEl.textContent = '...';
    }
  }

  // Get new translated target
  currentTarget = await getTranslatedTarget(rawTarget, currentLanguage);

  // Update active hints and target name
  const prefix = t('target_prefix', currentLanguage);
  if (isRoundActive) {
    targetCityName.textContent = `${prefix}: ???`;
  } else {
    targetCityName.textContent = `${prefix}: ${currentTarget.name}`;
  }

  for (let i = 1; i <= 3; i++) {
    const hintRow = document.getElementById(`hint-${i}`);
    if (hintRow && !hintRow.classList.contains('locked')) {
      const textValEl = hintRow.querySelector('.text-val');
      if (textValEl) textValEl.textContent = currentTarget[`hint${i}`];
    }
  }

  const hint4Row = document.getElementById('hint-4');
  if (hint4Row && !hint4Row.classList.contains('locked')) {
    const textValEl = hint4Row.querySelector('.text-val');
    if (textValEl) textValEl.textContent = t('hint_4_text', currentLanguage);
  }

  // Update guess instruction text
  if (guessLatLng) {
    const prefixStr = t('guess_placed_prefix', currentLanguage);
    guessInstructionMsg.innerHTML = `${prefixStr}: <span class="accent-text font-numeric">${guessLatLng.lat.toFixed(2)}°, ${guessLatLng.lng.toFixed(2)}°</span>`;
  } else {
    guessInstructionMsg.textContent = t('click_map_msg', currentLanguage);
  }
}

/* ----------------------------------------------------
   INITIALIZATION & LOBBY LOGIC
   ---------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Initialize Language Switcher UI
  updateLanguageUI();

  if (isTouchDevice && thermalCursor) {
    thermalCursor.classList.add('touch-device');
  }

  // Attach Language Switcher Button Event Listeners
  document.getElementById('lang-btn-en').addEventListener('click', () => {
    if (currentLanguage === 'en') return;
    synth.playConfirm();
    currentLanguage = 'en';
    localStorage.setItem('geoclash_lang', 'en');
    updateLanguageUI();
    if (isRoundActive) {
      reloadRoundTranslations();
    }
  });

  document.getElementById('lang-btn-lt').addEventListener('click', () => {
    if (currentLanguage === 'lt') return;
    synth.playConfirm();
    currentLanguage = 'lt';
    localStorage.setItem('geoclash_lang', 'lt');
    updateLanguageUI();
    if (isRoundActive) {
      reloadRoundTranslations();
    }
  });

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

  // Lightbox Close triggers
  if (btnCloseLightbox) {
    btnCloseLightbox.addEventListener('click', closeLightbox);
  }
  if (imageLightbox) {
    imageLightbox.addEventListener('click', (e) => {
      if (e.target === imageLightbox) {
        closeLightbox();
      }
    });
  }

  // Audio hovers
  document.querySelectorAll('button, select, input').forEach(el => {
    el.addEventListener('mouseenter', () => synth.playHover());
  });

  // Toggle intelligence brief panel
  if (hintsHeaderBtn) {
    hintsHeaderBtn.addEventListener('click', toggleHintsPanel);
  }

  // Track global mouse coordinates for custom cursor
  window.addEventListener('mousemove', (e) => {
    if (hint4Unlocked && isRoundActive && !isTouchDevice) {
      thermalCursor.style.left = e.clientX + 'px';
      thermalCursor.style.top = e.clientY + 'px';
    }
  });
});

function toggleHintsPanel() {
  synth.playConfirm();
  if (hintsListCard) {
    hintsListCard.classList.toggle('collapsed');
  }
}

function transitionToScreen(screenId) {
  startMenu.classList.add('hidden');
  startMenu.classList.remove('active-state');
  gameplayArena.classList.add('hidden');
  gameplayArena.classList.remove('active-state');
  gameOverScreen.classList.add('hidden');
  gameOverScreen.classList.remove('active-state');
  summaryOverlay.classList.add('hidden');

  // Hide thermal cursor and reset map cursor state when leaving gameplay-arena
  if (screenId !== 'gameplay-arena') {
    if (thermalCursor) {
      thermalCursor.classList.add('hidden');
    }
    const mapEl = document.getElementById('map');
    if (mapEl) {
      mapEl.classList.remove('map-thermal-active');
    }
  }

  const langSwitcher = document.querySelector('.language-switcher');

  if (screenId === 'start-menu') {
    startMenu.classList.remove('hidden');
    startMenu.classList.add('active-state');
    if (langSwitcher) langSwitcher.classList.remove('hidden');
  } else if (screenId === 'gameplay-arena') {
    gameplayArena.classList.remove('hidden');
    gameplayArena.classList.add('active-state');
    if (langSwitcher) langSwitcher.classList.add('hidden');
  } else if (screenId === 'game-over') {
    gameOverScreen.classList.remove('hidden');
    gameOverScreen.classList.add('active-state');
    if (langSwitcher) langSwitcher.classList.remove('hidden');
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

  // Map move handler for thermal tracking on touch devices
  if (isTouchDevice) {
    map.on('move', () => {
      if (hint4Unlocked && isRoundActive) {
        updateThermalProximity(map.getCenter());
      }
    });
  }
}

async function loadRound() {
  isRoundActive = true;
  elapsedTime = 0;
  currentAttempt = 5;
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

  // Reset Map View
  map.setView([20, 0], 2);
  document.getElementById('map').classList.remove('map-thermal-active');
  thermalCursor.classList.add('hidden');

  // Update UI Elements
  const targetPrefix = t('target_prefix', currentLanguage);
  targetCityName.textContent = `${targetPrefix}: ???`;
  targetCityName.classList.add('accent-text');
  hudRoundVal.textContent = `${currentRoundIndex + 1} / ${totalRounds}`;
  hudTimerVal.textContent = "00:00";
  hudScoreVal.textContent = formatNumber(score);
  
  updateAttemptsUI();
  resetHintsUI();

  // Reset collapsed panel state based on viewport size
  if (hintsListCard) {
    if (window.innerWidth <= 768) {
      hintsListCard.classList.add('collapsed');
    } else {
      hintsListCard.classList.remove('collapsed');
    }
  }
  
  // Set placeholder hints during resolution
  for (let i = 1; i <= 3; i++) {
    const hintRow = document.getElementById(`hint-${i}`);
    const textValEl = hintRow.querySelector('.text-val');
    if (textValEl) textValEl.textContent = '...';
  }

  // Set current target city (async translation)
  const rawTarget = activeLocations[currentRoundIndex];
  currentRawLocation = rawTarget;
  currentTarget = await getTranslatedTarget(rawTarget, currentLanguage);
  window.currentTarget = currentTarget;
  window.map = map;
  window.updateThermalProximity = updateThermalProximity;

  unlockHint(1, true); // Unlock famous fact immediately, silently
  updateSpeedMultiplierUI();

  // Disable Confirm Button
  btnConfirmGuess.classList.add('disabled');
  btnConfirmGuess.disabled = true;
  guessInstructionMsg.textContent = t('click_map_msg', currentLanguage);

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
  // Hints unlock at: 0s (Hint 1 - Immediate), 10s (Hint 2), 20s (Hint 3), 30s (Hint 4)
  if (elapsedTime <= 30) {
    const segmentTime = elapsedTime % 10;
    const progress = (segmentTime / 10) * 100;
    // If exact milestone, fill progress to 100% momentarily
    hintProgressBar.style.width = (elapsedTime > 0 && elapsedTime % 10 === 0) ? '100%' : `${progress}%`;
  } else {
    hintProgressBar.style.width = '100%';
  }

  // Trigger Hint unlocks
  if (elapsedTime === 10) {
    unlockHint(2);
  } else if (elapsedTime === 20) {
    unlockHint(3);
  } else if (elapsedTime === 30) {
    unlockHint(4);
  }
}

function getSpeedMultiplier(time) {
  if (time <= 30) {
    // Start from x5 multiplier, move to x2 over 30s (decays by 0.1 per second)
    return 5.0 - time * 0.1;
  } else if (time <= 40) {
    // At hot cursor mode (starts at 30s), have x2 multiplier still for the first 10s (up to 40s)
    return 2.0;
  } else {
    // Gradually lowers to x1 if taken more than 10s in hot cursor mode (decays by 0.1 per second, min 1.0)
    return Math.max(1.0, 2.0 - (time - 40) * 0.1);
  }
}

function updateSpeedMultiplierUI() {
  const mult = getSpeedMultiplier(elapsedTime);
  hudMultVal.textContent = `x${mult.toFixed(2)}`;
}

function updateAttemptsUI() {
  let heartsHtml = '';
  for (let i = 1; i <= 5; i++) {
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
    
    const textValEl = hintRow.querySelector('.text-val');
    if (textValEl) {
      textValEl.textContent = '';
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
    hintRow.querySelector('.text-val').textContent = currentTarget.hint1;
  } else if (number === 2) {
    hintRow.querySelector('.text-val').textContent = currentTarget.hint2;
  } else if (number === 3) {
    hintRow.querySelector('.text-val').textContent = currentTarget.hint3;
  } else if (number === 4) {
    // Set Hint 4 text
    const textValEl = hintRow.querySelector('.text-val');
    if (textValEl) {
      textValEl.textContent = t('hint_4_text', currentLanguage);
    }
    // Enable Thermal Cursor
    hint4Unlocked = true;
    document.getElementById('map').classList.add('map-thermal-active');
    thermalCursor.classList.remove('hidden');

    if (isTouchDevice) {
      thermalCursor.style.left = '50%';
      thermalCursor.style.top = '50%';
      updateThermalProximity(map.getCenter());
    }
  }

  // Auto-expand/collapse for hints on mobile
  if (!silent && window.innerWidth <= 768 && hintsListCard) {
    hintsListCard.classList.remove('collapsed');
    setTimeout(() => {
      if (isRoundActive && window.innerWidth <= 768) {
        hintsListCard.classList.add('collapsed');
      }
    }, 5000);
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
  const prefixStr = t('guess_placed_prefix', currentLanguage);
  guessInstructionMsg.innerHTML = `${prefixStr}: <span class="accent-text font-numeric">${guessLatLng.lat.toFixed(2)}°, ${guessLatLng.lng.toFixed(2)}°</span>`;
}

function updateThermalProximity(latlng) {
  if (!currentTarget) return;

  const targetLatLng = L.latLng(currentTarget.coords[0], currentTarget.coords[1]);
  const distance = map.distance(latlng, targetLatLng); // distance in meters
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

  // Update cursor inner circle style
  const circleEl = thermalCursor.querySelector('.thermal-circle');
  if (circleEl) {
    circleEl.style.backgroundColor = `hsla(${hue}, 100%, 50%, 0.4)`;
    circleEl.style.borderColor = `hsla(${hue}, 100%, 75%, 1)`;
    circleEl.style.boxShadow = `0 0 ${glow}px ${glow / 2}px hsla(${hue}, 100%, 50%, 0.7)`;
    circleEl.style.transform = `scale(${scale})`;
  }

  // Update tooltip text and styles matching proximity color
  const tooltipEl = document.getElementById('thermal-tooltip');
  if (tooltipEl) {
    let statusKey = 'thermal_freezing';
    if (distanceKm < 500) {
      statusKey = 'thermal_boiling';
    } else if (distanceKm < 1500) {
      statusKey = 'thermal_hot';
    } else if (distanceKm < 3000) {
      statusKey = 'thermal_warm';
    } else if (distanceKm < 5000) {
      statusKey = 'thermal_cool';
    } else if (distanceKm < 8000) {
      statusKey = 'thermal_cold';
    }
    tooltipEl.textContent = t(statusKey, currentLanguage);
    tooltipEl.style.color = `hsla(${hue}, 100%, 80%, 1)`;
    tooltipEl.style.textShadow = `0 0 6px hsla(${hue}, 100%, 50%, 0.7)`;
    tooltipEl.style.borderColor = `hsla(${hue}, 100%, 50%, 0.4)`;
  }
}

function onMapMouseMove(e) {
  if (!hint4Unlocked || !isRoundActive || !currentTarget) return;
  updateThermalProximity(e.latlng);
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
      const tooFarMsg = t('too_far_msg', currentLanguage);
      guessInstructionMsg.innerHTML = `<span class="accent-text text-glow-red font-numeric">${distanceKm.toLocaleString()} km</span> ${tooFarMsg}`;
      
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
  const mult = getSpeedMultiplier(elapsedTime);
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
  const prefix = t('target_prefix', currentLanguage);
  targetCityName.textContent = `${prefix}: ${currentTarget.name}`;

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
  const targetName = document.getElementById('summary-target-name');
  const distVal = document.getElementById('summary-distance-val');
  const scoreAcc = document.getElementById('summary-score-acc');
  const scoreSpeed = document.getElementById('summary-score-speed');
  const scoreTotal = document.getElementById('summary-score-total');
  const tipsBox = document.getElementById('summary-tips-box');
  const nextBtnText = document.getElementById('next-btn-text');

  if (targetName && currentTarget) {
    targetName.textContent = currentTarget.name;
  }

  if (isSuccess) {
    title.textContent = t('loc_secured', currentLanguage);
    title.style.color = "var(--accent-cyan)";
    subtitle.textContent = t('loc_secured_sub', currentLanguage);
  } else {
    title.textContent = t('mission_compromised', currentLanguage);
    title.style.color = "var(--accent-red)";
    subtitle.textContent = t('mission_compromised_sub', currentLanguage);
  }

  distVal.textContent = `${distanceKm.toLocaleString()} km`;
  scoreAcc.textContent = `+${accScore}`;
  scoreSpeed.textContent = `+${speedScore}`;
  scoreTotal.textContent = `+${roundTotal.toLocaleString()}`;

  // Smart tip generator
  let tipText = "";
  if (distanceKm <= 50) {
    tipText = t('tip_bullseye', currentLanguage).replace('${distanceKm}', distanceKm);
  } else if (distanceKm <= 200) {
    tipText = t('tip_superb', currentLanguage).replace('${distanceKm}', distanceKm);
  } else if (distanceKm <= 1000) {
    tipText = t('tip_confirmed', currentLanguage);
  } else {
    tipText = t('tip_failure', currentLanguage)
      .replace('${targetName}', currentTarget.name)
      .replace('${continent}', currentTarget.continent);
  }
  tipsBox.innerHTML = tipText;

  // Rename button on last round
  if (currentRoundIndex === totalRounds - 1) {
    nextBtnText.textContent = t('view_final_results', currentLanguage);
  } else {
    nextBtnText.textContent = t('next_location', currentLanguage);
  }

  // Load and show location images dynamically
  const imagesContainer = document.querySelector('.summary-images-container');
  if (imagesContainer && summaryImages) {
    imagesContainer.style.display = 'flex';
    summaryImages.innerHTML = '';
    
    // Create 3 skeletons initially
    for (let i = 0; i < 3; i++) {
      const wrapper = document.createElement('div');
      wrapper.className = 'summary-image-wrapper';
      const skeleton = document.createElement('div');
      skeleton.className = 'image-skeleton';
      wrapper.appendChild(skeleton);
      summaryImages.appendChild(wrapper);
    }
    
    const englishName = currentRawLocation ? currentRawLocation.name : currentTarget.name;
    fetchLocationImages(englishName).then(urls => {
      if (!urls || urls.length === 0) {
        imagesContainer.style.display = 'none';
        return;
      }
      summaryImages.innerHTML = '';
      urls.forEach(url => {
        const wrapper = document.createElement('div');
        wrapper.className = 'summary-image-wrapper';
        wrapper.addEventListener('mouseenter', () => {
          if (synth && synth.playHover) synth.playHover();
        });
        wrapper.addEventListener('click', () => openLightbox(url));

        const skeleton = document.createElement('div');
        skeleton.className = 'image-skeleton';
        wrapper.appendChild(skeleton);

        const img = document.createElement('img');
        img.src = url;
        img.alt = englishName;
        img.onload = () => {
          img.classList.add('loaded');
          skeleton.remove();
        };
        img.onerror = () => {
          skeleton.remove();
        };

        wrapper.appendChild(img);
        summaryImages.appendChild(wrapper);
      });
    });
  }

  // Open modal overlay
  summaryOverlay.classList.remove('hidden');
}

async function fetchLocationImages(locationName) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(locationName)}&gsrnamespace=6&prop=imageinfo&iiprop=url&gsrlimit=30&format=json&origin=*`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'GeoClashGame/1.0 (https://github.com/Almantask/location-finder-game-hot; contact@example.com)'
      }
    });
    if (!res.ok) throw new Error('Network response was not ok');
    const data = await res.json();
    if (!data.query || !data.query.pages) {
      return [];
    }
    const pages = Object.values(data.query.pages);
    const images = [];
    const excludeKeywords = ['map', 'flag', 'coat of arms', 'wappen', 'carte', 'location', 'svg', 'logo', 'icon', 'diagram', 'plan', 'population', 'districts', 'locator', 'seal', 'coa', 'shield'];
    for (const page of pages) {
      if (page.imageinfo && page.imageinfo[0]) {
        const imgUrl = page.imageinfo[0].url;
        const title = page.title.toLowerCase();
        
        const ext = imgUrl.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
          const hasExclude = excludeKeywords.some(keyword => title.includes(keyword));
          if (!hasExclude) {
            images.push(imgUrl);
          }
        }
      }
    }
    return images.slice(0, 3);
  } catch (err) {
    console.error(`Error fetching images for ${locationName}:`, err);
    return [];
  }
}

function openLightbox(imgUrl) {
  if (synth && synth.playConfirm) synth.playConfirm();
  if (lightboxImg) lightboxImg.src = imgUrl;
  if (imageLightbox) imageLightbox.classList.remove('hidden');
}

function closeLightbox() {
  if (synth && synth.playConfirm) synth.playConfirm();
  if (imageLightbox) imageLightbox.classList.add('hidden');
  if (lightboxImg) lightboxImg.src = '';
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
  if (confirm(t('abort_confirm', currentLanguage))) {
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
  const name = playerNameInput.value.trim() || t('anonymous_agent', currentLanguage);
  synth.playConfirm();

  const avgDistance = Math.round(distancesList.reduce((a, b) => a + b, 0) / distancesList.length);
  const locale = currentLanguage === 'en' ? 'en-US' : 'lt-LT';
  const dateStr = new Date().toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' });

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
