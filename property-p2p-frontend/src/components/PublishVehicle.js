import React, { useState } from "react";
import axios from "axios";
const categorias = [
  "Auto", "Moto", "Camioneta", "Camión", "Bus", "Bicicleta", "Cuatrimoto", "SUV", "Pickup", "Van", "Tractor", "Otro"
];

export default function PublishVehicle({ token, backendUrl }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState(categorias[0]);
  const [location, setLocation] = useState("");
  const [images, setImages] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleFileChange = e => setImages(e.target.files);

  const handleSubmit = async e => {
    e.preventDefault();
    setError(""); setSuccess("");
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("price", price);
      formData.append("category", category);
      formData.append("location", location);
      for (let i = 0; i < images.length; i++) {
        formData.append("images", images[i]);
      }
      await axios.post(`${backendUrl}/api/vehicles`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setSuccess("¡Vehículo publicado!");
      setTitle(""); setDescription(""); setPrice(""); setCategory(categorias[0]); setLocation(""); setImages([]);
    } catch (e) {
      setError("Error al publicar el vehículo.");
    }
  };

  return (
    <div className="publish-form-container">
      <h2>Publicar Vehículo</h2>
      <form onSubmit={handleSubmit} className="publish-form" encType="multipart/form-data">
        <input type="text" placeholder="Título" value={title} onChange={e => setTitle(e.target.value)} required />
        <textarea placeholder="Descripción" value={description} onChange={e => setDescription(e.target.value)} required />
        <input type="number" placeholder="Precio" value={price} onChange={e => setPrice(e.target.value)} required />
        <select value={category} onChange={e => setCategory(e.target.value)} required>
          {categorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        <input type="text" placeholder="Ubicación" value={location} onChange={e => setLocation(e.target.value)} />
        <input type="file" multiple accept="image/*" onChange={handleFileChange} />
        <button type="submit">Publicar vehículo</button>
        {success && <div className="success-msg">{success}</div>}
        {error && <div className="error-msg">{error}</div>}
      </form>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
        {images.length > 0 && Array.from(images).map((img, idx) => (
          <img key={idx} src={URL.createObjectURL(img)} alt="preview" style={{ width: 60, height: 60, borderRadius: 8, objectFit: "cover", border: "1px solid #ccc" }} />
        ))}
      </div>
    </div>
  );
}