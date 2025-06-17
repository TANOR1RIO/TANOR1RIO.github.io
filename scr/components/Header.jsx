import React from 'react';
import { FaPencilAlt } from 'react-icons/fa';

function Header() {
  return (
    <header className="vk-header">
      <h1><FaPencilAlt /> Мои заметки</h1>
      <p className="subtitle">Короткие мысли до 280 символов</p>
    </header>
  );
}

export default Header;