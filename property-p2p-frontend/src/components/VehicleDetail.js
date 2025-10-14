import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import axios from "axios";
import VehicleChat from "./VehicleChat";
import "./VehicleDetail.css";

export default function VehicleDetail({ backendUrl, token, userId }) {
  const { id } = useParams();
  const location = useLocation();
  const [vehicle, setVehicle] = useState(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [chatData, setChatData] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const currentUserId = localStorage.getItem('userId');

  useEffect(() => {
    loadVehicle();
    loadCurrentUser();

    // Si viene desde la lista de mensajes, abrir el chat automáticamente
    if (location.state?.openChat && location.state?.chatId) {
      openExistingChat(location.state.chatId);
    }
  }, [id, location.state]);

  const loadVehicle = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/vehicles/${id}`);
      setVehicle(res.data);
      console.log("DEBUG vehicle:", res.data);
      console.log("DEBUG userId:", userId);
    } catch (err) {
      console.error("Error al cargar vehículo:", err);
    }
  };

  const loadCurrentUser = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user) {
        setCurrentUser(user);
      } else {
        setCurrentUser({
          _id: userId,
          id: userId
        });
      }
    } catch (err) {
      console.error("Error al cargar usuario:", err);
      setCurrentUser({
        _id: userId,
        id: userId
      });
    }
  };

  const openExistingChat = async (chatId) => {
    try {
      const response = await axios.get(
        `${backendUrl}/api/vehicle-chat/${chatId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data) {
        setChatData(response.data);
        setShowChat(true);
      }
    } catch (err) {
      console.error("Error al abrir chat:", err);
    }
  };

  const handleOpenChat = async () => {
    try {
      if (!userId) {
        alert("Debes iniciar sesión para enviar mensajes");
        return;
      }

      if (!vehicle || !vehicle.owner) {
        alert("Error al cargar información del vehículo");
        return;
      }

      if (vehicle.owner._id === userId) {
        alert("No puedes contactarte a ti mismo");
        return;
      }

      const response = await axios.post(
        `${backendUrl}/api/vehicle-chat/start/${id}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data) {
        setChatData(response.data);
        setShowChat(true);
      }
    } catch (err) {
      console.error("Error al abrir chat:", err);
      if (err.response?.data?.error) {
        alert(err.response.data.error);
      } else {
        alert("Error al iniciar chat. Por favor intenta de nuevo.");
      }
    }
  };

  if (!vehicle) {
    return (
      <div style={{ 
        padding: 40, 
        textAlign: "center", 
        background: "#000", 
        color: "#fff", 
        minHeight: "100vh" 
      }}>
        Cargando vehículo...
      </div>
    );
  }

  if (showChat && chatData && currentUser) {
    return (
      <VehicleChat
        chatId={chatData.chatId}
        vehicle={vehicle}
        currentUser={currentUser}
        onClose={() => {
          setShowChat(false);
          window.history.replaceState({}, document.title);
        }}
      />
    );
  }

  return (
    <>
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          background: "#ffeeba",
          color: "#333",
          padding: "8px 14px",
          borderRadius: "8px",
          fontWeight: "bold",
          margin: "12px"
        }}>
          <span>DEBUG: userId actual en localStorage:</span>
          <br />
          <span>{currentUserId || "No definido"}</span>
        </div>
      )}

      <div className="vehicle-detail-main">
        <button 
          className="vehicle-detail-close" 
          onClick={() => window.history.back()}
        >
          &times;
        </button>

        <div className="vehicle-detail-gallery">
          {vehicle.images && vehicle.images.length > 0 ? (
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
                  >
                    ●
                  </span>
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
          ) : (
            <div className="no-image-placeholder">
              <p>Sin imágenes disponibles</p>
            </div>
          )}
        </div>

        <div className="vehicle-detail-info">
          <div className="vehicle-detail-title">Venta</div>
          <div className="vehicle-detail-price">
            ${vehicle.price?.toLocaleString('es-CO')}
          </div>
          <div className="vehicle-detail-meta">
            <span>
              Listed {Math.floor((Date.now() - new Date(vehicle.createdAt)) / (1000 * 60 * 60 * 24))} days ago
            </span>
            <span>📍 {vehicle.location}</span>
          </div>

          <div className="vehicle-detail-chat">
            <div className="chat-section-title">Send seller a message</div>
            
            {vehicle.owner && vehicle.owner._id !== userId ? (
              <button 
                className="open-chat-button" 
                onClick={handleOpenChat}
              >
                💬 Abrir Chat con {vehicle.owner.name || vehicle.owner.email}
              </button>
            ) : vehicle.owner && vehicle.owner._id === userId ? (
              <div className="own-vehicle-notice">
                Este es tu vehículo
              </div>
            ) : (
              <div className="login-notice">
                Inicia sesión para contactar al vendedor
              </div>
            )}
          </div>

          {vehicle.owner?.whatsapp && vehicle.owner._id !== userId && (
            <a
              className="vehicle-detail-whatsapp"
              href={`https://wa.me/${vehicle.owner.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              💬 Message on WhatsApp
            </a>
          )}

          <div className="vehicle-detail-desc">
            <h3>Description</h3>
            <p>{vehicle.description}</p>
          </div>

          {vehicle.category && (
            <div className="vehicle-detail-category">
              <h3>Categoría</h3>
              <p>{vehicle.category}</p>
            </div>
          )}
        </div>

        <div className="vehicle-detail-actions">
          <button className="vehicle-detail-action">
            <span role="img" aria-label="Alerts">🔔</span> Alerts
          </button>
          <button 
            className="vehicle-detail-action"
            onClick={handleOpenChat}
            disabled={!vehicle.owner || vehicle.owner._id === userId}
          >
            <span role="img" aria-label="Message">💬</span> Message
          </button>
          <button className="vehicle-detail-action">
            <span role="img" aria-label="Share">🔗</span> Share
          </button>
          <button className="vehicle-detail-action">
            <span role="img" aria-label="Save">🔖</span> Save
          </button>
        </div>
      </div>
    </>
  );
}