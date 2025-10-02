import React, { useEffect, useState } from 'react';
import axios from 'axios';

const countries = [
  { code: "CO", name: "Colombia", emoji: "🇨🇴" },
  { code: "MX", name: "México", emoji: "🇲🇽" },
  { code: "AR", name: "Argentina", emoji: "🇦🇷" },
  { code: "ES", name: "España", emoji: "🇪🇸" },
  { code: "US", name: "Estados Unidos", emoji: "🇺🇸" },
  { code: "BR", name: "Brasil", emoji: "🇧🇷" }
  // Agrega los países que desees
];

const documentOptions = [
  { value: "cedula_ciudadania", label: "Cédula de ciudadanía" },
  { value: "pasaporte", label: "Pasaporte" },
  { value: "cedula_extranjeria", label: "Cédula de extranjería" },
];

export default function Profile({ token, backendUrl }) {
  const [user, setUser] = useState(null);
  const [properties, setProperties] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState('');

  // Verificación
  const [verification, setVerification] = useState(null);
  const [nationality, setNationality] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [front, setFront] = useState(null);
  const [back, setBack] = useState(null);
  const [verifMsg, setVerifMsg] = useState('');

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

        // Verificación
        const resVerif = await axios.get(`${backendUrl}/api/profile/verify`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setVerification(resVerif.data);
        setNationality(resVerif.data.nationality || '');
        setDocumentType(resVerif.data.documentType || '');
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

  // Enviar verificación
  const handleVerifSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("nationality", nationality);
    formData.append("documentType", documentType);
    if (front) formData.append("documentFront", front);
    if (back) formData.append("documentBack", back);

    try {
      await axios.post(`${backendUrl}/api/profile/verify`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setVerifMsg("¡Verificación enviada!");
      // Actualiza verificación
      const resVerif = await axios.get(`${backendUrl}/api/profile/verify`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVerification(resVerif.data);
    } catch {
      setVerifMsg("Error al guardar la verificación.");
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

      {/* Módulo de verificación */}
      <div>
        <h3>Verificación de identidad</h3>
        {verification && verification.verified && <span style={{ color: "green" }}>✅ Verificado</span>}
        <form onSubmit={handleVerifSubmit}>
          <label>País/Nacionalidad:</label>
          <select value={nationality} onChange={e => setNationality(e.target.value)} required>
            <option value="">Selecciona tu país</option>
            {countries.map(c => (
              <option key={c.code} value={c.name}>
                {c.emoji} {c.name}
              </option>
            ))}
          </select>
          <br />
          <label>Tipo de documento:</label>
          <select value={documentType} onChange={e => setDocumentType(e.target.value)} required>
            <option value="">Selecciona tipo</option>
            {documentOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <br />
          <label>Foto (frontal):</label>
          <input type="file" accept="image/*" onChange={e => setFront(e.target.files[0])} required />
          <br />
          <label>Foto (reverso):</label>
          <input type="file" accept="image/*" onChange={e => setBack(e.target.files[0])} required />
          <br />
          <button type="submit">Enviar verificación</button>
        </form>
        {verifMsg && <p>{verifMsg}</p>}
        {verification?.documentFront && (
          <div>
            <p>Documento frontal:</p>
            <img src={`data:image/*;base64,${verification.documentFront}`} alt="Frontal" style={{maxWidth:200}} />
          </div>
        )}
        {verification?.documentBack && (
          <div>
            <p>Documento reverso:</p>
            <img src={`data:image/*;base64,${verification.documentBack}`} alt="Reverso" style={{maxWidth:200}} />
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