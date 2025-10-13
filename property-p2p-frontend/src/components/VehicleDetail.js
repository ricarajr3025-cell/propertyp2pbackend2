import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import "./VehicleDetail.css";

export default function VehicleDetail({ backendUrl, token, userId }) {
  const { id } = useParams();
  const [vehicle, setVehicle] = useState(null);
  const [chatMessage, setChatMessage] = useState("Hola, ¿Sigue disponible?");
  const [chatLog, setChatLog] = useState([]);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const socketRef = useRef();
  const [owner, setOwner] = useState(null);

  // DEBUG SNIPPET: Mostrar el userId actual
  const currentUserId = localStorage.getItem('userId');

  useEffect(() => {
    axios.get(`${backendUrl}/api/vehicles/${id}`)
      .then(res => {
        setVehicle(res.data);
        setOwner(res.data.owner);
        // Depuración extra
        console.log("DEBUG owner:", res.data.owner);
        console.log("DEBUG userId:", userId);
      });
  }, [id, backendUrl]);

  // CHATID ÚNICO PARA AMBOS USUARIOS!
  const ids = [userId, owner?._id].sort();
  const chatId = vehicle && owner ? `vehiclechat-${vehicle._id}-${ids[0]}-${ids[1]}` : "";

  useEffect(() => {
    if (!chatId) return;
    axios.get(`${backendUrl}/api/vehicle-chat/${chatId}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setChatLog(res.data));
    socketRef.current = io(backendUrl, { query: { token }, transports: ['websocket'] });
    socketRef.current.emit("join-vehicle-chat", { chatId });
    socketRef.current.on("vehicle-chat:message", (msg) => {
      setChatLog((prev) => [...prev, msg]);
    });
    return () => {
      socketRef.current.disconnect();
    };
  }, [chatId, backendUrl, token]);

  // SOLO envía el mensaje por socket
  const sendMsg = e => {
    e.preventDefault();
    if (!chatId || !owner || !userId) {
      alert("Error: userId es nulo o indefinido. Revisa el flujo de login.");
      return;
    }
    console.log('Enviando mensaje:', { chatId, sender: userId, receiver: owner._id, message: chatMessage });
    socketRef.current.emit('vehicle-chat:message', {
      chatId,
      sender: userId,
      receiver: owner._id,
      message: chatMessage,
    });
    setChatMessage("");
  };

  if (!vehicle) return <div style={{ padding: 40, textAlign: "center" }}>Cargando vehículo...</div>;
  return (
    <>
      {/* DEBUG: muestra el userId actual */}
      <div style={{
        background: "#ffeeba",
        color: "#333",
        padding: "8px 14px",
        borderRadius: "8px",
        fontWeight: "bold",
        margin: "12px 0"
      }}>
        <span>DEBUG: userId actual en localStorage:</span>
        <br />
        <span>{currentUserId || "No definido"}</span>
      </div>

      <div className="vehicle-detail-main">
        <button className="vehicle-detail-close" onClick={() => window.history.back()}>&times;</button>
        {/* Galería */}
        <div className="vehicle-detail-gallery">
          {vehicle.images && vehicle.images.length > 0 && (
            <>
              <img
                src={`${backendUrl}/${vehicle.images[galleryIndex]}`}
                alt={vehicle.title}
                className="vehicle-detail-img"
              />
              <div className="vehicle-detail-slider-dots">
                {vehicle.images.map((img, idx) => (
                  <span
                    key={idx}
                    className={`slider-dot${galleryIndex === idx ? " active" : ""}`}
                    onClick={() => setGalleryIndex(idx)}
                  >●</span>
                ))}
              </div>
              <div className="vehicle-detail-thumbs">
                {vehicle.images.map((img, idx) => (
                  <img
                    key={idx}
                    src={`${backendUrl}/${img}`}
                    alt={`Galería ${idx + 1}`}
                    className={`vehicle-detail-thumb${galleryIndex === idx ? " selected" : ""}`}
                    onClick={() => setGalleryIndex(idx)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
        <div className="vehicle-detail-info">
          <div className="vehicle-detail-title" style={{ fontWeight: "bold", fontSize: "1.3em" }}>Venta</div>
          <div className="vehicle-detail-price" style={{ fontSize: "1.3em" }}>${vehicle.price?.toLocaleString()}</div>
          <div className="vehicle-detail-meta">
            <span>
              Listed {Math.floor((Date.now() - new Date(vehicle.createdAt)) / (1000 * 60 * 60 * 24))} days ago
            </span>
            <span>{vehicle.location}</span>
          </div>
          <div className="vehicle-detail-chat">
            <div style={{ fontWeight: 500, marginBottom: 6 }}>Send seller a message</div>
            <form onSubmit={sendMsg} className="vehicle-detail-chat-form">
              <input
                value={chatMessage}
                onChange={e => setChatMessage(e.target.value)}
                placeholder={`Hola, ${owner?.username || owner?.email}, ¿Sigue disponible?`}
                className="vehicle-detail-chat-input"
              />
              <button type="submit" className="vehicle-detail-chat-send">Send</button>
            </form>
            <div style={{ marginTop: 10 }}>
              {chatLog.length > 0 && chatLog.map((msg, idx) => (
                <div key={idx} className={`vehicle-chat-msg vehicle-chat-msg-${msg.sender === userId ? 'me' : 'them'}`}>
                  <b>
                    {msg.sender === userId
                      ? "Tú"
                      : owner && msg.sender === owner._id
                      ? "Vendedor"
                      : "Otro"}
                    :
                  </b> {msg.message}
                  <br />
                  <small>{msg.timestamp ? new Date(msg.timestamp).toLocaleString() : ""}</small>
                </div>
              ))}
            </div>
          </div>
          {vehicle.owner?.whatsapp && (
            <a
              className="vehicle-detail-whatsapp"
              href={`https://wa.me/${vehicle.owner.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Message on WhatsApp
            </a>
          )}
          <div className="vehicle-detail-desc">
            <b>Description</b>
            <p>{vehicle.description}</p>
          </div>
        </div>
        <div className="vehicle-detail-actions">
          <button className="vehicle-detail-action"><span role="img" aria-label="Alerts">🔔</span> Alerts</button>
          <button className="vehicle-detail-action"><span role="img" aria-label="Message">💬</span> Message</button>
          <button className="vehicle-detail-action"><span role="img" aria-label="Share">🔗</span> Share</button>
          <button className="vehicle-detail-action"><span role="img" aria-label="Save">🔖</span> Save</button>
        </div>
      </div>
    </>
  );
}