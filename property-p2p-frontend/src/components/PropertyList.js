import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function PropertyList({ token, backendUrl }) {
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    axios.get(`${backendUrl}/api/properties`)
      .then(res => setProperties(res.data));
  }, [backendUrl]);

  const buy = async (propertyId) => {
    try {
      await axios.post(`${backendUrl}/api/transactions/buy/${propertyId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Transacción iniciada');
    } catch (e) {
      alert('No se pudo iniciar la transacción');
    }
  };

  return (
    <div>
      <h2>Propiedades disponibles</h2>
      {properties.map(p => (
        <div key={p._id} style={{ marginBottom: '30px' }}>
          {p.images && p.images.length > 0 && (
            <img
              src={`${backendUrl}/${p.images[0]}`}
              alt={p.title}
              style={{ width: '250px', borderRadius: '12px', marginBottom: '10px' }}
            />
          )}
          <h3>{p.title} - ${p.price}</h3>
          <p>{p.description}</p>
          <p>Ubicación: {p.location}</p>
          <p>Tipo: {p.propertyType}</p>
          {p.owner && (
            <p>Propietario: {p.owner.username || p.owner.email}</p>
          )}
          <button onClick={() => buy(p._id)}>Comprar</button>
        </div>
      ))}
    </div>
  );
}