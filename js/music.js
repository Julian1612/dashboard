// js/music.js

import { generateUUID } from './utils.js';

// DOM-Elemente
const scPlayerButtons = document.getElementById('sc-player-buttons');
const soundcloudPlayerIframe = document.getElementById('soundcloud-player');
const scEditModal = document.getElementById('sc-edit-modal');
const scEditListContainer = document.getElementById('sc-edit-list-container');
const newScNameInput = document.getElementById('new-sc-name-input');
const newScUrlInput = document.getElementById('new-sc-url-input');

// Constants
const SC_TRACKS_STORAGE_KEY = 'focusDaySCTracks_v1';
const DEFAULT_SC_TRACKS = [
    { id: 'sc-1', name: "Brown Noise", url: "https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/1107084022&color=%2322c55e&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=true" },
    { id: 'sc-2', name: "Piano Flow", url: "https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/playlists/soundcloud%253Aplaylists%253A1786226742&color=%2322c55e&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=true" },
    { id: 'sc-3', name: "Binaural", url: "https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/playlists/soundcloud%253Aplaylists%253A1561633429&color=%2322c55e&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=true" },
    { id: 'sc-4', name: "Lofi Beats", url: "https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/playlists/1234609288&color=%2322c55e&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=true" },
];

// State
let currentSCTracks = [];
let scWidget = null; 
let isPlaying = false;
let draggedTrackIndex = null;

// --- INITIALISIERUNG & DOM MANIPULATION ---

/**
 * Wandelt das UI in den minimalistischen Modus um:
 * Versteckt den Iframe und fügt den Play/Pause Button hinzu.
 */
function setupMinimalistUI() {
    // 1. Iframe-Container verstecken (aber im DOM lassen für Widget-API)
    const playerContainer = soundcloudPlayerIframe.parentElement;
    if (playerContainer) {
        // Wir machen ihn unsichtbar und ohne Höhe, damit er keinen Platz wegnimmt
        playerContainer.style.height = '0';
        playerContainer.style.opacity = '0';
        playerContainer.style.overflow = 'hidden';
        playerContainer.style.marginTop = '0';
        // Wir fügen Platzhalter hinzu, damit die Karte nicht leer wirkt
        playerContainer.style.flexGrow = '0'; 
    }

    // 2. Play/Pause Button injizieren
    const controlsContainer = document.getElementById('sc-next')?.parentElement;
    if (controlsContainer && !document.getElementById('sc-play-pause')) {
        // Container zentrieren und vergrößern für Fokus
        controlsContainer.className = "flex-grow flex justify-center items-center gap-8 h-full";
        
        const playBtn = document.createElement('button');
        playBtn.id = 'sc-play-pause';
        playBtn.className = "p-6 rounded-full bg-teal-600 hover:bg-teal-500 text-white transition shadow-lg shadow-teal-900/30 transform active:scale-95 group";
        playBtn.innerHTML = `
            <svg id="icon-play" class="w-8 h-8 translate-x-0.5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            <svg id="icon-pause" class="w-8 h-8 hidden" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
        `;
        
        // Button zwischen Prev und Next einfügen
        const nextBtn = document.getElementById('sc-next');
        controlsContainer.insertBefore(playBtn, nextBtn);
        
        playBtn.addEventListener('click', togglePlay);
    }
}

// --- DATA HANDLING ---

export function loadSCTracks() {
    const savedTracks = localStorage.getItem(SC_TRACKS_STORAGE_KEY);
    try {
        const tracks = savedTracks ? JSON.parse(savedTracks) : DEFAULT_SC_TRACKS;
        currentSCTracks = tracks.map(track => ({ ...track, id: track.id || generateUUID() }));
    } catch(e) {
        currentSCTracks = DEFAULT_SC_TRACKS;
    }
}

function saveSCTracks() {
    localStorage.setItem(SC_TRACKS_STORAGE_KEY, JSON.stringify(currentSCTracks));
}

// --- RENDERING ---

export function renderSCButtons() {
    scPlayerButtons.innerHTML = '';
    
    currentSCTracks.forEach((track, index) => {
        const button = document.createElement('button');
        // Minimalistisches Button-Design (Teal active state)
        button.className = `player-btn text-[10px] uppercase font-bold tracking-wider py-1.5 px-3 rounded-md transition-all border ${index === 0 ? 'active border-teal-500 bg-teal-500/10 text-teal-400' : 'border-slate-800 bg-slate-900 text-slate-500 hover:text-slate-300'}`;
        button.textContent = track.name;
        button.dataset.src = track.url;
        button.dataset.trackId = track.id; 
        
        button.addEventListener('click', (e) => {
            // Active State umschalten
            document.querySelectorAll('.player-btn').forEach(btn => {
                btn.className = 'player-btn text-[10px] uppercase font-bold tracking-wider py-1.5 px-3 rounded-md transition-all border border-slate-800 bg-slate-900 text-slate-500 hover:text-slate-300';
            });
            e.currentTarget.className = 'player-btn text-[10px] uppercase font-bold tracking-wider py-1.5 px-3 rounded-md transition-all border active border-teal-500 bg-teal-500/10 text-teal-400 shadow-[0_0_10px_rgba(20,184,166,0.2)]';
            
            loadNewTrack(e.currentTarget.dataset.src);
        });

        scPlayerButtons.appendChild(button);
    });
    
    if (currentSCTracks.length > 0) {
        soundcloudPlayerIframe.src = currentSCTracks[0].url;
    }
}

// --- PLAYER LOGIC ---

export function initializeSCWidget() {
    if (typeof SC !== 'undefined' && typeof SC.Widget === 'function') {
        scWidget = SC.Widget(soundcloudPlayerIframe);
        
        // Events für Play/Pause Status-Sync
        scWidget.bind(SC.Widget.Events.PLAY, () => updatePlayButtonState(true));
        scWidget.bind(SC.Widget.Events.PAUSE, () => updatePlayButtonState(false));
        scWidget.bind(SC.Widget.Events.FINISH, () => updatePlayButtonState(false));
        
        setupMinimalistUI(); // UI anpassen
    }
}

function updatePlayButtonState(playing) {
    isPlaying = playing;
    const iconPlay = document.getElementById('icon-play');
    const iconPause = document.getElementById('icon-pause');
    const playBtn = document.getElementById('sc-play-pause');
    
    if (iconPlay && iconPause) {
        if (playing) {
            iconPlay.classList.add('hidden');
            iconPause.classList.remove('hidden');
            if(playBtn) playBtn.classList.add('animate-pulse-slow'); // Optionaler Effekt
        } else {
            iconPlay.classList.remove('hidden');
            iconPause.classList.add('hidden');
            if(playBtn) playBtn.classList.remove('animate-pulse-slow');
        }
    }
}

function togglePlay() {
    if (!scWidget) return;
    scWidget.isPaused(paused => {
        if (paused) scWidget.play();
        else scWidget.pause();
    });
}

export function loadNewTrack(embedUrl) {
    if (scWidget) {
        const trackUrl = extractApiUrl(embedUrl);
        if (trackUrl) {
            scWidget.load(trackUrl, { 
                auto_play: true, // Auto-Play beim Senderwechsel für smooth experience
                show_artwork: false,
                visual: false 
            });
            isPlaying = true;
            updatePlayButtonState(true);
        }
    } else { 
        soundcloudPlayerIframe.src = embedUrl; 
    }
}

export function playMusic() {
    if (scWidget) scWidget.play();
}

export function pauseMusic() {
    if (scWidget) scWidget.pause();
}

// --- HELPER ---

function extractSoundCloudEmbedUrl(input) {
    const trimmed = input.trim();
    if (trimmed.startsWith('https://w.soundcloud.com/player/?url=')) return trimmed;
    const match = trimmed.match(/<iframe[^>]*src=["']([^"']*)["']/i);
    return (match && match[1].startsWith('https://w.soundcloud.com/player/?url=')) ? match[1] : null; 
}

function extractApiUrl(embedUrl) {
    try { return decodeURIComponent(new URL(embedUrl).searchParams.get('url')); } catch (e) { return null; }
}

// --- EDIT MODAL & DRAG/DROP (Logic unchanged, styled in CSS/HTML) ---

function openSCEditModal() {
    scEditModal.currentData = JSON.parse(JSON.stringify(currentSCTracks));
    renderSCEditList(scEditModal.currentData);
    scEditModal.classList.remove('hidden');
    scEditModal.style.opacity = '0';
    scEditModal.querySelector('.card').style.transform = 'scale(0.95)';
    setTimeout(() => { scEditModal.style.opacity = '1'; scEditModal.querySelector('.card').style.transform = 'scale(1)'; }, 10);
}

function closeSCEditModal() {
    scEditModal.style.opacity = '0';
    scEditModal.querySelector('.card').style.transform = 'scale(0.95)';
    setTimeout(() => { scEditModal.classList.add('hidden'); }, 300);
    newScNameInput.value = "";
    newScUrlInput.value = "";
    draggedTrackIndex = null;
}

// ... Drag & Drop Handler (handleDragStart, etc.) bleiben identisch zu vorher ...
// (Ich kürze diesen Block hier nicht, aber er entspricht der Logik aus dem vorherigen Artefakt, 
// da sich nur das Frontend-Design geändert hat).

function handleDragStart(e) {
    syncSCEditModalState(); draggedTrackIndex = parseInt(this.dataset.index);
    e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', draggedTrackIndex); 
    setTimeout(() => { this.classList.add('dragging'); }, 0);
}
function handleDragOver(e) {
    e.preventDefault(); e.dataTransfer.dropEffect = 'move';
    const item = e.target.closest('.draggable-item');
    if(item && item !== this) {
        document.querySelectorAll('#sc-edit-list-container .draggable-item').forEach(i => i.classList.remove('drag-over'));
        item.classList.add('drag-over');
    }
}
function handleDragEnd(e) {
    this.classList.remove('dragging'); draggedTrackIndex = null; 
    document.querySelectorAll('#sc-edit-list-container .draggable-item').forEach(item => item.classList.remove('drag-over'));
}
function handleDrop(e) {
    e.stopPropagation(); e.preventDefault();
    const targetItem = e.target.closest('.draggable-item');
    if (targetItem) {
        const targetIndex = parseInt(targetItem.dataset.index);
        if (draggedTrackIndex !== null && draggedTrackIndex !== targetIndex) {
            const tracks = scEditModal.currentData;
            const itemToMove = tracks[draggedTrackIndex];
            tracks.splice(draggedTrackIndex, 1);
            tracks.splice(targetIndex, 0, itemToMove);
            renderSCEditList(scEditModal.currentData);
        }
    }
    return false;
}

function renderSCEditList(data) {
    scEditListContainer.innerHTML = '';
    data.forEach((track, index) => {
        const li = document.createElement('div');
        li.className = "draggable-item flex items-center group bg-slate-900/50 p-3 rounded-lg border border-slate-800 transition gap-3 mb-2";
        li.draggable = true;
        li.dataset.index = index;
        li.dataset.trackId = track.id;

        const handle = document.createElement('div');
        handle.className = "drag-handle cursor-grab flex-none text-slate-600 hover:text-slate-400";
        handle.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="19" r="1"></circle></svg>';
        li.appendChild(handle);
        
        const nameInput = document.createElement('input');
        nameInput.type = "text";
        nameInput.value = track.name;
        nameInput.className = "sc-name-input flex-none w-1/3 bg-transparent text-sm rounded px-2 py-1 border border-transparent focus:border-slate-700 outline-none text-slate-300 placeholder-slate-600 focus:bg-slate-950";
        nameInput.dataset.trackId = track.id;

        const urlInput = document.createElement('input');
        urlInput.type = "text";
        urlInput.value = track.url || "";
        urlInput.className = "sc-url-input flex-grow bg-transparent text-xs rounded px-2 py-1 border border-transparent focus:border-slate-700 outline-none text-teal-600/70 focus:text-teal-500 placeholder-slate-600 focus:bg-slate-950";
        urlInput.dataset.trackId = track.id;

        const delBtn = document.createElement('button');
        delBtn.className = "action-icon-btn delete-task-btn flex-none p-1 hover:text-red-400 transition";
        delBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>';
        delBtn.addEventListener('click', () => {
            syncSCEditModalState(); 
            scEditModal.currentData.splice(index, 1);
            renderSCEditList(scEditModal.currentData);
        });

        li.addEventListener('dragstart', handleDragStart);
        li.addEventListener('dragover', handleDragOver);
        li.addEventListener('drop', handleDrop);
        li.addEventListener('dragend', handleDragEnd);

        li.appendChild(nameInput);
        li.appendChild(urlInput);
        li.appendChild(delBtn);
        scEditListContainer.appendChild(li);
    });
}

function syncSCEditModalState() {
     const temp = scEditModal.currentData;
     scEditListContainer.querySelectorAll('.sc-name-input').forEach(input => {
        const track = temp.find(t => t.id === input.dataset.trackId);
        if (track) track.name = input.value.trim();
     });
     scEditListContainer.querySelectorAll('.sc-url-input').forEach(input => {
        const track = temp.find(t => t.id === input.dataset.trackId);
        if (track) track.url = input.value.trim(); 
     });
}

function addSCTrack() {
    const name = newScNameInput.value.trim();
    const rawInput = newScUrlInput.value.trim();
    if (name === "" || rawInput === "") { alert("Bitte Name und URL eingeben."); return; }
    const cleanUrl = extractSoundCloudEmbedUrl(rawInput);
    if (!cleanUrl) { alert("Ungültige SoundCloud URL."); return; }
    
    syncSCEditModalState(); 
    scEditModal.currentData.push({ id: generateUUID(), name: name, url: cleanUrl });
    renderSCEditList(scEditModal.currentData);
    newScNameInput.value = ""; newScUrlInput.value = ""; newScNameInput.focus();
}

function saveEditedSCTracks() {
    syncSCEditModalState();
    // Validierung und Speicherung
    const validTracks = [];
    scEditModal.currentData.forEach(track => {
        const cleanedUrl = extractSoundCloudEmbedUrl(track.url);
        if (track.name !== "" && cleanedUrl) {
            validTracks.push({ ...track, url: cleanedUrl });
        }
    });
    
    if (validTracks.length === 0) {
        alert("Mindestens ein gültiger Track erforderlich.");
        return;
    }

    currentSCTracks = validTracks;
    saveSCTracks();
    renderSCButtons();
    initializeSCWidget(); 
    closeSCEditModal();
}

export function setupMusicListeners() {
    document.getElementById('edit-music-btn').addEventListener('click', openSCEditModal);
    document.getElementById('cancel-sc-edit-btn').addEventListener('click', closeSCEditModal);
    document.getElementById('save-sc-edit-btn').addEventListener('click', saveEditedSCTracks);
    document.getElementById('add-sc-track-btn').addEventListener('click', addSCTrack);
    
    // Player Controls
    document.getElementById('sc-next').addEventListener('click', () => { if (scWidget) scWidget.next(); });
    document.getElementById('sc-prev').addEventListener('click', () => { if (scWidget) scWidget.prev(); });
}