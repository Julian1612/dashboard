// js/timer.js

import { playMusic, pauseMusic } from './music.js';
import { handleTaskCompletion } from './checklist.js';

// DOM-Elemente
const timerDisplay = document.getElementById('timer');
const customTimeInput = document.getElementById('custom-time-input');
const startPauseBtn = document.getElementById('start-pause-btn');
const progressCircle = document.getElementById('progress-circle');
const mainControls = document.getElementById('main-controls');
const timeSetControls = document.getElementById('time-set-controls');
const timerModeDisplay = document.getElementById('timer-mode'); 
const musicModal = document.getElementById('music-modal');
const cycleProgressBar = document.getElementById('cycle-progress-bar');
const cycleProgressText = document.getElementById('cycle-progress-text');
const cycleModal = document.getElementById('cycle-modal');
const closeCycleModalBtn = document.getElementById('close-cycle-modal-btn');
const resetCycleBtn = document.getElementById('reset-cycle-btn'); 

// Timer-Zustand
const radius = progressCircle ? progressCircle.r.baseVal.value : 52;
const circumference = radius * 2 * Math.PI;
if (progressCircle) progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;

let countdown;
let timeLeft;
let timerState = 'stopped';
let initialDuration = 45 * 60; // 45 Minuten in Sekunden
let activeTaskTimerId = null; 

// Zyklus-Tracker-Zustand
const cycleDuration = 90 * 60; // 90 Minuten in Sekunden
let cycleTimeAccumulated = 0;
const cycleStorageKey = 'focusCycleTime';

// --- ZYKLUS LOGIK ---
export function loadCycleState() {
    const savedTime = localStorage.getItem(cycleStorageKey);
    cycleTimeAccumulated = savedTime ? parseInt(savedTime, 10) : 0;
    updateCycleProgress();
}

function saveCycleState() {
    localStorage.setItem(cycleStorageKey, cycleTimeAccumulated);
}

function showCycleModal() {
    cycleModal.classList.remove('hidden');
    cycleModal.style.opacity = '0'; 
    cycleModal.querySelector('.card').style.transform = 'scale(0.95)';
    setTimeout(() => { 
        cycleModal.style.opacity = '1';
        cycleModal.querySelector('.card').style.transform = 'scale(1)';
    }, 10);
}

function updateCycleProgress() {
    const percentageRaw = cycleDuration > 0 ? (cycleTimeAccumulated / cycleDuration) * 100 : 0;
    const percentage = Math.min(percentageRaw, 100); 
    if (cycleProgressBar) cycleProgressBar.style.width = `${percentage}%`;
    if (cycleProgressText) cycleProgressText.textContent = `${Math.floor(cycleTimeAccumulated / 60)}/90 Min.`;
}

// --- TIMER LOGIK ---

function setProgress(percent) {
    const offset = circumference - percent / 100 * circumference;
    if (progressCircle) progressCircle.style.strokeDashoffset = offset;
}

function updateDisplay(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const timeString = `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    if (timerDisplay) timerDisplay.textContent = timeString;
    document.title = `${timeString} - Fokus Dashboard`;
    const progress = initialDuration > 0 ? ((initialDuration - seconds) / initialDuration) * 100 : 0;
    setProgress(progress);
}

function startTimer() {
    if (timeLeft <= 0) return;
    if (timerState === 'running') clearInterval(countdown);
    
    timerState = 'running';
    if (startPauseBtn) startPauseBtn.textContent = 'Pause';
    if (timerModeDisplay) timerModeDisplay.textContent = 'Fokus'; 
    
    const then = Date.now() + timeLeft * 1000;
    countdown = setInterval(() => {
        const secondsLeft = Math.round((then - Date.now()) / 1000);
        
        // Zyklus-Update
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

function pauseTimer() {
    clearInterval(countdown);
    timerState = 'paused';
    if (startPauseBtn) startPauseBtn.textContent = 'Weiter';
    pauseMusic();
}

function resetTimer() {
    clearInterval(countdown);
    timerState = 'stopped';
    if (startPauseBtn) startPauseBtn.textContent = 'Start';
    timeLeft = initialDuration;
    updateDisplay(timeLeft);
    if (timerModeDisplay) timerModeDisplay.textContent = 'Fokus'; 
    activeTaskTimerId = null;
    pauseMusic();
}

function handleTimerEnd() {
    new Audio('https://www.soundjay.com/buttons/sounds/button-16.mp3').play();
    
    // Automatisch Task abhaken über Checklist Modul
    if (activeTaskTimerId) {
        handleTaskCompletion(activeTaskTimerId);
        activeTaskTimerId = null;
    }

    if (cycleTimeAccumulated >= cycleDuration) { showCycleModal(); }
    resetTimer();
}

// --- MUSIC MODAL LOGIK (Interaktion mit Timer) ---

let pendingTaskDuration = null;
let pendingTaskId = null;

/**
 * Fragt den Nutzer, ob die Musik gestartet werden soll.
 * @param {string | null} taskId - Die ID der Task, die den Timer gestartet hat.
 * @param {number} duration - Die Dauer in Minuten.
 */
export function askToStartMusic(taskId, duration) {
    // Wenn der Timer läuft und es kein Task-Start ist, einfach pausieren.
    if (timerState === 'running') { 
        pauseTimer();
        return;
    }
    
    // Wenn der Timer gestoppt ist und es keine Task-Duration gibt, starten (z.B. Haupt-Button)
    if (timerState === 'stopped' && !duration) {
        // Starte den Timer mit initialDuration (z.B. 45 min)
        pendingTaskId = null;
        pendingTaskDuration = initialDuration / 60; // Nutze die aktuelle Zeit
    } else {
        // Starte Timer für Task
        pendingTaskId = taskId;
        pendingTaskDuration = duration;
    }
    
    if(!pendingTaskDuration || pendingTaskDuration <= 0) return;

    musicModal.classList.remove('hidden');
    musicModal.style.opacity = '0';
    musicModal.querySelector('.card').style.transform = 'scale(0.95)';
    setTimeout(() => { 
        musicModal.style.opacity = '1';
        musicModal.querySelector('.card').style.transform = 'scale(1)';
    }, 10);
}

function closeMusicModal() {
    musicModal.style.opacity = '0';
    musicModal.querySelector('.card').style.transform = 'scale(0.95)';
    setTimeout(() => { musicModal.classList.add('hidden'); }, 300);
}

/**
 * Startet den Timer mit der angegebenen Dauer und optionaler Musik.
 * @param {number} minutes - Die Dauer in Minuten.
 * @param {string | null} taskId - Die ID der Task.
 * @param {boolean} playMusic - Ob Musik gestartet werden soll.
 */
export function startTaskTimer(minutes, taskId, playMusic) {
    if(!minutes || minutes <= 0) return;
    
    const wrapper = document.getElementById('timer-display-wrapper');
    if (wrapper) {
        wrapper.style.transform = 'scale(1.1)';
        setTimeout(() => wrapper.style.transform = 'scale(1)', 200);
    }

    initialDuration = minutes * 60;
    resetTimer(); 
    activeTaskTimerId = taskId; 
    startTimer(); 
    
    if (playMusic) {
        playMusic();
    }
}

function handleStartPauseClick() {
    if (timerState === 'running') {
        pauseTimer();
    } else if (timerState === 'paused') {
        startTimer();
    } else {
        // Bei Start immer Musik fragen (mit der aktuellen initialDuration)
        askToStartMusic(null, initialDuration / 60);
    }
}

// --- SETUP LISTENER ---

export function setupTimerListeners() {
    // Timer Controls
    startPauseBtn.addEventListener('click', handleStartPauseClick);
    document.getElementById('reset-btn').addEventListener('click', resetTimer);
    
    // Set Time Controls
    document.getElementById('open-set-time-btn').addEventListener('click', () => {
        if (timerState !== 'stopped') { resetTimer(); }
        mainControls.classList.add('hidden');
        timeSetControls.classList.remove('hidden');
        customTimeInput.value = Math.floor(initialDuration / 60);
        customTimeInput.focus();
    });

    document.getElementById('cancel-set-time-btn').addEventListener('click', () => {
        timeSetControls.classList.add('hidden');
        mainControls.classList.remove('hidden');
    });

    document.getElementById('confirm-set-time-btn').addEventListener('click', () => {
        const newTime = parseInt(customTimeInput.value, 10);
        if (!isNaN(newTime) && newTime > 0) {
            initialDuration = newTime * 60;
            resetTimer();
        }
        timeSetControls.classList.add('hidden');
        mainControls.classList.remove('hidden');
    });

    document.getElementById('custom-time-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') document.getElementById('confirm-set-time-btn').click();
        if (e.key === 'Escape') document.getElementById('cancel-set-time-btn').click();
    });
    
    // Cycle Controls
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
    
    // Music Modal Controls
    document.getElementById('music-yes-btn').addEventListener('click', () => {
        closeMusicModal();
        startTaskTimer(pendingTaskDuration, pendingTaskId, true);
    });

    document.getElementById('music-no-btn').addEventListener('click', () => {
        closeMusicModal();
        startTaskTimer(pendingTaskDuration, pendingTaskId, false);
    });
    
    // Initial-Reset
    resetTimer();
}