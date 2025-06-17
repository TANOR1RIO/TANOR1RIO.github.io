import React from 'react';
import Note from './Note';
import { FaClipboardList, FaFeatherAlt } from 'react-icons/fa';

function NoteList({ notes, onEdit, onDelete }) {
  if (notes.length === 0) {
    return (
      <div className="vk-card">
        <h2><FaClipboardList /> Ваши заметки</h2>
        <div className="vk-empty-state">
          <FaFeatherAlt size={24} />
          <p>У вас пока нет заметок</p>
          <p>Напишите что-нибудь вдохновляющее!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="vk-card">
      <h2><FaClipboardList /> Ваши заметки</h2>
      <div className="notes-list">
        {notes.map(note => (
          <Note 
            key={note.id} 
            note={note} 
            onEdit={onEdit} 
            onDelete={onDelete} 
          />
        ))}
      </div>
    </div>
  );
}

export default NoteList;