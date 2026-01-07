// js/main.js

import { initConfetti } from './confetti.js';
import { loadSCTracks, renderSCButtons, initializeSCWidget, setupMusicListeners } from './music.js';
import { loadChecklistData, renderChecklist, setupChecklistListeners, renderContributionGraph } from './checklist.js';
import { loadCycleState, setupTimerListeners } from './timer.js';

/**
 * Startpunkt der Anwendung. 
 * Wird ausgeführt, sobald das gesamte HTML geladen und geparst wurde.
 */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Laden der gespeicherten Zustände
    loadSCTracks();
    loadChecklistData(); 
    loadCycleState();
    
    // 2. Initialisieren der visuellen Komponenten/Widgets
    renderSCButtons(); // Muss vor initializeSCWidget() aufgerufen werden
    renderChecklist();
    renderContributionGraph(); // NEU: Aktivitäts-Graph rendern
    initConfetti(); 

    // 3. Initialisieren des externen Widgets
    initializeSCWidget();
    
    // 4. Registrieren aller Event Listener
    setupTimerListeners();
    setupMusicListeners();
    setupChecklistListeners();
    
    console.log("Fokus Tag Dashboard Pro gestartet.");
});