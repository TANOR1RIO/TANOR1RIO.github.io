import React from 'react';
import { FaClock, FaEdit, FaTrashAlt } from 'react-icons/fa';

function Note({ note, onEdit, onDelete }) {
  return (
    <div className="note">
      <div className="note-header">
        <div className="note-date">
          <FaClock /> {note.date}
        </div>
      </div>
      <div className="note-text">{note.text}</div>
      <div className="note-actions">
        <button 
          className="note-action edit"
          onClick={() => onEdit(note)}
        >
          <FaEdit /> Изменить
        </button>
        <button 
          className="note-action delete"
          onClick={() => onDelete(note.id)}
        >
          <FaTrashAlt /> Удалить
        </button>
      </div>
    </div>
  );
}

export default Note;