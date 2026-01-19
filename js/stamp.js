// js/stamp.js

import { VisualTimer } from './visual-timer.js';
import { triggerConfetti } from './confetti.js';
import { loadNewTrack, playMusic } from './music.js';

// ==========================================
// KONFIGURATION & SOUNDS
// ==========================================

// Sanftes "Aufwecken" (Magic Chime statt Alarm)
const GENTLE_WAKE_URL = "https://www.soundjay.com/misc/sounds/magic-chime-02.mp3"; 

// Brown Noise für Fokus
const BROWN_NOISE_URL = "https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/1107084022&color=%2322c55e&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=true";

// ==========================================
// DOM ELEMENTE
// ==========================================

// Haupt-UI
const contentArea = document.getElementById('stamp-content');
const actionBtn = document.getElementById('stamp-action-btn');
const resetBtn = document.getElementById('stamp-reset-btn');
const phaseBadge = document.getElementById('stamp-phase-badge');
const phaseName = document.getElementById('stamp-phase-name');

// Timer Container (für Reparenting im Focus Mode)
const timerSvgWrapper = document.querySelector('#original-timer-container > div'); 
const originalTimerContainer = document.getElementById('original-timer-container');
const focusTimerTarget = document.getElementById('focus-timer-target');

// Focus Overlay
const focusOverlay = document.getElementById('focus-overlay');
const focusGoalDisplay = document.getElementById('focus-goal-display');
const focusStepDisplay = document.getElementById('focus-step-display');
const exitFocusBtn = document.getElementById('exit-focus-btn');

// System Modal
const sysModal = document.getElementById('system-modal');
const sysModalPanel = document.getElementById('system-modal-panel');
const sysTitle = document.getElementById('system-modal-title');
const sysMessage = document.getElementById('system-modal-message');
const sysActions = document.getElementById('system-modal-actions');

// Timer Komponenten
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
    // Timer initialisieren (Reagiert auf Drag-Events)
    visualTimer = new VisualTimer(timerSvg, timerFaceGroup, timerWedge, timerDisplay, (seconds) => {
        // Optional: Logik beim Ziehen
    });

    // Reset Button
    resetBtn.addEventListener('click', () => {
        showSystemModal("Zyklus neustarten?", "Möchtest du den aktuellen Prozess wirklich abbrechen?", true, () => {
            if(isFocusModeActive) exitFocusMode();
            loadStep(0);
        });
    });

    // Button Listener
    exitFocusBtn.addEventListener('click', exitFocusMode);
    actionBtn.addEventListener('click', handleActionClick);
    
    // Start bei Phase 0
    loadStep(0);
}

// ==========================================
// PHASEN-LOGIK (STATE MACHINE)
// ==========================================

function handleActionClick() {
    
    // --- PHASE 0: CHECK-IN -> TUNE ---
    if (currentStep === 0) {
        const slider = document.getElementById('overwhelm-slider');
        sessionData.overwhelm = slider.value;
        
        // Modal für Musik-Abfrage
        sysTitle.textContent = "Fokus Musik";
        sysMessage.textContent = "Soll 'Brown Noise' zur Konzentration gestartet werden?";
        sysActions.innerHTML = '';
        
        const noBtn = document.createElement('button');
        noBtn.className = "px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition uppercase tracking-wide";
        noBtn.textContent = "Nein";
        noBtn.onclick = () => { closeSystemModal(); loadStep(1); };
        
        const yesBtn = document.createElement('button');
        yesBtn.className = "px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs font-bold transition shadow-lg uppercase tracking-wide";
        yesBtn.textContent = "Ja, Starten";
        yesBtn.onclick = () => {
            closeSystemModal();
            loadNewTrack(BROWN_NOISE_URL);
            setTimeout(() => { playMusic(); }, 1500); // Warten bis Widget ready
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
        // 1. Setup Check
        const setupCheck = document.getElementById('setup-ready-check');
        if(!setupCheck.checked) {
            showSystemModal("System Start", "Du kannst erst starten, wenn alle Programme und Dateien geöffnet sind.\n\nBestätige dies mit der Checkbox.", false);
            return;
        }
        // 2. Atomic Step Check
        const atomicInput = document.getElementById('atomic-step-input');
        if(!atomicInput.value.trim()) { 
            showSystemModal("Schritt fehlt", "Definiere den allerersten, kleinen Handgriff.", false);
            return; 
        }
        sessionData.atomicStep = atomicInput.value.trim();
        loadStep(3);
    } 
    
    // --- PHASE 3: MOMENTUM -> ENDE (RESET) ---
    else if (currentStep === 3) { 
        if(isFocusModeActive) exitFocusMode();
        
        // Bridge speichern
        const bridgeInput = document.getElementById('bridge-input');
        if(bridgeInput && bridgeInput.value.trim() !== "") {
            localStorage.setItem('stamp_bridge_v2', bridgeInput.value.trim());
        }
        
        // Feiern
        triggerConfetti();
        new Audio('https://www.soundjay.com/buttons/sounds/button-3.mp3').play().catch(() => {});
        loadStep(0); 
    }
}

function loadStep(stepIndex) {
    currentStep = stepIndex;
    if (timerWatcherInterval) clearInterval(timerWatcherInterval);
    
    // Render Content
    if (stepIndex === 0) renderCheckIn();
    else if (stepIndex === 1) renderTune();
    else if (stepIndex === 2) renderAtomic();
    else if (stepIndex === 3) renderMomentum();
}

// ==========================================
// RENDER FUNKTIONEN (HTML INJECTION)
// ==========================================

function renderCheckIn() {
    updateHeader("CHECK-IN", "System Check", "bg-slate-700", "text-slate-300");
    actionBtn.textContent = "START";
    actionBtn.className = "bg-green-600 hover:bg-green-500 text-white text-xs font-bold py-2.5 px-8 rounded shadow-lg shadow-green-900/30 transition-all border-b-2 border-green-800 uppercase tracking-widest transform hover:-translate-y-0.5";
    visualTimer.setTime(0);

    contentArea.innerHTML = `
        <div class="space-y-6 text-center animate-fade-in">
            <div class="space-y-4">
                <label class="text-xs font-bold text-slate-300 uppercase tracking-wide block">
                    Gefühls-Barometer
                </label>
                <div class="px-2 pt-2 pb-6 relative">
                    <style>
                        #overwhelm-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 22px; height: 22px; border-radius: 50%; background: white; cursor: pointer; border: 3px solid #1e293b; box-shadow: 0 4px 6px rgba(0,0,0,0.3); margin-top: -9px; transition: transform 0.1s; }
                        #overwhelm-slider::-webkit-slider-thumb:hover { transform: scale(1.1); }
                        #overwhelm-slider::-webkit-slider-runnable-track { width: 100%; height: 6px; cursor: pointer; border-radius: 3px; }
                    </style>
                    <input type="range" id="overwhelm-slider" min="0" max="100" value="50" step="0.1"
                        class="w-full h-2 rounded-full appearance-none cursor-pointer outline-none focus:ring-2 focus:ring-blue-500"
                        style="background: linear-gradient(to right, #22c55e, #eab308, #ef4444);">
                    <div class="flex justify-between text-[10px] text-slate-400 font-bold px-1 mt-3 absolute w-full left-0 -bottom-1 uppercase tracking-wider">
                        <span class="text-green-500">Klar</span><span class="text-red-500">Überfordert</span>
                    </div>
                </div>
            </div>
            
            <div class="p-4 bg-slate-700/30 border border-slate-600/50 rounded-xl">
                <p class="text-slate-200 text-xs font-bold uppercase tracking-wide mb-2 flex justify-center items-center gap-2">
                    <span class="text-xl">⚡️</span> Physischer Reset
                </p>
                <p class="text-[11px] text-slate-400 leading-relaxed">
                    Atme tief ein. Zieh die Schultern hoch.<br>
                    Ball die Fäuste. <b>Halten...</b><br>
                    Und locker lassen.
                </p>
            </div>
        </div>
    `;
}

function renderTune() {
    updateHeader("TUNE", "Ziel definieren", "bg-blue-600", "text-white");
    actionBtn.textContent = "WEITER";
    actionBtn.className = "bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2.5 px-8 rounded shadow-lg shadow-blue-900/30 transition-all border-b-2 border-blue-800 uppercase tracking-widest";

    contentArea.innerHTML = `
        <div class="space-y-4 animate-fade-in">
            <div class="bg-blue-900/20 border border-blue-800/50 p-4 rounded-xl space-y-3">
                <p class="text-xs font-bold text-blue-400 border-b border-blue-800/50 pb-2 uppercase tracking-wide">Die M.V.P. Formel</p>
                <ul class="text-[11px] text-slate-300 space-y-2">
                    <li class="flex gap-3"><span class="font-bold text-blue-400 bg-blue-900/40 w-5 h-5 flex items-center justify-center rounded text-[10px]">M</span> <span><b>Micro:</b> "5 Minuten"</span></li>
                    <li class="flex gap-3"><span class="font-bold text-blue-400 bg-blue-900/40 w-5 h-5 flex items-center justify-center rounded text-[10px]">V</span> <span><b>Verb:</b> "Tippen"</span></li>
                    <li class="flex gap-3"><span class="font-bold text-blue-400 bg-blue-900/40 w-5 h-5 flex items-center justify-center rounded text-[10px]">P</span> <span><b>Präzision:</b> "Datei XY"</span></li>
                </ul>
            </div>
            <div>
                <input type="text" id="session-goal-input" autocomplete="off" placeholder="Dein M.V.P. Ziel..." class="w-full bg-slate-700/50 text-white p-3.5 rounded-xl border border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none placeholder-slate-500 text-sm transition-all shadow-inner">
                <p class="text-[10px] text-slate-500 mt-2 text-center italic opacity-70">Bsp: "10 Min. (M) Stichpunkte tippen (V) in Konzept.docx (P)"</p>
            </div>
        </div>
    `;
    setTimeout(() => document.getElementById('session-goal-input').focus(), 50);
}

function renderAtomic() {
    updateHeader("ATOMIC", "Setup & Start", "bg-purple-600", "text-white");
    actionBtn.textContent = "STARTEN";
    actionBtn.className = "bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold py-2.5 px-8 rounded shadow-lg shadow-purple-900/30 transition-all border-b-2 border-purple-800 uppercase tracking-widest";

    const savedBridge = localStorage.getItem('stamp_bridge_v2') || "";
    
    contentArea.innerHTML = `
        <div class="space-y-5 animate-fade-in">
            <div class="p-3 bg-slate-700/40 border border-slate-600/80 rounded-xl transition-all hover:bg-slate-700/60">
                <label class="flex items-start gap-3 cursor-pointer group select-none">
                    <div class="relative flex items-center mt-0.5">
                        <input type="checkbox" id="setup-ready-check" class="peer h-5 w-5 cursor-pointer appearance-none rounded border border-slate-500 bg-slate-800 transition-all checked:border-green-500 checked:bg-green-500 checked:scale-110">
                        <svg class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none opacity-0 peer-checked:opacity-100 text-white transition-opacity duration-300" viewBox="0 0 14 14" fill="none"><path d="M3 8L6 11L11 3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </div>
                    <div class="flex-1">
                        <p class="text-xs font-bold text-white group-hover:text-green-400 transition-colors uppercase tracking-wide">System-Start Pflicht</p>
                        <p class="text-[11px] text-slate-400 leading-snug mt-1 transition-colors group-hover:text-slate-300">
                            Ich habe <b>jetzt</b> alle Programme und Tabs geöffnet. Alles liegt bereit.
                        </p>
                    </div>
                </label>
            </div>
            <div>
                <label class="text-[10px] uppercase font-bold text-purple-400 block mb-2 tracking-wide">Der allererste Schritt</label>
                <input type="text" id="atomic-step-input" value="${savedBridge}" autocomplete="off" placeholder="Winziger Handgriff (< 30 sek)..." class="w-full bg-slate-700/50 text-white p-3.5 rounded-xl border border-slate-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none text-sm transition-all shadow-inner">
                ${savedBridge ? '<p class="text-[10px] text-green-400 mt-2 flex items-center justify-center gap-1 opacity-80"><span class="text-xs">↺</span> Aus "The Bridge" übernommen</p>' : ''}
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
    updateHeader("MOMENTUM", "Deep Work", "bg-red-600", "text-white");
    actionBtn.textContent = "SESSION BEENDEN";
    actionBtn.className = "bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold py-2.5 px-8 rounded shadow-lg transition-all border-b-2 border-slate-900 uppercase tracking-widest";
    
    contentArea.innerHTML = `
        <div class="space-y-4 h-full flex flex-col animate-fade-in relative">
            <div class="bg-slate-700/30 p-4 rounded-xl border-l-4 border-blue-500 shadow-sm">
                <p class="text-[10px] uppercase text-slate-500 font-bold tracking-widest mb-1">Session Ziel</p>
                <p class="text-sm font-semibold text-white line-clamp-2 leading-relaxed tracking-tight">${sessionData.goal}</p>
            </div>
            <div class="bg-slate-700/30 p-4 rounded-xl border-l-4 border-purple-500 shadow-sm opacity-80 hover:opacity-100 transition-opacity">
                <p class="text-[10px] uppercase text-slate-500 font-bold tracking-widest mb-1">Erster Schritt</p>
                <p class="text-xs text-white line-clamp-1 font-mono">${sessionData.atomicStep}</p>
            </div>
            
            <div class="flex-grow flex items-center justify-center">
                <button id="activate-focus-btn" class="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 px-4 py-2 rounded-full text-xs font-bold text-slate-200 transition-all shadow-lg hover:scale-105 active:scale-95 group">
                    <div class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                    FOKUS MODUS
                </button>
            </div>

            <div class="mt-auto pt-4 border-t border-slate-700/30">
                <label class="text-[10px] uppercase font-bold text-green-400 block mb-2 tracking-wide">The Bridge (Für nächstes Mal)</label>
                <input type="text" id="bridge-input" autocomplete="off" placeholder="Nächster logischer Schritt / Notiz..." class="w-full bg-slate-900/50 text-slate-300 p-3 rounded-xl border border-slate-700 focus:border-green-500 focus:ring-1 focus:ring-green-500/30 outline-none text-xs transition-all shadow-inner">
            </div>
        </div>
    `;

    document.getElementById('activate-focus-btn').addEventListener('click', enterFocusMode);

    startTimerWatcher();
}

// ==========================================
// TIMER WATCHER & SOUND LOGIC
// ==========================================

function startTimerWatcher() {
    if (timerWatcherInterval) clearInterval(timerWatcherInterval);
    
    timerWatcherInterval = setInterval(() => {
        let seconds = visualTimer.totalSeconds;

        if (seconds > 0) {
            visualTimer.setTime(seconds - 1);
            
            // WENN TIMER ABLÄUFT (0 Sekunden)
            if (visualTimer.totalSeconds === 0) {
                 // 1. Sanfter Ton abspielen
                 const gentleAudio = new Audio(GENTLE_WAKE_URL);
                 gentleAudio.volume = 0.5; // Leise, 50% Volume für sanftes Aufwecken
                 gentleAudio.play().catch(() => {});
                 
                 // 2. Focus Mode beenden, falls aktiv
                 if(isFocusModeActive) exitFocusMode();

                 // 3. Hinweis anzeigen
                 showSystemModal("Zeit abgelaufen", "Die Meditation ist vorbei.\n\nFülle 'The Bridge' aus, um den nächsten Start vorzubereiten.", false);
                 
                 // 4. Fokus auf Bridge Input
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
    
    focusTimerTarget.appendChild(timerSvgWrapper); // SVG verschieben
    
    focusOverlay.classList.remove('hidden');
    setTimeout(() => { focusOverlay.classList.remove('opacity-0'); }, 10);
}

function exitFocusMode() {
    isFocusModeActive = false;
    focusOverlay.classList.add('opacity-0');
    
    setTimeout(() => {
        focusOverlay.classList.add('hidden');
        // SVG zurückschieben
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
        cancelBtn.className = "px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition uppercase tracking-wide";
        cancelBtn.textContent = "Abbrechen";
        cancelBtn.onclick = closeSystemModal;
        sysActions.appendChild(cancelBtn);

        const okBtn = document.createElement('button');
        okBtn.className = "px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition shadow-lg uppercase tracking-wide";
        okBtn.textContent = "Bestätigen";
        okBtn.onclick = () => {
            closeSystemModal();
            if(onConfirm) onConfirm();
        };
        sysActions.appendChild(okBtn);
    } else {
        const okBtn = document.createElement('button');
        okBtn.className = "px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-bold transition uppercase tracking-wide";
        okBtn.textContent = "Verstanden";
        okBtn.onclick = closeSystemModal;
        sysActions.appendChild(okBtn);
    }
    openSystemModal();
}

function openSystemModal() {
    sysModal.classList.remove('hidden');
    requestAnimationFrame(() => {
        sysModal.classList.remove('opacity-0');
        sysModalPanel.classList.remove('scale-95');
        sysModalPanel.classList.add('scale-100');
    });
}

function closeSystemModal() {
    sysModal.classList.add('opacity-0');
    sysModalPanel.classList.remove('scale-100');
    sysModalPanel.classList.add('scale-95');
    setTimeout(() => { sysModal.classList.add('hidden'); }, 200);
}

function updateHeader(badgeText, titleText, badgeColorClass, titleColorClass) {
    phaseBadge.textContent = badgeText;
    phaseBadge.className = `px-2 py-0.5 rounded text-[10px] font-bold border border-white/10 shadow-sm transition-colors duration-500 ${badgeColorClass} text-white uppercase tracking-wider`;
    phaseName.textContent = titleText;
    phaseName.className = `text-sm font-semibold transition-colors duration-500 ${titleColorClass} tracking-tight`;
}