import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import Cropper from 'react-easy-crop';

const countries = [
  { code: "CO", name: "Colombia", emoji: "🇨🇴" },
  { code: "MX", name: "México", emoji: "🇲🇽" },
  { code: "AR", name: "Argentina", emoji: "🇦🇷" },
  { code: "ES", name: "España", emoji: "🇪🇸" },
  { code: "US", name: "Estados Unidos", emoji: "🇺🇸" },
  { code: "BR", name: "Brasil", emoji: "🇧🇷" }
];

const documentOptions = [
  { value: "cedula_ciudadania", label: "Cédula de ciudadanía" },
  { value: "pasaporte", label: "Pasaporte" },
  { value: "cedula_extranjeria", label: "Cédula de extranjería" },
];

// Utilidad para recortar imagen
function getCroppedImg(imageSrc, pixelCrop, outputSize = 300) {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.crossOrigin = "Anonymous";
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = outputSize;
      canvas.height = outputSize;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        outputSize,
        outputSize
      );
      resolve(canvas.toDataURL('image/jpeg'));
    };
    image.onerror = error => reject(error);
  });
}

export default function Profile({ token, backendUrl }) {
  const [user, setUser] = useState(null);
  const [properties, setProperties] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAvatarFile, setEditAvatarFile] = useState(null);

  // Cropper states
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  // Verificación
  const [verification, setVerification] = useState(null);
  const [nationality, setNationality] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [front, setFront] = useState(null);
  const [back, setBack] = useState(null);
  const [verifMsg, setVerifMsg] = useState('');
  const [showVerificationForm, setShowVerificationForm] = useState(false);

  const fetchProfile = async () => {
    try {
      const resUser = await axios.get(`${backendUrl}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(resUser.data);
      setEditName(resUser.data.name || '');
      const resProp = await axios.get(`${backendUrl}/api/profile/properties`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProperties(resProp.data);

      const resTrans = await axios.get(`${backendUrl}/api/profile/transactions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(resTrans.data);

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

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line
  }, [token, backendUrl]);

  // Guardar cambios de perfil
  const handleSave = async () => {
    try {
      let avatarData = user?.avatar || '';
      // Si hay cropper visible y archivo, recorta la imagen antes de guardar
      if (editAvatarFile && croppedAreaPixels) {
        avatarData = await getCroppedImg(
          URL.createObjectURL(editAvatarFile),
          croppedAreaPixels,
          300
        );
      }
      await axios.put(`${backendUrl}/api/profile`, {
        name: editName,
        avatar: avatarData,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEditing(false);
      setError('');
      setEditAvatarFile(null);
      setShowCropper(false);
      setTimeout(fetchProfile, 300);
    } catch (e) {
      setError('No se pudo guardar los cambios.');
    }
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setEditAvatarFile(file);
    setShowCropper(true);
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
      setShowVerificationForm(false);
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
          key={user.avatar}
          src={user.avatar && user.avatar.startsWith('data:image') ? user.avatar : 'https://ui-avatars.com/api/?name=' + (user.name || user.email)}
          alt="Avatar"
          className="profile-avatar"
          style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', background: '#191a1c', border: '2px solid #38a3f1' }}
        />
        {editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <input
              type="text"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              placeholder="Nombre"
              style={{ marginBottom: 8 }}
            />
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarFileChange}
              style={{ marginBottom: 8 }}
            />
            {showCropper && editAvatarFile && (
              <div style={{ position: 'relative', width: 300, height: 300, background: '#222', marginBottom: 12 }}>
                <Cropper
                  image={URL.createObjectURL(editAvatarFile)}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
                <div style={{ marginTop: 10 }}>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.01}
                    value={zoom}
                    onChange={e => setZoom(Number(e.target.value))}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setShowCropper(false);
                      setEditAvatarFile(null);
                    }}
                    style={{ marginLeft: 8 }}
                  >Cancelar recorte</button>
                </div>
              </div>
            )}
            {/* No hay botón de "Recortar foto", el recorte se hace con Guardar */}
            <button onClick={handleSave}>Guardar</button>
            <button onClick={() => { setEditing(false); setEditAvatarFile(null); setShowCropper(false); }} style={{ marginLeft: 8 }}>Cancelar</button>
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

      <div>
        <h3>Verificación de identidad</h3>
        {verification && verification.verified ? (
          <span style={{ color: "green" }}>✅ Verificado</span>
        ) : (
          <button
            style={{
              background: "#38a3f1",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "0.8em 1.2em",
              fontWeight: "600",
              fontSize: "1em",
              cursor: "pointer",
              marginBottom: "1em"
            }}
            onClick={() => setShowVerificationForm(!showVerificationForm)}
          >
            {showVerificationForm ? "Ocultar verificación" : "Iniciar verificación"}
          </button>
        )}
        {showVerificationForm && (
          <>
            <form onSubmit={handleVerifSubmit} style={{marginTop: '1em'}}>
              <label>País/Nacionalidad:</label>
              <select value={nationality} onChange={e => setNationality(e.target.value)} required>
                <option value="">Selecciona tu país</option>
                {countries.map(c => (
                  <option key={c.code} value={c.name}>
                    {c.emoji} {c.name}
                  </option>
                ))}
              </select>
              <label>Tipo de documento:</label>
              <select value={documentType} onChange={e => setDocumentType(e.target.value)} required>
                <option value="">Selecciona tipo</option>
                {documentOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <label>Foto (frontal):</label>
              <input type="file" accept="image/*" onChange={e => setFront(e.target.files[0])} required />
              <label>Foto (reverso):</label>
              <input type="file" accept="image/*" onChange={e => setBack(e.target.files[0])} required />
              <button type="submit" style={{marginTop: '1em'}}>Enviar verificación</button>
            </form>
            {verifMsg && <p>{verifMsg}</p>}
            {verification?.documentFront && (
              <div>
                <p>Documento frontal:</p>
                <img src={`data:image/*;base64,${verification.documentFront}`} alt="Frontal" style={{maxWidth:200, border:'2px solid #38a3f1', borderRadius:'12px'}} />
              </div>
            )}
            {verification?.documentBack && (
              <div>
                <p>Documento reverso:</p>
                <img src={`data:image/*;base64,${verification.documentBack}`} alt="Reverso" style={{maxWidth:200, border:'2px solid #38a3f1', borderRadius:'12px'}} />
              </div>
            )}
          </>
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