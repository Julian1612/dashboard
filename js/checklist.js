// js/checklist.js

import { generateUUID } from './utils.js';
import { triggerConfetti } from './confetti.js';
import { askToStartMusic } from './timer.js'; 

// DOM-Elemente
const morningList = document.getElementById('morgen-start-list');
const focusList = document.getElementById('fokus-flow-list');
const eveningList = document.getElementById('tages-abschluss-list');
const editModal = document.getElementById('edit-modal');
const editModalContent = document.getElementById('edit-modal-content');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
// NEU: Contribution Graph
const contributionGraphContainer = document.getElementById('contribution-graph-container');

// Speicher-Schlüssel
const CHECKED_STATE_KEY = 'focusDayChecklistState_v16';
const CONTENT_STORAGE_KEY = 'focusDayChecklistContent_v16';
const CONTRIBUTION_DATA_KEY = 'focusDayContributionData_v1';
const HABITIFY_TOKEN_KEY = 'habitify_api_token';

// API-Konstanten
const HABITIFY_API_BASE = 'https://api.habitify.me';

// Standarddaten
const DEFAULT_CHECKLIST_DATA = {
    'morgen-start': {
        title: 'Morgen-Start (Hürde senken)',
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
        tasks: [
            { id: 'task-e1', text: 'Wichtigste Aufgabe für morgen festlegen', checked: false },
            { id: 'task-e2', text: 'Arbeitszeit loggen (Ende)', checked: false },
            { id: 'task-e3', text: 'Clear Desk', checked: false, duration: 5 },
        ]
    }
};

let currentChecklistData = {};
let contributionData = {};
let availableHabits = []; // Temporärer Cache für Habitify-Habits während des Editiervorgangs

// --- HILFSFUNKTIONEN ---

function getTodayKey() {
    return new Date().toISOString().split('T')[0];
}

// --- HABITIFY API LOGIK ---

async function syncWithHabitify(habitId, status) {
    const token = localStorage.getItem(HABITIFY_TOKEN_KEY);
    if (!token || !habitId) return;

    try {
        await fetch(`${HABITIFY_API_BASE}/logs/${habitId}`, {
            method: status ? 'POST' : 'DELETE',
            headers: { 
                'Authorization': token,
                'Content-Type': 'application/json' 
            }
        });
    } catch (err) {
        console.error("Habitify Sync Fehler:", err);
    }
}

export async function fetchHabitifyHabits() {
    const tokenInput = document.getElementById('habitify-token-input');
    const token = tokenInput.value.trim();
    if (!token) {
        alert("Bitte gib einen API Token ein.");
        return;
    }
    localStorage.setItem(HABITIFY_TOKEN_KEY, token);
    try {
        const res = await fetch(`${HABITIFY_API_BASE}/habits`, {
            headers: { 'Authorization': token }
        });
        const data = await res.json();
        availableHabits = data.data || [];
        renderEditModal(editModal.currentData);
    } catch (err) {
        alert("Fehler beim Laden der Habits.");
    }
}

// --- LADE-/SPEICHER-LOGIK ---

export function loadChecklistData() {
    const savedContent = localStorage.getItem(CONTENT_STORAGE_KEY);
    let content = savedContent ? JSON.parse(savedContent) : DEFAULT_CHECKLIST_DATA;
    if(!content['morgen-start']) content = DEFAULT_CHECKLIST_DATA;

    const savedState = localStorage.getItem(CHECKED_STATE_KEY);
    const state = savedState ? JSON.parse(savedState) : {};

    for (const categoryKey in content) {
        if (content[categoryKey] && content[categoryKey].tasks) {
            content[categoryKey].tasks = content[categoryKey].tasks.map(task => ({
                ...task,
                checked: state[task.id] || false,
                duration: task.duration || null,
                url: task.url || null,
                habitifyId: task.habitifyId || null
            }));
        }
    }
    currentChecklistData = content;
    
    const savedContribution = localStorage.getItem(CONTRIBUTION_DATA_KEY);
    try {
        contributionData = savedContribution ? JSON.parse(savedContribution) : {};
    } catch(e) { contributionData = {}; }

    // Token initialisieren
    const savedToken = localStorage.getItem(HABITIFY_TOKEN_KEY);
    const tokenInput = document.getElementById('habitify-token-input');
    if (savedToken && tokenInput) tokenInput.value = savedToken;
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
        contentToSave[key] = {
            title: currentChecklistData[key].title,
            tasks: currentChecklistData[key].tasks.map(({ id, text, duration, url, habitifyId }) => ({ id, text, duration, url, habitifyId }))
        };
    }
    localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify(contentToSave));
}

function saveContributionData() {
    localStorage.setItem(CONTRIBUTION_DATA_KEY, JSON.stringify(contributionData));
}

// --- RENDER- & UPDATE-LOGIK ---

export function renderChecklist() {
    morningList.innerHTML = '';
    focusList.innerHTML = '';
    eveningList.innerHTML = '';

    const listMap = { 'morgen-start': morningList, 'fokus-flow': focusList, 'tages-abschluss': eveningList };

    Object.keys(currentChecklistData).forEach(key => {
        const category = currentChecklistData[key];
        const targetList = listMap[key];
        if (!targetList) return;
        
        const titleEl = document.querySelector(`#${key}-container h3`);
        if(titleEl) titleEl.textContent = category.title;

        category.tasks.forEach(task => {
            const li = document.createElement('li');
            li.className = "flex items-center justify-between"; 
            const leftSide = document.createElement('div');
            leftSide.className = "flex items-start flex-grow min-w-0";

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = task.id;
            checkbox.className = "custom-checkbox h-4 w-4 rounded border-slate-600 focus:ring-green-500 mr-3 shrink-0 mt-1";
            checkbox.checked = task.checked;
            
            const label = document.createElement('label');
            label.htmlFor = task.id;
            label.className = "text-sm leading-tight pt-[2px] truncate";
            // Zeige Habitify-Indikator
            label.innerHTML = task.habitifyId ? `<span class="text-blue-400 font-bold mr-1">H</span>${task.text}` : task.text;

            leftSide.appendChild(checkbox);
            leftSide.appendChild(label);
            li.appendChild(leftSide);
            
            const rightSide = document.createElement('div');
            rightSide.className = "flex items-center gap-2 flex-none ml-2";

            if (task.url && task.url.trim() !== '') {
                const linkBtn = document.createElement('a');
                linkBtn.href = task.url;
                linkBtn.target = "_blank";
                linkBtn.className = "task-link-btn flex items-center justify-center p-1 rounded-full bg-slate-800 border border-slate-700";
                linkBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`;
                rightSide.appendChild(linkBtn);
            }

            if (task.duration && task.duration > 0) {
                const playBtn = document.createElement('button');
                playBtn.className = "task-timer-btn flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 text-green-500 px-2 py-1 rounded border border-slate-700";
                playBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg><span>${task.duration}m</span>`;
                playBtn.onclick = () => askToStartMusic(task.id, task.duration);
                rightSide.appendChild(playBtn);
            }
            
            li.appendChild(rightSide);
            targetList.appendChild(li);
            checkbox.addEventListener('change', handleTaskChange);
        });
    });
    updateProgress();
}

function handleTaskChange(e) {
    const taskId = e.target.id;
    const isChecked = e.target.checked;
    let foundTask = null;
    Object.values(currentChecklistData).forEach(category => {
        const task = category.tasks.find(t => t.id === taskId);
        if (task) { task.checked = isChecked; foundTask = task; }
    });
    
    if (foundTask) { 
        saveChecklistState(); 
        if (foundTask.habitifyId) syncWithHabitify(foundTask.habitifyId, isChecked);
    }
    updateProgress();
}

export function handleTaskCompletion(taskId) {
    let foundAndChecked = false;
    let completedTask = null;
    Object.values(currentChecklistData).forEach(category => {
        const task = category.tasks.find(t => t.id === taskId);
        if (task && !task.checked) { task.checked = true; foundAndChecked = true; completedTask = task; }
    });
    if(foundAndChecked) {
        saveChecklistState();
        renderChecklist();
        if (completedTask.habitifyId) syncWithHabitify(completedTask.habitifyId, true);
    }
}

function updateProgress() {
    let totalTasks = 0; let checkedTasks = 0;
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
    
    logDailyProgress(checkedTasks, totalTasks);
    renderContributionGraph();
}

function logDailyProgress(checked, total) {
    contributionData[getTodayKey()] = { checked, total };
    saveContributionData();
}

export function renderContributionGraph() {
    if (!contributionGraphContainer) return;
    contributionGraphContainer.innerHTML = '';
    const weeksToDisplay = 16; const daysToDisplay = weeksToDisplay * 7;
    const now = new Date(); const displayData = [];
    const startDate = new Date(now); startDate.setDate(now.getDate() - daysToDisplay + 1); 
    
    for (let i = 0; i < daysToDisplay; i++) {
        const date = new Date(startDate); date.setDate(startDate.getDate() + i);
        const dateKey = date.toISOString().split('T')[0];
        displayData.push({ date: dateKey, ...contributionData[dateKey] });
    }
    
    const graphWrapper = document.createElement('div');
    graphWrapper.className = 'flex flex-row-reverse gap-1';
    for (let week = weeksToDisplay - 1; week >= 0; week--) {
        const weekCol = document.createElement('div');
        weekCol.className = 'flex flex-col-reverse gap-[2px]'; 
        for (let day = 6; day >= 0; day--) { 
            const index = week * 7 + day;
            if (index >= displayData.length) continue; 
            const dailyData = displayData[index];
            const square = document.createElement('div');
            square.className = 'contribution-square';
            if (dailyData.checked !== undefined) {
                const pct = dailyData.total > 0 ? (dailyData.checked / dailyData.total) : 0;
                let lvl = pct >= 0.9 ? 4 : pct >= 0.7 ? 3 : pct >= 0.4 ? 2 : pct > 0 ? 1 : 0;
                if (lvl > 0) square.classList.add(`level-${lvl}`);
                square.title = `${dailyData.date}: ${dailyData.checked}/${dailyData.total}`;
            }
            weekCol.appendChild(square);
        }
        graphWrapper.appendChild(weekCol);
    }
    contributionGraphContainer.appendChild(graphWrapper);
}

// --- EDIT MODAL & D&D ---

let draggedItemIndex = null; let draggedCategoryKey = null;

function openEditModal() {
    editModal.currentData = JSON.parse(JSON.stringify(currentChecklistData)); 
    renderEditModal(editModal.currentData);
    editModal.classList.remove('hidden');
    setTimeout(() => { editModal.style.opacity = '1'; }, 10);
}

function closeEditModal() {
    editModal.style.opacity = '0';
    setTimeout(() => { editModal.classList.add('hidden'); }, 300);
}

function createEditableTaskItem(task, index, categoryKey) {
    const li = document.createElement('li');
    li.className = "draggable-item flex items-center group bg-slate-800/80 p-2 rounded border border-transparent hover:border-slate-600 transition gap-2";
    li.draggable = true; li.dataset.index = index; li.dataset.category = categoryKey; li.dataset.taskId = task.id;

    const handle = document.createElement('div');
    handle.className = "drag-handle cursor-grab flex-none";
    handle.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="19" r="1"></circle></svg>';
    
    const input = document.createElement('input');
    input.type = "text"; input.value = task.text;
    input.className = "task-edit-input flex-grow min-w-0 bg-transparent text-sm outline-none text-slate-200";
    input.dataset.taskId = task.id;

    const urlInput = document.createElement('input');
    urlInput.type = "text"; urlInput.value = task.url || "";
    urlInput.className = "task-url-input w-24 bg-slate-700/50 text-xs rounded px-1 outline-none text-blue-300";
    urlInput.dataset.taskId = task.id;

    const timeInput = document.createElement('input');
    timeInput.type = "number"; if(task.duration) timeInput.value = task.duration;
    timeInput.className = "task-duration-input w-12 text-center bg-slate-700/50 text-xs rounded px-1 outline-none text-green-400";
    timeInput.dataset.taskId = task.id;

    const delBtn = document.createElement('button');
    delBtn.className = "action-icon-btn delete-task-btn flex-none";
    delBtn.innerHTML = '<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" /></svg>';
    delBtn.onclick = () => { syncEditModalState(); editModal.currentData[categoryKey].tasks.splice(index, 1); renderEditModal(editModal.currentData); };

    li.addEventListener('dragstart', handleDragStart); li.addEventListener('dragover', handleDragOver); li.addEventListener('drop', handleDrop); li.addEventListener('dragend', handleDragEnd);

    li.appendChild(handle); li.appendChild(input); li.appendChild(urlInput); li.appendChild(timeInput); li.appendChild(delBtn);
    return li;
}

function renderEditModal(data) {
    editModalContent.innerHTML = '';
    Object.keys(data).forEach(key => {
        const category = data[key];
        const col = document.createElement('div');
        col.className = 'bg-slate-900/50 p-4 rounded-lg flex flex-col h-full min-h-0'; 
        col.dataset.category = key;
        
        const header = document.createElement('h4');
        header.className = "font-semibold text-white mb-3 text-base border-b border-slate-700 pb-2";
        header.textContent = category.title;
        col.appendChild(header);

        const listContainer = document.createElement('ul');
        listContainer.className = "space-y-2 text-sm flex-grow overflow-y-auto mb-4 pr-1";
        listContainer.dataset.category = key;
        category.tasks.forEach((task, index) => listContainer.appendChild(createEditableTaskItem(task, index, key)));
        col.appendChild(listContainer);

        const footer = document.createElement('div');
        footer.className = "flex-none mt-auto pt-2 border-t border-slate-800 space-y-2";
        
        const addWrapper = document.createElement('div');
        addWrapper.className = "flex space-x-2";
        const addInput = document.createElement('input');
        addInput.type = "text"; addInput.placeholder = "Neue Aufgabe...";
        addInput.className = "w-full bg-slate-700 text-sm rounded px-2 outline-none text-slate-200";
        const addBtn = document.createElement('button');
        addBtn.textContent = "Add"; addBtn.className = "bg-blue-600 text-xs py-1 px-3 rounded";
        addBtn.onclick = () => { if(addInput.value.trim()) { syncEditModalState(); editModal.currentData[key].tasks.push({ id: generateUUID(), text: addInput.value.trim(), checked: false, habitifyId: null }); renderEditModal(editModal.currentData); } };
        addWrapper.appendChild(addInput); addWrapper.appendChild(addBtn);
        footer.appendChild(addWrapper);

        if (availableHabits.length > 0) {
            const hSelect = document.createElement('select');
            hSelect.className = "w-full bg-blue-900/30 text-[11px] rounded px-2 py-1 text-blue-300 outline-none";
            hSelect.innerHTML = '<option value="">+ Habitify Import</option>';
            availableHabits.forEach(h => hSelect.innerHTML += `<option value="${h.id}">${h.name}</option>`);
            hSelect.onchange = (e) => { if(e.target.value) { syncEditModalState(); editModal.currentData[key].tasks.push({ id: generateUUID(), text: e.target.options[e.target.selectedIndex].text, checked: false, habitifyId: e.target.value }); renderEditModal(editModal.currentData); } };
            footer.appendChild(hSelect);
        }
        col.appendChild(footer);
        editModalContent.appendChild(col);
    });
}

function handleDragStart(e) { syncEditModalState(); draggedItemIndex = parseInt(this.dataset.index); draggedCategoryKey = this.dataset.category; setTimeout(() => { this.classList.add('dragging'); }, 0); }
function handleDragOver(e) { e.preventDefault(); const item = e.target.closest('.draggable-item'); if(item && item !== this) item.classList.add('drag-over'); }
function handleDragEnd() { this.classList.remove('dragging'); document.querySelectorAll('.draggable-item').forEach(i => i.classList.remove('drag-over')); }
function handleDrop(e) { e.stopPropagation(); const target = e.target.closest('.draggable-item'); if (target && draggedCategoryKey === target.dataset.category) { const tasks = editModal.currentData[draggedCategoryKey].tasks; const item = tasks[draggedItemIndex]; tasks.splice(draggedItemIndex, 1); tasks.splice(parseInt(target.dataset.index), 0, item); renderEditModal(editModal.currentData); } return false; }

function syncEditModalState() {
     const temp = editModal.currentData;
     editModalContent.querySelectorAll('input.task-edit-input').forEach(i => { const t = Object.values(temp).flatMap(c => c.tasks).find(x => x.id === i.dataset.taskId); if(t) t.text = i.value; });
     editModalContent.querySelectorAll('input.task-url-input').forEach(i => { const t = Object.values(temp).flatMap(c => c.tasks).find(x => x.id === i.dataset.taskId); if(t) t.url = i.value.trim() || null; });
     editModalContent.querySelectorAll('input.task-duration-input').forEach(i => { const t = Object.values(temp).flatMap(c => c.tasks).find(x => x.id === i.dataset.taskId); if(t) t.duration = parseInt(i.value) || null; });
}

function saveEditedChecklist() { syncEditModalState(); currentChecklistData = editModal.currentData; saveChecklistContent(); renderChecklist(); closeEditModal(); }

export function setupChecklistListeners() {
    document.getElementById('reset-checklist-btn').onclick = () => { if(confirm("Reset?")) { Object.values(currentChecklistData).forEach(c => c.tasks.forEach(t => t.checked = false)); saveChecklistState(); renderChecklist(); } };
    document.getElementById('edit-checklist-btn').onclick = openEditModal;
    document.getElementById('cancel-edit-btn').onclick = closeEditModal;
    document.getElementById('save-edit-btn').onclick = saveEditedChecklist;
    document.getElementById('fetch-habitify-btn').onclick = fetchHabitifyHabits;
}