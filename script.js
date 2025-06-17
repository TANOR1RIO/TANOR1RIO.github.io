class NotesApp {
    constructor() {
        this.notes = JSON.parse(localStorage.getItem('notes')) || [];
        this.initElements();
        this.initEventListeners();
        this.renderNotes();
    }

    initElements() {
        // Основные элементы
        this.notesList = document.getElementById('notes-list');
        this.emptyState = document.getElementById('empty-state');
        this.newNoteText = document.getElementById('new-note-text');
        this.addNoteBtn = document.getElementById('add-note-btn');
        this.charRemaining = document.getElementById('char-remaining');
        this.errorMessage = document.getElementById('error-message');

        // Элементы редактирования
        this.editForm = document.getElementById('edit-form');
        this.noteForm = document.getElementById('note-form');
        this.editNoteText = document.getElementById('edit-note-text');
        this.editNoteId = document.getElementById('edit-note-id');
        this.saveEditBtn = document.getElementById('save-edit-btn');
        this.cancelEditBtn = document.getElementById('cancel-edit-btn');
        this.editCharRemaining = document.getElementById('edit-char-remaining');
    }

    initEventListeners() {
        // Отслеживание ввода текста
        this.newNoteText.addEventListener('input', () => this.updateCharCount(this.newNoteText, this.charRemaining));
        this.editNoteText.addEventListener('input', () => this.updateCharCount(this.editNoteText, this.editCharRemaining));

        // Кнопки
        this.addNoteBtn.addEventListener('click', () => this.addNote());
        this.saveEditBtn.addEventListener('click', () => this.saveEditedNote());
        this.cancelEditBtn.addEventListener('click', () => this.cancelEditing());

        // Добавление по Enter (с Shift для переноса строки)
        this.newNoteText.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.addNote();
            }
        });
    }

    updateCharCount(textarea, counterElement) {
        const remaining = 280 - textarea.value.length;
        counterElement.textContent = remaining;
        
        // Изменение цвета при приближении к лимиту
        if (remaining < 20) {
            counterElement.style.color = remaining < 0 ? '#E0245E' : '#FFAD1F';
        } else {
            counterElement.style.color = '#657786';
        }
    }

    addNote() {
        const text = this.newNoteText.value.trim();
        
        if (!text) {
            this.showError('Заметка не может быть пустой!');
            return;
        }
        
        if (text.length > 280) {
            this.showError('Превышен лимит в 280 символов!');
            return;
        }
        
        this.hideError();
        
        const newNote = {
            id: Date.now(),
            text: text,
            date: new Date().toLocaleString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        };
        
        this.notes.unshift(newNote);
        this.saveNotes();
        this.renderNotes();
        this.newNoteText.value = '';
        this.charRemaining.textContent = 280;
        this.charRemaining.style.color = '#657786';
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.style.display = 'block';
    }

    hideError() {
        this.errorMessage.style.display = 'none';
    }

    startEditingNote(id) {
        const note = this.notes.find(note => note.id === id);
        if (note) {
            this.editNoteText.value = note.text;
            this.editNoteId.value = note.id;
            this.editCharRemaining.textContent = 280 - note.text.length;
            
            // Переключение форм
            this.noteForm.classList.remove('active');
            this.editForm.classList.add('active');
            
            // Фокус на поле редактирования
            this.editNoteText.focus();
            
            // Прокрутка к верху
            window.scrollTo(0, 0);
        }
    }

    saveEditedNote() {
        const text = this.editNoteText.value.trim();
        const id = parseInt(this.editNoteId.value);
        
        if (!text) {
            return;
        }
        
        const noteIndex = this.notes.findIndex(note => note.id === id);
        if (noteIndex !== -1) {
            this.notes[noteIndex].text = text;
            this.notes[noteIndex].date = new Date().toLocaleString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            this.saveNotes();
            this.renderNotes();
        }
        
        this.cancelEditing();
    }

    cancelEditing() {
        this.editForm.classList.remove('active');
        this.noteForm.classList.add('active');
        this.editNoteText.value = '';
    }

    deleteNote(id) {
        if (confirm('Вы уверены, что хотите удалить эту заметку?')) {
            this.notes = this.notes.filter(note => note.id !== id);
            this.saveNotes();
            this.renderNotes();
        }
    }

    saveNotes() {
        localStorage.setItem('notes', JSON.stringify(this.notes));
    }

    renderNotes() {
        this.notesList.innerHTML = '';
        
        if (this.notes.length === 0) {
            this.emptyState.style.display = 'block';
            return;
        }
        
        this.emptyState.style.display = 'none';
        
        this.notes.forEach(note => {
            const noteElement = document.createElement('div');
            noteElement.className = 'note';
            noteElement.innerHTML = `
                <div class="note-header">
                    <div class="note-date"><i class="far fa-clock"></i> ${note.date}</div>
                </div>
                <div class="note-text">${note.text}</div>
                <div class="note-actions">
                    <button class="note-action edit" onclick="notesApp.startEditingNote(${note.id})">
                        <i class="fas fa-edit"></i> Изменить
                    </button>
                    <button class="note-action delete" onclick="notesApp.deleteNote(${note.id})">
                        <i class="fas fa-trash-alt"></i> Удалить
                    </button>
                </div>
            `;
            this.notesList.appendChild(noteElement);
        });
    }
}

// Инициализация приложения
const notesApp = new NotesApp();