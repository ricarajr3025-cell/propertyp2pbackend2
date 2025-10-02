import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

export default function Header({ token }) {
  const [menuOpen, setMenuOpen] = useState(false);

  // Animación condicional de rotación
  const iconClass = menuOpen ? "menu-icon rotated" : "menu-icon";

  return (
    <header className="main-header">
      <div className="header-top">
        {!menuOpen && (
          <button
            className="menu-btn"
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menú"
          >
            <span className={iconClass}>&#9776;</span>
          </button>
        )}
      </div>
      {menuOpen && (
        <div className="side-menu">
          <button
            className="menu-btn close-btn"
            onClick={() => setMenuOpen(false)}
            aria-label="Cerrar menú"
          >
            <span className={iconClass}>&#10006;</span>
          </button>
          <nav>
            <Link to="/" onClick={() => setMenuOpen(false)}>Inicio</Link>
            <Link to="/properties" onClick={() => setMenuOpen(false)}>Buscar Propiedad</Link>
            {!token && <Link to="/login" onClick={() => setMenuOpen(false)}>Login</Link>}
            {!token && <Link to="/register" onClick={() => setMenuOpen(false)}>Registro</Link>}
            {token && <Link to="/publish" onClick={() => setMenuOpen(false)}>Registrar Propiedad</Link>}
            {token && <Link to="/profile" onClick={() => setMenuOpen(false)}>Perfil</Link>}
            {token && <Link to="/transactions" onClick={() => setMenuOpen(false)}>Transacciones</Link>}
            {token && (
              <button
                className="logout-btn"
                onClick={() => {
                  localStorage.removeItem('token');
                  window.location.reload();
                }}
              >Cerrar sesión</button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}