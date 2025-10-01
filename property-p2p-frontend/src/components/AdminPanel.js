import React, { useState, useEffect } from 'react';

function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    async function fetchData() {
      try {
        const userRes = await fetch('/api/admin/users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const usersData = await userRes.json();

        const propertyRes = await fetch('/api/admin/properties', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const propertiesData = await propertyRes.json();

        setUsers(usersData);
        setProperties(propertiesData);
        setLoading(false);
      } catch (e) {
        setLoading(false);
        alert("No tienes permisos de administrador o hubo un error.");
      }
    }
    fetchData();
  }, [token]);

  const handleDeleteUser = async (id) => {
    if (!window.confirm('¿Seguro que quieres eliminar este usuario?')) return;
    await fetch(`/api/admin/users/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    setUsers(users.filter(u => u._id !== id));
  };

  const handleDeleteProperty = async (id) => {
    if (!window.confirm('¿Seguro que quieres eliminar esta propiedad?')) return;
    await fetch(`/api/admin/properties/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    setProperties(properties.filter(p => p._id !== id));
  };

  if (loading) return <div>Cargando...</div>;
  return (
    <div>
      <h2>Panel de Administración</h2>
      <section>
        <h3>Usuarios</h3>
        <ul>
          {users.map(user => (
            <li key={user._id}>
              {user.email} ({user.role})
              <button onClick={() => handleDeleteUser(user._id)}>Eliminar</button>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h3>Propiedades</h3>
        <ul>
          {properties.map(prop => (
            <li key={prop._id}>
              {prop.title}
              <button onClick={() => handleDeleteProperty(prop._id)}>Eliminar</button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default AdminPanel;
