// Хранилище заметок
let notes = JSON.parse(localStorage.getItem('notes')) || [];

// Элементы DOM
const notesList = document.getElementById('notes-list');
const newNoteText = document.getElementById('new-note-text');
const addNoteBtn = document.getElementById('add-note-btn');
const charRemaining = document.getElementById('char-remaining');
const editForm = document.getElementById('edit-form');
const editNoteText = document.getElementById('edit-note-text');
const editNoteId = document.getElementById('edit-note-id');
const saveEditBtn = document.getElementById('save-edit-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const editCharRemaining = document.getElementById('edit-char-remaining');
const errorMessage = document.getElementById('error-message');

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    renderNotes();
    
    // Отслеживание количества символов для новой заметки
    newNoteText.addEventListener('input', updateCharCount);
    
    // Отслеживание количества символов для редактируемой заметки
    editNoteText.addEventListener('input', updateEditCharCount);
    
    // Добавление новой заметки
    addNoteBtn.addEventListener('click', addNewNote);
    
    // Сохранение отредактированной заметки
    saveEditBtn.addEventListener('click', saveEditedNote);
    
    // Отмена редактирования
    cancelEditBtn.addEventListener('click', cancelEditing);
});

function updateCharCount() {
    const remaining = 280 - this.value.length;
    charRemaining.textContent = remaining;
}

function updateEditCharCount() {
    const remaining = 280 - this.value.length;
    editCharRemaining.textContent = remaining;
}

function addNewNote() {
    const text = newNoteText.value.trim();
    
    if (!text) {
        errorMessage.style.display = 'block';
        return;
    }
    
    errorMessage.style.display = 'none';
    
    const newNote = {
        id: Date.now(),
        text: text,
        date: new Date().toLocaleString()
    };
    
    notes.unshift(newNote);
    saveNotes();
    renderNotes();
    newNoteText.value = '';
    charRemaining.textContent = 280;
}

function saveEditedNote() {
    const text = editNoteText.value.trim();
    const id = parseInt(editNoteId.value);
    
    if (!text) return;
    
    const noteIndex = notes.findIndex(note => note.id === id);
    if (noteIndex !== -1) {
        notes[noteIndex].text = text;
        notes[noteIndex].date = new Date().toLocaleString();
        saveNotes();
        renderNotes();
    }
    
    editForm.style.display = 'none';
}

function cancelEditing() {
    editForm.style.display = 'none';
}

function deleteNote(id) {
    notes = notes.filter(note => note.id !== id);
    saveNotes();
    renderNotes();
}

function startEditNote(id) {
    const note = notes.find(note => note.id === id);
    if (note) {
        editNoteText.value = note.text;
        editNoteId.value = note.id;
        editCharRemaining.textContent = 280 - note.text.length;
        editForm.style.display = 'block';
        window.scrollTo(0, 0);
    }
}

function saveNotes() {
    localStorage.setItem('notes', JSON.stringify(notes));
}

function renderNotes() {
    notesList.innerHTML = '';
    
    if (notes.length === 0) {
        notesList.innerHTML = '<p>У вас пока нет заметок.</p>';
        return;
    }
    
    notes.forEach(note => {
        const noteElement = document.createElement('div');
        noteElement.className = 'note';
        noteElement.innerHTML = `
            <div class="note-date">Создано: ${note.date}</div>
            <div class="note-text">${note.text}</div>
            <div class="note-actions">
                <button onclick="startEditNote(${note.id})">Изменить</button>
                <button onclick="deleteNote(${note.id})">Удалить</button>
            </div>
        `;
        notesList.appendChild(noteElement);
    });
}

// Делаем функции глобальными для использования в HTML
window.deleteNote = deleteNote;
window.startEditNote = startEditNote;