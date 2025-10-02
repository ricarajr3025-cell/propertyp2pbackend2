import React, { useEffect, useState } from "react";
import axios from "axios";
import countries from "./countries.json"; // Ver abajo ejemplo de estructura

const documentOptions = [
  { value: "cedula_ciudadania", label: "Cédula de ciudadanía" },
  { value: "pasaporte", label: "Pasaporte" },
  { value: "cedula_extranjeria", label: "Cédula de extranjería" },
];

export default function ProfileVerification({ token, backendUrl }) {
  const [nationality, setNationality] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [front, setFront] = useState(null);
  const [back, setBack] = useState(null);
  const [msg, setMsg] = useState("");
  const [saved, setSaved] = useState(null);

  useEffect(() => {
    // Cargar lo guardado
    axios
      .get(`${backendUrl}/api/profile/verify`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setSaved(res.data));
  }, [token, backendUrl]);

  const handleSubmit = async (e) => {
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
      setMsg("¡Verificación enviada!");
    } catch {
      setMsg("Error al guardar la verificación.");
    }
  };

  return (
    <div>
      <h3>Verificación de identidad</h3>
      {saved && saved.verified && <span style={{ color: "green" }}>✅ Verificado</span>}
      <form onSubmit={handleSubmit}>
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
      {msg && <p>{msg}</p>}
      {saved?.documentFront && (
        <div>
          <p>Documento frontal:</p>
          <img src={`data:image/*;base64,${saved.documentFront}`} alt="Frontal" style={{maxWidth:200}} />
        </div>
      )}
      {saved?.documentBack && (
        <div>
          <p>Documento reverso:</p>
          <img src={`data:image/*;base64,${saved.documentBack}`} alt="Reverso" style={{maxWidth:200}} />
        </div>
      )}
    </div>
  );
}
