// js/stamp.js

import { VisualTimer } from './visual-timer.js';
import { triggerConfetti } from './confetti.js';

// DOM Elements
const contentArea = document.getElementById('stamp-content');
const actionBtn = document.getElementById('stamp-action-btn');
const resetBtn = document.getElementById('stamp-reset-btn');
const phaseBadge = document.getElementById('stamp-phase-badge');
const phaseName = document.getElementById('stamp-phase-name');

// Timer Components (für VisualTimer Instanz)
const timerSvg = document.getElementById('visual-timer-svg');
const timerFaceGroup = document.getElementById('timer-face-group');
const timerWedge = document.getElementById('timer-wedge');
const timerDisplay = document.getElementById('timer-display-digital');

// State
let currentStep = 0; // 0=CheckIn, 1=Tune, 2=Atomic, 3=Momentum
let visualTimer = null;
let timerWatcherInterval = null;

// Session Data (temporärer Speicher für den aktuellen Zyklus)
let sessionData = {
    feeling: 3,
    goal: "",
    atomicStep: ""
};

/**
 * Initialisiert das S.T.A.M.P. System.
 */
export function initStamp() {
    // 1. Visual Timer initialisieren
    // Der Callback wird gefeuert, wenn der User den Timer manuell verstellt.
    visualTimer = new VisualTimer(timerSvg, timerFaceGroup, timerWedge, timerDisplay, (seconds) => {
        // Hier könnte man Logik einfügen, wenn der Timer verstellt wird.
        // Aktuell passiert das rein visuell in visual-timer.js.
    });

    // 2. Button Listener
    resetBtn.addEventListener('click', () => {
        if(confirm("Zyklus wirklich abbrechen und neu starten?")) {
            loadStep(0);
        }
    });

    actionBtn.addEventListener('click', handleActionClick);

    // 3. Starten mit Phase 0
    loadStep(0);
}

/**
 * Steuert den Übergang zur nächsten Phase basierend auf dem aktuellen Schritt.
 */
function handleActionClick() {
    
    // --- PHASE 0: CHECK-IN -> TUNE ---
    if (currentStep === 0) {
        const slider = document.getElementById('feeling-slider');
        sessionData.feeling = slider.value;
        loadStep(1);
    } 
    
    // --- PHASE 1: TUNE -> ATOMIC ---
    else if (currentStep === 1) { 
        const goalInput = document.getElementById('session-goal-input');
        if(!goalInput.value.trim()) { 
            alert("Bitte definiere ein Ziel für diese Session."); 
            goalInput.focus();
            return; 
        }
        
        // Prüfen ob Checkboxen abgehakt sind (optional, aber psychologisch wichtig)
        // Wir erzwingen es nicht technisch, aber das UI fordert dazu auf.
        
        sessionData.goal = goalInput.value.trim();
        loadStep(2);
    } 
    
    // --- PHASE 2: ATOMIC -> MOMENTUM ---
    else if (currentStep === 2) { 
        const atomicInput = document.getElementById('atomic-step-input');
        if(!atomicInput.value.trim()) { 
            alert("Bitte den allerersten, winzigen Schritt definieren."); 
            atomicInput.focus();
            return; 
        }
        sessionData.atomicStep = atomicInput.value.trim();
        loadStep(3);
    } 
    
    // --- PHASE 3: MOMENTUM -> ENDE (NEUSTART) ---
    else if (currentStep === 3) { 
        // Bridge speichern (für den nächsten Zyklus)
        const bridgeInput = document.getElementById('bridge-input');
        if(bridgeInput && bridgeInput.value.trim() !== "") {
            localStorage.setItem('stamp_bridge_v2', bridgeInput.value.trim());
        }
        
        // Erfolg feiern
        triggerConfetti();
        new Audio('https://www.soundjay.com/buttons/sounds/button-3.mp3').play().catch(() => {}); // Optionaler Sound
        
        // Neustart
        loadStep(0); 
    }
}

/**
 * Lädt das UI und die Logik für den angegebenen Schritt.
 */
function loadStep(stepIndex) {
    currentStep = stepIndex;
    
    // Timer-Überwachung stoppen (falls aktiv)
    if (timerWatcherInterval) clearInterval(timerWatcherInterval);
    
    // UI rendern
    if (stepIndex === 0) renderCheckIn();
    else if (stepIndex === 1) renderTune();
    else if (stepIndex === 2) renderAtomic();
    else if (stepIndex === 3) renderMomentum();
}

// ==========================================
// RENDER FUNKTIONEN
// ==========================================

function renderCheckIn() {
    updateHeader("CHECK-IN", "System Check", "bg-slate-700", "text-slate-300");
    actionBtn.textContent = "BEREIT MACHEN";
    actionBtn.className = "bg-slate-600 hover:bg-slate-500 text-white text-xs font-bold py-2 px-6 rounded shadow-lg transition-all border-b-2 border-slate-800";
    
    // Timer resetten
    visualTimer.setTime(0);

    contentArea.innerHTML = `
        <div class="space-y-6 text-center animate-fade-in">
            <div class="space-y-3">
                <label class="text-xs font-bold text-slate-400 uppercase tracking-wide block">Wie fühlst du dich? (1-5)</label>
                <div class="px-2">
                    <input type="range" id="feeling-slider" min="1" max="5" value="3" class="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500">
                </div>
                <div class="flex justify-between text-[10px] text-slate-500 font-medium px-1">
                    <span>Müde / Brainfog</span>
                    <span>Klar / Fokus</span>
                </div>
            </div>
            
            <div class="p-4 bg-blue-900/20 border border-blue-800/50 rounded-lg">
                <p class="text-blue-300 text-sm font-bold mb-1">⚡️ Physische Aktivierung</p>
                <p class="text-xs text-slate-400 leading-relaxed">
                    Atme tief ein. Spanne kurz <b>alle Muskeln</b> an.<br>
                    Halten... und locker lassen.
                </p>
            </div>
        </div>
    `;
}

function renderTune() {
    updateHeader("TUNE", "Ziel & Umfeld", "bg-blue-600", "text-white");
    actionBtn.textContent = "WEITER ZU ATOMIC";
    actionBtn.className = "bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 px-6 rounded shadow-lg transition-all border-b-2 border-blue-800";

    // Inspiration
    const examples = ["E-Mail Entwurf an X schreiben", "Bugfix im Header", "Recherche für Projekt Y", "Meeting-Notizen sortieren"];
    const randomEx = examples[Math.floor(Math.random() * examples.length)];

    contentArea.innerHTML = `
        <div class="space-y-5 animate-fade-in">
            <div>
                <label class="text-xs uppercase font-bold text-blue-400 block mb-2">1. Session Ziel (M.V.P.)</label>
                <input type="text" id="session-goal-input" autocomplete="off" placeholder="Was willst du in dieser Session erreichen?" class="w-full bg-slate-700/50 text-white p-3 rounded border border-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none placeholder-slate-500 text-sm transition-all">
                <p class="text-[10px] text-slate-500 mt-1.5 italic">Bsp: "${randomEx}"</p>
            </div>

            <div class="bg-slate-900/30 p-3 rounded border border-slate-700/50 space-y-2.5">
                <p class="text-xs font-bold text-slate-300 mb-2 border-b border-slate-700/50 pb-1">2. Umgebung sichern</p>
                <label class="flex items-center gap-3 cursor-pointer group hover:bg-slate-800/50 p-1 rounded transition">
                    <input type="checkbox" class="w-4 h-4 rounded bg-slate-700 border-slate-600 checked:bg-blue-500 focus:ring-0">
                    <span class="text-xs text-slate-400 group-hover:text-slate-200 transition">Handy außer Sichtweite / Stumm</span>
                </label>
                <label class="flex items-center gap-3 cursor-pointer group hover:bg-slate-800/50 p-1 rounded transition">
                    <input type="checkbox" class="w-4 h-4 rounded bg-slate-700 border-slate-600 checked:bg-blue-500 focus:ring-0">
                    <span class="text-xs text-slate-400 group-hover:text-slate-200 transition">Unnötige Browser-Tabs schließen</span>
                </label>
            </div>
        </div>
    `;
    
    // Fokus auf Input
    setTimeout(() => document.getElementById('session-goal-input').focus(), 50);
}

function renderAtomic() {
    updateHeader("ATOMIC", "Setup & Start", "bg-purple-600", "text-white");
    actionBtn.textContent = "ALLES BEREIT -> FLOW";
    actionBtn.className = "bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold py-2 px-6 rounded shadow-lg transition-all border-b-2 border-purple-800";

    // Bridge aus LocalStorage laden
    const savedBridge = localStorage.getItem('stamp_bridge_v2') || "";
    
    contentArea.innerHTML = `
        <div class="space-y-5 animate-fade-in">
            <div class="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded flex gap-3 items-start">
                <div class="text-lg mt-0.5">📂</div>
                <div>
                    <p class="text-xs font-bold text-yellow-500 mb-1">Erst alles öffnen!</p>
                    <p class="text-[11px] text-slate-400 leading-snug">
                        Bevor du startest: Öffne <b>jetzt</b> alle benötigten Programme, Dateien und Webseiten. Lege dir alles zurecht.
                    </p>
                </div>
            </div>

            <div>
                <label class="text-xs uppercase font-bold text-purple-400 block mb-2">Der allererste Schritt</label>
                <input type="text" id="atomic-step-input" value="${savedBridge}" autocomplete="off" placeholder="Erster, lächerlich kleiner Handgriff..." class="w-full bg-slate-700/50 text-white p-3 rounded border border-slate-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none text-sm transition-all">
                ${savedBridge ? '<p class="text-[10px] text-green-400 mt-1.5 flex items-center gap-1"><span class="text-xs">↺</span> Aus "The Bridge" übernommen</p>' : '<p class="text-[10px] text-slate-500 mt-1.5">Bsp: "Dokument öffnen", "Dateiname tippen"</p>'}
            </div>
        </div>
    `;
    
    if(!savedBridge) {
        setTimeout(() => document.getElementById('atomic-step-input').focus(), 50);
    }
}

function renderMomentum() {
    updateHeader("MOMENTUM", "Deep Work", "bg-red-600", "text-white");
    actionBtn.textContent = "SESSION BEENDEN";
    actionBtn.className = "bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold py-2 px-6 rounded shadow-lg transition-all border-b-2 border-slate-900";
    
    contentArea.innerHTML = `
        <div class="space-y-4 h-full flex flex-col animate-fade-in">
            <div class="bg-slate-700/30 p-3 rounded border-l-4 border-blue-500 shadow-sm">
                <p class="text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-0.5">Session Ziel</p>
                <p class="text-sm font-medium text-white line-clamp-2 leading-snug">${sessionData.goal}</p>
            </div>
            
            <div class="bg-slate-700/30 p-3 rounded border-l-4 border-purple-500 shadow-sm opacity-80">
                <p class="text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-0.5">Erster Schritt</p>
                <p class="text-xs text-white line-clamp-1">${sessionData.atomicStep}</p>
            </div>

            <div class="flex-grow flex items-center justify-center py-2">
                <p class="text-xs text-slate-500 text-center font-mono animate-pulse" id="timer-status-text">
                    &larr; Stelle den Timer links manuell
                </p>
            </div>

            <div class="mt-auto pt-2 border-t border-slate-700/30">
                <label class="text-[10px] uppercase font-bold text-green-400 block mb-1.5">The Bridge (Für nächstes Mal)</label>
                <input type="text" id="bridge-input" autocomplete="off" placeholder="Nächster logischer Schritt / Notiz..." class="w-full bg-slate-900/50 text-slate-300 p-2.5 rounded border border-slate-700 focus:border-green-500 outline-none text-xs transition-colors">
            </div>
        </div>
    `;

    // Timer Überwachung starten (damit wir Sounds abspielen können, wenn er abläuft)
    startTimerWatcher();
}

/**
 * Überwacht den Visual Timer jede Sekunde, um ihn runterzuzählen und Sounds abzuspielen.
 * Der Visual Timer selbst hat keine interne "Tick"-Logik, die von außen gesteuert wird, 
 * aber wir nutzen setTime() um die Visualisierung zu aktualisieren.
 */
function startTimerWatcher() {
    if (timerWatcherInterval) clearInterval(timerWatcherInterval);
    
    const statusText = document.getElementById('timer-status-text');
    
    timerWatcherInterval = setInterval(() => {
        // Zugriff auf die aktuelle Zeit im Timer-Objekt
        let seconds = visualTimer.totalSeconds;

        if (seconds > 0) {
            // Eine Sekunde abziehen
            visualTimer.setTime(seconds - 1);
            
            // Status Text Update
            if(statusText) {
                statusText.textContent = "Fokus aktiv... Viel Erfolg!";
                statusText.classList.remove('text-red-500', 'font-bold');
                statusText.classList.add('text-green-500');
            }
            
            // Ablauf-Logik (wenn genau 0 erreicht wird)
            if (visualTimer.totalSeconds === 0) {
                 new Audio('https://www.soundjay.com/buttons/sounds/beep-07.mp3').play().catch(() => {});
                 
                 if(statusText) {
                     statusText.textContent = "ZEIT ABGELAUFEN. BRIDGE AUSFÜLLEN!";
                     statusText.classList.remove('text-green-500', 'text-slate-500');
                     statusText.classList.add('text-red-500', 'font-bold');
                 }
                 
                 // Fokus auf Bridge Input lenken
                 const bridgeInput = document.getElementById('bridge-input');
                 if(bridgeInput) bridgeInput.focus();
            }
        } else {
             // Wenn Timer auf 0 steht (und nicht gerade abgelaufen ist)
             if(statusText && statusText.textContent !== "ZEIT ABGELAUFEN. BRIDGE AUSFÜLLEN!") {
                 statusText.textContent = "Timer stellen um zu starten ->";
                 statusText.classList.remove('text-green-500', 'text-red-500');
                 statusText.classList.add('text-slate-500');
             }
        }
    }, 1000);
}

/**
 * Hilfsfunktion zum Aktualisieren der Header-Leiste
 */
function updateHeader(badgeText, titleText, badgeColorClass, titleColorClass) {
    phaseBadge.textContent = badgeText;
    // Reset classes
    phaseBadge.className = `px-2 py-0.5 rounded text-[10px] font-bold border border-white/10 shadow-sm transition-colors duration-300 ${badgeColorClass} text-white`;
    
    phaseName.textContent = titleText;
    phaseName.className = `text-sm font-semibold transition-colors duration-300 ${titleColorClass}`;
}