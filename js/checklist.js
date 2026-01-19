// js/checklist.js

import { generateUUID } from './utils.js';
import { triggerConfetti } from './confetti.js';

// DOM-Elemente
const activeList = document.getElementById('active-routine-list');
const editModal = document.getElementById('edit-modal');
const editModalContent = document.getElementById('edit-modal-content');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const tabButtons = document.querySelectorAll('.routine-tab-btn');

// Speicher-Schlüssel
const CHECKED_STATE_KEY = 'focusDayChecklistState_v19'; // Version up
const CONTENT_STORAGE_KEY = 'focusDayChecklistContent_v19';

// Standarddaten
const DEFAULT_CHECKLIST_DATA = {
    'morgen-start': {
        title: 'Morgen-Start (Hürde senken)',
        autoSelect: true, // Umbenannt von timeRestricted für Klarheit
        startTime: "06:00",
        endTime: "11:00",
        tasks: [
            { id: 'task-m1', text: 'Startzeit loggen', checked: false },
            { id: 'task-m2', text: 'Erste Stunde → Standingdesk', checked: false },
            { id: 'task-m3', text: 'Wasserflasche auffüllen', checked: false },
            { id: 'task-m4', text: 'Mails & Nachrichten checken', checked: false, duration: 15, url: 'https://gmail.com' },
            { id: 'task-m5', text: 'Kalender checken', checked: false, url: 'https://calendar.google.com' },
            { id: 'task-m6', text: 'Notizen vom Vortag checken', checked: false },
            { id: 'task-m7', text: 'Aufgaben für den Tag definieren (max. 3)', checked: false },
            { id: 'task-m8', text: 'Zeitblöcke planen', checked: false, duration: 10 },
        ]
    },
    'fokus-flow': {
        title: 'Fokus & Flow (Durchhalten)',
        autoSelect: true,
        startTime: "11:00",
        endTime: "17:00",
        tasks: [
            { id: 'task-f1', text: '90 min Deepworkphase (Vormittag)', checked: false, duration: 90 },
            { id: 'task-f2', text: '90 min Deepworkphase (Nachmittag)', checked: false, duration: 90 },
            { id: 'task-f3', text: 'Focus FM Soundtrack nutzen', checked: false },
            { id: 'task-f4', text: 'Standing Desk nutzen Nachmittags', checked: false },
            { id: 'task-f5', text: 'Trinkflasche auffüllen', checked: false },
        ]
    },
    'tages-abschluss': {
        title: 'Tages-Abschluss (Morgen vorbereiten)',
        autoSelect: true,
        startTime: "17:00",
        endTime: "22:00",
        tasks: [
            { id: 'task-e1', text: 'Wichtigste Aufgabe für morgen festlegen', checked: false },
            { id: 'task-e2', text: 'Arbeitszeit loggen (Ende)', checked: false },
            { id: 'task-e3', text: 'Clear Desk', checked: false, duration: 5 },
        ]
    }
};

let currentChecklistData = {};
let activeTabId = null;

// --- LADE-/SPEICHER-LOGIK ---

export function loadChecklistData() {
    const savedContent = localStorage.getItem(CONTENT_STORAGE_KEY);
    let content = savedContent ? JSON.parse(savedContent) : DEFAULT_CHECKLIST_DATA;
    if(!content['morgen-start']) content = DEFAULT_CHECKLIST_DATA;

    const savedState = localStorage.getItem(CHECKED_STATE_KEY);
    const state = savedState ? JSON.parse(savedState) : {};

    for (const categoryKey in content) {
        if (content[categoryKey]) {
            // Migration alter Daten (timeRestricted -> autoSelect)
            if (typeof content[categoryKey].autoSelect === 'undefined') {
                // Fallback falls altes Feld existiert
                content[categoryKey].autoSelect = content[categoryKey].timeRestricted || false; 
                content[categoryKey].startTime = content[categoryKey].startTime || "08:00";
                content[categoryKey].endTime = content[categoryKey].endTime || "18:00";
            }

            if (content[categoryKey].tasks) {
                content[categoryKey].tasks = content[categoryKey].tasks.map(task => ({
                    ...task,
                    checked: state[task.id] || false,
                    duration: task.duration || null,
                    url: task.url || null
                }));
            }
        }
    }
    currentChecklistData = content;
    
    // Initialen Tab bestimmen (Zeitbasiert)
    selectTabByTime();
}

/**
 * Wählt den aktiven Tab basierend auf der aktuellen Uhrzeit.
 * Wird nur beim Laden der Seite aufgerufen.
 */
function selectTabByTime() {
    const timeMatch = Object.keys(currentChecklistData).find(key => isCategoryInTimeWindow(key));
    
    if (timeMatch) {
        activeTabId = timeMatch;
    } else {
        // Fallback: Wenn keine Zeit passt (oder Auto-Select aus ist), nehmen wir den ersten Tab
        activeTabId = 'morgen-start';
    }
}

function saveChecklistState() {
    const state = {};
    Object.values(currentChecklistData).forEach(category => {
        category.tasks.forEach(task => {
            state[task.id] = task.checked;
        });
    });
    localStorage.setItem(CHECKED_STATE_KEY, JSON.stringify(state));
}

function saveChecklistContent() {
    const contentToSave = {};
    for (const key in currentChecklistData) {
        const cat = currentChecklistData[key];
        contentToSave[key] = {
            title: cat.title,
            autoSelect: cat.autoSelect,
            startTime: cat.startTime,
            endTime: cat.endTime,
            tasks: cat.tasks.map(({ id, text, duration, url }) => ({ id, text, duration, url }))
        };
    }
    localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify(contentToSave));
}

// --- ZEIT-LOGIK HELPER ---

function isCategoryInTimeWindow(key) {
    const cat = currentChecklistData[key];
    if (!cat || !cat.autoSelect) return false; // Ignorieren, wenn Auto-Select aus

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = cat.startTime.split(':').map(Number);
    const [endH, endM] = cat.endTime.split(':').map(Number);
    
    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;

    return currentMinutes >= startTotal && currentMinutes < endTotal;
}

// --- RENDER-LOGIK ---

export function renderChecklist() {
    if (!activeList) return;
    
    // Keine Filterung! Wir zeigen immer alle Tabs an.
    renderTabs();
    renderActiveList();
    updateProgress();
}

function renderTabs() {
    const tabButtons = document.querySelectorAll('.routine-tab-btn');

    tabButtons.forEach(btn => {
        const key = btn.dataset.tab;
        const catData = currentChecklistData[key];
        
        // Titel aktualisieren
        if(catData) {
            btn.textContent = catData.title.split('(')[0].trim();
            btn.title = catData.title;
        }

        // IMMER SICHTBAR (Wir entfernen 'hidden' falls es gesetzt war)
        btn.classList.remove('hidden');

        // Active State Styling
        if (key === activeTabId) {
            btn.classList.add('border-green-500', 'text-white');
            btn.classList.remove('border-transparent', 'text-slate-400');
        } else {
            btn.classList.remove('border-green-500', 'text-white');
            btn.classList.add('border-transparent', 'text-slate-400');
        }
    });
}

function renderActiveList() {
    activeList.innerHTML = '';
    const category = currentChecklistData[activeTabId];
    if (!category) return;

    category.tasks.forEach(task => {
        const li = document.createElement('li');
        li.className = "flex items-center justify-between bg-slate-800/50 p-2 rounded hover:bg-slate-800 transition group mb-2 border border-slate-700/50"; 
        
        const leftSide = document.createElement('div');
        leftSide.className = "flex items-start flex-grow min-w-0";

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = task.id;
        checkbox.className = "custom-checkbox h-5 w-5 rounded border-slate-600 focus:ring-green-500 mr-3 shrink-0 mt-0.5 cursor-pointer";
        checkbox.checked = task.checked;
        
        const label = document.createElement('label');
        label.htmlFor = task.id;
        label.className = "text-sm leading-snug pt-[2px] cursor-pointer text-slate-300 group-hover:text-white transition select-none";
        label.textContent = task.text;

        leftSide.appendChild(checkbox);
        leftSide.appendChild(label);
        li.appendChild(leftSide);
        
        const rightSide = document.createElement('div');
        rightSide.className = "flex items-center gap-2 flex-none ml-2";

        // Link Button
        if (task.url && task.url.trim() !== '') {
            const linkBtn = document.createElement('a');
            let safeUrl = task.url.trim();
            if (!/^https?:\/\//i.test(safeUrl)) safeUrl = 'https://' + safeUrl;
            
            linkBtn.href = safeUrl;
            linkBtn.target = "_blank";
            linkBtn.rel = "noopener noreferrer";
            linkBtn.className = "flex items-center justify-center p-1.5 rounded-md bg-slate-700 hover:bg-blue-600 text-blue-400 hover:text-white transition shadow-sm border border-slate-600";
            linkBtn.title = `Öffne ${safeUrl}`;
            linkBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>';
            rightSide.appendChild(linkBtn);
        }

        li.appendChild(rightSide);
        activeList.appendChild(li);
        checkbox.addEventListener('change', handleTaskChange);
    });
}

function handleTaskChange(e) {
    const taskId = e.target.id;
    const isChecked = e.target.checked;
    let found = false;
    
    Object.values(currentChecklistData).forEach(category => {
        const task = category.tasks.find(t => t.id === taskId);
        if (task) { task.checked = isChecked; found = true; }
    });
    
    if (found) saveChecklistState(); 
    updateProgress();
}

export function handleTaskCompletion(taskId) {
    let foundAndChecked = false;
    Object.values(currentChecklistData).forEach(category => {
        const task = category.tasks.find(t => t.id === taskId);
        if (task && !task.checked) { task.checked = true; foundAndChecked = true; }
    });
    if(foundAndChecked) { saveChecklistState(); renderChecklist(); }
}

function updateProgress() {
    let totalTasks = 0;
    let checkedTasks = 0;
    Object.values(currentChecklistData).forEach(category => {
        category.tasks.forEach(task => {
            totalTasks++;
            if (task.checked) checkedTasks++;
        });
    });
    const percentage = totalTasks > 0 ? (checkedTasks / totalTasks) * 100 : 0;
    if (progressBar) progressBar.style.width = `${percentage}%`;
    if (progressText) progressText.textContent = `${checkedTasks}/${totalTasks} Erledigt`;
    if(checkedTasks === totalTasks && totalTasks > 0) triggerConfetti();
}

// --- EDIT MODAL (MIT AUTO-SELECT SETTING) ---

let draggedItemIndex = null;
let draggedCategoryKey = null;

function openEditModal() {
    editModal.currentData = JSON.parse(JSON.stringify(currentChecklistData)); 
    renderEditModal(editModal.currentData);
    editModal.classList.remove('hidden');
    editModal.style.opacity = '0';
    editModal.querySelector('.card').style.transform = 'scale(0.95)';
    setTimeout(() => { editModal.style.opacity = '1'; editModal.querySelector('.card').style.transform = 'scale(1)'; }, 10);
}

function closeEditModal() {
    editModal.style.opacity = '0';
    editModal.querySelector('.card').style.transform = 'scale(0.95)';
    setTimeout(() => { editModal.classList.add('hidden'); }, 300);
}

function createEditableTaskItem(task, index, categoryKey) {
    const li = document.createElement('li');
    li.className = "draggable-item flex items-center group bg-slate-900/60 p-2 rounded border border-transparent hover:border-slate-600 transition gap-2 mb-2";
    li.draggable = true;
    li.dataset.index = index;
    li.dataset.category = categoryKey;
    li.dataset.taskId = task.id;

    const handle = document.createElement('div');
    handle.className = "drag-handle cursor-grab flex-none text-slate-500 hover:text-white";
    handle.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="19" r="1"></circle></svg>';
    
    const input = document.createElement('input');
    input.type = "text";
    input.value = task.text;
    input.className = "task-edit-input flex-grow min-w-0 bg-transparent text-sm rounded px-2 py-1 border border-transparent focus:border-slate-600 focus:bg-slate-800 outline-none text-slate-200 placeholder-slate-600";
    input.dataset.taskId = task.id;

    const urlInput = document.createElement('input');
    urlInput.type = "text";
    urlInput.placeholder = "URL...";
    urlInput.value = task.url || "";
    urlInput.className = "task-url-input w-24 bg-slate-800 text-xs rounded px-2 py-1 border border-slate-700 outline-none text-blue-400 placeholder-slate-600 focus:border-blue-500";
    urlInput.dataset.taskId = task.id;

    const delBtn = document.createElement('button');
    delBtn.className = "action-icon-btn delete-task-btn flex-none p-1 hover:text-red-500";
    delBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>';
    delBtn.onclick = () => {
        syncEditModalState();
        editModal.currentData[categoryKey].tasks.splice(index, 1);
        renderEditModal(editModal.currentData);
    };

    li.addEventListener('dragstart', handleDragStart);
    li.addEventListener('dragover', handleDragOver);
    li.addEventListener('drop', handleDrop);
    li.addEventListener('dragend', handleDragEnd);

    li.appendChild(handle);
    li.appendChild(input);
    li.appendChild(urlInput);
    li.appendChild(delBtn);
    return li;
}

function renderEditModal(data) {
    editModalContent.innerHTML = '';
    
    Object.keys(data).forEach(key => {
        const category = data[key];
        const col = document.createElement('div');
        col.className = 'bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 flex flex-col h-full min-h-0'; 
        col.dataset.category = key;
        
        // Titel Input
        const headerInput = document.createElement('input');
        headerInput.type = "text";
        headerInput.value = category.title;
        headerInput.className = "category-title-input font-bold text-white bg-transparent border-b border-transparent focus:border-green-500 outline-none mb-2 pb-1 text-sm w-full focus:bg-slate-800/50 px-1 rounded transition";
        headerInput.dataset.category = key;
        col.appendChild(headerInput);

        // --- ZEIT-STEUERUNG UI (NEU: AUTO-SELECT) ---
        const timeControlDiv = document.createElement('div');
        timeControlDiv.className = "mb-3 p-2 bg-slate-800/50 rounded border border-slate-700/50 flex flex-col gap-2";
        
        const toggleLabel = document.createElement('label');
        toggleLabel.className = "flex items-center gap-2 cursor-pointer text-xs text-slate-400 select-none";
        const toggleCheck = document.createElement('input');
        toggleCheck.type = "checkbox";
        toggleCheck.className = "accent-green-500 w-3 h-3 rounded category-auto-select-toggle";
        toggleCheck.checked = category.autoSelect || false;
        toggleCheck.dataset.category = key;
        
        toggleLabel.appendChild(toggleCheck);
        toggleLabel.appendChild(document.createTextNode("Automatisch auswählen von/bis:"));
        timeControlDiv.appendChild(toggleLabel);

        const inputsDiv = document.createElement('div');
        inputsDiv.className = `flex items-center gap-2 transition-all overflow-hidden ${category.autoSelect ? 'max-h-10 opacity-100' : 'max-h-0 opacity-50'}`;
        
        const startInp = document.createElement('input');
        startInp.type = "time";
        startInp.value = category.startTime || "08:00";
        startInp.className = "category-time-start bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-xs text-white focus:border-blue-500 outline-none";
        startInp.dataset.category = key;

        const endInp = document.createElement('input');
        endInp.type = "time";
        endInp.value = category.endTime || "18:00";
        endInp.className = "category-time-end bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-xs text-white focus:border-blue-500 outline-none";
        endInp.dataset.category = key;

        inputsDiv.innerHTML = `<span class="text-[10px] text-slate-500">Start:</span>`;
        inputsDiv.appendChild(startInp);
        inputsDiv.innerHTML += `<span class="text-[10px] text-slate-500">Ende:</span>`;
        inputsDiv.appendChild(endInp);
        
        timeControlDiv.appendChild(inputsDiv);
        col.appendChild(timeControlDiv);

        toggleCheck.addEventListener('change', (e) => {
            if(e.target.checked) {
                inputsDiv.classList.remove('max-h-0', 'opacity-50');
                inputsDiv.classList.add('max-h-10', 'opacity-100');
            } else {
                inputsDiv.classList.add('max-h-0', 'opacity-50');
                inputsDiv.classList.remove('max-h-10', 'opacity-100');
            }
        });
        // ----------------------------------------

        const listContainer = document.createElement('ul');
        listContainer.className = "space-y-1 pl-0 text-sm flex-grow overflow-y-auto custom-scroll min-h-0 mb-4 pr-1";
        listContainer.dataset.category = key;
        
        category.tasks.forEach((task, index) => {
            const li = createEditableTaskItem(task, index, key);
            listContainer.appendChild(li);
        });
        col.appendChild(listContainer);

        const footer = document.createElement('div');
        footer.className = "flex-none mt-auto pt-2 border-t border-slate-800 flex gap-2";
        const addInput = document.createElement('input');
        addInput.type = "text";
        addInput.placeholder = "Neuer Task...";
        addInput.className = "flex-grow bg-slate-800 text-sm rounded px-3 py-1.5 focus:ring-1 focus:ring-green-500 border border-slate-700 outline-none text-slate-200 placeholder-slate-500";
        const addBtn = document.createElement('button');
        addBtn.textContent = "+";
        addBtn.className = "flex-none bg-blue-600 hover:bg-blue-500 text-white font-bold py-1 px-3 rounded transition";
        
        const handleAdd = () => {
            if(addInput.value.trim()) {
                syncEditModalState(); 
                editModal.currentData[key].tasks.push({ id: generateUUID(), text: addInput.value.trim(), checked: false, duration: null, url: null });
                renderEditModal(editModal.currentData);
                setTimeout(() => {
                    const inputs = editModalContent.querySelectorAll(`ul[data-category="${key}"] input.task-edit-input`);
                    if(inputs.length > 0) inputs[inputs.length-1].focus();
                }, 50);
            }
        };
        addBtn.onclick = handleAdd;
        addInput.onkeydown = (e) => { if(e.key === 'Enter') handleAdd(); };

        footer.appendChild(addInput);
        footer.appendChild(addBtn);
        col.appendChild(footer);
        editModalContent.appendChild(col);
    });
}

function handleDragStart(e) {
    syncEditModalState(); 
    draggedItemIndex = parseInt(this.dataset.index);
    draggedCategoryKey = this.dataset.category;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', draggedItemIndex); 
    setTimeout(() => { this.classList.add('dragging'); }, 0);
}
function handleDragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }
function handleDragEnd(e) { this.classList.remove('dragging'); }
function handleDrop(e) {
    e.stopPropagation(); e.preventDefault();
    const targetItem = e.target.closest('.draggable-item');
    if (targetItem) {
        const targetIndex = parseInt(targetItem.dataset.index);
        const targetCategory = targetItem.dataset.category;
        if (draggedItemIndex !== null && draggedCategoryKey === targetCategory && draggedItemIndex !== targetIndex) {
            const tasks = editModal.currentData[draggedCategoryKey].tasks;
            const itemToMove = tasks[draggedItemIndex];
            tasks.splice(draggedItemIndex, 1);
            tasks.splice(targetIndex, 0, itemToMove);
            renderEditModal(editModal.currentData);
        }
    }
    return false;
}

function syncEditModalState() {
     const temp = editModal.currentData;
     
     // Titles
     editModalContent.querySelectorAll('input.category-title-input').forEach(input => {
         if(temp[input.dataset.category]) temp[input.dataset.category].title = input.value.trim();
     });

     // Auto-Select Settings
     editModalContent.querySelectorAll('input.category-auto-select-toggle').forEach(input => {
         if(temp[input.dataset.category]) temp[input.dataset.category].autoSelect = input.checked;
     });
     editModalContent.querySelectorAll('input.category-time-start').forEach(input => {
         if(temp[input.dataset.category]) temp[input.dataset.category].startTime = input.value;
     });
     editModalContent.querySelectorAll('input.category-time-end').forEach(input => {
         if(temp[input.dataset.category]) temp[input.dataset.category].endTime = input.value;
     });

     // Tasks
     editModalContent.querySelectorAll('input.task-edit-input').forEach(input => {
        const task = temp[input.closest('ul').dataset.category].tasks.find(t => t.id === input.dataset.taskId);
        if (task) task.text = input.value; 
     });
     editModalContent.querySelectorAll('input.task-url-input').forEach(input => {
        const task = temp[input.closest('ul').dataset.category].tasks.find(t => t.id === input.dataset.taskId);
        if (task) task.url = input.value.trim();
     });
}

function saveEditedChecklist() {
    syncEditModalState();
    Object.values(editModal.currentData).forEach(category => {
        category.tasks = category.tasks.filter(task => task.text.trim() !== "");
    });
    currentChecklistData = editModal.currentData;
    saveChecklistContent();
    
    // Nach Speichern: Prüfen ob wir den Tab basierend auf neuer Zeit wechseln sollen
    selectTabByTime();
    
    renderChecklist();
    closeEditModal();
}

export function setupChecklistListeners() {
    document.getElementById('reset-checklist-btn').addEventListener('click', () => {
        if(confirm("Alle Checkboxen zurücksetzen?")) {
            Object.values(currentChecklistData).forEach(category => { category.tasks.forEach(task => task.checked = false); });
            saveChecklistState(); renderChecklist(); 
        }
    });
    document.getElementById('edit-checklist-btn').addEventListener('click', openEditModal);
    document.getElementById('cancel-edit-btn').addEventListener('click', closeEditModal);
    document.getElementById('save-edit-btn').addEventListener('click', saveEditedChecklist);
    
    document.querySelectorAll('.routine-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            activeTabId = btn.dataset.tab;
            renderChecklist();
        });
    });
}