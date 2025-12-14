// Hauptinitialisierungslogik, die nach dem Laden des DOM ausgeführt wird.
document.addEventListener('DOMContentLoaded', () => {
    // 1. Laden von Daten (Abhängig von timer.js und checklist.js)
    if (window.loadChecklistData) window.loadChecklistData(); 
    if (window.loadCycleState) window.loadCycleState();
    
    // 2. Initiales Rendering und Timer-Setup
    if (window.renderChecklist) window.renderChecklist(); // checklist.js
    if (window.resetTimer) window.resetTimer();           // timer.js
    
    // 3. Initialisierung der Drittanbieter-Widgets
    if (window.initializeSCWidget) window.initializeSCWidget(); // musicPlayer.js

    // 4. Initiales Canvas-Setup
    if (window.resizeCanvas) window.resizeCanvas(); // confetti.js
    
    // 5. Start der Animationsschleife
    if (window.animateConfetti) window.animateConfetti(); // confetti.js
});