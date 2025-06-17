import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaPaperPlane, FaTimes, FaSave } from 'react-icons/fa';

function NoteForm({ mode, initialText = '', onAdd, onSave, onCancel, charLimit }) {
  const [text, setText] = useState(initialText);
  const [error, setError] = useState('');
  const [charsRemaining, setCharsRemaining] = useState(charLimit - initialText.length);

  useEffect(() => {
    setText(initialText);
    setCharsRemaining(charLimit - initialText.length);
  }, [initialText, charLimit]);

  const handleTextChange = (e) => {
    setText(e.target.value);
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedText = text.trim();

    if (!trimmedText) {
      setError('Заметка не может быть пустой');
      return;
    }

    if (trimmedText.length > charLimit) {
      setError(`Превышен лимит в ${charLimit} символов`);
      return;
    }

    if (mode === 'add') {
      onAdd(trimmedText);
      setText('');
    } else {
      onSave(trimmedText);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && mode === 'add') {
      handleSubmit(e);
    }
  };

  const charCountClass = charsRemaining < 0 
    ? 'char-count over-limit' 
    : charsRemaining < 20 
      ? 'char-count warning' 
      : 'char-count';

  return (
    <div className={`vk-card ${mode === 'edit' ? 'edit-form' : ''}`}>
      <h2>
        {mode === 'add' ? <FaPlus /> : <FaEdit />}
        {mode === 'add' ? ' Новая заметка' : ' Редактировать'}
      </h2>
      <form onSubmit={handleSubmit}>
        <textarea
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          maxLength={charLimit}
          placeholder={mode === 'add' ? 'О чем вы думаете?' : ''}
        />
        <div className="form-footer">
          <div className={charCountClass}>
            <span className={charsRemaining < 0 ? 'over-limit' : ''}>{charsRemaining}</span>/{charLimit}
          </div>
          {mode === 'edit' ? (
            <div className="edit-buttons">
              <button 
                type="button" 
                className="vk-button vk-button--secondary"
                onClick={onCancel}
              >
                <FaTimes /> Отмена
              </button>
              <button type="submit" className="vk-button vk-button--primary">
                <FaSave /> Сохранить
              </button>
            </div>
          ) : (
            <button type="submit" className="vk-button vk-button--primary">
              <FaPaperPlane /> Опубликовать
            </button>
          )}
        </div>
        {error && <div className="vk-error">{error}</div>}
      </form>
    </div>
  );
}

export default NoteForm;