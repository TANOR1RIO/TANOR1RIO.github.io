document.addEventListener('DOMContentLoaded', function() {
    const noteText = document.getElementById('note-text');
    const addNoteBtn = document.getElementById('add-note');
    const notesContainer = document.getElementById('notes-container');
    const charCount = document.getElementById('char-count');

    loadNotes();
    
    // Счетчик символов
    noteText.addEventListener('input', function() {
        const count = this.value.length;
        charCount.textContent = count;
        
        if (count > 250) {
            charCount.classList.add('warning');
        } else {
            charCount.classList.remove('warning');
        }
    });
    
    // Добавление новой заметки
    addNoteBtn.addEventListener('click', function() {
        const text = noteText.value.trim();
        if (text === '') {
            showAlert('Заметка не может быть пустой');
            return;
        }
        
        addNote(text);
        noteText.value = '';
        charCount.textContent = '0';
        charCount.classList.remove('warning');
    });
    
    // Функция показа уведомления
    function showAlert(message) {
        const alert = document.createElement('div');
        alert.className = 'alert';
        alert.textContent = message;
        document.body.appendChild(alert);
        
        setTimeout(() => {
            alert.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            alert.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(alert);
            }, 200);
        }, 3000);
    }
    
    // Функция добавления заметки
    function addNote(text) {
        const note = {
            text: text,
            date: new Date().toLocaleString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        };
        
        let notes = getNotes();
        notes.unshift(note);
        saveNotes(notes);
        renderNotes();
    }
    
    // Функция редактирования заметки
    function editNote(index) {
        const notes = getNotes();
        const note = notes[index];
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close">&times;</span>
                <h2>Редактирование заметки</h2>
                <textarea id="edit-textarea">${note.text}</textarea>
                <div class="counter"><span id="edit-char-count">${note.text.length}</span>/280</div>
                <button class="save-edit">Сохранить</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'block';
        
        const editTextarea = modal.querySelector('#edit-textarea');
        const saveBtn = modal.querySelector('.save-edit');
        const closeBtn = modal.querySelector('.close');
        const editCharCount = modal.querySelector('#edit-char-count');
        
        editTextarea.focus();
        
        editTextarea.addEventListener('input', function() {
            const count = this.value.length;
            editCharCount.textContent = count;
            
            if (count > 250) {
                editCharCount.classList.add('warning');
            } else {
                editCharCount.classList.remove('warning');
            }
        });
        
        saveBtn.addEventListener('click', function() {
            const newText = editTextarea.value.trim();
            if (newText === '') {
                showAlert('Заметка не может быть пустой');
                return;
            }
            
            notes[index].text = newText;
            notes[index].date = new Date().toLocaleString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }) + ' (изменено)';
            
            saveNotes(notes);
            renderNotes();
            closeModal(modal);
        });
        
        closeBtn.addEventListener('click', function() {
            closeModal(modal);
        });
        
        window.addEventListener('click', function(event) {
            if (event.target === modal) {
                closeModal(modal);
            }
        });
        
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeModal(modal);
            }
        });
    }
    
    function closeModal(modal) {
        modal.style.animation = 'modalFadeOut 0.2s forwards';
        setTimeout(() => {
            document.body.removeChild(modal);
        }, 200);
    }
    
    // Функция удаления заметки
    function deleteNote(index) {
        const confirmModal = document.createElement('div');
        confirmModal.className = 'modal';
        confirmModal.innerHTML = `
            <div class="modal-content">
                <h2>Удалить заметку?</h2>
                <p>Это действие нельзя отменить</p>
                <div class="modal-actions">
                    <button class="cancel-btn">Отмена</button>
                    <button class="confirm-btn">Удалить</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(confirmModal);
        confirmModal.style.display = 'block';
        
        const cancelBtn = confirmModal.querySelector('.cancel-btn');
        const confirmBtn = confirmModal.querySelector('.confirm-btn');
        
        cancelBtn.addEventListener('click', function() {
            closeModal(confirmModal);
        });
        
        confirmBtn.addEventListener('click', function() {
            let notes = getNotes();
            notes.splice(index, 1);
            saveNotes(notes);
            renderNotes();
            closeModal(confirmModal);
        });
    }
    
    // Функция получения всех заметок
    function getNotes() {
        const notesJson = localStorage.getItem('notes');
        return notesJson ? JSON.parse(notesJson) : [];
    }
    
    // Функция сохранения заметок
    function saveNotes(notes) {
        localStorage.setItem('notes', JSON.stringify(notes));
    }
    
    // Функция загрузки заметок
    function loadNotes() {
        renderNotes();
    }
    
    // Функция отрисовки заметок
    function renderNotes() {
        const notes = getNotes();
        notesContainer.innerHTML = '';
        
        if (notes.length === 0) {
            notesContainer.innerHTML = `
                <div class="empty-state">
                    <p>У вас пока нет заметок</p>
                    <p>Добавьте первую запись</p>
                </div>
            `;
            return;
        }
        
        notes.forEach((note, index) => {
            const noteElement = document.createElement('div');
            noteElement.className = 'note';
            noteElement.innerHTML = `
                <div class="note-text">${note.text}</div>
                <div class="note-date">${note.date}</div>
                <div class="note-actions">
                    <button class="edit-btn" data-index="${index}">Изменить</button>
                    <button class="delete-btn" data-index="${index}">Удалить</button>
                </div>
            `;
            notesContainer.appendChild(noteElement);
        });
        
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                editNote(parseInt(this.getAttribute('data-index')));
            });
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                deleteNote(parseInt(this.getAttribute('data-index')));
            });
        });
    }
    
    // Добавляем стили для анимаций
    const style = document.createElement('style');
    style.textContent = `
        @keyframes modalFadeOut {
            to { opacity: 0; transform: translateY(20px); }
        }
        
        .alert {
            position: fixed;
            top: 1rem;
            left: 50%;
            transform: translateX(-50%) translateY(-100px);
            background: var(--error-color);
            color: white;
            padding: 0.75rem 1.5rem;
            border-radius: 0.375rem;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            opacity: 0;
            transition: all 0.2s ease;
            z-index: 100;
            font-size: 0.9rem;
        }
        
        .alert.show {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
        
        .modal-actions {
            display: flex;
            justify-content: flex-end;
            gap: 0.75rem;
            margin-top: 1.5rem;
        }
        
        .cancel-btn, .confirm-btn {
            padding: 0.5rem 1rem;
            border-radius: 0.375rem;
            cursor: pointer;
            font-size: 0.9rem;
            font-weight: 500;
            transition: all 0.2s;
        }
        
        .cancel-btn {
            background: white;
            color: var(--text-color);
            border: 1px solid var(--border-color);
        }
        
        .cancel-btn:hover {
            background: var(--bg-color);
        }
        
        .confirm-btn {
            background: var(--error-color);
            color: white;
            border: 1px solid var(--error-color);
        }
        
        .confirm-btn:hover {
            background: #b91c1c;
        }
    `;
    document.head.appendChild(style);
});