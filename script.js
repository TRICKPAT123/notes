document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const homeView = document.getElementById('homeView');
    const notePanel = document.getElementById('notePanel');
    const mapPanel = document.getElementById('mapPanel');
    const notesGrid = document.getElementById('notesGrid');
    const noNotesMessage = document.getElementById('noNotesMessage');
    const notesListContainer = document.getElementById('notesListContainer');
    
    // Buttons
    const newNoteMainBtn = document.getElementById('newNoteMainBtn');
    const viewNotesMainBtn = document.getElementById('viewNotesMainBtn');
    const viewMapBtn = document.getElementById('viewMapBtn');
    const removeAllNotesBtn = document.getElementById('removeAllNotesBtn');
    const closePanelBtn = document.getElementById('closePanelBtn');
    const closeMapBtn = document.getElementById('closeMapBtn');
    const currentLocationBtn = document.getElementById('currentLocationBtn');
    const addNoteMapBtn = document.getElementById('addNoteMapBtn');
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
    
    // Map Elements
    const mapContainer = document.getElementById('map');
    const notePopup = document.getElementById('notePopup');
    
    // State - Load from localStorage
    let notes = [];
    let currentNoteIndex = -1;
    let isEditing = false;
    let map = null;
    let markers = {};
    let currentLocationMarker = null;
    let selectedLatLng = null;
    
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
    
    // Initialize Map
    function initMap() {
        if (map) return;
        map = L.map('map').setView([37.7749, -122.4194], 19);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 25
        }).addTo(map);
        map.on('click', function(e) {
            selectedLatLng = e.latlng;
            showAddNoteDialog(e.latlng);
        });
        loadMapMarkers();
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                currentLocationMarker = L.circleMarker([lat, lng], {
                    radius: 8,
                    fillColor: "#2196F3",
                    color: "#1976D2",
                    weight: 2,
                    opacity: 0.8,
                    fillOpacity: 0.6
                }).addTo(map).bindPopup('📍 Your Location');
                map.setView([lat, lng], 19);
            });
        }
    }
    
    function loadMapMarkers() {
        Object.values(markers).forEach(marker => map.removeLayer(marker));
        markers = {};
        notes.forEach((note, index) => {
            if (note.location) {
                const lat = note.location.lat;
                const lng = note.location.lng;
                const marker = L.marker([lat, lng], {
                    icon: L.icon({
                        iconUrl: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%236A11CB" width="32" height="32"%3E%3Cpath d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm0-13c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5z"/%3E%3C/svg%3E',
                        iconSize: [32, 32],
                        iconAnchor: [16, 32],
                        popupAnchor: [0, -32]
                    })
                }).addTo(map);
                marker.bindPopup(`<strong>${note.title}</strong><br><p style="font-size: 0.85em; white-space: pre-wrap; max-height: 200px; overflow-y: auto;">${note.content}</p>`);
                marker.on('click', function() {
                    showNotePopup(note, index);
                });
                markers[note.id] = marker;
            }
        });
    }
    
    function showNotePopup(note, index) {
        document.getElementById('popupTitle').textContent = note.title;
        document.getElementById('popupContent').textContent = note.content;
        if (note.location) {
            document.getElementById('popupLocation').textContent = `📍 ${note.location.lat.toFixed(4)}, ${note.location.lng.toFixed(4)}`;
        }
        if (note.createdAt) {
            const date = new Date(note.createdAt);
            const dateString = date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            document.getElementById('popupDate').textContent = `📅 Created: ${dateString}`;
        }
        document.getElementById('editPopupBtn').onclick = function() {
            currentNoteIndex = index;
            loadNote(index);
            showNotePanel();
        };
        document.getElementById('deletePopupBtn').onclick = function() {
            if (confirm('Delete this note?')) {
                notes.splice(index, 1);
                saveToLocalStorage();
                loadMapMarkers();
                renderNotesGrid();
                updateNotesList();
            }
        };
        notePopup.style.display = 'block';
    }
    
    function showAddNoteDialog(latlng) {
        const title = prompt('📌 Enter note title:');
        if (!title) return;
        const content = prompt('📝 Enter note content:');
        if (!content) return;
        const note = {
            id: Date.now(),
            title,
            content,
            image: null,
            date: new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }),
            timestamp: Date.now(),
            location: {
                lat: latlng.lat,
                lng: latlng.lng
            }
        };
        notes.unshift(note);
        saveToLocalStorage();
        loadMapMarkers();
        renderNotesGrid();
        updateNotesList();
        alert(`✅ Note saved at location!\n📍 ${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`);
    }
    
    // Event Listeners
    newNoteMainBtn.addEventListener('click', () => openNotePanelForNew());
    viewNotesMainBtn.addEventListener('click', () => scrollToNotes());
    viewMapBtn.addEventListener('click', showMapPanel);
    removeAllNotesBtn.addEventListener('click', removeAllNotes);
    closePanelBtn.addEventListener('click', showHomeView);
    closeMapBtn.addEventListener('click', showHomeView);
    currentLocationBtn.addEventListener('click', goToCurrentLocation);
    addNoteMapBtn.addEventListener('click', () => {
        if (currentLocationMarker && currentLocationMarker.getLatLng) {
            showAddNoteDialog(currentLocationMarker.getLatLng());
        } else {
            alert('Please enable location services first.');
        }
    });
    newNoteBtn.addEventListener('click', openNotePanelForNew);
    saveNoteBtn.addEventListener('click', saveNote);
    deleteNoteBtn.addEventListener('click', deleteCurrentNote);
    editNoteBtn.addEventListener('click', toggleEditMode);
    prevNoteBtn.addEventListener('click', showPreviousNote);
    nextNoteBtn.addEventListener('click', showNextNote);
    
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.note-popup') && !event.target.closest('#addNoteMapBtn')) {
            notePopup.style.display = 'none';
        }
    });
    
    // Image Upload
    noteImageFrame.addEventListener('click', () => noteImageInput.click());
    noteImageInput.addEventListener('change', handleImageUpload);
    
    // Functions
    function showHomeView() {
        console.log('🏠 Going back to home view');
        homeView.classList.add('active');
        notePanel.classList.remove('active');
        mapPanel.classList.remove('active');
        isEditing = false;
        updateEditButton();
        renderNotesGrid();
        notePopup.style.display = 'none';
    }
    
    function showNotePanel() {
        homeView.classList.remove('active');
        notePanel.classList.add('active');
        mapPanel.classList.remove('active');
    }
    
    function showMapPanel() {
        homeView.classList.remove('active');
        notePanel.classList.remove('active');
        mapPanel.classList.add('active');
        setTimeout(() => {
            if (!map) {
                initMap();
            }
            map.invalidateSize();
        }, 100);
    }
    
    function goToCurrentLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                if (!currentLocationMarker) {
                    currentLocationMarker = L.circleMarker([lat, lng], {
                        radius: 8,
                        fillColor: "#2196F3",
                        color: "#1976D2",
                        weight: 2,
                        opacity: 0.8,
                        fillOpacity: 0.6
                    }).addTo(map).bindPopup('📍 Your Location');
                } else {
                    currentLocationMarker.setLatLng([lat, lng]);
                }
                map.setView([lat, lng], 19);
            }, function() {
                alert('Unable to get your location.');
            });
        }
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
        
        if (currentNoteIndex === -1) {
            // New note
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
            notes.unshift(note);
        } else {
            // Update existing note - preserve all existing properties
            const existingNote = notes[currentNoteIndex];
            existingNote.title = title;
            existingNote.content = content;
            existingNote.image = imageUrl;
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
