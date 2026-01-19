// js/main.js

import { initConfetti } from './confetti.js';
import { loadSCTracks, renderSCButtons, initializeSCWidget, setupMusicListeners } from './music.js';
import { loadChecklistData, renderChecklist, setupChecklistListeners } from './checklist.js';
import { initStamp } from './stamp.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Laden & Rendern
    loadSCTracks();
    loadChecklistData(); 
    renderSCButtons(); 
    renderChecklist();
    initConfetti(); 

    // 2. S.T.A.M.P. Init
    initStamp();

    // 3. Listener
    initializeSCWidget();
    setupMusicListeners();
    setupChecklistListeners();
    
    console.log("Fokus Dashboard Pro - S.T.A.M.P. Edition initialized.");
});