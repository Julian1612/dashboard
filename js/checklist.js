// Abhängigkeit von Utils und Timer
const generateUUID = window.generateUUID;
const askToStartMusic = window.askToStartMusic; 
const triggerConfetti = window.triggerConfetti;

// Checklist Elemente
const morningList = document.getElementById('morgen-start-list');
const focusList = document.getElementById('fokus-flow-list');
const eveningList = document.getElementById('tages-abschluss-list');
const editChecklistBtn = document.getElementById('edit-checklist-btn');

const editModal = document.getElementById('edit-modal');
const editModalContent = document.getElementById('edit-modal-content');
const saveEditBtn = document.getElementById('save-edit-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');

const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const resetChecklistBtn = document.getElementById('reset-checklist-btn'); 

const CHECKED_STATE_KEY = 'focusDayChecklistState_v16';
const CONTENT_STORAGE_KEY = 'focusDayChecklistContent_v16';

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

// Drag and Drop State
let draggedItemIndex = null;
let draggedCategoryKey = null;

/** Lädt Checklisten-Daten und deren Zustand aus dem Local Storage. */
function loadChecklistData() {
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
                url: task.url || null
            }));
        }
    }
    currentChecklistData = content;
}

/** Speichert den "checked"-Zustand der Tasks. */
function saveChecklistState() {
    const state = {};
    Object.values(currentChecklistData).forEach(category => {
        category.tasks.forEach(task => {
            state[task.id] = task.checked;
        });
    });
    localStorage.setItem(CHECKED_STATE_KEY, JSON.stringify(state));
}

/** Speichert den Inhalt (Text, URL, Dauer) der Tasks. */
function saveChecklistContent() {
    const contentToSave = {};
    for (const key in currentChecklistData) {
        contentToSave[key] = {
            title: currentChecklistData[key].title,
            tasks: currentChecklistData[key].tasks.map(({ id, text, duration, url }) => ({ id, text, duration, url }))
        };
    }
    localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify(contentToSave));
}

/** Rendert die Checkliste im Haupt-Dashboard. */
function renderChecklist() {
    morningList.innerHTML = '';
    focusList.innerHTML = '';
    eveningList.innerHTML = '';

    const listMap = {
        'morgen-start': morningList,
        'fokus-flow': focusList,
        'tages-abschluss': eveningList
    };

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
            // GEÄNDERT: Checkbox nutzt nun Rot-500 für Fokus Ring
            checkbox.className = "custom-checkbox h-4 w-4 rounded border-slate-600 focus:ring-red-500 mr-3 shrink-0 mt-1";
            checkbox.checked = task.checked;
            
            const label = document.createElement('label');
            label.htmlFor = task.id;
            label.className = "text-sm leading-tight pt-[2px] truncate";
            label.textContent = task.text;

            leftSide.appendChild(checkbox);
            leftSide.appendChild(label);
            li.appendChild(leftSide);
            
            const rightSide = document.createElement('div');
            rightSide.className = "flex items-center gap-2 flex-none ml-2";

            // LINK BUTTON
            if (task.url && task.url.trim() !== '') {
                const linkBtn = document.createElement('a');
                linkBtn.href = task.url;
                linkBtn.target = "_blank";
                linkBtn.rel = "noopener noreferrer";
                linkBtn.className = "task-link-btn flex items-center justify-center p-1 rounded-full bg-slate-800 border border-slate-700";
                linkBtn.title = `Öffne ${task.url}`;
                linkBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                `;
                rightSide.appendChild(linkBtn);
            }

            // PLAY BUTTON
            if (task.duration && task.duration > 0) {
                const playBtn = document.createElement('button');
                // GEÄNDERT: Textfarbe des Buttons ist nun Gelb-500 (Akzent)
                playBtn.className = "task-timer-btn flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 text-yellow-500 px-2 py-1 rounded border border-slate-700";
                playBtn.title = `${task.duration} Min. Timer starten`;
                playBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                    <span>${task.duration}m</span>
                `;
                playBtn.onclick = (e) => {
                    e.preventDefault();
                    // Abhängigkeit vom Timer: askToStartMusic muss global verfügbar sein
                    if(askToStartMusic) askToStartMusic(task.id, task.duration);
                };
                rightSide.appendChild(playBtn);
            }
            
            li.appendChild(rightSide);
            targetList.appendChild(li);
            checkbox.addEventListener('change', handleTaskChange);
        });
    });
    updateProgress();
}

/** Behandelt das manuelle Ändern einer Checkbox. */
function handleTaskChange(e) {
    const taskId = e.target.id;
    const isChecked = e.target.checked;
    let found = false;
    Object.values(currentChecklistData).forEach(category => {
        const task = category.tasks.find(t => t.id === taskId);
        if (task) { task.checked = isChecked; found = true; }
    });
    if (found) { saveChecklistState(); }
    
    // Konfetti-Effekt (Abhängigkeit von confetti.js)
    if(isChecked && window.triggerConfetti) {
         const rect = e.target.getBoundingClientRect();
         const particleCount = 20;
         // GEÄNDERT: Konfetti-Farben auf Bauhaus-Palette (Rot/Gelb/Blau)
         const colors = ['#ef4444', '#facc15', '#3b82f6', '#dc2626']; 
         for (let i = 0; i < particleCount; i++) {
             window.particles.push({ // particles ist in confetti.js definiert
                 x: rect.left + rect.width / 2,
                 y: rect.top + rect.height / 2,
                 size: Math.random() * 2 + 1,
                 speedX: (Math.random() - 0.5) * 4,
                 speedY: (Math.random() - 0.5) * 4,
                 color: colors[Math.floor(Math.random() * colors.length)],
                 life: 0.5,
             });
         }
    }
    updateProgress();
}

/** * Wird vom Timer (timer.js) aufgerufen, um eine Aufgabe automatisch abzuhaken.
 * @param {string} taskId - Die ID der abzuhakenden Aufgabe.
 */
function handleTaskAutoCheck(taskId) {
    let foundAndChecked = false;
    Object.values(currentChecklistData).forEach(category => {
        const task = category.tasks.find(t => t.id === taskId);
        if (task && !task.checked) { 
            task.checked = true; 
            foundAndChecked = true;
        }
    });
    
    if(foundAndChecked) {
        saveChecklistState();
        renderChecklist();
        // Optionale visuelle Bestätigung, dass Task abgehakt wurde, z.B. Konfetti
        if(window.triggerConfetti) window.triggerConfetti();
    }
}


/** Aktualisiert die Fortschrittsanzeige (Balken und Text). */
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
    progressBar.style.width = `${percentage}%`;
    progressText.textContent = `${checkedTasks}/${totalTasks} Erledigt`;
    if(checkedTasks === totalTasks && totalTasks > 0 && window.triggerConfetti) {
        window.triggerConfetti();
    }
}

// --- DRAG AND DROP & EDIT MODAL LOGIC ---

/** Öffnet das Bearbeitungs-Modal. */
function openEditModal() {
    editModal.currentData = JSON.parse(JSON.stringify(currentChecklistData)); 
    renderEditModal(editModal.currentData);
    
    editModal.classList.remove('hidden');
    editModal.style.opacity = '0';
    editModal.querySelector('.card').style.transform = 'scale(0.95)';
    setTimeout(() => { 
        editModal.style.opacity = '1';
        editModal.querySelector('.card').style.transform = 'scale(1)';
    }, 10);
}

/** Schließt das Bearbeitungs-Modal. */
function closeEditModal() {
    editModal.style.opacity = '0';
    editModal.querySelector('.card').style.transform = 'scale(0.95)';
    setTimeout(() => { editModal.classList.add('hidden'); }, 300);
}

/** Rendert den Inhalt des Bearbeitungs-Modals. */
function renderEditModal(data) {
    // ... (Logik wie in der Originaldatei)
    // Nur die `createEditableTaskItem` Funktion und die Schleife zur Erstellung der Struktur wird benötigt.
    // (Der Umfang des Codes ist zu groß für eine vollständige Wiederholung, 
    // daher wird hier nur der Platzhalter für die Komplexität eingefügt.)
    
    editModalContent.innerHTML = '';
            
    Object.keys(data).forEach(key => {
        const category = data[key];
        
        const col = document.createElement('div');
        col.className = 'bg-slate-900/50 p-4 rounded-lg flex flex-col h-full min-h-0'; 
        col.dataset.category = key;
        
        const header = document.createElement('h4');
        // GEÄNDERT: Add-Button Ring ist Blau-500
        header.className = "font-semibold text-white mb-3 text-base border-b border-slate-700 pb-2 flex-none";
        header.textContent = category.title;
        col.appendChild(header);

        const listContainer = document.createElement('ul');
        listContainer.className = "space-y-2 pl-1 text-sm flex-grow overflow-y-auto custom-scroll min-h-0 mb-4 pr-1";
        listContainer.dataset.category = key;
        
        category.tasks.forEach((task, index) => {
            const li = createEditableTaskItem(task, index, key);
            listContainer.appendChild(li);
        });
        col.appendChild(listContainer);

        // Footer (Add Button)
        const footer = document.createElement('div');
        footer.className = "flex-none mt-auto pt-2 border-t border-slate-800 flex space-x-2";
        
        const addInput = document.createElement('input');
        addInput.type = "text";
        addInput.placeholder = "Neue Aufgabe...";
        // GEÄNDERT: Add-Button Ring ist Blau-500
        addInput.className = "w-full bg-slate-700 text-sm rounded-md px-2 py-1 focus:ring-blue-500 border border-transparent focus:border-blue-500 outline-none text-slate-200";
        
        const addBtn = document.createElement('button');
        addBtn.textContent = "Add";
        // BEIBEHALTEN: Add Button ist Blau-600 (Tool/Struktur)
        addBtn.className = "flex-none bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-1 px-3 rounded-md transition";
        
        const handleAdd = () => {
            const text = addInput.value.trim();
            if(text) {
                syncEditModalState(); 
                const newTask = { id: generateUUID(), text: text, checked: false, duration: null, url: null };
                editModal.currentData[key].tasks.push(newTask);
                renderEditModal(editModal.currentData);
                
                setTimeout(() => {
                    const lists = editModalContent.querySelectorAll(`ul[data-category="${key}"]`);
                    const currentList = lists[0];
                    if(currentList) {
                        currentList.scrollTop = currentList.scrollHeight;
                        const inputs = currentList.querySelectorAll('input.task-edit-input');
                        const lastInput = inputs[inputs.length - 1];
                        if(lastInput) lastInput.focus();
                    }
                }, 50);
            }
        };

        addBtn.addEventListener('click', handleAdd);
        addInput.addEventListener('keydown', (e) => { if(e.key === 'Enter') handleAdd(); });

        footer.appendChild(addInput);
        footer.appendChild(addBtn);
        col.appendChild(footer);

        editModalContent.appendChild(col);
    });
}

/** Erstellt ein bearbeitbares Task-Element für das Modal. */
function createEditableTaskItem(task, index, categoryKey) {
    const li = document.createElement('li');
    li.className = "draggable-item flex items-center group bg-slate-800/80 p-2 rounded border border-transparent hover:border-slate-600 transition gap-2";
    li.draggable = true;
    li.dataset.index = index;
    li.dataset.category = categoryKey;
    li.dataset.taskId = task.id;

    // Handle
    const handle = document.createElement('div');
    handle.className = "drag-handle cursor-grab flex-none";
    handle.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="19" r="1"></circle></svg>';
    
    // Text Input
    const input = document.createElement('input');
    input.type = "text";
    input.value = task.text;
    // GEÄNDERT: Text Input Fokus ist nun Rot-500
    input.className = "task-edit-input flex-grow min-w-0 bg-transparent text-sm rounded-md px-2 py-1 border-none outline-none text-slate-200 placeholder-slate-500 focus:ring-1 focus:ring-red-500/50";
    input.dataset.taskId = task.id;

    // URL Input
    const urlInput = document.createElement('input');
    urlInput.type = "text";
    urlInput.placeholder = "https://...";
    urlInput.value = task.url || "";
    // GEÄNDERT: URL Input Farbe ist Blau-300, Fokus ist Blau-500
    urlInput.className = "task-url-input w-24 bg-slate-700/50 text-xs rounded-md px-1 py-1 border border-slate-700 outline-none text-blue-300 placeholder-slate-500 focus:ring-1 focus:ring-blue-500/50";
    urlInput.dataset.taskId = task.id;
    urlInput.title = "URL für externen Link (optional)";

    // Timer Input (Minuten)
    const timeInput = document.createElement('input');
    timeInput.type = "number";
    timeInput.placeholder = "Min.";
    timeInput.min = "1";
    timeInput.max = "180";
    if(task.duration) timeInput.value = task.duration;
    // GEÄNDERT: Timer Input Farbe ist Gelb-400, Fokus ist Gelb-500
    timeInput.className = "task-duration-input w-12 text-center bg-slate-700/50 text-xs rounded-md px-1 py-1 border border-slate-700 outline-none text-yellow-400 placeholder-slate-500 focus:ring-1 focus:ring-yellow-500/50 tabular-nums";
    timeInput.dataset.taskId = task.id;
    timeInput.title = "Dauer in Minuten für Auto-Timer";

    // Delete Btn
    const delBtn = document.createElement('button');
    delBtn.className = "action-icon-btn delete-task-btn flex-none";
    delBtn.title = "Löschen";
    delBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>';
    
    delBtn.addEventListener('click', () => {
        syncEditModalState();
        editModal.currentData[categoryKey].tasks.splice(index, 1);
        renderEditModal(editModal.currentData);
    });

    // Drag Events
    li.addEventListener('dragstart', handleDragStart);
    li.addEventListener('dragover', handleDragOver);
    li.addEventListener('drop', handleDrop);
    li.addEventListener('dragend', handleDragEnd);

    li.appendChild(handle);
    li.appendChild(input);
    li.appendChild(urlInput);
    li.appendChild(timeInput);
    li.appendChild(delBtn);

    return li;
}

/** Synchronisiert die Input-Werte im Modal zurück in das temporäre Datenobjekt. */
function syncEditModalState() {
     const temp = editModal.currentData;
     // Sync Titles
     editModalContent.querySelectorAll('input.task-edit-input').forEach(input => {
        const taskId = input.dataset.taskId;
        Object.values(temp).forEach(category => {
            const task = category.tasks.find(t => t.id === taskId);
            if (task) task.text = input.value; 
        });
     });
     // Sync URLS
     editModalContent.querySelectorAll('input.task-url-input').forEach(input => {
        const taskId = input.dataset.taskId;
        Object.values(temp).forEach(category => {
            const task = category.tasks.find(t => t.id === taskId);
            if (task) task.url = input.value.trim() === "" ? null : input.value.trim();
        });
     });
     // Sync Durations
     editModalContent.querySelectorAll('input.task-duration-input').forEach(input => {
        const taskId = input.dataset.taskId;
        Object.values(temp).forEach(category => {
            const task = category.tasks.find(t => t.id === taskId);
            if (task) {
                const val = parseInt(input.value);
                task.duration = (!isNaN(val) && val > 0) ? val : null;
            } 
        });
     });
}

/** Speichert die bearbeitete Checkliste und schließt das Modal. */
function saveEditedChecklist() {
    syncEditModalState();
    
    Object.values(editModal.currentData).forEach(category => {
        category.tasks = category.tasks.filter(task => task.text.trim() !== "");
    });
    
    currentChecklistData = editModal.currentData;
    saveChecklistContent();
    saveChecklistState(); 
    renderChecklist();
    closeEditModal();
}

// --- Drag & Drop Handlers ---
function handleDragStart(e) {
    syncEditModalState(); 
    draggedItemIndex = parseInt(this.dataset.index);
    draggedCategoryKey = this.dataset.category;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', draggedItemIndex); 
    setTimeout(() => { this.classList.add('dragging'); }, 0);
}

function handleDragOver(e) {
    e.preventDefault(); 
    e.dataTransfer.dropEffect = 'move';
    const item = e.target.closest('.draggable-item');
    if(item && item !== this) {
        item.classList.add('drag-over');
    }
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    document.querySelectorAll('.draggable-item').forEach(item => item.classList.remove('drag-over'));
}

function handleDrop(e) {
    e.stopPropagation();
    e.preventDefault();
    
    const targetItem = e.target.closest('.draggable-item');
    if (targetItem) {
        const targetIndex = parseInt(targetItem.dataset.index);
        const targetCategory = targetItem.dataset.category;

        if (draggedCategoryKey === targetCategory && draggedItemIndex !== null) {
            const tasks = editModal.currentData[draggedCategoryKey].tasks;
            const itemToMove = tasks[draggedItemIndex];
            
            tasks.splice(draggedItemIndex, 1);
            tasks.splice(targetIndex, 0, itemToMove);
            
            renderEditModal(editModal.currentData);
        }
    }
    return false;
}

// --- EVENT LISTENERS FÜR CHECKLISTE & EDIT MODAL ---
resetChecklistBtn.addEventListener('click', () => {
    if(confirm("Alle Checkboxen zurücksetzen?")) {
        Object.values(currentChecklistData).forEach(category => {
            category.tasks.forEach(task => { task.checked = false; });
        });
        saveChecklistState();
        renderChecklist(); 
    }
});

editChecklistBtn.addEventListener('click', openEditModal);
cancelEditBtn.addEventListener('click', closeEditModal);
saveEditBtn.addEventListener('click', saveEditedChecklist);


// Funktionen im globalen Scope bereitstellen
window.loadChecklistData = loadChecklistData;
window.renderChecklist = renderChecklist;
window.handleTaskAutoCheck = handleTaskAutoCheck; // Für den Timer (timer.js)