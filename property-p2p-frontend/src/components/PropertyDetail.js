import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import axios from "axios";
import PropertyChat from "./PropertyChat";
import "./VehicleDetail.css"; // Reutilizamos los mismos estilos

export default function PropertyDetail({ backendUrl, token, userId }) {
  const { id } = useParams();
  const location = useLocation();
  const [property, setProperty] = useState(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [chatData, setChatData] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const currentUserId = localStorage.getItem('userId');

  useEffect(() => {
    loadProperty();
    loadCurrentUser();

    // Si viene desde la lista de mensajes, abrir el chat automáticamente
    if (location.state?.openChat && location.state?.chatId) {
      openExistingChat(location.state.chatId);
    }
  }, [id, location.state]);

  const loadProperty = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/properties/${id}`);
      setProperty(res.data);
      console.log("DEBUG property:", res.data);
      console.log("DEBUG userId:", userId);
    } catch (err) {
      console.error("Error al cargar propiedad:", err);
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
        `${backendUrl}/api/property-chat/${chatId}`,
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

      if (!property || !property.owner) {
        alert("Error al cargar información de la propiedad");
        return;
      }

      if (property.owner._id === userId) {
        alert("No puedes contactarte a ti mismo");
        return;
      }

      const response = await axios.post(
        `${backendUrl}/api/property-chat/start/${id}`,
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

  if (!property) {
    return (
      <div style={{ 
        padding: 40, 
        textAlign: "center", 
        background: "#000", 
        color: "#fff", 
        minHeight: "100vh" 
      }}>
        Cargando propiedad...
      </div>
    );
  }

  if (showChat && chatData && currentUser) {
    return (
      <PropertyChat
        chatId={chatData.chatId}
        property={property}
        currentUser={currentUser}
        type="sale"
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
          {property.images && property.images.length > 0 ? (
            <>
              <img
                src={`${backendUrl}/${property.images[galleryIndex]}`}
                alt={property.title}
                className="vehicle-detail-img"
              />
              <div className="vehicle-detail-slider-dots">
                {property.images.map((img, idx) => (
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
                {property.images.map((img, idx) => (
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
            ${property.price?.toLocaleString('es-CO')}
          </div>
          <div className="vehicle-detail-meta">
            <span>
              📅 Publicado hace {Math.floor((Date.now() - new Date(property.createdAt || Date.now())) / (1000 * 60 * 60 * 24))} días
            </span>
            <span>📍 {property.location}</span>
            <span>🏠 {property.propertyType}</span>
          </div>

          <div className="vehicle-detail-chat">
            <div className="chat-section-title">Contactar al vendedor</div>
            
            {property.owner && property.owner._id !== userId ? (
              <button 
                className="open-chat-button" 
                onClick={handleOpenChat}
              >
                💬 Abrir Chat con {property.owner.name || property.owner.email}
              </button>
            ) : property.owner && property.owner._id === userId ? (
              <div className="own-vehicle-notice">
                Esta es tu propiedad
              </div>
            ) : (
              <div className="login-notice">
                Inicia sesión para contactar al vendedor
              </div>
            )}
          </div>

          {property.owner?.whatsapp && property.owner._id !== userId && (
            <a
              className="vehicle-detail-whatsapp"
              href={`https://wa.me/${property.owner.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              💬 Mensaje por WhatsApp
            </a>
          )}

          <div className="vehicle-detail-desc">
            <h3>Descripción</h3>
            <p>{property.description}</p>
          </div>

          {property.propertyType && (
            <div className="vehicle-detail-category">
              <h3>Tipo de Propiedad</h3>
              <p>{property.propertyType}</p>
            </div>
          )}
        </div>

        <div className="vehicle-detail-actions">
          <button className="vehicle-detail-action">
            <span role="img" aria-label="Alerts">🔔</span> Alertas
          </button>
          <button 
            className="vehicle-detail-action"
            onClick={handleOpenChat}
            disabled={!property.owner || property.owner._id === userId}
          >
            <span role="img" aria-label="Message">💬</span> Mensaje
          </button>
          <button className="vehicle-detail-action">
            <span role="img" aria-label="Share">🔗</span> Compartir
          </button>
          <button className="vehicle-detail-action">
            <span role="img" aria-label="Save">🔖</span> Guardar
          </button>
        </div>
      </div>
    </>
  );
}
