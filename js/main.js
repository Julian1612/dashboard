// js/main.js

import { initConfetti } from './confetti.js';
import { loadSCTracks, renderSCButtons, initializeSCWidget, setupMusicListeners } from './music.js';
import { loadChecklistData, renderChecklist, setupChecklistListeners } from './checklist.js';
import { initStamp } from './stamp.js'; // NEU: S.T.A.M.P. Import

/**
 * Startpunkt der Anwendung. 
 * Wird ausgeführt, sobald das gesamte HTML geladen und geparst wurde.
 */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Laden der gespeicherten Zustände (Musik & Checkliste)
    loadSCTracks();
    loadChecklistData(); 
    
    // 2. Initialisieren der visuellen Komponenten
    renderSCButtons(); 
    renderChecklist();
    initConfetti(); 

    // 3. S.T.A.M.P. Commander starten (Ersetzt den alten Timer)
    // Lädt den Status, den Timer und die Phasen-Logik
    initStamp();

    // 4. Initialisieren des externen Widgets (SoundCloud)
    initializeSCWidget();
    
    // 5. Registrieren der restlichen Event Listener
    setupMusicListeners();
    setupChecklistListeners();
    
    console.log("Fokus Tag Dashboard V2.0 (S.T.A.M.P. Edition) gestartet.");
});