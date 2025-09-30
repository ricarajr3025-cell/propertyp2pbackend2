import React, { useState } from 'react';
import axios from 'axios';

export default function PublishProperty({ token, backendUrl }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState('');

  const publish = async () => {
    try {
      await axios.post(`${backendUrl}/api/properties`, {
        title, description, location, price
      }, { headers: { Authorization: `Bearer ${token}` } });
      alert('Propiedad publicada');
    } catch (e) {
      alert('Error al publicar');
    }
  };

  return (
    <div>
      <h2>Publicar Propiedad</h2>
      <input placeholder="Título" value={title} onChange={e => setTitle(e.target.value)} />
      <input placeholder="Descripción" value={description} onChange={e => setDescription(e.target.value)} />
      <input placeholder="Ubicación" value={location} onChange={e => setLocation(e.target.value)} />
      <input placeholder="Precio" type="number" value={price} onChange={e => setPrice(e.target.value)} />
      <button onClick={publish}>Publicar</button>
    </div>
  );
}
