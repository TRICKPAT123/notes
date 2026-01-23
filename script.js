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
    
    // State - Load from localStorage
    let notes = [];
    let currentNoteIndex = -1;
    let isEditing = false;
    
    // Load notes from localStorage on page load
    function loadNotesFromStorage() {
        const stored = localStorage.getItem('notes');
        if (stored) {
            try {
                notes = JSON.parse(stored);
                console.log(`✅ Loaded ${notes.length} notes from localStorage`);
            } catch (error) {
                console.error('Error loading notes:', error);
                notes = [];
            }
        }
    }
    
    // Save notes to localStorage
    function saveToLocalStorage() {
        try {
            localStorage.setItem('notes', JSON.stringify(notes));
            console.log('✅ Notes saved to localStorage');
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            alert('Failed to save notes. Your storage might be full.');
            return false;
        }
    }
    
    // Initialize
    loadNotesFromStorage();
    
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
        noteImageFrame.dataset.imageUrl = '';
        showNotePanel();
        isEditing = true;
        updateEditButton();
        noteTitle.focus();
    }
    
    function scrollToNotes() {
        const notesSection = document.querySelector('.saved-notes-section');
        if (notesSection) {
            notesSection.scrollIntoView({ behavior: 'smooth' });
        }
    }
    
    function handleImageUpload(event) {
        const file = event.target.files[0];
        if (file) {
            // Check file size
            if (file.size > 10 * 1024 * 1024) {
                alert('⚠️ Image is too large (max 10MB). Please choose a smaller image.');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                // Compress image before storing
                const img = new Image();
                img.onload = function() {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // Calculate new size (max 800px width)
                    let width = img.width;
                    let height = img.height;
                    const maxWidth = 800;
                    
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Compress to JPEG (better compression)
                    const compressedImageData = canvas.toDataURL('image/jpeg', 0.7);
                    
                    noteImageFrame.innerHTML = `<img src="${compressedImageData}" alt="Note Image">`;
                    noteImageFrame.classList.add('has-image');
                    noteImageFrame.dataset.imageUrl = compressedImageData;
                };
                img.src = e.target.result;
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
        
        const imageUrl = noteImageFrame.dataset.imageUrl || null;
        
        const note = {
            id: Date.now(),
            title,
            content,
            image: imageUrl,
            date: new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }),
            timestamp: Date.now()
        };
        
        if (currentNoteIndex === -1) {
            // New note
            notes.unshift(note);
        } else {
            // Update existing note
            notes[currentNoteIndex] = note;
        }
        
        // Save to localStorage
        if (!saveToLocalStorage()) {
            return; // Stop if save failed
        }
        
        renderNotesGrid();
        updateNotesList();
        updateCounter();
        
        if (currentNoteIndex === -1) {
            // If it was a new note, load it
            currentNoteIndex = notes.findIndex(n => n.id === note.id);
            loadNote(currentNoteIndex);
            isEditing = false;
            updateEditButton();
        } else {
            showHomeView();
        }
    }
    
    function loadNote(index) {
        if (index < 0 || index >= notes.length) return;
        
        currentNoteIndex = index;
        const note = notes[index];
        
        noteTitle.value = note.title;
        noteContent.value = note.content;
        
        if (note.image) {
            noteImageFrame.innerHTML = `<img src="${note.image}" alt="Note Image">`;
            noteImageFrame.classList.add('has-image');
            noteImageFrame.dataset.imageUrl = note.image;
        } else {
            noteImageFrame.innerHTML = '<i class="fas fa-image"></i><p>Click to upload note image</p>';
            noteImageFrame.classList.remove('has-image');
            noteImageFrame.dataset.imageUrl = '';
        }
        
        isEditing = false;
        updateEditButton();
        updateCounter();
    }
    
    function deleteCurrentNote() {
        if (currentNoteIndex === -1 || currentNoteIndex >= notes.length) {
            alert('No note selected to delete');
            return;
        }
        
        if (confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
            notes.splice(currentNoteIndex, 1);
            
            // Save to localStorage
            saveToLocalStorage();
            
            if (notes.length === 0) {
                currentNoteIndex = -1;
                showHomeView();
            } else {
                if (currentNoteIndex >= notes.length) {
                    currentNoteIndex = notes.length - 1;
                }
                loadNote(currentNoteIndex);
                renderNotesGrid();
                updateNotesList();
            }
        }
    }
    
    function toggleEditMode() {
        if (currentNoteIndex === -1 || currentNoteIndex >= notes.length) {
            alert('No note selected to edit');
            return;
        }
        
        isEditing = !isEditing;
        updateEditButton();
        
        if (isEditing) {
            noteTitle.focus();
        }
    }
    
    function showPreviousNote() {
        if (notes.length === 0) return;
        currentNoteIndex = (currentNoteIndex - 1 + notes.length) % notes.length;
        loadNote(currentNoteIndex);
        renderNotesGrid();
        updateNotesList();
    }
    
    function showNextNote() {
        if (notes.length === 0) return;
        currentNoteIndex = (currentNoteIndex + 1) % notes.length;
        loadNote(currentNoteIndex);
        renderNotesGrid();
        updateNotesList();
    }
    
    function removeAllNotes() {
        if (notes.length === 0) {
            alert('No notes to remove.');
            return;
        }
        
        if (confirm('⚠️ WARNING: This will delete ALL notes permanently. This cannot be undone!\n\nAre you sure?')) {
            notes = [];
            saveToLocalStorage();
            currentNoteIndex = -1;
            isEditing = false;
            renderNotesGrid();
            updateNotesList();
            updateCounter();
            updateEditButton();
            showHomeView();
            alert('✅ All notes have been deleted.');
        }
    }
    
    function renderNotesGrid() {
        notesGrid.innerHTML = '';
        
        if (notes.length === 0) {
            noNotesMessage.style.display = 'block';
            return;
        }
        
        noNotesMessage.style.display = 'none';
        
        notes.forEach((note, index) => {
            const noteCard = document.createElement('div');
            noteCard.className = 'note-card';
            
            const imageHtml = note.image 
                ? `<img src="${note.image}" alt="${note.title}">`
                : '<i class="fas fa-sticky-note"></i>';
            
            noteCard.innerHTML = `
                <div class="note-card-image">
                    ${imageHtml}
                </div>
                <div class="note-card-content">
                    <h3 class="note-card-title">${note.title}</h3>
                    <div class="note-card-date">${note.date}</div>
                </div>
            `;
            
            noteCard.addEventListener('click', function() {
                loadNote(index);
                showNotePanel();
                updateNotesList();
            });
            
            notesGrid.appendChild(noteCard);
        });
    }
    
    function updateNotesList() {
        notesListContainer.innerHTML = '';
        
        if (notes.length === 0) {
            notesListContainer.innerHTML = '<div style="padding: 10px; color: #999; text-align: center;">No notes</div>';
            return;
        }
        
        notes.forEach((note, index) => {
            const noteItem = document.createElement('div');
            noteItem.className = 'note-item';
            if (index === currentNoteIndex) {
                noteItem.classList.add('active');
            }
            
            noteItem.innerHTML = `
                <h4>${note.title}</h4>
                <p>${note.content.substring(0, 50)}${note.content.length > 50 ? '...' : ''}</p>
                <div class="note-date">${note.date}</div>
            `;
            
            noteItem.addEventListener('click', function() {
                loadNote(index);
            });
            
            notesListContainer.appendChild(noteItem);
        });
    }
    
    function updateCounter() {
        currentNoteNum.textContent = currentNoteIndex + 1;
        totalNotes.textContent = notes.length;
    }
    
    function updateEditButton() {
        if (isEditing) {
            editNoteBtn.style.display = 'none';
            noteTitle.disabled = false;
            noteContent.disabled = false;
        } else {
            editNoteBtn.style.display = 'block';
            noteTitle.disabled = true;
            noteContent.disabled = true;
        }
    }
    
    // Initialize UI
    renderNotesGrid();
    updateNotesList();
    updateCounter();
    updateEditButton();
    showHomeView();
    
    // Optional: Auto-save every 30 seconds if editing
    setInterval(() => {
        if (isEditing && currentNoteIndex !== -1) {
            notes[currentNoteIndex].title = noteTitle.value;
            notes[currentNoteIndex].content = noteContent.value;
            saveToLocalStorage();
        }
    }, 30000);
    
    // Save before leaving page
    window.addEventListener('beforeunload', () => {
        if (notes.length > 0) {
            saveToLocalStorage();
        }
    });
});
