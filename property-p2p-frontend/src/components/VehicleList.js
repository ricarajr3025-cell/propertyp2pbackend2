import React, { useState, useEffect } from "react";
import axios from "axios";

export default function VehicleList({ backendUrl }) {
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    axios.get(`${backendUrl}/api/vehicles`)
      .then(res => setVehicles(res.data));
  }, [backendUrl]);

  return (
    <div>
      <h2>Vehículos disponibles</h2>
      {vehicles.map(v => (
        <div key={v._id} style={{ marginBottom: '30px' }}>
          {v.images && v.images.length > 0 && (
            <img
              src={`${backendUrl}/${v.images[0]}`}
              alt={v.title}
              style={{ width: '250px', borderRadius: '12px', marginBottom: '10px' }}
            />
          )}
          <h3>{v.title} - ${v.price}</h3>
          <p>{v.description}</p>
          <p>Ubicación: {v.location}</p>
          <p>Categoría: {v.category}</p>
          {v.owner && (
            <p>Propietario: {v.owner.username || v.owner.email}</p>
          )}
        </div>
      ))}
    </div>
  );
}
