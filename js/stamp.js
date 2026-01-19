// js/stamp.js

import { VisualTimer } from './visual-timer.js';
import { triggerConfetti } from './confetti.js';
import { loadNewTrack, playMusic } from './music.js';

// ==========================================
// KONFIGURATION & SOUNDS
// ==========================================

const GENTLE_WAKE_URL = "https://cdn.pixabay.com/audio/2021/08/04/audio_3d3c760630.mp3"; 
const BROWN_NOISE_URL = "https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/1107084022&color=%2322c55e&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=true";

// ==========================================
// DOM ELEMENTE
// ==========================================

const contentArea = document.getElementById('stamp-content');
const actionBtn = document.getElementById('stamp-action-btn');
const resetBtn = document.getElementById('stamp-reset-btn');
const phaseBadge = document.getElementById('stamp-phase-badge');
const phaseName = document.getElementById('stamp-phase-name');

const timerSvgWrapper = document.querySelector('#original-timer-container > div'); 
const originalTimerContainer = document.getElementById('original-timer-container');
const leftActions = document.getElementById('stamp-left-actions'); 
const focusTimerTarget = document.getElementById('focus-timer-target');

const focusOverlay = document.getElementById('focus-overlay');
const focusGoalDisplay = document.getElementById('focus-goal-display');
const focusStepDisplay = document.getElementById('focus-step-display');
const exitFocusBtn = document.getElementById('exit-focus-btn');

const sysModal = document.getElementById('system-modal');
const sysModalPanel = document.getElementById('system-modal-panel');
const sysTitle = document.getElementById('system-modal-title');
const sysMessage = document.getElementById('system-modal-message');
const sysActions = document.getElementById('system-modal-actions');

const timerSvg = document.getElementById('visual-timer-svg');
const timerFaceGroup = document.getElementById('timer-face-group');
const timerWedge = document.getElementById('timer-wedge');
const timerDisplay = document.getElementById('timer-display-digital');

// ==========================================
// STATE MANAGEMENT
// ==========================================

let currentStep = 0; 
let visualTimer = null;
let timerWatcherInterval = null;
let isFocusModeActive = false;

let sessionData = {
    overwhelm: 50,
    goal: "",
    atomicStep: ""
};

// ==========================================
// INIT & EVENT LISTENER
// ==========================================

export function initStamp() {
    visualTimer = new VisualTimer(timerSvg, timerFaceGroup, timerWedge, timerDisplay, (seconds) => {});

    resetBtn.addEventListener('click', () => {
        showSystemModal("Zyklus neustarten?", "Möchtest du den aktuellen Prozess wirklich abbrechen?", true, () => {
            if(isFocusModeActive) exitFocusMode();
            loadStep(0);
        });
    });

    exitFocusBtn.addEventListener('click', exitFocusMode);
    actionBtn.addEventListener('click', handleActionClick);
    
    loadStep(0);
}

// ==========================================
// PHASEN-LOGIK
// ==========================================

function handleActionClick() {
    
    // --- PHASE 0: CHECK-IN -> TUNE ---
    if (currentStep === 0) {
        const slider = document.getElementById('overwhelm-slider');
        sessionData.overwhelm = slider.value;
        
        sysTitle.textContent = "Fokus Musik";
        sysMessage.textContent = "Soll 'Brown Noise' zur Konzentration gestartet werden?";
        sysActions.innerHTML = '';
        
        const noBtn = document.createElement('button');
        noBtn.className = "px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-300 transition uppercase tracking-widest";
        noBtn.textContent = "Nein";
        noBtn.onclick = () => { closeSystemModal(); loadStep(1); };
        
        const yesBtn = document.createElement('button');
        yesBtn.className = "px-6 py-2 bg-teal-700 hover:bg-teal-600 text-white rounded-lg text-xs font-bold transition shadow-lg shadow-teal-900/20 uppercase tracking-widest border border-teal-600/50";
        yesBtn.textContent = "Ja, Starten";
        yesBtn.onclick = () => {
            closeSystemModal();
            loadNewTrack(BROWN_NOISE_URL);
            setTimeout(() => { playMusic(); }, 1500); 
            loadStep(1);
        };
        
        sysActions.appendChild(noBtn);
        sysActions.appendChild(yesBtn);
        openSystemModal();
    } 
    
    // --- PHASE 1: TUNE -> ATOMIC ---
    else if (currentStep === 1) { 
        const goalInput = document.getElementById('session-goal-input');
        if(!goalInput.value.trim()) { 
            showSystemModal("Ziel fehlt", "Bitte definiere ein Ziel für diese Session.", false);
            return; 
        }
        sessionData.goal = goalInput.value.trim();
        loadStep(2);
    } 
    
    // --- PHASE 2: ATOMIC -> MOMENTUM ---
    else if (currentStep === 2) { 
        const setupCheck = document.getElementById('setup-ready-check');
        if(!setupCheck.checked) {
            showSystemModal("System Start", "Du kannst erst starten, wenn alle Programme und Dateien geöffnet sind.\n\nBestätige dies mit der Checkbox.", false);
            return;
        }
        const atomicInput = document.getElementById('atomic-step-input');
        if(!atomicInput.value.trim()) { 
            showSystemModal("Schritt fehlt", "Definiere den allerersten, kleinen Handgriff.", false);
            return; 
        }
        sessionData.atomicStep = atomicInput.value.trim();
        loadStep(3);
    } 
    
    // --- PHASE 3: MOMENTUM -> ENDE ---
    else if (currentStep === 3) { 
        if(isFocusModeActive) exitFocusMode();
        const bridgeInput = document.getElementById('bridge-input');
        if(bridgeInput && bridgeInput.value.trim() !== "") {
            localStorage.setItem('stamp_bridge_v2', bridgeInput.value.trim());
        }
        triggerConfetti();
        new Audio('https://www.soundjay.com/buttons/sounds/button-3.mp3').play().catch(() => {});
        loadStep(0); 
    }
}

function loadStep(stepIndex) {
    currentStep = stepIndex;
    if (timerWatcherInterval) clearInterval(timerWatcherInterval);
    
    leftActions.innerHTML = ''; 
    
    if (stepIndex === 0) renderCheckIn();
    else if (stepIndex === 1) renderTune();
    else if (stepIndex === 2) renderAtomic();
    else if (stepIndex === 3) renderMomentum();
}

// ==========================================
// RENDER FUNKTIONEN (Optimiert & Kompakt)
// ==========================================

function renderCheckIn() {
    updateHeader("CHECK-IN", "System Check");
    actionBtn.textContent = "START";
    actionBtn.className = "bg-teal-700 hover:bg-teal-600 text-teal-50 text-xs font-bold py-3 px-8 rounded-lg shadow-lg shadow-teal-900/20 transition-all transform active:scale-95 border border-teal-600/50 uppercase tracking-widest";
    
    visualTimer.setTime(0);

    contentArea.innerHTML = `
        <div class="space-y-5 text-center animate-fade-in flex flex-col justify-center h-full">
            <div class="space-y-3">
                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] block">
                    Gefühls-Barometer
                </label>
                <div class="px-2 pt-1 pb-4 relative">
                    <style>
                        #overwhelm-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 16px; height: 16px; border-radius: 50%; background: #0f172a; cursor: pointer; border: 2px solid #5eead4; box-shadow: 0 0 8px rgba(94, 234, 212, 0.3); margin-top: -6px; transition: transform 0.2s; }
                        #overwhelm-slider::-webkit-slider-thumb:hover { transform: scale(1.2); background: #5eead4; }
                        #overwhelm-slider::-webkit-slider-runnable-track { width: 100%; height: 4px; cursor: pointer; border-radius: 2px; background: #334155; }
                    </style>
                    <input type="range" id="overwhelm-slider" min="0" max="100" value="50" step="0.1"
                        class="w-full h-1 bg-slate-800 rounded-full appearance-none cursor-pointer outline-none">
                    <div class="flex justify-between text-[9px] text-slate-500 font-bold px-1 mt-3 absolute w-full left-0 -bottom-1 uppercase tracking-widest">
                        <span>Klar</span><span>Überfordert</span>
                    </div>
                </div>
            </div>
            
            <div class="p-4 bg-slate-950/30 border border-slate-800/50 rounded-xl hover:border-slate-700/50 transition-colors">
                <p class="text-teal-500 text-[9px] font-bold uppercase tracking-widest mb-2 flex justify-center items-center gap-2">
                    <span class="text-sm">⚡️</span> Physischer Reset
                </p>
                <p class="text-[11px] text-slate-400 leading-relaxed font-light">
                    Atme tief ein. Zieh die Schultern hoch.<br>
                    Ball die Fäuste. <b class="text-slate-300">Halten...</b><br>
                    Und locker lassen.
                </p>
            </div>
        </div>
    `;
}

function renderTune() {
    updateHeader("TUNE", "Ziel definieren");
    actionBtn.textContent = "WEITER";
    actionBtn.className = "bg-teal-700 hover:bg-teal-600 text-teal-50 text-xs font-bold py-3 px-8 rounded-lg shadow-lg shadow-teal-900/20 transition-all transform active:scale-95 border border-teal-600/50 uppercase tracking-widest";

    contentArea.innerHTML = `
        <div class="space-y-4 animate-fade-in flex flex-col justify-center h-full">
            <div class="bg-slate-950/30 border border-slate-800/50 p-4 rounded-xl space-y-3">
                <p class="text-[9px] font-bold text-teal-500 border-b border-slate-800/50 pb-1.5 uppercase tracking-widest">Die M.V.P. Formel</p>
                <ul class="text-[11px] text-slate-400 space-y-2 font-light">
                    <li class="flex gap-3 items-baseline"><span class="font-bold text-teal-400 bg-teal-900/20 w-4 h-4 flex flex-none items-center justify-center rounded text-[9px]">M</span> <span><b>Micro:</b> "5 Minuten" statt "Alles"</span></li>
                    <li class="flex gap-3 items-baseline"><span class="font-bold text-teal-400 bg-teal-900/20 w-4 h-4 flex flex-none items-center justify-center rounded text-[9px]">V</span> <span><b>Verb:</b> "Tippen" statt "Lernen"</span></li>
                    <li class="flex gap-3 items-baseline"><span class="font-bold text-teal-400 bg-teal-900/20 w-4 h-4 flex flex-none items-center justify-center rounded text-[9px]">P</span> <span><b>Präzision:</b> "Datei XY" - Kein Suchen</span></li>
                </ul>
            </div>
            <div>
                <input type="text" id="session-goal-input" autocomplete="off" placeholder="Dein M.V.P. Ziel..." 
                    class="w-full bg-slate-950 text-slate-200 p-3 rounded-lg border border-slate-800 focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 outline-none placeholder-slate-600 text-sm transition-all font-light shadow-inner">
                <p class="text-[9px] text-slate-600 mt-1.5 text-center italic tracking-wide">Bsp: "10 Min. (M) Stichpunkte tippen (V) in Konzept.docx (P)"</p>
            </div>
        </div>
    `;
    setTimeout(() => document.getElementById('session-goal-input').focus(), 50);
}

function renderAtomic() {
    updateHeader("ATOMIC", "Setup & Start");
    actionBtn.textContent = "STARTEN";
    actionBtn.className = "bg-teal-700 hover:bg-teal-600 text-teal-50 text-xs font-bold py-3 px-8 rounded-lg shadow-lg shadow-teal-900/20 transition-all transform active:scale-95 border border-teal-600/50 uppercase tracking-widest";

    const savedBridge = localStorage.getItem('stamp_bridge_v2') || "";
    
    contentArea.innerHTML = `
        <div class="space-y-5 animate-fade-in flex flex-col justify-center h-full">
            <div class="p-3 bg-slate-950/30 border border-slate-800/50 rounded-xl transition-all hover:border-teal-900/30">
                <label class="flex items-start gap-3 cursor-pointer group select-none">
                    <div class="relative flex items-center mt-0.5">
                        <input type="checkbox" id="setup-ready-check" class="peer h-4 w-4 cursor-pointer appearance-none rounded border border-slate-600 bg-slate-900 transition-all checked:border-teal-500 checked:bg-teal-500">
                        <svg class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-0 peer-checked:opacity-100 text-white transition-opacity duration-300" viewBox="0 0 14 14" fill="none"><path d="M3 8L6 11L11 3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </div>
                    <div class="flex-1">
                        <p class="text-[11px] font-bold text-slate-300 group-hover:text-teal-400 transition-colors uppercase tracking-wide">System-Start Pflicht</p>
                        <p class="text-[10px] text-slate-500 leading-relaxed mt-0.5 font-light group-hover:text-slate-400 transition-colors">
                            Ich habe <b>jetzt</b> alle Programme und Tabs geöffnet. Alles liegt bereit.
                        </p>
                    </div>
                </label>
            </div>
            <div>
                <label class="text-[9px] uppercase font-bold text-teal-500/80 block mb-2 tracking-[0.2em] ml-1">Der allererste Schritt</label>
                <input type="text" id="atomic-step-input" value="${savedBridge}" autocomplete="off" placeholder="Winziger Handgriff (< 30 sek)..." 
                    class="w-full bg-slate-950 text-slate-200 p-3 rounded-lg border border-slate-800 focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 outline-none text-sm transition-all font-light shadow-inner">
                ${savedBridge ? '<p class="text-[9px] text-teal-600 mt-1.5 flex items-center justify-center gap-1 opacity-80"><span class="text-[10px]">↺</span> Aus "The Bridge" übernommen</p>' : ''}
            </div>
        </div>
    `;
    setTimeout(() => {
        const check = document.getElementById('setup-ready-check');
        check.addEventListener('change', (e) => { if(e.target.checked) new Audio('https://www.soundjay.com/buttons/sounds/button-17.mp3').play().catch(()=>{}); });
        if(!savedBridge) document.getElementById('atomic-step-input').focus();
    }, 50);
}

function renderMomentum() {
    updateHeader("MOMENTUM", "Deep Work");
    actionBtn.textContent = "BEENDEN";
    actionBtn.className = "bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold py-3 px-8 rounded-lg shadow-lg transition-all border border-slate-700 uppercase tracking-widest";
    
    // UI Inhalte (Rechts) - MASSIV GESTRAFFTES LAYOUT
    contentArea.innerHTML = `
        <div class="flex flex-col h-full overflow-hidden justify-between animate-fade-in">
            <div class="space-y-2 flex-shrink-0">
                <div class="bg-slate-950/30 p-2.5 rounded-lg border-l-2 border-teal-500 shadow-sm">
                    <p class="text-[9px] uppercase text-slate-500 font-bold tracking-[0.2em] mb-0.5">Session Ziel</p>
                    <p class="text-sm font-medium text-slate-200 line-clamp-2 leading-snug tracking-wide">${sessionData.goal}</p>
                </div>
                
                <div class="bg-slate-950/30 p-2.5 rounded-lg border-l-2 border-slate-700 shadow-sm opacity-70 hover:opacity-100 transition-opacity">
                    <p class="text-[9px] uppercase text-slate-500 font-bold tracking-[0.2em] mb-0.5">Start-Impuls</p>
                    <p class="text-xs text-slate-300 line-clamp-1 font-mono">${sessionData.atomicStep}</p>
                </div>
            </div>
            
            <div class="flex-grow min-h-2"></div> <div class="pt-2 border-t border-slate-800/50 flex-shrink-0">
                <label class="text-[9px] uppercase font-bold text-teal-600 block mb-1 tracking-[0.2em]">The Bridge (Next Step)</label>
                <input type="text" id="bridge-input" autocomplete="off" placeholder="Nächster logischer Schritt / Notiz..." 
                    class="w-full bg-slate-950 text-slate-300 p-2 rounded-lg border border-slate-800 focus:border-teal-500/30 focus:ring-1 focus:ring-teal-500/10 outline-none text-xs transition-all shadow-inner font-light">
            </div>
        </div>
    `;

    // Button links einfügen
    leftActions.innerHTML = `
        <button id="activate-focus-btn" class="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 px-4 py-1.5 rounded-full text-[9px] font-bold text-slate-400 hover:text-teal-400 transition-all shadow-lg hover:scale-105 active:scale-95 group uppercase tracking-[0.15em] animate-fade-in">
            <div class="w-1.5 h-1.5 rounded-full bg-red-500 opacity-70 group-hover:opacity-100 transition-opacity"></div>
            Fokus Modus
        </button>
    `;
    document.getElementById('activate-focus-btn').addEventListener('click', enterFocusMode);

    startTimerWatcher();
}

function startTimerWatcher() {
    if (timerWatcherInterval) clearInterval(timerWatcherInterval);
    timerWatcherInterval = setInterval(() => {
        let seconds = visualTimer.totalSeconds;
        if (seconds > 0) {
            visualTimer.setTime(seconds - 1);
            if (visualTimer.totalSeconds === 0) {
                 // GONG SOUND (Sanft)
                 const gong = new Audio(GENTLE_WAKE_URL);
                 gong.volume = 0.6; 
                 gong.play().catch(() => {});
                 
                 if(isFocusModeActive) exitFocusMode();
                 showSystemModal("Zeit abgelaufen", "Die Meditation ist vorbei.\n\nFülle 'The Bridge' aus, um den nächsten Start vorzubereiten.", false);
                 const bridgeInput = document.getElementById('bridge-input');
                 if(bridgeInput) bridgeInput.focus();
            }
        }
    }, 1000);
}

// ==========================================
// FOCUS MODE LOGIC
// ==========================================

function enterFocusMode() {
    if(!sessionData.goal) return;
    isFocusModeActive = true;
    focusGoalDisplay.textContent = sessionData.goal;
    focusStepDisplay.textContent = sessionData.atomicStep || "Fokus";
    
    focusTimerTarget.appendChild(timerSvgWrapper); 
    focusOverlay.classList.remove('hidden');
    setTimeout(() => { focusOverlay.classList.remove('opacity-0'); }, 10);
}

function exitFocusMode() {
    isFocusModeActive = false;
    focusOverlay.classList.add('opacity-0');
    
    setTimeout(() => {
        focusOverlay.classList.add('hidden');
        // SVG zurück in den linken Container schieben (VOR den Hint)
        const hint = document.getElementById('timer-hint-text');
        originalTimerContainer.insertBefore(timerSvgWrapper, hint);
    }, 500); 
}

// ==========================================
// SYSTEM MODAL HELPER
// ==========================================

function showSystemModal(title, message, isConfirm, onConfirm) {
    sysTitle.textContent = title;
    sysMessage.textContent = message;
    sysActions.innerHTML = '';
    if (isConfirm) {
        const cancelBtn = document.createElement('button');
        cancelBtn.className = "px-4 py-2 text-[10px] font-bold text-slate-500 hover:text-slate-300 transition uppercase tracking-widest";
        cancelBtn.textContent = "Abbrechen";
        cancelBtn.onclick = closeSystemModal;
        sysActions.appendChild(cancelBtn);
        const okBtn = document.createElement('button');
        okBtn.className = "px-6 py-2 bg-teal-700 hover:bg-teal-600 text-white rounded-lg text-[10px] font-bold transition shadow-lg uppercase tracking-widest border border-teal-600/50";
        okBtn.textContent = "Bestätigen";
        okBtn.onclick = () => { closeSystemModal(); if(onConfirm) onConfirm(); };
        sysActions.appendChild(okBtn);
    } else {
        const okBtn = document.createElement('button');
        okBtn.className = "px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-bold transition uppercase tracking-widest border border-slate-700";
        okBtn.textContent = "Verstanden";
        okBtn.onclick = closeSystemModal;
        sysActions.appendChild(okBtn);
    }
    openSystemModal();
}

function openSystemModal() {
    sysModal.classList.remove('hidden');
    requestAnimationFrame(() => { sysModal.classList.remove('opacity-0'); sysModalPanel.classList.remove('scale-95'); sysModalPanel.classList.add('scale-100'); });
}

function closeSystemModal() {
    sysModal.classList.add('opacity-0'); sysModalPanel.classList.remove('scale-100'); sysModalPanel.classList.add('scale-95');
    setTimeout(() => { sysModal.classList.add('hidden'); }, 200);
}

function updateHeader(badgeText, titleText, badgeColorClass, titleColorClass) {
    phaseBadge.textContent = badgeText;
    phaseBadge.className = `px-3 py-1 rounded-md text-[10px] font-bold bg-slate-800 text-teal-500 border border-slate-700/50 uppercase tracking-[0.15em] shadow-sm transition-colors duration-500`;
    phaseName.textContent = titleText;
    phaseName.className = `text-sm font-medium text-slate-300 tracking-wide transition-colors duration-500`;
}