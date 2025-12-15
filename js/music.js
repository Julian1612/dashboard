// js/music.js

import { generateUUID } from './utils.js';

const scPlayerButtons = document.getElementById('sc-player-buttons');
const soundcloudPlayerIframe = document.getElementById('soundcloud-player');
const scEditModal = document.getElementById('sc-edit-modal');
const scEditListContainer = document.getElementById('sc-edit-list-container');
const newScNameInput = document.getElementById('new-sc-name-input');
const newScUrlInput = document.getElementById('new-sc-url-input');

const SC_TRACKS_STORAGE_KEY = 'focusDaySCTracks_v1';
const DEFAULT_SC_TRACKS = [
    { id: 'sc-1', name: "Brown Noise", url: "https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/1107084022&color=%2322c55e&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=true" },
    { id: 'sc-2', name: "Piano Focus", url: "https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/playlists/soundcloud%253Aplaylists%253A1786226742&color=%2322c55e&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=true" },
    { id: 'sc-3', name: "Binaural Beats", url: "https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/playlists/soundcloud%253Aplaylists%253A1561633429&color=%2322c55e&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=true" },
    { id: 'sc-4', name: "Lofi", url: "https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/playlists/1234609288&color=%2322c55e&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=true" },
];
let currentSCTracks = [];
let scWidget; 

// --- DRAG & DROP VARIABLEN ---
let draggedTrackIndex = null;

/**
 * Versucht, die reine SoundCloud Embed URL aus einem beliebigen Input (reine URL oder voller HTML Embed Code) zu extrahieren.
 * @param {string} input - Die vom Nutzer eingefügte Zeichenkette.
 * @returns {string | null} Die bereinigte Embed URL (die mit https://w.soundcloud.com/player/...), oder null bei Misserfolg.
 */
function extractSoundCloudEmbedUrl(input) {
    const trimmedInput = input.trim();

    if (trimmedInput.startsWith('https://w.soundcloud.com/player/?url=')) {
        return trimmedInput;
    }

    const iframeMatch = trimmedInput.match(/<iframe[^>]*src=["']([^"']*)["']/i);
    
    if (iframeMatch && iframeMatch[1]) {
        const extractedUrl = iframeMatch[1];
        if (extractedUrl.startsWith('https://w.soundcloud.com/player/?url=')) {
            return extractedUrl;
        }
    }
    
    return null; 
}


function extractApiUrl(embedUrl) {
    try { return decodeURIComponent(new URL(embedUrl).searchParams.get('url')); } catch (e) { return null; }
}

/**
 * Lädt die Track-Daten aus dem Local Storage.
 */
export function loadSCTracks() {
    const savedTracks = localStorage.getItem(SC_TRACKS_STORAGE_KEY);
    try {
        const tracks = savedTracks ? JSON.parse(savedTracks) : DEFAULT_SC_TRACKS;
        currentSCTracks = tracks.map(track => ({
            ...track,
            id: track.id || generateUUID(), 
        }));
    } catch(e) {
        console.error("Error loading SoundCloud tracks from local storage:", e);
        currentSCTracks = DEFAULT_SC_TRACKS;
    }
}

function saveSCTracks() {
    localStorage.setItem(SC_TRACKS_STORAGE_KEY, JSON.stringify(currentSCTracks));
}

/**
 * Rendert die Buttons für die SoundCloud-Tracks.
 */
export function renderSCButtons() {
    scPlayerButtons.innerHTML = '';
    
    currentSCTracks.forEach((track, index) => {
        const button = document.createElement('button');
        button.className = `player-btn text-xs py-1 px-2 rounded ${index === 0 ? 'active' : ''}`;
        button.textContent = track.name;
        button.dataset.src = track.url;
        button.dataset.trackId = track.id; 
        
        button.addEventListener('click', (e) => {
            document.querySelectorAll('.player-btn').forEach(btn => btn.classList.remove('active'));
            e.currentTarget.classList.add('active');
            loadNewTrack(e.currentTarget.dataset.src);
        });

        scPlayerButtons.appendChild(button);
    });
    
    if (currentSCTracks.length > 0) {
        soundcloudPlayerIframe.src = currentSCTracks[0].url;
    }
}

/**
 * Initialisiert das SoundCloud Widget.
 */
export function initializeSCWidget() {
    if (typeof SC !== 'undefined' && typeof SC.Widget === 'function') {
        scWidget = SC.Widget(soundcloudPlayerIframe);
    }
}

/**
 * Lädt einen neuen Track in den SC-Player.
 * @param {string} embedUrl Die SoundCloud Embed URL.
 */
export function loadNewTrack(embedUrl) {
    if (scWidget) {
        const trackUrl = extractApiUrl(embedUrl);
        if (trackUrl) {
            scWidget.load(trackUrl, { auto_play: false, show_comments: false, show_user: false, show_reposts: false, color: '22c55e' });
        }
    } else { soundcloudPlayerIframe.src = embedUrl; }
}

/**
 * Startet die Musikwiedergabe.
 */
export function playMusic() {
    if (scWidget) scWidget.play();
}

/**
 * Pausiert die Musikwiedergabe.
 */
export function pauseMusic() {
    if (scWidget) scWidget.pause();
}

// --- DRAG & DROP HANDLERS ---

function handleDragStart(e) {
    syncSCEditModalState(); // Eingaben speichern, bevor verschoben wird
    draggedTrackIndex = parseInt(this.dataset.index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', draggedTrackIndex); 
    setTimeout(() => { this.classList.add('dragging'); }, 0);
}

function handleDragOver(e) {
    e.preventDefault(); 
    e.dataTransfer.dropEffect = 'move';
    const item = e.target.closest('.draggable-item');
    if(item && item !== this) {
        // Alle drag-over entfernen und zum Ziel hinzufügen
        document.querySelectorAll('#sc-edit-list-container .draggable-item').forEach(i => i.classList.remove('drag-over'));
        item.classList.add('drag-over');
    }
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    draggedTrackIndex = null; 
    document.querySelectorAll('#sc-edit-list-container .draggable-item').forEach(item => item.classList.remove('drag-over'));
}

function handleDrop(e) {
    e.stopPropagation();
    e.preventDefault();
    
    const targetItem = e.target.closest('.draggable-item');
    if (targetItem) {
        const targetIndex = parseInt(targetItem.dataset.index);

        if (draggedTrackIndex !== null && draggedTrackIndex !== targetIndex) {
            const tracks = scEditModal.currentData;
            const itemToMove = tracks[draggedTrackIndex];
            
            tracks.splice(draggedTrackIndex, 1);
            tracks.splice(targetIndex, 0, itemToMove);
            
            // Neu rendern, um Indexe und Reihenfolge zu aktualisieren
            renderSCEditList(scEditModal.currentData);
        }
    }
    return false;
}
// --- END DRAG & DROP HANDLERS ---


// --- EDIT MODAL LOGIC ---

function openSCEditModal() {
    scEditModal.currentData = JSON.parse(JSON.stringify(currentSCTracks));
    renderSCEditList(scEditModal.currentData);

    scEditModal.classList.remove('hidden');
    scEditModal.style.opacity = '0';
    scEditModal.querySelector('.card').style.transform = 'scale(0.95)';
    setTimeout(() => { 
        scEditModal.style.opacity = '1';
        scEditModal.querySelector('.card').style.transform = 'scale(1)';
    }, 10);
}

function closeSCEditModal() {
    scEditModal.style.opacity = '0';
    scEditModal.querySelector('.card').style.transform = 'scale(0.95)';
    setTimeout(() => { scEditModal.classList.add('hidden'); }, 300);
    newScNameInput.value = "";
    newScUrlInput.value = "";
    // Reset D&D state (falls ein Drag während des Schließens aktiv war)
    draggedTrackIndex = null;
}

function createEditableTrackItem(track, index) {
    const li = document.createElement('div');
    li.className = "draggable-item flex items-center group bg-slate-800/80 p-2 rounded border border-transparent hover:border-slate-600 transition gap-2";
    li.draggable = true;
    li.dataset.index = index;
    li.dataset.trackId = track.id;

    // Handle (D&D) - NEU HINZUGEFÜGT
    const handle = document.createElement('div');
    handle.className = "drag-handle cursor-grab flex-none";
    handle.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="19" r="1"></circle></svg>';
    li.appendChild(handle);
    
    // Name Input
    const nameInput = document.createElement('input');
    nameInput.type = "text";
    nameInput.value = track.name;
    nameInput.className = "sc-name-input flex-none w-1/4 bg-transparent text-sm rounded-md px-2 py-1 border-none outline-none text-slate-200 placeholder-slate-500 focus:ring-1 focus:ring-blue-500/50";
    nameInput.dataset.trackId = track.id;
    nameInput.title = "Button Name";

    // URL Input
    const urlInput = document.createElement('input');
    urlInput.type = "text";
    // Zeige die bereinigte URL an, aber erlaube das Einfügen des vollen Embed Codes.
    urlInput.value = track.url || "";
    urlInput.className = "sc-url-input flex-grow bg-transparent text-xs rounded-md px-2 py-1 border-none outline-none text-blue-300 placeholder-slate-500 focus:ring-1 focus:ring-blue-500/50";
    urlInput.dataset.trackId = track.id;
    urlInput.title = "SoundCloud Embed URL oder kompletter Embed Code";

    // Delete Btn
    const delBtn = document.createElement('button');
    delBtn.className = "action-icon-btn delete-task-btn flex-none";
    delBtn.title = "Löschen";
    delBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>';
    
    delBtn.addEventListener('click', () => {
        syncSCEditModalState(); 
        scEditModal.currentData.splice(index, 1);
        renderSCEditList(scEditModal.currentData);
    });

    // D&D Event Listener anhängen - NEU HINZUGEFÜGT
    li.addEventListener('dragstart', handleDragStart);
    li.addEventListener('dragover', handleDragOver);
    li.addEventListener('drop', handleDrop);
    li.addEventListener('dragend', handleDragEnd);

    li.appendChild(nameInput);
    li.appendChild(urlInput);
    li.appendChild(delBtn);

    return li;
}

function renderSCEditList(data) {
    scEditListContainer.innerHTML = '';
    
    data.forEach((track, index) => {
        const li = createEditableTrackItem(track, index);
        scEditListContainer.appendChild(li);
    });
}

function syncSCEditModalState() {
     const temp = scEditModal.currentData;
     scEditListContainer.querySelectorAll('.sc-name-input').forEach(input => {
        const trackId = input.dataset.trackId;
        const track = temp.find(t => t.id === trackId);
        if (track) track.name = input.value.trim();
     });
     scEditListContainer.querySelectorAll('.sc-url-input').forEach(input => {
        const trackId = input.dataset.trackId;
        const track = temp.find(t => t.id === trackId);
        // Speichere den rohen/aktuellen Wert. Bereinigung erfolgt in saveEditedSCTracks.
        if (track) track.url = input.value.trim(); 
     });
}

function addSCTrack() {
    const name = newScNameInput.value.trim();
    const rawInput = newScUrlInput.value.trim();
    
    if (name === "" || rawInput === "") {
        alert("Bitte einen Namen und die vollständige SoundCloud URL oder Embed Code eingeben.");
        return;
    }
    
    const cleanUrl = extractSoundCloudEmbedUrl(rawInput);

    if (!cleanUrl) {
         alert("Die Eingabe scheint keine gültige SoundCloud Embed URL oder kein vollständiger Embed Code zu sein. Bitte überprüfe deine Eingabe.");
         return;
    }
    
    syncSCEditModalState(); 
    const newTrack = { id: generateUUID(), name: name, url: cleanUrl }; 
    scEditModal.currentData.push(newTrack);
    renderSCEditList(scEditModal.currentData);
    
    newScNameInput.value = "";
    newScUrlInput.value = "";
    newScNameInput.focus();
}

function saveEditedSCTracks() {
    syncSCEditModalState();
    
    const validTracks = [];

    scEditModal.currentData.forEach(track => {
        // Bereinige und validiere die URL, die im Edit-Modal stehen könnte
        const cleanedUrl = extractSoundCloudEmbedUrl(track.url);
        if (track.name !== "" && cleanedUrl) {
            validTracks.push({
                ...track,
                url: cleanedUrl // Speichere die bereinigte URL
            });
        }
    });

    if (validTracks.length === 0) {
        alert("Es muss mindestens ein gültiger SoundCloud-Track mit Namen und URL vorhanden sein. Bitte beachte, dass alle URLs validiert wurden.");
        return;
    }

    currentSCTracks = validTracks;
    saveSCTracks();
    renderSCButtons();
    initializeSCWidget(); 

    closeSCEditModal();
}


/**
 * Registriert alle Event Listener für das Musik-Interface.
 */
export function setupMusicListeners() {
    document.getElementById('edit-music-btn').addEventListener('click', openSCEditModal);
    document.getElementById('cancel-sc-edit-btn').addEventListener('click', closeSCEditModal);
    document.getElementById('save-sc-edit-btn').addEventListener('click', saveEditedSCTracks);
    document.getElementById('add-sc-track-btn').addEventListener('click', addSCTrack);
    document.getElementById('new-sc-url-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') addSCTrack(); });
    document.getElementById('new-sc-name-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') newScUrlInput.focus(); });
    document.getElementById('sc-next').addEventListener('click', () => { if (scWidget) scWidget.next(); });
    document.getElementById('sc-prev').addEventListener('click', () => { if (scWidget) scWidget.prev(); });
}