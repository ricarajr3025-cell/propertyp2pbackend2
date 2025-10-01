import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

export default function Header({ token }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="main-header">
      <div className="header-top">
        <img src="/logo.png" alt="Logo" className="logo" />
        <div className="lang-flags">
          <img src="/us.png" alt="US" />
          <img src="/br.png" alt="BR" />
        </div>
        <button className="menu-btn" onClick={() => setMenuOpen(true)}>
          <span className="menu-icon">&#9776;</span>
        </button>
      </div>
      {menuOpen && (
        <div className="side-menu">
          <button className="close-btn" onClick={() => setMenuOpen(false)}>×</button>
          <nav>
            <Link to="/" onClick={() => setMenuOpen(false)}>Inicio</Link>
            <Link to="/properties" onClick={() => setMenuOpen(false)}>Buscar Propiedad</Link>
            <Link to="/login" onClick={() => setMenuOpen(false)}>Login</Link>
            <Link to="/register" onClick={() => setMenuOpen(false)}>Registro</Link>
            {token && (
              <Link to="/publish" onClick={() => setMenuOpen(false)}>Registrar Propiedad</Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}