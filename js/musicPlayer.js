const playerBtns = document.querySelectorAll('.player-btn');
const soundcloudPlayerIframe = document.getElementById('soundcloud-player');
const scNextBtn = document.getElementById('sc-next');
const scPrevBtn = document.getElementById('sc-prev');
let scWidget;

/**
 * Extrahiert die API-URL aus der eingebetteten URL.
 * @param {string} embedUrl - Die URL des iframes.
 * @returns {string|null} Die decodierte SoundCloud API URL.
 */
function extractApiUrl(embedUrl) {
    try { 
        return decodeURIComponent(new URL(embedUrl).searchParams.get('url')); 
    } catch (e) { 
        console.error("Fehler beim Extrahieren der API URL:", e);
        return null; 
    }
}

/** Initialisiert das SoundCloud Widget-Objekt. */
function initializeSCWidget() {
    if (typeof SC !== 'undefined' && typeof SC.Widget === 'function') {
        scWidget = SC.Widget(soundcloudPlayerIframe);
        
        // Optional: Listener für Widget-Events hinzufügen, falls benötigt
        // scWidget.bind(SC.Widget.Events.READY, function() { ... });
    }
}

/**
 * Lädt einen neuen Track in den Player. Pausiert den Timer, falls er läuft.
 * @param {string} embedUrl - Die neue SoundCloud Embed URL.
 */
function loadNewTrack(embedUrl) {
    // Abhängigkeit vom Timer: Muss global verfügbar sein
    if(window.timerState === 'running' && window.pauseTimer) window.pauseTimer(); 
    
    if (scWidget) {
        const trackUrl = extractApiUrl(embedUrl);
        if (trackUrl) {
            // GEÄNDERT: Farbe im iFrame auf Rot (#ef4444)
            scWidget.load(trackUrl, { auto_play: true, show_comments: false, show_user: false, show_reposts: false, color: 'ef4444' });
        }
    } else { 
        // Fallback, wenn SC.Widget noch nicht verfügbar ist
        soundcloudPlayerIframe.src = embedUrl; 
    }
}

// Event Listener für Player-Buttons
playerBtns.forEach(button => {
    button.addEventListener('click', (e) => {
        playerBtns.forEach(btn => btn.classList.remove('active'));
        e.currentTarget.classList.add('active');
        loadNewTrack(e.currentTarget.dataset.src);
    });
});

scNextBtn.addEventListener('click', () => { if (scWidget) scWidget.next(); });
scPrevBtn.addEventListener('click', () => { if (scWidget) scWidget.prev(); });

// Funktionen im globalen Scope bereitstellen
window.initializeSCWidget = initializeSCWidget;
window.loadNewTrack = loadNewTrack;
window.scWidget = scWidget; // Widget muss für timer.js zugänglich sein