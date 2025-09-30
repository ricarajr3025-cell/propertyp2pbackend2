import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Profile({ token, backendUrl }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    axios.get(`${backendUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setUser(res.data));
  }, [token, backendUrl]);

  if (!user) return <p>Cargando perfil...</p>;

  return (
    <div>
      <h2>Mi perfil</h2>
      <p>Usuario: {user.username}</p>
      <p>ID: {user._id}</p>
      {/* Puedes mostrar el historial de transacciones, propiedades publicadas, etc. */}
    </div>
  );
}
