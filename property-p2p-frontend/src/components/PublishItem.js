import React, { useState } from "react";
import "./PublishForm.css";

export default function PublishItem({ token, backendUrl }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [images, setImages] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const formData = new FormData();
      formData.append("category", "Items");
      formData.append("title", title);
      formData.append("description", description);
      formData.append("price", price);
      images.forEach(img => formData.append("images", img));
      await fetch(`${backendUrl}/api/ads`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      setSuccess("¡Item publicado!");
      setTitle(""); setDescription(""); setPrice(""); setImages([]);
    } catch (e) {
      setError("Error al publicar el item.");
    }
  };

  return (
    <div className="publish-form-container">
      <h2>Publicar Item</h2>
      <form onSubmit={handleSubmit} className="publish-form">
        <input type="text" placeholder="Título" value={title} onChange={e => setTitle(e.target.value)} required />
        <textarea placeholder="Descripción" value={description} onChange={e => setDescription(e.target.value)} required />
        <input type="number" placeholder="Precio" value={price} onChange={e => setPrice(e.target.value)} required />
        <input type="file" multiple accept="image/*" onChange={e => setImages(Array.from(e.target.files))} />
        <button type="submit">Publicar item</button>
        {success && <div className="success-msg">{success}</div>}
        {error && <div className="error-msg">{error}</div>}
      </form>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
        {images.length > 0 && images.map((img, idx) => (
          <img key={idx} src={URL.createObjectURL(img)} alt="preview" style={{ width: 60, height: 60, borderRadius: 8, objectFit: "cover", border: "1px solid #ccc" }} />
        ))}
      </div>
    </div>
  );
}
