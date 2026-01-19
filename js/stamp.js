// js/stamp.js

import { VisualTimer } from './visual-timer.js';
import { triggerConfetti } from './confetti.js';
import { loadNewTrack, playMusic } from './music.js';

// DOM Elements
const contentArea = document.getElementById('stamp-content');
const actionBtn = document.getElementById('stamp-action-btn');
const resetBtn = document.getElementById('stamp-reset-btn');
const phaseBadge = document.getElementById('stamp-phase-badge');
const phaseName = document.getElementById('stamp-phase-name');

// System Modal Elements
const sysModal = document.getElementById('system-modal');
const sysModalPanel = document.getElementById('system-modal-panel');
const sysTitle = document.getElementById('system-modal-title');
const sysMessage = document.getElementById('system-modal-message');
const sysActions = document.getElementById('system-modal-actions');

// Timer Components
const timerSvg = document.getElementById('visual-timer-svg');
const timerFaceGroup = document.getElementById('timer-face-group');
const timerWedge = document.getElementById('timer-wedge');
const timerDisplay = document.getElementById('timer-display-digital');

// Constants
const BROWN_NOISE_URL = "https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/1107084022&color=%2322c55e&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=true";

// State
let currentStep = 0; 
let visualTimer = null;
let timerWatcherInterval = null;

let sessionData = {
    overwhelm: 50,
    goal: "",
    atomicStep: ""
};

/**
 * Zeigt das System-Modal an (Alert oder Confirm Ersatz).
 * @param {string} title - Titel
 * @param {string} message - Nachricht
 * @param {boolean} isConfirm - Wenn true, werden "Abbrechen" und "OK" angezeigt.
 * @param {Function} onConfirm - Callback für OK.
 */
function showSystemModal(title, message, isConfirm, onConfirm) {
    sysTitle.textContent = title;
    sysMessage.textContent = message;
    sysActions.innerHTML = ''; // Reset Buttons

    if (isConfirm) {
        // Cancel Button
        const cancelBtn = document.createElement('button');
        cancelBtn.className = "px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition";
        cancelBtn.textContent = "Abbrechen";
        cancelBtn.onclick = closeSystemModal;
        sysActions.appendChild(cancelBtn);

        // Confirm Button
        const okBtn = document.createElement('button');
        okBtn.className = "px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold transition shadow-lg";
        okBtn.textContent = "Bestätigen";
        okBtn.onclick = () => {
            closeSystemModal();
            if(onConfirm) onConfirm();
        };
        sysActions.appendChild(okBtn);
    } else {
        // Simple Alert OK
        const okBtn = document.createElement('button');
        okBtn.className = "px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded text-xs font-bold transition";
        okBtn.textContent = "Verstanden";
        okBtn.onclick = closeSystemModal;
        sysActions.appendChild(okBtn);
    }

    sysModal.classList.remove('hidden');
    // Animation
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
    setTimeout(() => {
        sysModal.classList.add('hidden');
    }, 200);
}

export function initStamp() {
    visualTimer = new VisualTimer(timerSvg, timerFaceGroup, timerWedge, timerDisplay, (seconds) => {});

    resetBtn.addEventListener('click', () => {
        showSystemModal("Zyklus neustarten?", "Möchtest du den aktuellen Prozess wirklich abbrechen und von vorne beginnen?", true, () => {
            loadStep(0);
        });
    });

    actionBtn.addEventListener('click', handleActionClick);
    loadStep(0);
}

function handleActionClick() {
    
    // --- CHECK-IN ---
    if (currentStep === 0) {
        const slider = document.getElementById('overwhelm-slider');
        sessionData.overwhelm = slider.value;
        
        showSystemModal("Fokus Musik", "Möchtest du 'Brown Noise' zur Konzentration starten?", true, () => {
             loadNewTrack(BROWN_NOISE_URL);
             setTimeout(() => { playMusic(); }, 1500);
        });
        
        // Unabhängig von der Musik-Antwort zum nächsten Schritt (passiert sofort, Musik lädt im Hintergrund wenn bestätigt)
        // Aber da Modal async ist, müssen wir hier aufpassen.
        // Besser: Wir wechseln den Schritt im Modal-Callback?
        // Nein, das Modal unterbricht den Flow. Wir machen den Schrittwechsel erst, wenn das Modal weg ist.
        // Die obige showSystemModal ist für die Musik. Wir brauchen Logik für den Schrittwechsel.
        
        // Korrektur: Wir zeigen das Modal. Wenn "Bestätigen" -> Musik an + Next Step. Wenn "Abbrechen" -> Nur Next Step?
        // Das Standard-Modal schließt sich bei Abbrechen nur.
        
        // Wir brauchen eine spezielle Logik hierfür, da "Abbrechen" hier "Nein, keine Musik" bedeutet, aber trotzdem "Weiter".
        // Da meine Helper-Funktion `closeSystemModal` bei Cancel nur schließt, baue ich das manuell um:
        
        sysTitle.textContent = "Fokus Musik";
        sysMessage.textContent = "Möchtest du 'Brown Noise' zur Konzentration starten?";
        sysActions.innerHTML = '';
        
        const noBtn = document.createElement('button');
        noBtn.className = "px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition";
        noBtn.textContent = "Nein, ohne Musik";
        noBtn.onclick = () => {
            closeSystemModal();
            loadStep(1);
        };
        
        const yesBtn = document.createElement('button');
        yesBtn.className = "px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded text-xs font-bold transition shadow-lg";
        yesBtn.textContent = "Ja, Musik starten";
        yesBtn.onclick = () => {
            closeSystemModal();
            loadNewTrack(BROWN_NOISE_URL);
            setTimeout(() => { playMusic(); }, 1500);
            loadStep(1);
        };
        
        sysActions.appendChild(noBtn);
        sysActions.appendChild(yesBtn);
        
        sysModal.classList.remove('hidden');
        requestAnimationFrame(() => {
            sysModal.classList.remove('opacity-0');
            sysModalPanel.classList.remove('scale-95');
            sysModalPanel.classList.add('scale-100');
        });
    } 
    
    // --- TUNE ---
    else if (currentStep === 1) { 
        const goalInput = document.getElementById('session-goal-input');
        if(!goalInput.value.trim()) { 
            showSystemModal("Angabe fehlt", "Bitte definiere dein Ziel nach der M.V.P.-Formel.", false);
            return; 
        }
        sessionData.goal = goalInput.value.trim();
        loadStep(2);
    } 
    
    // --- ATOMIC ---
    else if (currentStep === 2) { 
        const setupCheck = document.getElementById('setup-ready-check');
        if(!setupCheck.checked) {
            showSystemModal("System-Start Pflicht", "Bitte bestätige erst (Checkbox), dass alle Programme und Dateien geöffnet sind.", false);
            return;
        }

        const atomicInput = document.getElementById('atomic-step-input');
        if(!atomicInput.value.trim()) { 
            showSystemModal("Angabe fehlt", "Bitte definiere den allerersten, winzigen Schritt.", false);
            return; 
        }
        
        sessionData.atomicStep = atomicInput.value.trim();
        loadStep(3);
    } 
    
    // --- MOMENTUM ---
    else if (currentStep === 3) { 
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
    
    if (stepIndex === 0) renderCheckIn();
    else if (stepIndex === 1) renderTune();
    else if (stepIndex === 2) renderAtomic();
    else if (stepIndex === 3) renderMomentum();
}

// RENDER FUNKTIONEN

function renderCheckIn() {
    updateHeader("CHECK-IN", "System Check", "bg-slate-700", "text-slate-300");
    actionBtn.textContent = "START";
    actionBtn.className = "bg-green-600 hover:bg-green-500 text-white text-xs font-bold py-2 px-6 rounded shadow-lg transition-all border-b-2 border-green-800";
    visualTimer.setTime(0);

    contentArea.innerHTML = `
        <div class="space-y-6 text-center animate-fade-in">
            <div class="space-y-3">
                <label class="text-xs font-bold text-slate-300 uppercase tracking-wide block">
                    Wie sehr überfordert dich die Aufgabe?
                </label>
                <div class="px-2 pt-2 pb-6 relative">
                    <style>
                        #overwhelm-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 20px; height: 20px; border-radius: 50%; background: white; cursor: pointer; border: 2px solid #334155; box-shadow: 0 2px 5px rgba(0,0,0,0.3); margin-top: -8px; }
                        #overwhelm-slider::-webkit-slider-runnable-track { width: 100%; height: 6px; cursor: pointer; border-radius: 3px; }
                    </style>
                    <input type="range" id="overwhelm-slider" min="0" max="100" value="50" step="0.1"
                        class="w-full h-2 rounded-lg appearance-none cursor-pointer"
                        style="background: linear-gradient(to right, #22c55e, #eab308, #ef4444);">
                    <div class="flex justify-between text-[10px] text-slate-400 font-medium px-1 mt-3 absolute w-full left-0 -bottom-1">
                        <span>Easy</span><span class="text-red-500">Panik</span>
                    </div>
                </div>
            </div>
            <div class="p-3 bg-slate-700/30 border border-slate-600/50 rounded-lg">
                <p class="text-slate-300 text-xs font-medium mb-1">⚡️ Kurz-Reset</p>
                <p class="text-[11px] text-slate-400">Schultern hochziehen, Fäuste ballen... halten... <br>und <b>locker lassen</b>.</p>
            </div>
        </div>
    `;
}

function renderTune() {
    updateHeader("TUNE", "Ziel definieren", "bg-blue-600", "text-white");
    actionBtn.textContent = "WEITER";
    actionBtn.className = "bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 px-6 rounded shadow-lg transition-all border-b-2 border-blue-800";

    contentArea.innerHTML = `
        <div class="space-y-4 animate-fade-in">
            <div class="bg-blue-900/20 border border-blue-800/50 p-3 rounded-lg space-y-2">
                <p class="text-xs font-bold text-blue-400 border-b border-blue-800/50 pb-1 mb-1">Die M.V.P. Formel für klare Ziele:</p>
                <ul class="text-[11px] text-slate-300 space-y-1.5 pl-1">
                    <li class="flex gap-2"><span class="font-bold text-blue-300 w-4">M</span> <span><b>Micro-Menge:</b> "1 Seite", "5 Minuten" (statt "Alles")</span></li>
                    <li class="flex gap-2"><span class="font-bold text-blue-300 w-4">V</span> <span><b>Verb (Aktiv):</b> "Tippen", "Lesen" (statt "Lernen")</span></li>
                    <li class="flex gap-2"><span class="font-bold text-blue-300 w-4">P</span> <span><b>Präzision:</b> "In Datei XY" (Wo genau?)</span></li>
                </ul>
            </div>
            <div>
                <input type="text" id="session-goal-input" autocomplete="off" placeholder="Dein M.V.P. Ziel..." class="w-full bg-slate-700/50 text-white p-3 rounded border border-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none placeholder-slate-500 text-sm">
                <p class="text-[10px] text-slate-500 mt-1 italic">Bsp: "10 Minuten (M) Stichpunkte schreiben (V) in Word-Doc 'Entwurf' (P)"</p>
            </div>
        </div>
    `;
    setTimeout(() => document.getElementById('session-goal-input').focus(), 50);
}

function renderAtomic() {
    updateHeader("ATOMIC", "Setup & Start", "bg-purple-600", "text-white");
    actionBtn.textContent = "STARTEN";
    actionBtn.className = "bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold py-2 px-6 rounded shadow-lg transition-all border-b-2 border-purple-800";

    const savedBridge = localStorage.getItem('stamp_bridge_v2') || "";
    
    contentArea.innerHTML = `
        <div class="space-y-5 animate-fade-in">
            <div class="p-3 bg-slate-700/40 border border-slate-600 rounded-lg">
                <label class="flex items-start gap-3 cursor-pointer group">
                    <div class="relative flex items-center mt-0.5">
                        <input type="checkbox" id="setup-ready-check" class="peer h-5 w-5 cursor-pointer appearance-none rounded border border-slate-500 bg-slate-800 transition-all checked:border-green-500 checked:bg-green-500">
                        <svg class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none opacity-0 peer-checked:opacity-100 text-white" viewBox="0 0 14 14" fill="none"><path d="M3 8L6 11L11 3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </div>
                    <div class="flex-1">
                        <p class="text-xs font-bold text-white group-hover:text-green-300 transition">System-Start Pflicht</p>
                        <p class="text-[11px] text-slate-400 leading-snug mt-0.5">Ich habe <b>jetzt</b> alle Programme, Dateien und Tabs geöffnet, die ich brauche. Alles liegt bereit.</p>
                    </div>
                </label>
            </div>
            <div>
                <label class="text-xs uppercase font-bold text-purple-400 block mb-2">Der allererste Schritt</label>
                <input type="text" id="atomic-step-input" value="${savedBridge}" autocomplete="off" placeholder="Erster, lächerlich kleiner Handgriff..." class="w-full bg-slate-700/50 text-white p-3 rounded border border-slate-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none text-sm transition-all">
                ${savedBridge ? '<p class="text-[10px] text-green-400 mt-1.5 flex items-center gap-1"><span class="text-xs">↺</span> Aus "The Bridge" übernommen</p>' : ''}
            </div>
        </div>
    `;
    setTimeout(() => {
        const check = document.getElementById('setup-ready-check');
        check.addEventListener('change', (e) => {
            if(e.target.checked) new Audio('https://www.soundjay.com/buttons/sounds/button-17.mp3').play().catch(()=>{});
        });
        if(!savedBridge) document.getElementById('atomic-step-input').focus();
    }, 50);
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
            <div class="flex-grow"></div>
            <div class="mt-auto pt-2 border-t border-slate-700/30">
                <label class="text-[10px] uppercase font-bold text-green-400 block mb-1.5">The Bridge (Für nächstes Mal)</label>
                <input type="text" id="bridge-input" autocomplete="off" placeholder="Nächster logischer Schritt / Notiz..." class="w-full bg-slate-900/50 text-slate-300 p-2.5 rounded border border-slate-700 focus:border-green-500 outline-none text-xs transition-colors">
            </div>
        </div>
    `;
    startTimerWatcher();
}

function startTimerWatcher() {
    if (timerWatcherInterval) clearInterval(timerWatcherInterval);
    timerWatcherInterval = setInterval(() => {
        let seconds = visualTimer.totalSeconds;
        if (seconds > 0) {
            visualTimer.setTime(seconds - 1);
            if (visualTimer.totalSeconds === 0) {
                 new Audio('https://www.soundjay.com/buttons/sounds/beep-07.mp3').play().catch(() => {});
                 showSystemModal("Zeit abgelaufen!", "Deine Deep Work Session ist vorbei. Vergiss nicht, 'The Bridge' auszufüllen, bevor du die Session beendest.", false);
                 const bridgeInput = document.getElementById('bridge-input');
                 if(bridgeInput) bridgeInput.focus();
            }
        }
    }, 1000);
}

function updateHeader(badgeText, titleText, badgeColorClass, titleColorClass) {
    phaseBadge.textContent = badgeText;
    phaseBadge.className = `px-2 py-0.5 rounded text-[10px] font-bold border border-white/10 shadow-sm transition-colors duration-300 ${badgeColorClass} text-white`;
    phaseName.textContent = titleText;
    phaseName.className = `text-sm font-semibold transition-colors duration-300 ${titleColorClass}`;
}