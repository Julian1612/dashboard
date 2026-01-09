// js/main.js

import { initConfetti } from './confetti.js';
import { loadSCTracks, renderSCButtons, initializeSCWidget, setupMusicListeners } from './music.js';
import { loadChecklistData, renderChecklist, setupChecklistListeners } from './checklist.js';
import { loadCycleState, setupTimerListeners } from './timer.js';

/**
 * Startpunkt der Anwendung. 
 * Wird ausgeführt, sobald das gesamte HTML geladen und geparst wurde.
 */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Laden der gespeicherten Zustände (inkl. Habitify Token & Checklist-Daten)
    loadSCTracks();
    loadChecklistData(); 
    loadCycleState();
    
    // 2. Initialisieren der visuellen Komponenten/Widgets
    renderSCButtons(); // Muss vor initializeSCWidget() aufgerufen werden
    renderChecklist(); // Rendert die Liste und den Contribution Graph
    initConfetti(); 

    // 3. Initialisieren des externen Widgets
    initializeSCWidget();
    
    // 4. Registrieren aller Event Listener
    setupTimerListeners();
    setupMusicListeners();
    setupChecklistListeners(); // Registriert nun auch den Habitify "Fetch"-Button
    
    console.log("Fokus Tag Dashboard Pro mit Habitify-Integration gestartet.");
});