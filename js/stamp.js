import { triggerConfetti } from './confetti.js';
import { playMusic } from './music.js';

const STAMP_CONFIG = {
    'S': { title: "Start: Die Zündung", text: "Dauer: 60 Sek. Ziel: Den Freeze motorisch durchbrechen. Gehe zum Platz, berühre dein Werkzeug. Kein Denken!", time: 1, color: "#ef4444" },
    'T': { title: "Tune: Setup", text: "Dauer: 5-7 Min. Bühne einrichten. Musik an. MVP formulieren. Du darfst noch nicht arbeiten!", time: 7, color: "#f59e0b", showMVP: true },
    'A': { title: "Atomic: Quick-Win", text: "Dauer: 10-15 Min. Der kleinste erste Schritt (< 30 Sek). Dokument öffnen? Hake es ab!", time: 15, color: "#10b981", showMVP: true },
    'M': { title: "Momentum: Flow", text: "Dauer: 50 Min. Deep Work. 5 Min. vor Ende: The Bridge (Mitten im Wort abbrechen!).", time: 50, color: "#3b82f6" },
    'P': { title: "Pause: Reset", text: "Dauer: 15 Min. Aktiver Cut! Raum verlassen. 5 Min. Fernsicht ohne Handy. Wasser trinken.", time: 15, color: "#8b5cf6" }
};

let currentPhaseIndex = 0;
const phases = ['S', 'T', 'A', 'M', 'P'];
let totalSeconds = 0;
let timerInterval = null;
let isDragging = false;

const wedge = document.getElementById('timer-wedge');
const svg = document.getElementById('stamp-timer-svg');
const timeDisplay = document.getElementById('stamp-time-display');
const phaseTitle = document.getElementById('phase-title');
const phaseText = document.getElementById('phase-text');
const mvpContainer = document.getElementById('mvp-container');
const nextBtn = document.getElementById('next-phase-btn');
const prevBtn = document.getElementById('prev-phase-btn');

export function initStamp() {
    updatePhaseUI();
    drawTicks();
    setupEventListeners();
}

function updatePhaseUI() {
    const config = STAMP_CONFIG[phases[currentPhaseIndex]];
    phaseTitle.textContent = config.title;
    phaseTitle.style.color = config.color;
    phaseText.textContent = config.text;
    mvpContainer.classList.toggle('hidden', !config.showMVP);
    wedge.setAttribute('fill', config.color);
    totalSeconds = config.time * 60;
    updateTimerVisuals();

    document.querySelectorAll('#phase-dots span').forEach((dot, idx) => {
        dot.style.backgroundColor = idx === currentPhaseIndex ? config.color : '#334155';
    });
    prevBtn.disabled = currentPhaseIndex === 0;
}

function updateTimerVisuals() {
    const maxSeconds = currentPhaseIndex === 0 ? 60 : 3600;
    const angle = (totalSeconds / maxSeconds) * 2 * Math.PI;
    const x = 50 + 48 * Math.sin(angle);
    const y = 50 - 48 * Math.cos(angle);
    const largeArc = angle > Math.PI ? 1 : 0;
    
    wedge.setAttribute('d', totalSeconds <= 0 ? 'M 50 50 L 50 2 A 48 48 0 0 1 50 2 Z' : `M 50 50 L 50 2 A 48 48 0 ${largeArc} 1 ${x} ${y} Z`);
    timeDisplay.textContent = `${Math.floor(totalSeconds / 60).toString().padStart(2, '0')}:${(totalSeconds % 60).toString().padStart(2, '0')}`;
}

function setupEventListeners() {
    nextBtn.onclick = () => {
        currentPhaseIndex = (currentPhaseIndex + 1) % phases.length;
        if (currentPhaseIndex === 0) triggerConfetti();
        stopTimer(); updatePhaseUI();
    };
    prevBtn.onclick = () => { if (currentPhaseIndex > 0) { currentPhaseIndex--; stopTimer(); updatePhaseUI(); }};
    document.getElementById('stamp-start-btn').onclick = toggleTimer;
    document.getElementById('stamp-reset-btn').onclick = () => { stopTimer(); updatePhaseUI(); };
    svg.onmousedown = (e) => { isDragging = true; setTimeFromEvent(e); };
    window.onmousemove = (e) => { if (isDragging) setTimeFromEvent(e); };
    window.onmouseup = () => isDragging = false;
}

function setTimeFromEvent(e) {
    if (timerInterval) return;
    const rect = svg.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    let angle = Math.atan2(dy, dx) + Math.PI / 2;
    if (angle < 0) angle += 2 * Math.PI;
    totalSeconds = Math.round((angle / (2 * Math.PI)) * (currentPhaseIndex === 0 ? 60 : 3600));
    updateTimerVisuals();
}

function toggleTimer() {
    if (timerInterval) { stopTimer(); } else {
        document.getElementById('stamp-start-btn').textContent = "PAUSE";
        timerInterval = setInterval(() => {
            totalSeconds--; updateTimerVisuals();
            if (totalSeconds <= 0) {
                stopTimer(); new Audio('https://www.soundjay.com/buttons/sounds/button-16.mp3').play();
                if (phases[currentPhaseIndex] === 'T') playMusic();
            }
        }, 1000);
    }
}

function stopTimer() { clearInterval(timerInterval); timerInterval = null; document.getElementById('stamp-start-btn').textContent = "START"; }

function drawTicks() {
    const group = document.getElementById('timer-ticks');
    for (let i = 0; i < 60; i++) {
        const angle = (i / 60) * 2 * Math.PI;
        const l = i % 5 === 0 ? 5 : 2;
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", 50 + 47 * Math.sin(angle)); line.setAttribute("y1", 50 - 47 * Math.cos(angle));
        line.setAttribute("x2", 50 + (47 - l) * Math.sin(angle)); line.setAttribute("y2", 50 - (47 - l) * Math.cos(angle));
        line.classList.add('timer-tick'); group.appendChild(line);
    }
}