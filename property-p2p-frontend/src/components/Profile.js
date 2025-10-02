import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Profile({ token, backendUrl }) {
  const [user, setUser] = useState(null);
  const [properties, setProperties] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener perfil
        const resUser = await axios.get(`${backendUrl}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(resUser.data);
        setEditName(resUser.data.name || '');
        setEditAvatar(resUser.data.avatar || '');
        // Propiedades propias
        const resProp = await axios.get(`${backendUrl}/api/profile/properties`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProperties(resProp.data);
        // Transacciones propias
        const resTrans = await axios.get(`${backendUrl}/api/profile/transactions`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTransactions(resTrans.data);
      } catch (e) {
        setError('Error al cargar perfil.');
      }
    };
    fetchData();
  }, [token, backendUrl]);

  // Guardar cambios de perfil
  const handleSave = async () => {
    try {
      await axios.put(`${backendUrl}/api/profile`, {
        name: editName,
        avatar: editAvatar
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEditing(false);
      setError('');
      setUser({ ...user, name: editName, avatar: editAvatar });
    } catch (e) {
      setError('No se pudo guardar los cambios.');
    }
  };

  if (!user) return <div>Cargando perfil...</div>;

  return (
    <div className="profile-container" style={{ maxWidth: 600, margin: 'auto', padding: 20 }}>
      <h2>Mi Perfil</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div className="profile-info" style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <img
          src={user.avatar || 'https://ui-avatars.com/api/?name=' + (user.name || user.email)}
          alt="Avatar"
          className="profile-avatar"
          style={{ width: 100, borderRadius: '50%' }}
        />
        {editing ? (
          <div>
            <input
              type="text"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              placeholder="Nombre"
              style={{ marginBottom: 8 }}
            />
            <input
              type="text"
              value={editAvatar}
              onChange={e => setEditAvatar(e.target.value)}
              placeholder="URL de foto"
              style={{ marginBottom: 8 }}
            />
            <button onClick={handleSave}>Guardar</button>
            <button onClick={() => setEditing(false)} style={{ marginLeft: 8 }}>Cancelar</button>
          </div>
        ) : (
          <div>
            <p><b>Nombre:</b> {user.name || '(no definido)'}</p>
            <p><b>Correo:</b> {user.email}</p>
            <button onClick={() => setEditing(true)}>Editar perfil</button>
          </div>
        )}
      </div>
      <hr />
      <h3>Propiedades publicadas</h3>
      {properties.length === 0 ? (
        <p>No has publicado propiedades.</p>
      ) : (
        <ul>
          {properties.map(prop => (
            <li key={prop._id}>
              <b>{prop.title}</b> - {prop.status}
            </li>
          ))}
        </ul>
      )}
      <hr />
      <h3>Transacciones</h3>
      {transactions.length === 0 ? (
        <p>No tienes transacciones todavía.</p>
      ) : (
        <ul>
          {transactions.map(tx => (
            <li key={tx._id}>
              <b>{tx.type}</b> - {tx.status} - {tx.amount ? `$${tx.amount}` : ''}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}