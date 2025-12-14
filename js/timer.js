// Pomodoro Timer Elemente
const timerDisplay = document.getElementById('timer');
const customTimeInput = document.getElementById('custom-time-input');
const startPauseBtn = document.getElementById('start-pause-btn');
const resetBtn = document.getElementById('reset-btn');
const progressCircle = document.getElementById('progress-circle');
const openSetTimeBtn = document.getElementById('open-set-time-btn');
const mainControls = document.getElementById('main-controls');
const timeSetControls = document.getElementById('time-set-controls');
const confirmSetTimeBtn = document.getElementById('confirm-set-time-btn');
const cancelSetTimeBtn = document.getElementById('cancel-set-time-btn');
const timerModeDisplay = document.getElementById('timer-mode'); 

// Music Modal Elemente
const musicModal = document.getElementById('music-modal');
const musicYesBtn = document.getElementById('music-yes-btn');
const musicNoBtn = document.getElementById('music-no-btn');

// Timer State
const radius = progressCircle.r.baseVal.value;
const circumference = radius * 2 * Math.PI;
progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;

let countdown;
let timeLeft;
let timerState = 'stopped';
let initialDuration = 45 * 60;
let activeTaskTimerId = null; // Stores ID of the task that started the current timer

// 90 Minute Cycle Tracker Elemente
const cycleProgressBar = document.getElementById('cycle-progress-bar');
const cycleProgressText = document.getElementById('cycle-progress-text');
const cycleModal = document.getElementById('cycle-modal');
const closeCycleModalBtn = document.getElementById('close-cycle-modal-btn');
const resetCycleBtn = document.getElementById('reset-cycle-btn'); 
const cycleDuration = 90 * 60;
let cycleTimeAccumulated = 0;
const cycleStorageKey = 'focusCycleTime';

// Music Modal State
let pendingTaskDuration = null;
let pendingTaskId = null;


/** Lädt den gespeicherten Zyklus-Zustand aus dem Local Storage. */
function loadCycleState() {
    const savedTime = localStorage.getItem(cycleStorageKey);
    cycleTimeAccumulated = savedTime ? parseInt(savedTime, 10) : 0;
    updateCycleProgress();
}

/** Speichert den aktuellen Zyklus-Zustand. */
function saveCycleState() {
    localStorage.setItem(cycleStorageKey, cycleTimeAccumulated);
}

/** Zeigt das Zyklus-Ende-Modal an. */
function showCycleModal() {
    cycleModal.classList.remove('hidden');
    cycleModal.style.opacity = '0'; 
    cycleModal.querySelector('.card').style.transform = 'scale(0.95)';
    setTimeout(() => { 
        cycleModal.style.opacity = '1';
        cycleModal.querySelector('.card').style.transform = 'scale(1)';
    }, 10);
}

/** Aktualisiert die Zyklus-Fortschrittsanzeige. */
function updateCycleProgress() {
    const percentageRaw = cycleDuration > 0 ? (cycleTimeAccumulated / cycleDuration) * 100 : 0;
    const percentage = Math.min(percentageRaw, 100); 
    cycleProgressBar.style.width = `${percentage}%`;
    cycleProgressText.textContent = `${Math.floor(cycleTimeAccumulated / 60)}/90 Min.`;
}

/** * Setzt den Fortschrittskreis-Offset.
 * @param {number} percent - Fortschritt in Prozent (0-100).
 */
function setProgress(percent) {
    const offset = circumference - percent / 100 * circumference;
    progressCircle.style.strokeDashoffset = offset;
}

/**
 * Aktualisiert die Zeitanzeige und den Fortschrittskreis.
 * @param {number} seconds - Verbleibende Sekunden.
 */
function updateDisplay(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    timerDisplay.textContent = `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    document.title = `${timerDisplay.textContent} - Fokus Dashboard`;
    const progress = initialDuration > 0 ? ((initialDuration - seconds) / initialDuration) * 100 : 0;
    setProgress(progress);
}

/** Startet den Timer. */
function startTimer() {
    if (timeLeft <= 0) return;
    if (timerState === 'running') clearInterval(countdown);
    
    timerState = 'running';
    startPauseBtn.textContent = 'Pause';
    timerModeDisplay.textContent = 'Fokus'; 
    const then = Date.now() + timeLeft * 1000;
    countdown = setInterval(() => {
        const secondsLeft = Math.round((then - Date.now()) / 1000);
        
        // Zyklus-Zeiterfassung (nur im Fokus-Modus)
        if(timerState === 'running' && timerModeDisplay.textContent === 'Fokus') { 
            cycleTimeAccumulated++;
            updateCycleProgress();
            saveCycleState();
        }
        
        if (secondsLeft < 0) {
            clearInterval(countdown);
            handleTimerEnd();
            return;
        }
        timeLeft = secondsLeft;
        updateDisplay(timeLeft);
    }, 1000);
}

/** Pausiert den Timer. */
function pauseTimer() {
    clearInterval(countdown);
    timerState = 'paused';
    startPauseBtn.textContent = 'Weiter';
}

/** Setzt den Timer zurück. */
function resetTimer() {
    clearInterval(countdown);
    timerState = 'stopped';
    startPauseBtn.textContent = 'Start';
    timeLeft = initialDuration;
    updateDisplay(timeLeft);
    timerModeDisplay.textContent = 'Fokus'; 
    // Setzt den aktiven Task-Tracker zurück
    activeTaskTimerId = null;
}

/** Behandelt das Ende des Timers (Countdown ist 0). */
function handleTimerEnd() {
    new Audio('https://www.soundjay.com/buttons/sounds/button-16.mp3').play();
    
    // Automatische Aufgabenprüfung über die Funktion in checklist.js
    if (activeTaskTimerId && window.handleTaskAutoCheck) {
        window.handleTaskAutoCheck(activeTaskTimerId);
    }

    if (cycleTimeAccumulated >= cycleDuration) { showCycleModal(); }
    resetTimer();
}


// --- MUSIC MODAL LOGIC ---

/**
 * Zeigt das Musik-Modal an, um den Benutzer zu fragen.
 * @param {string} taskId - ID des Tasks, der den Timer gestartet hat.
 * @param {number} duration - Dauer in Minuten.
 */
function askToStartMusic(taskId, duration) {
    pendingTaskId = taskId;
    pendingTaskDuration = duration;
    
    musicModal.classList.remove('hidden');
    musicModal.style.opacity = '0';
    musicModal.querySelector('.card').style.transform = 'scale(0.95)';
    setTimeout(() => { 
        musicModal.style.opacity = '1';
        musicModal.querySelector('.card').style.transform = 'scale(1)';
    }, 10);
}

/** Schließt das Musik-Modal. */
function closeMusicModal() {
    musicModal.style.opacity = '0';
    musicModal.querySelector('.card').style.transform = 'scale(0.95)';
    setTimeout(() => { musicModal.classList.add('hidden'); }, 300);
}

/**
 * Startet den Timer basierend auf einem Task.
 * @param {number} minutes - Dauer in Minuten.
 * @param {string} taskId - ID des Tasks.
 * @param {boolean} playMusic - Ob Musik abgespielt werden soll.
 */
function startTaskTimer(minutes, taskId, playMusic) {
    if(!minutes || minutes <= 0) return;
    
    // Visual feedback
    const wrapper = document.getElementById('timer-display-wrapper');
    wrapper.style.transform = 'scale(1.1)';
    setTimeout(() => wrapper.style.transform = 'scale(1)', 200);

    initialDuration = minutes * 60;
    
    resetTimer(); // Erst Reset
    
    activeTaskTimerId = taskId; // Dann ID neu setzen
    
    startTimer(); 
    
    // Abhängigkeit vom Music Player: Muss global verfügbar sein
    if (playMusic && window.scWidget) {
        window.scWidget.play();
    }
}


// --- EVENT LISTENERS FÜR TIMER & MODAL ---
startPauseBtn.addEventListener('click', () => {
    if (timerState === 'running') { pauseTimer(); } else { startTimer(); }
});

resetBtn.addEventListener('click', resetTimer);

function showTimeInput() {
    mainControls.classList.add('hidden');
    timeSetControls.classList.remove('hidden');
    customTimeInput.value = Math.floor(initialDuration / 60);
    customTimeInput.focus();
}

function hideTimeInput() {
    timeSetControls.classList.add('hidden');
    mainControls.classList.remove('hidden');
}

openSetTimeBtn.addEventListener('click', () => {
    if (timerState !== 'stopped') { pauseTimer(); }
    showTimeInput();
});

cancelSetTimeBtn.addEventListener('click', hideTimeInput);

confirmSetTimeBtn.addEventListener('click', () => {
    const newTime = parseInt(customTimeInput.value, 10);
    if (!isNaN(newTime) && newTime > 0) {
        initialDuration = newTime * 60;
        resetTimer();
    }
    hideTimeInput();
});

customTimeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') confirmSetTimeBtn.click();
    if (e.key === 'Escape') cancelSetTimeBtn.click();
});

// Modal Listeners
musicYesBtn.addEventListener('click', () => {
    closeMusicModal();
    startTaskTimer(pendingTaskDuration, pendingTaskId, true);
});

musicNoBtn.addEventListener('click', () => {
    closeMusicModal();
    startTaskTimer(pendingTaskDuration, pendingTaskId, false);
});

closeCycleModalBtn.addEventListener('click', () => {
    cycleModal.style.opacity = '0';
    cycleModal.querySelector('.card').style.transform = 'scale(0.95)';
    setTimeout(() => { cycleModal.classList.add('hidden'); }, 300)
    cycleTimeAccumulated = 0;
    saveCycleState();
    updateCycleProgress();
});

resetCycleBtn.addEventListener('click', () => {
    cycleTimeAccumulated = 0;
    saveCycleState();
    updateCycleProgress();
});


// Funktionen und Variablen im globalen Scope bereitstellen
window.loadCycleState = loadCycleState;
window.resetTimer = resetTimer;
window.startTimer = startTimer;
window.pauseTimer = pauseTimer;
window.timerState = timerState; // Muss für musicPlayer.js verfügbar sein
window.askToStartMusic = askToStartMusic;
window.startTaskTimer = startTaskTimer;