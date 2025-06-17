import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import NoteForm from './components/NoteForm';
import NoteList from './components/NoteList';
import './styles/App.css';

function App() {
  const [notes, setNotes] = useState([]);
  const [isVKClient, setIsVKClient] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('bright_light');
  const [isEditing, setIsEditing] = useState(false);
  const [editingNote, setEditingNote] = useState(null);

  useEffect(() => {
    const vkClient = typeof vkBridge !== 'undefined';
    setIsVKClient(vkClient);

    if (vkClient) {
      initVKApp();
    } else {
      loadNotesFromLocalStorage();
    }
  }, []);

  const initVKApp = async () => {
    try {
      await vkBridge.send('VKWebAppInit');
      subscribeToEvents();
      const config = await vkBridge.send('VKWebAppGetConfig');
      handleThemeChange(config.scheme || 'bright_light');
      await loadNotes();
    } catch (error) {
      console.error('VK init failed:', error);
      loadNotesFromLocalStorage();
    }
  };

  const subscribeToEvents = () => {
    vkBridge.subscribe((event) => {
      switch (event.detail.type) {
        case 'VKWebAppUpdateConfig':
          handleThemeChange(event.detail.data.scheme);
          break;
        case 'VKWebAppGoBack':
          if (isEditing) {
            cancelEditing();
          }
          break;
      }
    });
  };

  const handleThemeChange = (scheme) => {
    setCurrentTheme(scheme);
    document.body.classList.toggle('dark-mode', scheme === 'space_gray');
  };

  const loadNotes = async () => {
    try {
      const storageData = await vkBridge.send('VKWebAppStorageGet', {
        keys: ['notes']
      });
      
      if (storageData.keys && storageData.keys.length > 0) {
        setNotes(JSON.parse(storageData.keys[0].value) || []);
      }
    } catch (error) {
      console.error('Failed to load notes:', error);
      loadNotesFromLocalStorage();
    }
  };

  const loadNotesFromLocalStorage = () => {
    const savedNotes = JSON.parse(localStorage.getItem('vk-notes')) || [];
    setNotes(savedNotes);
  };

  const saveNotes = async (notesToSave) => {
    try {
      if (isVKClient) {
        await vkBridge.send('VKWebAppStorageSet', {
          key: 'notes',
          value: JSON.stringify(notesToSave)
        });
      } else {
        localStorage.setItem('vk-notes', JSON.stringify(notesToSave));
      }
    } catch (error) {
      console.error('Failed to save notes:', error);
      localStorage.setItem('vk-notes', JSON.stringify(notesToSave));
    }
  };

  const addNote = async (text) => {
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

    const updatedNotes = [newNote, ...notes];
    setNotes(updatedNotes);
    await saveNotes(updatedNotes);

    if (isVKClient) {
      try {
        await vkBridge.send('VKWebAppTapticImpactOccurred', { style: 'light' });
      } catch (error) {
        console.error('Haptic feedback failed:', error);
      }
    }
  };

  const startEditing = (note) => {
    setEditingNote(note);
    setIsEditing(true);
    window.scrollTo(0, 0);
  };

  const saveEditedNote = async (text) => {
    const updatedNotes = notes.map(note => 
      note.id === editingNote.id ? {
        ...note,
        text: text,
        date: new Date().toLocaleString('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      } : note
    );

    setNotes(updatedNotes);
    await saveNotes(updatedNotes);
    cancelEditing();
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditingNote(null);
  };

  const deleteNote = async (id) => {
    try {
      if (isVKClient) {
        const result = await vkBridge.send('VKWebAppShowSnackbar', {
          text: 'Удалить заметку?',
          button_text: 'Удалить'
        });
        
        if (result.result) {
          confirmDelete(id);
        }
      } else {
        if (window.confirm('Удалить заметку?')) {
          confirmDelete(id);
        }
      }
    } catch (error) {
      console.error('Delete error:', error);
      if (window.confirm('Удалить заметку?')) {
        confirmDelete(id);
      }
    }
  };

  const confirmDelete = async (id) => {
    const updatedNotes = notes.filter(note => note.id !== id);
    setNotes(updatedNotes);
    await saveNotes(updatedNotes);
    
    if (isVKClient) {
      try {
        await vkBridge.send('VKWebAppTapticImpactOccurred', { style: 'medium' });
      } catch (error) {
        console.error('Haptic feedback failed:', error);
      }
    }
  };

  return (
    <div className="vk-app">
      <Header />
      <main className="vk-content">
        {isEditing ? (
          <NoteForm 
            key="edit-form"
            mode="edit"
            initialText={editingNote?.text}
            onSave={saveEditedNote}
            onCancel={cancelEditing}
            charLimit={280}
          />
        ) : (
          <NoteForm 
            key="add-form"
            mode="add"
            onAdd={addNote}
            charLimit={280}
          />
        )}
        <NoteList 
          notes={notes} 
          onEdit={startEditing} 
          onDelete={deleteNote} 
        />
      </main>
    </div>
  );
}

export default App;