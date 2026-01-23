document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const homeView = document.getElementById('homeView');
    const notePanel = document.getElementById('notePanel');
    const notesGrid = document.getElementById('notesGrid');
    const noNotesMessage = document.getElementById('noNotesMessage');
    const notesListContainer = document.getElementById('notesListContainer');
    
    // Buttons
    const newNoteMainBtn = document.getElementById('newNoteMainBtn');
    const viewNotesMainBtn = document.getElementById('viewNotesMainBtn');
    const removeAllNotesBtn = document.getElementById('removeAllNotesBtn');
    const backHomeBtn = document.getElementById('backHomeBtn');
    const closePanelBtn = document.getElementById('closePanelBtn');
    const newNoteBtn = document.getElementById('newNoteBtn');
    const saveNoteBtn = document.getElementById('saveNoteBtn');
    const deleteNoteBtn = document.getElementById('deleteNoteBtn');
    const editNoteBtn = document.getElementById('editNoteBtn');
    const prevNoteBtn = document.getElementById('prevNoteBtn');
    const nextNoteBtn = document.getElementById('nextNoteBtn');
    
    // Form Elements
    const noteTitle = document.getElementById('noteTitle');
    const noteContent = document.getElementById('noteContent');
    const noteImageFrame = document.getElementById('noteImageFrame');
    const noteImageInput = document.getElementById('noteImageInput');
    const currentNoteNum = document.getElementById('currentNoteNum');
    const totalNotes = document.getElementById('totalNotes');
    
    // State
    let notes = JSON.parse(localStorage.getItem('notes')) || [];
    let currentNoteIndex = -1;
    let isEditing = false;
    
    // Initialize
    renderNotesGrid();
    updateNotesList();
    updateCounter();
    
    // Event Listeners
    newNoteMainBtn.addEventListener('click', () => openNotePanelForNew());
    viewNotesMainBtn.addEventListener('click', () => scrollToNotes());
    removeAllNotesBtn.addEventListener('click', removeAllNotes);
    backHomeBtn.addEventListener('click', showHomeView);
    closePanelBtn.addEventListener('click', showHomeView);
    newNoteBtn.addEventListener('click', openNotePanelForNew);
    saveNoteBtn.addEventListener('click', saveNote);
    deleteNoteBtn.addEventListener('click', deleteCurrentNote);
    editNoteBtn.addEventListener('click', toggleEditMode);
    prevNoteBtn.addEventListener('click', showPreviousNote);
    nextNoteBtn.addEventListener('click', showNextNote);
    
    // Image Upload
    noteImageFrame.addEventListener('click', () => noteImageInput.click());
    noteImageInput.addEventListener('change', handleImageUpload);
    
    // Functions
    function showHomeView() {
        homeView.classList.add('active');
        notePanel.classList.remove('active');
        isEditing = false;
        updateEditButton();
        renderNotesGrid();
    }
    
    function showNotePanel() {
        homeView.classList.remove('active');
        notePanel.classList.add('active');
    }
    
    function openNotePanelForNew() {
        currentNoteIndex = -1;
        noteTitle.value = '';
        noteContent.value = '';
        noteImageFrame.innerHTML = '<i class="fas fa-image"></i><p>Click to upload note image</p>';
        noteImageFrame.classList.remove('has-image');
        showNotePanel();
        isEditing = true;
        updateEditButton();
        noteTitle.focus();
    }
    
    function scrollToNotes() {
        const notesSection = document.querySelector('.saved-notes-section');
        notesSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    function handleImageUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                noteImageFrame.innerHTML = `<img src="${e.target.result}" alt="Note Image">`;
                noteImageFrame.classList.add('has-image');
            };
            reader.readAsDataURL(file);
        }
    }
    
    function saveNote() {
        const title = noteTitle.value.trim();
        const content = noteContent.value.trim();
        
        if (!title || !content) {
            alert('Please enter both title and content for the note.');
            return;
        }
        
        const noteImage = noteImageFrame.querySelector('img') ? 
            noteImageFrame.querySelector('img').src : null;
        
        const note = {
            id: Date.now(),
            title,
            content,
            image: noteImage,
            date: new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }),
            timestamp: Date.now()
        };
        
        if (currentNoteIndex === -1) {
            // New note
            notes.unshift(note); // Add to beginning
        } else {
            // Update existing note
            notes[currentNoteIndex] = note;
        }
        
        saveToLocalStorage();
        renderNotesGrid();
        updateNotesList();
        updateCounter();
        
        if (currentNoteIndex === -1) {
            // If it was a new note, open it for viewing
            currentNoteIndex = notes.findIndex(n => n.id === note.id);
            loadNote(currentNoteIndex);
            isEditing = false;
            updateEditButton();
        } else {
            showHomeView();
        }
    }
    
    function deleteCurrentNote() {
        if (currentNoteIndex >= 0 && currentNoteIndex < notes.length) {
            if (confirm('Are you sure you want to delete this note?')) {
                notes.splice(currentNoteIndex, 1);
                saveToLocalStorage();
                renderNotesGrid();
                updateNotesList();
                updateCounter();
                
                if (notes.length === 0) {
                    showHomeView();
                } else {
                    currentNoteIndex = Math.min(currentNoteIndex, notes.length - 1);
                    loadNote(currentNoteIndex);
                }
            }
        }
    }
    
    function removeAllNotes() {
        if (notes.length === 0) {
            alert('No notes to remove.');
            return;
        }
        
        if (confirm('Are you sure you want to delete ALL notes? This cannot be undone.')) {
            notes = [];
            saveToLocalStorage();
            renderNotesGrid();
            updateNotesList();
            updateCounter();
            showHomeView();
        }
    }
    
    function toggleEditMode() {
        isEditing = !isEditing;
        updateEditButton();
        
        if (isEditing) {
            noteTitle.removeAttribute('readonly');
            noteContent.removeAttribute('readonly');
            noteTitle.focus();
        } else {
            noteTitle.setAttribute('readonly', true);
            noteContent.setAttribute('readonly', true);
        }
    }
    
    function updateEditButton() {
        editNoteBtn.innerHTML = isEditing ? 
            '<i class="fas fa-eye"></i> View' : 
            '<i class="fas fa-edit"></i> Edit';
    }
    
    function showPreviousNote() {
        if (notes.length > 0) {
            currentNoteIndex = (currentNoteIndex - 1 + notes.length) % notes.length;
            loadNote(currentNoteIndex);
        }
    }
    
    function showNextNote() {
        if (notes.length > 0) {
            currentNoteIndex = (currentNoteIndex + 1) % notes.length;
            loadNote(currentNoteIndex);
        }
    }
    
    function loadNote(index) {
        if (index >= 0 && index < notes.length) {
            const note = notes[index];
            noteTitle.value = note.title;
            noteContent.value = note.content;
            
            if (note.image) {
                noteImageFrame.innerHTML = `<img src="${note.image}" alt="Note Image">`;
                noteImageFrame.classList.add('has-image');
            } else {
                noteImageFrame.innerHTML = '<i class="fas fa-image"></i><p>Click to upload note image</p>';
                noteImageFrame.classList.remove('has-image');
            }
            
            // Disable editing initially
            isEditing = false;
            noteTitle.setAttribute('readonly', true);
            noteContent.setAttribute('readonly', true);
            updateEditButton();
            
            currentNoteNum.textContent = index + 1;
            updateCounter();
        }
    }
    
    function renderNotesGrid() {
        if (notes.length === 0) {
            notesGrid.innerHTML = '';
            noNotesMessage.style.display = 'block';
            return;
        }
        
        noNotesMessage.style.display = 'none';
        notesGrid.innerHTML = '';
        
        notes.forEach((note, index) => {
            const noteCard = createNoteCard(note, index);
            notesGrid.appendChild(noteCard);
        });
    }
    
    function createNoteCard(note, index) {
        const card = document.createElement('div');
        card.className = 'note-card';
        card.dataset.index = index;
        
        // Preview content (first 100 characters)
        const previewContent = note.content.length > 100 ? 
            note.content.substring(0, 100) + '...' : note.content;
        
        card.innerHTML = `
            <div class="note-card-image">
                ${note.image ? 
                    `<img src="${note.image}" alt="${note.title}">` : 
                    `<i class="fas fa-sticky-note default-icon"></i>`
                }
            </div>
            <div class="note-card-content">
                <h3 class="note-card-title">${note.title}</h3>
                <p class="note-card-preview">${previewContent}</p>
                <div class="note-card-footer">
                    <span class="note-card-date">${note.date}</span>
                    <div class="note-card-actions">
                        <button class="note-action-btn view-btn" title="View Note">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="note-action-btn delete-btn" title="Delete Note">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Add event listeners to buttons
        card.querySelector('.view-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            currentNoteIndex = index;
            loadNote(index);
            showNotePanel();
        });
        
        card.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('Delete this note?')) {
                notes.splice(index, 1);
                saveToLocalStorage();
                renderNotesGrid();
                updateNotesList();
                updateCounter();
            }
        });
        
        // Click on card to view note
        card.addEventListener('click', () => {
            currentNoteIndex = index;
            loadNote(index);
            showNotePanel();
        });
        
        return card;
    }
    
    function updateNotesList() {
        notesListContainer.innerHTML = '';
        
        notes.forEach((note, index) => {
            const noteItem = document.createElement('div');
            noteItem.className = `note-item ${index === currentNoteIndex ? 'active' : ''}`;
            noteItem.innerHTML = `
                <h4>${note.title}</h4>
                <p>${note.content.substring(0, 50)}${note.content.length > 50 ? '...' : ''}</p>
                <small class="note-date">${note.date}</small>
            `;
            
            noteItem.addEventListener('click', () => {
                currentNoteIndex = index;
                loadNote(index);
            });
            
            notesListContainer.appendChild(noteItem);
        });
    }
    
    function updateCounter() {
        totalNotes.textContent = notes.length;
        if (notes.length > 0 && currentNoteIndex >= 0) {
            currentNoteNum.textContent = currentNoteIndex + 1;
        } else {
            currentNoteNum.textContent = '0';
        }
    }
    
    function saveToLocalStorage() {
        localStorage.setItem('notes', JSON.stringify(notes));
    }
    
    // Initialize view buttons state
    updateEditButton();
});
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const homeView = document.getElementById('homeView');
    const notePanel = document.getElementById('notePanel');
    const notesGrid = document.getElementById('notesGrid');
    const noNotesMessage = document.getElementById('noNotesMessage');
    const notesListContainer = document.getElementById('notesListContainer');
    
    // Buttons
    const newNoteMainBtn = document.getElementById('newNoteMainBtn');
    const viewNotesMainBtn = document.getElementById('viewNotesMainBtn');
    const backHomeBtn = document.getElementById('backHomeBtn');
    const closePanelBtn = document.getElementById('closePanelBtn');
    const newNoteBtn = document.getElementById('newNoteBtn');
    const saveNoteBtn = document.getElementById('saveNoteBtn');
    const deleteNoteBtn = document.getElementById('deleteNoteBtn');
    const editNoteBtn = document.getElementById('editNoteBtn');
    const prevNoteBtn = document.getElementById('prevNoteBtn');
    const nextNoteBtn = document.getElementById('nextNoteBtn');
    
    // Database/Cloud Elements
    const backupBtn = document.getElementById('backupBtn');
    const restoreBtn = document.getElementById('restoreBtn');
    const exportBtn = document.getElementById('exportBtn');
    const importBtn = document.getElementById('importBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    
    // Modal Elements
    const cloudBackupModal = document.getElementById('cloudBackupModal');
    const importExportModal = document.getElementById('importExportModal');
    const closeModalButtons = document.querySelectorAll('.close-modal');
    const githubTokenInput = document.getElementById('githubToken');
    const gistIdInput = document.getElementById('gistId');
    const connectGithubBtn = document.getElementById('connectGithubBtn');
    const backupNowBtn = document.getElementById('backupNowBtn');
    const restoreFromCloudBtn = document.getElementById('restoreFromCloudBtn');
    const exportJsonBtn = document.getElementById('exportJsonBtn');
    const chooseFileBtn = document.getElementById('chooseFileBtn');
    const importFileInput = document.getElementById('importFile');
    const importJsonBtn = document.getElementById('importJsonBtn');
    const exportPreview = document.getElementById('exportPreview');
    const importStatus = document.getElementById('importStatus');
    
    // Form Elements
    const noteTitle = document.getElementById('noteTitle');
    const noteContent = document.getElementById('noteContent');
    const noteImageFrame = document.getElementById('noteImageFrame');
    const noteImageInput = document.getElementById('noteImageInput');
    const currentNoteNum = document.getElementById('currentNoteNum');
    const totalNotes = document.getElementById('totalNotes');
    
    // State
    let notes = [];
    let currentNoteIndex = -1;
    let isEditing = false;
    let githubToken = localStorage.getItem('githubToken') || '';
    let gistId = localStorage.getItem('gistId') || '';
    let lastBackupTime = localStorage.getItem('lastBackupTime') || '';
    
    // Initialize Database
    initializeDatabase();
    
    // Event Listeners
    newNoteMainBtn.addEventListener('click', () => openNotePanelForNew());
    viewNotesMainBtn.addEventListener('click', () => scrollToNotes());
    backHomeBtn.addEventListener('click', showHomeView);
    closePanelBtn.addEventListener('click', showHomeView);
    newNoteBtn.addEventListener('click', openNotePanelForNew);
    saveNoteBtn.addEventListener('click', saveNote);
    deleteNoteBtn.addEventListener('click', deleteCurrentNote);
    editNoteBtn.addEventListener('click', toggleEditMode);
    prevNoteBtn.addEventListener('click', showPreviousNote);
    nextNoteBtn.addEventListener('click', showNextNote);
    
    // Database/Cloud Listeners
    backupBtn.addEventListener('click', () => showModal(cloudBackupModal));
    restoreBtn.addEventListener('click', () => showModal(cloudBackupModal));
    exportBtn.addEventListener('click', () => showModal(importExportModal));
    importBtn.addEventListener('click', () => showModal(importExportModal));
    clearAllBtn.addEventListener('click', clearAllNotes);
    
    // Modal Listeners
    closeModalButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            cloudBackupModal.classList.remove('active');
            importExportModal.classList.remove('active');
        });
    });
    
    // Cloud Backup Listeners
    connectGithubBtn.addEventListener('click', connectToGitHub);
    backupNowBtn.addEventListener('click', backupToCloud);
    restoreFromCloudBtn.addEventListener('click', restoreFromCloud);
    
    // Import/Export Listeners
    exportJsonBtn.addEventListener('click', exportToJson);
    chooseFileBtn.addEventListener('click', () => importFileInput.click());
    importFileInput.addEventListener('change', handleFileSelect);
    importJsonBtn.addEventListener('click', importFromJson);
    
    // Image Upload
    noteImageFrame.addEventListener('click', () => noteImageInput.click());
    noteImageInput.addEventListener('change', handleImageUpload);
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === cloudBackupModal) cloudBackupModal.classList.remove('active');
        if (e.target === importExportModal) importExportModal.classList.remove('active');
    });
    
    // Initialize UI
    updateEditButton();
    updateCloudUI();
    updateExportPreview();
    
    // Functions
    
    function initializeDatabase() {
        // Try to load notes from localStorage
        const savedNotes = localStorage.getItem('notes');
        
        if (savedNotes) {
            try {
                notes = JSON.parse(savedNotes);
                console.log(`Loaded ${notes.length} notes from localStorage`);
            } catch (error) {
                console.error('Error parsing notes from localStorage:', error);
                notes = [];
            }
        }
        
        // If no notes in localStorage, check for legacy data or create default
        if (notes.length === 0) {
            console.log('No notes found, initializing empty database');
            notes = [];
        }
        
        // Initialize UI
        renderNotesGrid();
        updateNotesList();
        updateCounter();
        
        // Create database status indicator
        createDatabaseStatus();
        
        // Auto-save every 30 seconds if there are changes
        setInterval(() => {
            if (notes.length > 0) {
                saveToLocalStorage();
            }
        }, 30000);
    }
    
    function createDatabaseStatus() {
        const statusDiv = document.createElement('div');
        statusDiv.className = 'database-status';
        statusDiv.innerHTML = `
            <i class="fas fa-database"></i>
            <span>${notes.length} notes saved</span>
        `;
        document.body.appendChild(statusDiv);
        
        // Update status when notes change
        const updateStatus = () => {
            statusDiv.innerHTML = `
                <i class="fas fa-database"></i>
                <span>${notes.length} notes saved</span>
            `;
        };
        
        // Override functions that change notes
        const originalSaveToLocalStorage = saveToLocalStorage;
        saveToLocalStorage = function() {
            originalSaveToLocalStorage();
            updateStatus();
        };
    }
    
    function saveToLocalStorage() {
        try {
            localStorage.setItem('notes', JSON.stringify(notes));
            localStorage.setItem('lastSaved', new Date().toISOString());
            showAutoSaveNotification();
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            showError('Failed to save notes. Storage might be full.');
            return false;
        }
    }
    
    function showAutoSaveNotification() {
        // Remove existing notification
        const existing = document.querySelector('.auto-save-notification');
        if (existing) existing.remove();
        
        // Create new notification
        const notification = document.createElement('div');
        notification.className = 'auto-save-notification';
        notification.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>Notes saved automatically</span>
        `;
        document.body.appendChild(notification);
        
        // Show and auto-remove
        setTimeout(() => {
            notification.style.display = 'flex';
            setTimeout(() => {
                notification.style.opacity = '0';
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => notification.remove(), 300);
            }, 2000);
        }, 100);
    }
    
    function showError(message) {
        alert(`Error: ${message}`);
    }
    
    // Cloud Backup Functions
    
    function updateCloudUI() {
        if (githubToken && gistId) {
            document.getElementById('authSection').style.display = 'none';
            document.getElementById('backupSection').style.display = 'block';
            document.getElementById('currentGistId').textContent = gistId.substring(0, 20) + '...';
            document.getElementById('lastBackupTime').textContent = lastBackupTime || 'Never';
            githubTokenInput.value = '';
            gistIdInput.value = gistId;
        } else {
            document.getElementById('authSection').style.display = 'block';
            document.getElementById('backupSection').style.display = 'none';
            githubTokenInput.value = githubToken;
            gistIdInput.value = gistId;
        }
    }
    
    async function connectToGitHub() {
        const token = githubTokenInput.value.trim();
        const gistIdValue = gistIdInput.value.trim();
        
        if (!token) {
            alert('Please enter a GitHub Personal Access Token');
            return;
        }
        
        try {
            // Test the token
            const response = await fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Invalid token or network error');
            }
            
            githubToken = token;
            if (gistIdValue) gistId = gistIdValue;
            
            localStorage.setItem('githubToken', githubToken);
            if (gistId) localStorage.setItem('gistId', gistId);
            
            updateCloudUI();
            showSuccess('Connected to GitHub successfully!');
        } catch (error) {
            showError('Failed to connect to GitHub: ' + error.message);
        }
    }
    
    async function backupToCloud() {
        if (!githubToken) {
            alert('Please connect to GitHub first');
            return;
        }
        
        try {
            const backupData = {
                notes: notes,
                version: '1.0',
                lastUpdated: new Date().toISOString(),
                totalNotes: notes.length
            };
            
            const gistData = {
                description: 'Online Notes Backup',
                public: false,
                files: {
                    'notes_backup.json': {
                        content: JSON.stringify(backupData, null, 2)
                    }
                }
            };
            
            let response;
            let url = 'https://api.github.com/gists';
            
            if (gistId) {
                // Update existing gist
                url += `/${gistId}`;
                response = await fetch(url, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `token ${githubToken}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/vnd.github.v3+json'
                    },
                    body: JSON.stringify(gistData)
                });
            } else {
                // Create new gist
                response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Authorization': `token ${githubToken}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/vnd.github.v3+json'
                    },
                    body: JSON.stringify(gistData)
                });
            }
            
            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status}`);
            }
            
            const result = await response.json();
            gistId = result.id;
            localStorage.setItem('gistId', gistId);
            
            lastBackupTime = new Date().toLocaleString();
            localStorage.setItem('lastBackupTime', lastBackupTime);
            
            updateCloudUI();
            showSuccess('Backup completed successfully!');
        } catch (error) {
            showError('Backup failed: ' + error.message);
        }
    }
    
    async function restoreFromCloud() {
        if (!githubToken || !gistId) {
            alert('Please connect to GitHub and ensure you have a Gist ID');
            return;
        }
        
        if (!confirm('This will replace all current notes with the cloud backup. Continue?')) {
            return;
        }
        
        try {
            const response = await fetch(`https://api.github.com/gists/${gistId}`, {
                headers: {
                    'Authorization': `token ${githubToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch gist: ${response.status}`);
            }
            
            const gist = await response.json();
            const backupFile = gist.files['notes_backup.json'];
            
            if (!backupFile) {
                throw new Error('Backup file not found in gist');
            }
            
            const backupData = JSON.parse(backupFile.content);
            notes = backupData.notes || [];
            
            saveToLocalStorage();
            renderNotesGrid();
            updateNotesList();
            updateCounter();
            
            showSuccess(`Restored ${notes.length} notes from cloud backup!`);
            cloudBackupModal.classList.remove('active');
        } catch (error) {
            showError('Restore failed: ' + error.message);
        }
    }
    
    // Import/Export Functions
    
    function updateExportPreview() {
        const previewData = {
            notes: notes.slice(0, 2), // Show first 2 notes as preview
            totalNotes: notes.length,
            exportDate: new Date().toISOString()
        };
        exportPreview.textContent = JSON.stringify(previewData, null, 2);
    }
    
    function exportToJson() {
        const exportData = {
            notes: notes,
            version: '1.0',
            exportDate: new Date().toISOString(),
            totalNotes: notes.length
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `notes_backup_${Date.now()}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        showSuccess('Export completed! File downloaded.');
    }
    
    function handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const data = JSON.parse(e.target.result);
                    importJsonBtn.disabled = false;
                    importStatus.innerHTML = `
                        <div class="success">
                            File loaded: ${file.name}<br>
                            Contains ${data.notes?.length || 0} notes
                        </div>
                    `;
                    importStatus.className = 'success';
                } catch (error) {
                    importStatus.innerHTML = `
                        <div class="error">
                            Invalid JSON file. Please select a valid backup file.
                        </div>
                    `;
                    importStatus.className = 'error';
                    importJsonBtn.disabled = true;
                }
            };
            reader.readAsText(file);
        }
    }
    
    function importFromJson() {
        const file = importFileInput.files[0];
        if (!file) {
            alert('Please select a file first');
            return;
        }
        
        if (!confirm('This will add imported notes to your existing notes. Continue?')) {
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importData = JSON.parse(e.target.result);
                const importedNotes = importData.notes || [];
                
                if (!Array.isArray(importedNotes)) {
                    throw new Error('Invalid notes format in file');
                }
                
                // Add imported notes (prevent duplicates by ID)
                importedNotes.forEach(newNote => {
                    const exists = notes.some(note => note.id === newNote.id);
                    if (!exists) {
                        notes.unshift(newNote);
                    }
                });
                
                saveToLocalStorage();
                renderNotesGrid();
                updateNotesList();
                updateCounter();
                updateExportPreview();
                
                importStatus.innerHTML = `
                    <div class="success">
                        Successfully imported ${importedNotes.length} notes!<br>
                        Total notes: ${notes.length}
                    </div>
                `;
                importStatus.className = 'success';
                
                // Reset file input
                importFileInput.value = '';
                importJsonBtn.disabled = true;
                
                setTimeout(() => {
                    importExportModal.classList.remove('active');
                }, 2000);
                
            } catch (error) {
                importStatus.innerHTML = `
                    <div class="error">
                        Error importing notes: ${error.message}
                    </div>
                `;
                importStatus.className = 'error';
            }
        };
        reader.readAsText(file);
    }
    
    function clearAllNotes() {
        if (notes.length === 0) {
            alert('No notes to clear.');
            return;
        }
        
        if (confirm('⚠️ WARNING: This will permanently delete ALL notes. This cannot be undone!')) {
            notes = [];
            saveToLocalStorage();
            renderNotesGrid();
            updateNotesList();
            updateCounter();
            updateExportPreview();
            showHomeView();
            showSuccess('All notes have been cleared.');
        }
    }
    
    function showModal(modal) {
        modal.classList.add('active');
        if (modal === importExportModal) {
            updateExportPreview();
        }
    }
    
    function showSuccess(message) {
        alert('✅ ' + message);
    }
    
    // ... [Keep all the existing note management functions from previous code]
    // (showHomeView, showNotePanel, openNotePanelForNew, etc.)
    // These functions should remain exactly as in the previous script
    
    // Make sure all functions that modify notes call saveToLocalStorage()
    // For example, in saveNote function:
    function saveNote() {
        const title = noteTitle.value.trim();
        const content = noteContent.value.trim();
        
        if (!title || !content) {
            alert('Please enter both title and content for the note.');
            return;
        }
        
        const noteImage = noteImageFrame.querySelector('img') ? 
            noteImageFrame.querySelector('img').src : null;
        
        const note = {
            id: Date.now(),
            title,
            content,
            image: noteImage,
            date: new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }),
            timestamp: Date.now()
        };
        
        if (currentNoteIndex === -1) {
            notes.unshift(note);
        } else {
            notes[currentNoteIndex] = note;
        }
        
        saveToLocalStorage(); // This saves to localStorage
        renderNotesGrid();
        updateNotesList();
        updateCounter();
        updateExportPreview(); // Update export preview
        
        if (currentNoteIndex === -1) {
            currentNoteIndex = notes.findIndex(n => n.id === note.id);
            loadNote(currentNoteIndex);
            isEditing = false;
            updateEditButton();
        } else {
            showHomeView();
        }
    }
    
    // ... [Rest of the note management functions remain the same]
    // Just ensure they all call saveToLocalStorage() when notes are modified
});