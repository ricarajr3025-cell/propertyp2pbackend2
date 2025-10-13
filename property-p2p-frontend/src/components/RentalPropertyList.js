import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ChatBoxAlquiler from './ChatBoxAlquiler';

export default function RentalPropertyList({ token, backendUrl, userId }) {
  const [properties, setProperties] = useState([]);
  const [activeChat, setActiveChat] = useState(null);

  useEffect(() => {
    axios.get(`${backendUrl}/api/rental-properties`)
      .then(res => setProperties(res.data));
  }, [backendUrl]);

  const contactOwner = (property) => {
    setActiveChat({
      property,
      owner: property.owner,
      userId
    });
  };

  return (
    <div>
      <h2>Propiedades en alquiler disponibles</h2>
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
          <button onClick={() => contactOwner(p)}>Contactar</button>
        </div>
      ))}
      {/* Chat previo sin transacción */}
      {activeChat && (
        <ChatBoxAlquiler
          property={activeChat.property}
          owner={activeChat.owner}
          userId={activeChat.userId}
          token={token}
          backendUrl={backendUrl}
          onTransactionCreated={() => window.location.href = "/transactions"}
        />
      )}
    </div>
  );
}