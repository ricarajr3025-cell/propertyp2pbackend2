import React from 'react';
import { Link } from 'react-router-dom';

export default function Navbar({ token, setToken }) {
  return (
    <nav style={{ background: "#eee", padding: "10px", marginBottom: "20px" }}>
      <Link to="/" style={{ marginRight: "10px" }}>Inicio</Link>
      <Link to="/properties" style={{ marginRight: "10px" }}>Propiedades</Link>
      <Link to="/publish" style={{ marginRight: "10px" }}>Publicar</Link>
      <Link to="/transactions" style={{ marginRight: "10px" }}>Transacciones</Link>
      <Link to="/profile" style={{ marginRight: "10px" }}>Perfil</Link>
      {!token ? (
        <>
          <Link to="/login" style={{ marginRight: "10px" }}>Login</Link>
          <Link to="/register" style={{ marginRight: "10px" }}>Registro</Link>
        </>
      ) : (
        <button onClick={() => {
          localStorage.removeItem('token');
          setToken(null);
        }}>Cerrar sesión</button>
      )}
    </nav>
  );
}
