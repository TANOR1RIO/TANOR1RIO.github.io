// Инициализация VK Mini App
vkBridge.send('VKWebAppInit');

// Получение информации о пользователе
let currentUser = null;

vkBridge.send('VKWebAppGetUserInfo')
  .then(data => {
    currentUser = data;
    console.log('User info:', data);
  })
  .catch(error => {
    console.error('Failed to get user info:', error);
  });

// Используем VK Storage вместо localStorage
async function getNotes() {
  try {
    const response = await vkBridge.send('VKWebAppStorageGet', {
      keys: ['notes']
    });
    return response.keys[0]?.value ? JSON.parse(response.keys[0].value) : [];
  } catch (error) {
    console.error('Failed to get notes:', error);
    showAlert('Ошибка загрузки заметок');
    return [];
  }
}

async function saveNotes(notes) {
  try {
    await vkBridge.send('VKWebAppStorageSet', {
      key: 'notes',
      value: JSON.stringify(notes)
    });
  } catch (error) {
    console.error('Failed to save notes:', error);
    showAlert('Ошибка сохранения заметок');
  }
}

document.addEventListener('DOMContentLoaded', function() {
    const noteText = document.getElementById('note-text');
    const addNoteBtn = document.getElementById('add-note');
    const notesContainer = document.getElementById('notes-container');
    const charCount = document.getElementById('char-count');
    
    // Загрузка заметок
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
        
        if (text.length > 280) {
            showAlert('Заметка слишком длинная (макс. 280 символов)');
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
    async function addNote(text) {
        const notes = await getNotes();
        const note = {
            text: text,
            date: new Date().toLocaleString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }),
            userId: currentUser?.id || null
        };
        
        notes.unshift(note);
        await saveNotes(notes);
        renderNotes();
    }
    
    // Функция редактирования заметки
    async function editNote(index) {
        const notes = await getNotes();
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
        
        saveBtn.addEventListener('click', async function() {
            const newText = editTextarea.value.trim();
            if (newText === '') {
                showAlert('Заметка не может быть пустой');
                return;
            }
            
            if (newText.length > 280) {
                showAlert('Заметка слишком длинная (макс. 280 символов)');
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
            
            await saveNotes(notes);
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
    async function deleteNote(index) {
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
        
        confirmBtn.addEventListener('click', async function() {
            const notes = await getNotes();
            notes.splice(index, 1);
            await saveNotes(notes);
            renderNotes();
            closeModal(confirmModal);
        });
    }
    
    // Функция загрузки заметок
    async function loadNotes() {
        renderNotes();
    }
    
    // Функция отрисовки заметок
    async function renderNotes() {
        const notes = await getNotes();
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
    
    // Обработка кнопки "Назад" в VK
    vkBridge.subscribe((e) => {
        if (e.detail.type === 'VKWebAppGoBack') {
            const modals = document.querySelectorAll('.modal');
            if (modals.length > 0) {
                modals.forEach(modal => closeModal(modal));
            } else {
                vkBridge.send('VKWebAppClose', { status: 'success' });
            }
        }
    });
});