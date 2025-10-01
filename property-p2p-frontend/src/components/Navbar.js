import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

export default function Navbar({ token, setToken }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="menu-btn"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
      >
        ☰
      </button>
      {open && (
        <div className="sidebar-menu">
          <button className="close-btn" onClick={() => setOpen(false)}>×</button>
          <ul>
            <li><Link to="/" onClick={() => setOpen(false)}>Inicio</Link></li>
            <li><Link to="/properties" onClick={() => setOpen(false)}>Buscar Propiedad</Link></li>
            {!token && <li><Link to="/login" onClick={() => setOpen(false)}>Login</Link></li>}
            {!token && <li><Link to="/register" onClick={() => setOpen(false)}>Registro</Link></li>}
            {!token && <li><Link to="/publish" onClick={() => setOpen(false)}>Registrar Propiedad</Link></li>}
            {token && <li><Link to="/profile" onClick={() => setOpen(false)}>Perfil</Link></li>}
            {token && <li><Link to="/transactions" onClick={() => setOpen(false)}>Transacciones</Link></li>}
            {token && <li><Link to="/publish" onClick={() => setOpen(false)}>Publicar</Link></li>}
            {token && (
              <li>
                <button
                  className="logout-btn"
                  onClick={() => {
                    localStorage.removeItem('token');
                    setToken(null);
                    setOpen(false);
                  }}
                >Cerrar sesión</button>
              </li>
            )}
          </ul>
        </div>
      )}
    </>
  );
}