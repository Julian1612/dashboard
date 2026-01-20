// js/stamp.js

import { VisualTimer } from './visual-timer.js';
import { triggerConfetti } from './confetti.js';
import { loadNewTrack, playMusic, isMusicPlaying, getCurrentTrackSrc } from './music.js';

// ==========================================
// KONFIGURATION & SOUNDS
// ==========================================

const GENTLE_WAKE_URL = "https://cdn.pixabay.com/audio/2021/08/04/audio_3d3c760630.mp3"; 
const BROWN_NOISE_URL = "https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/1107084022&color=%2322c55e&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=true";

// Fibonacci Stufen & Strategien
const FIB_LEVELS = [
    { val: 1, title: "Trivial", duration: 60, tip: "Du fühlst dich fit und die Aufgabe ist klar? Nutze das Momentum für 60 Min. Deep Work.", color: "text-teal-400" },
    { val: 2, title: "Einfach", duration: 45, tip: "Routine-Aufgabe mit wenig Widerstand? 45 Min. sind ideal für stetigen Fortschritt.", color: "text-teal-300" },
    { val: 3, title: "Machbar", duration: 30, tip: "Standard-Aufgabe, aber der Anfang fällt schwer? Ein 30 Min. Sprint hilft dir rein.", color: "text-blue-300" },
    { val: 5, title: "Anspruchsvoll", duration: 20, tip: "Respekt vor der Aufgabe? Salami-Taktik: Wir machen nur 20 Min. für den ersten Teil.", color: "text-yellow-300" },
    { val: 8, title: "Komplex", duration: 15, tip: "Perfektionismus blockiert dich? Egal wie schlecht: Schreibe 15 Min. eine 'Grobe Rohfassung'.", color: "text-orange-300" },
    { val: 13, title: "Schwer", duration: 10, tip: "Der Berg wirkt riesig? Blende das Gesamtziel aus. Nur 10 Min. Start-Impuls suchen.", color: "text-red-300" },
    { val: 21, title: "Blockade", duration: 10, tip: "Warum hängst du? Nutze 10 Min. nur zur Analyse: Was genau verstehst du nicht? Wo liegt das Problem?", color: "text-red-500" }
];

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
    complexity: 3, 
    recommendedTime: 30,
    goal: "",
    atomicStep: ""
};

// ==========================================
// ADAPTIVE TEXT LOGIK (STRICT MVP + SMART SUPPORT)
// ==========================================

function getAdaptiveTuneConfig() {
    const comp = sessionData.complexity;
    let config = {
        placeholder: "Dein M.V.P. Ziel...",
        example: "",
        mvp: { m: "", v: "", p: "" }
    };

    if (comp === 1) { // Trivial
        config.example = "\"60 Min. (M) kompletten Bericht (P) durchformatieren (V)\"";
        config.mvp = { 
            m: "<b>Micro-Menge:</b> Großzügig (60 Min) ist okay.", 
            v: "<b>Aktiv-Verb:</b> Physisches Tun (Tippen, Klicken).", 
            p: "<b>Präzision:</b> Das ganze Dokument." 
        };
    } else if (comp === 2) { // Einfach
        config.example = "\"45 Min. (M) alle Mails im Eingang (P) beantworten (V)\"";
        config.mvp = { 
            m: "<b>Micro-Menge:</b> Ein fester Zeitblock (45 Min).", 
            v: "<b>Aktiv-Verb:</b> Abarbeiten / Senden.", 
            p: "<b>Präzision:</b> Posteingang (Inbox)." 
        };
    } else if (comp === 3) { // Machbar
        config.example = "\"30 Min. (M) 3 Kern-Argumente (P) skizzieren (V)\"";
        config.mvp = { 
            m: "<b>Micro-Menge:</b> Begrenzte Anzahl (3 Stück).", 
            v: "<b>Aktiv-Verb:</b> Skizzieren / Notieren.", 
            p: "<b>Präzision:</b> Auf Notizblock / Seite 1." 
        };
    } else if (comp === 5) { // Anspruchsvoll
        config.example = "\"20 Min. (M) nur die Gliederung (P) runterschreiben (V)\"";
        config.mvp = { 
            m: "<b>Micro-Menge:</b> Nur ein Teilstück (Gliederung).", 
            v: "<b>Aktiv-Verb:</b> Schreiben (nicht 'überlegen').", 
            p: "<b>Präzision:</b> Leeres Word-Dokument." 
        };
    } else if (comp === 8) { // Komplex
        config.example = "\"15 Min. (M) schmutzige Rohfassung (P) tippen (V)\"";
        config.mvp = { 
            m: "<b>Micro-Menge:</b> Zeitdruck erzeugen (15 Min).", 
            v: "<b>Aktiv-Verb:</b> Tippen (Qualität egal).", 
            p: "<b>Präzision:</b> Ein 'Trash-Draft' Dokument." 
        };
    } else if (comp === 13) { // Schwer
        config.example = "\"10 Min. (M) alle Quellen-PDFs (P) zusammensuchen (V)\"";
        config.mvp = { 
            m: "<b>Micro-Menge:</b> Lächerliches Minimum (Vorbereitung).", 
            v: "<b>Aktiv-Verb:</b> Suchen / Speichern / Öffnen.", 
            p: "<b>Präzision:</b> Ein Desktop-Ordner." 
        };
    } else if (comp >= 21) { // Blockade
        config.example = "\"10 Min. (M) meine konkrete Blockade (P) aufschreiben (V)\"";
        config.mvp = { 
            m: "<b>Micro-Menge:</b> 1 einziger Gedanke / Satz.", 
            v: "<b>Aktiv-Verb:</b> Aufschreiben (nicht 'grübeln').", 
            p: "<b>Präzision:</b> Ein Zettel / Post-It." 
        };
    }
    return config;
}

function getAdaptiveAtomicConfig() {
    const comp = sessionData.complexity;
    if (comp >= 21) {
        return {
            label: "Der Knotenlöser",
            placeholder: "Eine Frage aufschreiben / Begriff googeln..."
        };
    } else if (comp >= 13) {
        return {
            label: "Die Hürde senken",
            placeholder: "Z.B. 'Dokument öffnen' (Lächerlich klein)..."
        };
    } else {
        return {
            label: "Der allererste Schritt",
            placeholder: "Winziger Handgriff (< 30 sek)..."
        };
    }
}

function getAdaptiveMomentumTitle() {
    const comp = sessionData.complexity;
    if (comp >= 21) return "Problem-Analyse";
    if (comp >= 13) return "Micro-Sprint"; 
    if (comp >= 5) return "Fokus Session";
    return "Deep Work"; 
}

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
        const slider = document.getElementById('fib-slider');
        const index = parseInt(slider.value);
        
        const selectedLevel = FIB_LEVELS[index];
        sessionData.complexity = selectedLevel.val;
        sessionData.recommendedTime = selectedLevel.duration; 
        
        const currentSrc = getCurrentTrackSrc();
        const isBrownNoise = currentSrc && currentSrc.includes("1107084022");
        
        if (isMusicPlaying() && isBrownNoise) {
             loadStep(1);
             return;
        }
        
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
// RENDER FUNKTIONEN
// ==========================================

function renderCheckIn() {
    updateHeader("CHECK-IN", "Komplexitäts-Check");
    actionBtn.textContent = "START";
    actionBtn.className = "bg-teal-700 hover:bg-teal-600 text-teal-50 text-xs font-bold py-3 px-8 rounded-lg shadow-lg shadow-teal-900/20 transition-all transform active:scale-95 border border-teal-600/50 uppercase tracking-widest";
    
    visualTimer.setTime(0);

    contentArea.innerHTML = `
        <div class="flex flex-col h-full justify-center animate-fade-in">
            <div class="space-y-4">
                <div class="flex justify-between items-end px-1">
                    <label class="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">Wie schwer fühlt es sich an?</label>
                    <span id="fib-display" class="text-2xl font-light text-teal-400 font-mono">3</span>
                </div>
                
                <div class="px-1 relative pb-2">
                    <style>
                        #fib-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 18px; height: 18px; border-radius: 50%; background: #0f172a; cursor: pointer; border: 2px solid #2dd4bf; box-shadow: 0 0 10px rgba(45, 212, 191, 0.4); margin-top: -7px; transition: transform 0.2s; }
                        #fib-slider::-webkit-slider-thumb:hover { transform: scale(1.2); background: #2dd4bf; }
                        #fib-slider::-webkit-slider-runnable-track { width: 100%; height: 4px; cursor: pointer; border-radius: 2px; background: #334155; }
                    </style>
                    <input type="range" id="fib-slider" min="0" max="6" value="2" step="1" class="w-full h-1 bg-slate-800 rounded-full appearance-none cursor-pointer outline-none">
                    
                    <div id="fib-labels" class="flex justify-between text-sm font-bold text-slate-300 mt-4 px-1 select-none">
                        <span data-idx="0" class="cursor-pointer hover:text-teal-400 transition w-6 text-center">1</span>
                        <span data-idx="1" class="cursor-pointer hover:text-teal-400 transition w-6 text-center">2</span>
                        <span data-idx="2" class="cursor-pointer hover:text-teal-400 transition w-6 text-center">3</span>
                        <span data-idx="3" class="cursor-pointer hover:text-teal-400 transition w-6 text-center">5</span>
                        <span data-idx="4" class="cursor-pointer hover:text-teal-400 transition w-6 text-center">8</span>
                        <span data-idx="5" class="cursor-pointer hover:text-teal-400 transition w-6 text-center">13</span>
                        <span data-idx="6" class="cursor-pointer hover:text-teal-400 transition w-6 text-center">21</span>
                    </div>
                </div>
            </div>
            
            <div class="mt-5 p-4 bg-slate-950/40 border border-slate-800/50 rounded-xl transition-all duration-300" id="fib-strategy-card">
                <div class="flex items-center gap-2 mb-2">
                    <span class="text-sm">💡</span>
                    <span id="fib-title" class="text-[10px] font-bold text-teal-300 uppercase tracking-widest">Routine</span>
                </div>
                <p id="fib-tip" class="text-xs text-slate-300 leading-relaxed font-light">
                    Musik an. Timer stellen. Wegarbeiten.
                </p>
            </div>
        </div>
    `;

    setTimeout(() => {
        const slider = document.getElementById('fib-slider');
        const display = document.getElementById('fib-display');
        const title = document.getElementById('fib-title');
        const tip = document.getElementById('fib-tip');
        const labels = document.querySelectorAll('#fib-labels span');
        
        const updateUI = (idx) => {
            const level = FIB_LEVELS[idx];
            display.textContent = level.val;
            title.textContent = level.title;
            title.className = `text-[10px] font-bold uppercase tracking-widest transition-colors duration-300 ${level.color}`;
            tip.textContent = level.tip;
            
            labels.forEach(l => l.classList.remove('text-teal-400', 'scale-125'));
            labels[idx].classList.add('text-teal-400', 'scale-125');
        };

        // Initial
        updateUI(slider.value);

        slider.addEventListener('input', (e) => updateUI(e.target.value));

        labels.forEach(span => {
            span.addEventListener('click', () => {
                const idx = span.dataset.idx;
                slider.value = idx;
                updateUI(idx);
            });
        });
    }, 0);
}

function renderTune() {
    updateHeader("TUNE", "Ziel definieren");
    actionBtn.textContent = "WEITER";
    actionBtn.className = "bg-teal-700 hover:bg-teal-600 text-teal-50 text-xs font-bold py-3 px-8 rounded-lg shadow-lg shadow-teal-900/20 transition-all transform active:scale-95 border border-teal-600/50 uppercase tracking-widest";

    const config = getAdaptiveTuneConfig();

    contentArea.innerHTML = `
        <div class="flex flex-col h-full overflow-hidden animate-fade-in justify-between py-1">
            <div class="bg-slate-950/30 border border-slate-800/50 p-3 rounded-xl space-y-3 flex-shrink-0">
                <p class="text-[9px] font-bold text-teal-500 border-b border-slate-800/50 pb-1.5 uppercase tracking-widest">Die M.V.P. Formel</p>
                
                <p class="text-sm font-medium text-teal-100/90 leading-snug bg-teal-900/10 p-2 rounded border-l-2 border-teal-500/50 italic">
                    ${config.example}
                </p>

                <ul class="text-[10px] text-slate-400 space-y-1.5 font-light">
                    <li class="flex gap-2.5 items-start"><span class="font-bold text-teal-400 bg-teal-900/20 w-4 h-4 flex flex-none items-center justify-center rounded text-[8px] mt-0.5">M</span> <span class="leading-tight">${config.mvp.m}</span></li>
                    <li class="flex gap-2.5 items-start"><span class="font-bold text-teal-400 bg-teal-900/20 w-4 h-4 flex flex-none items-center justify-center rounded text-[8px] mt-0.5">V</span> <span class="leading-tight">${config.mvp.v}</span></li>
                    <li class="flex gap-2.5 items-start"><span class="font-bold text-teal-400 bg-teal-900/20 w-4 h-4 flex flex-none items-center justify-center rounded text-[8px] mt-0.5">P</span> <span class="leading-tight">${config.mvp.p}</span></li>
                </ul>
            </div>
            
            <div class="flex-grow min-h-2"></div>

            <div class="flex-shrink-0">
                <input type="text" id="session-goal-input" autocomplete="off" placeholder="${config.placeholder}" 
                    class="w-full bg-slate-950 text-slate-200 p-3 rounded-lg border border-slate-800 focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 outline-none placeholder-slate-600 text-sm transition-all font-light shadow-inner">
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
    const config = getAdaptiveAtomicConfig();
    
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
                <label class="text-[9px] uppercase font-bold text-teal-500/80 block mb-2 tracking-[0.2em] ml-1">${config.label}</label>
                <input type="text" id="atomic-step-input" value="${savedBridge}" autocomplete="off" placeholder="${config.placeholder}" 
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
    updateHeader("MOMENTUM", getAdaptiveMomentumTitle());
    actionBtn.textContent = "BEENDEN";
    actionBtn.className = "bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold py-3 px-8 rounded-lg shadow-lg transition-all border border-slate-700 uppercase tracking-widest";
    
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
            
            <div class="flex-grow min-h-2"></div>

            <div class="pt-2 border-t border-slate-800/50 flex-shrink-0">
                <label class="text-[9px] uppercase font-bold text-teal-600 block mb-1 tracking-[0.2em]">The Bridge (Next Step)</label>
                <input type="text" id="bridge-input" autocomplete="off" placeholder="Nächster logischer Schritt / Notiz..." 
                    class="w-full bg-slate-950 text-slate-300 p-2 rounded-lg border border-slate-800 focus:border-teal-500/30 focus:ring-1 focus:ring-teal-500/10 outline-none text-xs transition-all shadow-inner font-light">
            </div>
        </div>
    `;

    leftActions.innerHTML = `
        <button id="activate-focus-btn" class="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 px-4 py-1.5 rounded-full text-[9px] font-bold text-slate-400 hover:text-teal-400 transition-all shadow-lg hover:scale-105 active:scale-95 group uppercase tracking-[0.15em] animate-fade-in">
            <div class="w-1.5 h-1.5 rounded-full bg-red-500 opacity-70 group-hover:opacity-100 transition-opacity"></div>
            Fokus Modus
        </button>
    `;
    document.getElementById('activate-focus-btn').addEventListener('click', enterFocusMode);

    if (sessionData.recommendedTime > 0) {
        visualTimer.setTime(sessionData.recommendedTime * 60);
    }

    startTimerWatcher();
}

function startTimerWatcher() {
    if (timerWatcherInterval) clearInterval(timerWatcherInterval);
    timerWatcherInterval = setInterval(() => {
        let seconds = visualTimer.totalSeconds;
        if (seconds > 0) {
            visualTimer.setTime(seconds - 1);
            if (visualTimer.totalSeconds === 0) {
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

function updateHeader(badgeText, titleText) {
    phaseBadge.textContent = badgeText;
    phaseBadge.className = `px-3 py-1 rounded-md text-[10px] font-bold bg-slate-800 text-teal-500 border border-slate-700/50 uppercase tracking-[0.15em] shadow-sm transition-colors duration-500`;
    phaseName.textContent = titleText;
    phaseName.className = `text-sm font-medium text-slate-300 tracking-wide transition-colors duration-500`;
}