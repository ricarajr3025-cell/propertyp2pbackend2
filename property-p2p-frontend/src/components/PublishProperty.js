import React, { useState } from 'react';
import axios from 'axios';
import colombiaCities from './countries.json';

export default function PublishProperty({ token, backendUrl }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [price, setPrice] = useState('');
  const [images, setImages] = useState([]);

  const handleFileChange = e => {
    setImages(e.target.files);
  };

  const publish = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('location', location);
      formData.append('propertyType', propertyType);
      formData.append('price', price);
      for (let i = 0; i < images.length; i++) {
        formData.append('images', images[i]);
      }
      await axios.post(`${backendUrl}/api/properties`, formData, { // <--- CORREGIDO
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      alert('Propiedad publicada con fotos');
      setTitle('');
      setDescription('');
      setLocation('');
      setPropertyType('');
      setPrice('');
      setImages([]);
    } catch (e) {
      alert('Error al publicar');
    }
  };

  return (
    <div>
      <h2>Publicar Propiedad</h2>
      <form onSubmit={publish} encType="multipart/form-data">
        <input placeholder="Título" value={title} onChange={e => setTitle(e.target.value)} name="title" required />
        <input placeholder="Descripción" value={description} onChange={e => setDescription(e.target.value)} name="description" required />

        {/* Select para tipo de propiedad */}
        <select value={propertyType} onChange={e => setPropertyType(e.target.value)} required>
          <option value="">Selecciona tipo de propiedad</option>
          <option value="Casa">Casa</option>
          <option value="Lote">Lote</option>
          <option value="Apartamento">Apartamento</option>
          <option value="Edificio">Edificio</option>
          <option value="Local Comercial">Local Comercial</option>
        </select>

        {/* Select para ciudad */}
        <select value={location} onChange={e => setLocation(e.target.value)} required>
          <option value="">Selecciona ciudad</option>
          {colombiaCities.map((city, idx) => (
            <option key={idx} value={city}>{city}</option>
          ))}
        </select>

        <input placeholder="Precio" type="number" value={price} onChange={e => setPrice(e.target.value)} name="price" required />
        <input type="file" name="images" multiple accept="image/*" onChange={handleFileChange} />
        <button type="submit">Publicar</button>
      </form>
    </div>
  );
}