class VKNotesApp {
    constructor() {
        this.notes = [];
        this.isVKClient = typeof vkBridge !== 'undefined';
        this.currentTheme = 'bright_light';
        
        this.initElements();
        this.initEventListeners();
        this.initApp();
    }

    async initApp() {
        try {
            if (this.isVKClient) {
                // Инициализация VK Bridge
                await vkBridge.send('VKWebAppInit');
                
                // Подписка на события
                this.subscribeToEvents();
                
                // Получаем текущую тему
                const config = await vkBridge.send('VKWebAppGetConfig');
                this.handleThemeChange(config.scheme || 'bright_light');
                
                // Загружаем заметки
                await this.loadNotes();
            } else {
                // Режим разработки (вне VK)
                console.log('Running in development mode');
                this.loadNotesFromLocalStorage();
            }
            
            this.renderNotes();
        } catch (error) {
            console.error('App initialization failed:', error);
            this.loadNotesFromLocalStorage();
            this.renderNotes();
        }
    }

    subscribeToEvents() {
        vkBridge.subscribe((event) => {
            console.log('VK Event:', event.detail.type);
            
            switch (event.detail.type) {
                case 'VKWebAppUpdateConfig':
                    this.handleThemeChange(event.detail.data.scheme);
                    break;
                    
                case 'VKWebAppGoBack':
                    if (this.editForm.classList.contains('active')) {
                        this.cancelEditing();
                    }
                    break;
            }
        });
    }

    handleThemeChange(scheme) {
        this.currentTheme = scheme;
        document.body.classList.toggle('dark-mode', scheme === 'space_gray');
    }

    initElements() {
        this.notesList = document.getElementById('notes-list');
        this.emptyState = document.getElementById('empty-state');
        this.newNoteText = document.getElementById('new-note-text');
        this.addNoteBtn = document.getElementById('add-note-btn');
        this.charRemaining = document.getElementById('char-remaining');
        this.errorMessage = document.getElementById('error-message');

        this.editForm = document.getElementById('edit-form');
        this.noteForm = document.getElementById('note-form');
        this.editNoteText = document.getElementById('edit-note-text');
        this.editNoteId = document.getElementById('edit-note-id');
        this.saveEditBtn = document.getElementById('save-edit-btn');
        this.cancelEditBtn = document.getElementById('cancel-edit-btn');
        this.editCharRemaining = document.getElementById('edit-char-remaining');
    }

    initEventListeners() {
        this.newNoteText.addEventListener('input', () => this.updateCharCount(this.newNoteText, this.charRemaining));
        this.editNoteText.addEventListener('input', () => this.updateCharCount(this.editNoteText, this.editCharRemaining));

        this.addNoteBtn.addEventListener('click', () => this.addNote());
        this.saveEditBtn.addEventListener('click', () => this.saveEditedNote());
        this.cancelEditBtn.addEventListener('click', () => this.cancelEditing());

        // Добавление заметки по Enter (без Shift)
        this.newNoteText.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.addNote();
            }
        });
    }

    async loadNotes() {
        try {
            if (this.isVKClient) {
                const storageData = await vkBridge.send('VKWebAppStorageGet', {
                    keys: ['notes']
                });
                
                if (storageData.keys && storageData.keys.length > 0) {
                    this.notes = JSON.parse(storageData.keys[0].value) || [];
                }
            } else {
                this.loadNotesFromLocalStorage();
            }
        } catch (error) {
            console.error('Failed to load notes:', error);
            this.loadNotesFromLocalStorage();
        }
    }

    loadNotesFromLocalStorage() {
        this.notes = JSON.parse(localStorage.getItem('vk-notes')) || [];
    }

    async saveNotes() {
        try {
            if (this.isVKClient) {
                await vkBridge.send('VKWebAppStorageSet', {
                    key: 'notes',
                    value: JSON.stringify(this.notes)
                });
            } else {
                localStorage.setItem('vk-notes', JSON.stringify(this.notes));
            }
        } catch (error) {
            console.error('Failed to save notes:', error);
            localStorage.setItem('vk-notes', JSON.stringify(this.notes));
        }
    }

    updateCharCount(textarea, counterElement) {
        const remaining = 280 - textarea.value.length;
        counterElement.textContent = remaining;
        
        if (remaining < 20) {
            counterElement.style.color = remaining < 0 ? 'var(--vk-error)' : '#FF9C00';
        } else {
            counterElement.style.color = 'var(--vk-text-secondary)';
        }
    }

    async addNote() {
        const text = this.newNoteText.value.trim();
        
        if (!text) {
            this.showError('Заметка не может быть пустой');
            return;
        }
        
        if (text.length > 280) {
            this.showError('Превышен лимит в 280 символов');
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
        await this.saveNotes();
        this.renderNotes();
        
        // Сброс формы
        this.newNoteText.value = '';
        this.charRemaining.textContent = 280;
        this.charRemaining.style.color = 'var(--vk-text-secondary)';
        
        // Тактильная отдача
        if (this.isVKClient) {
            try {
                await vkBridge.send('VKWebAppTapticImpactOccurred', { style: 'light' });
            } catch (error) {
                console.error('Haptic feedback failed:', error);
            }
        }
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.style.display = 'block';
        
        if (this.isVKClient) {
            vkBridge.send('VKWebAppTapticNotificationOccurred', { type: 'error' })
                .catch(e => console.error('Taptic error:', e));
        }
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

    async saveEditedNote() {
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
            
            await this.saveNotes();
            this.renderNotes();
        }
        
        this.cancelEditing();
    }

    cancelEditing() {
        this.editForm.classList.remove('active');
        this.noteForm.classList.add('active');
        this.editNoteText.value = '';
    }

    async deleteNote(id) {
        try {
            if (this.isVKClient) {
                const result = await vkBridge.send('VKWebAppShowSnackbar', {
                    text: 'Удалить заметку?',
                    button_text: 'Удалить'
                });
                
                if (result.result) {
                    this.confirmDelete(id);
                }
            } else {
                if (confirm('Удалить заметку?')) {
                    this.confirmDelete(id);
                }
            }
        } catch (error) {
            console.error('Delete error:', error);
            if (confirm('Удалить заметку?')) {
                this.confirmDelete(id);
            }
        }
    }

    async confirmDelete(id) {
        this.notes = this.notes.filter(note => note.id !== id);
        await this.saveNotes();
        this.renderNotes();
        
        if (this.isVKClient) {
            try {
                await vkBridge.send('VKWebAppTapticImpactOccurred', { style: 'medium' });
            } catch (error) {
                console.error('Haptic feedback failed:', error);
            }
        }
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
                    <button class="note-action edit">
                        <i class="fas fa-edit"></i> Изменить
                    </button>
                    <button class="note-action delete">
                        <i class="fas fa-trash-alt"></i> Удалить
                    </button>
                </div>
            `;
            
            // Назначаем обработчики событий напрямую
            noteElement.querySelector('.note-action.edit').addEventListener('click', () => {
                this.startEditingNote(note.id);
            });
            
            noteElement.querySelector('.note-action.delete').addEventListener('click', () => {
                this.deleteNote(note.id);
            });
            
            this.notesList.appendChild(noteElement);
        });
    }
}

// Инициализация приложения после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    window.vkNotesApp = new VKNotesApp();
});