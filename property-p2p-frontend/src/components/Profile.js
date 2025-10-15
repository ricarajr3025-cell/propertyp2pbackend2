import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Profile.css';

export default function Profile({ token, backendUrl }) {
  const [user, setUser] = useState(null);
  const [listings, setListings] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [kycStatus, setKycStatus] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
    loadListings();
    loadKYCStatus();
  }, [filter]);

  const loadProfile = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
      setEditName(response.data.name || '');
    } catch (err) {
      console.error('Error al cargar perfil:', err);
    }
  };

  const loadKYCStatus = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/kyc/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setKycStatus(response.data);
    } catch (err) {
      console.error('Error al cargar estado KYC:', err);
    }
  };

  const loadListings = async () => {
    try {
      setLoading(true);
      const queryParam = filter !== 'all' ? `?type=${filter}` : '';
      const response = await axios.get(
        `${backendUrl}/api/profile/listings${queryParam}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setListings(response.data.listings || []);
    } catch (err) {
      console.error('Error al cargar publicaciones:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      await axios.put(
        `${backendUrl}/api/profile`,
        { name: editName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Perfil actualizado exitosamente');
      setEditMode(false);
      loadProfile();
    } catch (err) {
      console.error('Error al actualizar perfil:', err);
      alert('Error al actualizar perfil');
    }
  };

  const handleDeleteListing = async (type, id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta publicación?')) return;

    try {
      await axios.delete(
        `${backendUrl}/api/profile/listings/${type}/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      alert('Publicación eliminada exitosamente');
      loadListings();
    } catch (err) {
      console.error('Error al eliminar:', err);
      alert('Error al eliminar publicación');
    }
  };

  const handleToggleAvailability = async (type, id, currentStatus) => {
    try {
      await axios.patch(
        `${backendUrl}/api/profile/listings/${type}/${id}/availability`,
        { available: !currentStatus },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      loadListings();
    } catch (err) {
      console.error('Error al cambiar disponibilidad:', err);
      alert('Error al cambiar disponibilidad');
    }
  };

  const getListingRoute = (listing) => {
    if (listing.listingType === 'vehicle') {
      return `/vehicle/${listing._id}`;
    } else if (listing.listingType === 'rental') {
      return `/rental-property/${listing._id}`;
    } else {
      return `/property/${listing._id}`;
    }
  };

  const getListingIcon = (type) => {
    if (type === 'vehicle') return '🚗';
    if (type === 'rental') return '🏘️';
    return '🏠';
  };

  const getListingTypeName = (type) => {
    if (type === 'vehicle') return 'Vehículo';
    if (type === 'rental') return 'Alquiler';
    return 'Venta';
  };

  const isVerified = user?.badges?.some(b => b.type === 'verified');

  if (!user) {
    return (
      <div className="profile-loading">
        <div className="spinner"></div>
        <p>Cargando perfil...</p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* HEADER DEL PERFIL */}
      <div className="profile-header">
        <div className="profile-avatar-section">
          <div className="profile-avatar-large">
            {user.avatar ? (
              <img src={`${backendUrl}/${user.avatar}`} alt="Avatar" />
            ) : (
              <span className="avatar-placeholder-large">
                {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
              </span>
            )}
            {/* ✅ Badge de verificado en avatar */}
            {isVerified && (
              <div className="verified-badge-avatar">✅</div>
            )}
          </div>
          <div className="profile-info">
            {editMode ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="profile-edit-input"
                placeholder="Tu nombre"
              />
            ) : (
              <h1>
                {user.name || '(no definido)'}
                {isVerified && (
                  <span className="verified-badge-inline" title="Usuario Verificado">
                    ✅ Verificado
                  </span>
                )}
              </h1>
            )}
            <p className="profile-email">{user.email}</p>
            {user.phone && <p className="profile-phone">📞 {user.phone}</p>}
            {user.whatsapp && <p className="profile-whatsapp">💬 WhatsApp: {user.whatsapp}</p>}
          </div>
        </div>
        <div className="profile-actions">
          {editMode ? (
            <>
              <button className="btn-save" onClick={handleSaveProfile}>
                ✅ Guardar
              </button>
              <button className="btn-cancel" onClick={() => setEditMode(false)}>
                ❌ Cancelar
              </button>
            </>
          ) : (
            <button className="btn-edit" onClick={() => setEditMode(true)}>
              ✏️ Editar perfil
            </button>
          )}
        </div>
      </div>

      {/* ✅ VERIFICACIÓN KYC CON ESTADOS */}
      <div className="profile-verification">
        <div className="verification-header">
          <h3>🔐 Verificación de Identidad</h3>
          {kycStatus?.status === 'approved' && (
            <span className="kyc-level-badge">Nivel {kycStatus.level}</span>
          )}
        </div>

        {kycStatus?.status === 'approved' ? (
          <div className="verification-approved">
            <div className="verification-status">
              <span className="verified-badge-large">✅ VERIFICADO</span>
              <p className="verification-message">
                Tu identidad ha sido verificada exitosamente
              </p>
            </div>
            <div className="verification-benefits">
              <h4>Beneficios de estar verificado:</h4>
              <ul>
                <li>✅ Badge de verificado en todas tus publicaciones</li>
                <li>🔒 Mayor confianza de otros usuarios</li>
                <li>🚀 Prioridad en búsquedas</li>
                <li>💰 Acceso a transacciones de mayor valor</li>
              </ul>
            </div>
          </div>
        ) : kycStatus?.status === 'reviewing' ? (
          <div className="verification-reviewing">
            <div className="verification-status">
              <span className="status-badge-reviewing">⏳ EN REVISIÓN</span>
              <p className="verification-message">
                Estamos revisando tu información. Esto puede tardar entre 24-48 horas.
              </p>
            </div>
            <button className="btn-view-kyc" onClick={() => navigate('/kyc')}>
              Ver Estado de Verificación
            </button>
          </div>
        ) : kycStatus?.status === 'rejected' ? (
          <div className="verification-rejected">
            <div className="verification-status">
              <span className="status-badge-rejected">❌ RECHAZADO</span>
              <p className="verification-message rejection-reason">
                {kycStatus.rejectionReason || 'Tu verificación fue rechazada. Por favor intenta de nuevo.'}
              </p>
            </div>
            <button className="btn-retry-kyc" onClick={() => navigate('/kyc')}>
              Intentar Nuevamente
            </button>
          </div>
        ) : kycStatus?.status === 'pending' ? (
          <div className="verification-pending">
            <div className="verification-status">
              <span className="status-badge-pending">📝 INCOMPLETO</span>
              <p className="verification-message">
                Completa tu verificación para obtener el badge verificado
              </p>
            </div>
            <div className="verification-progress">
              <div className="progress-item">
                {kycStatus.personalInfo?.firstName ? '✅' : '⏳'} Información Personal
              </div>
              <div className="progress-item">
                {kycStatus.hasDocument ? '✅' : '⏳'} Documento de Identidad
              </div>
              <div className="progress-item">
                {kycStatus.hasSelfie ? '✅' : '⏳'} Selfie de Verificación
              </div>
              <div className="progress-item">
                {kycStatus.hasProofOfAddress ? '✅' : '⏳'} Comprobante de Domicilio
              </div>
            </div>
            <button className="btn-continue-kyc" onClick={() => navigate('/kyc')}>
              Continuar Verificación
            </button>
          </div>
        ) : (
          <div className="verification-not-started">
            <p className="verification-message">
              Verifica tu identidad para generar más confianza con otros usuarios y obtener beneficios exclusivos
            </p>
            <div className="verification-features">
              <div className="feature-item">
                <span className="feature-icon">✅</span>
                <span>Badge de verificado</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🔒</span>
                <span>Mayor confianza</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🚀</span>
                <span>Prioridad en búsquedas</span>
              </div>
            </div>
            <button className="btn-verify" onClick={() => navigate('/kyc')}>
              Iniciar Verificación
            </button>
          </div>
        )}
      </div>

      {/* PUBLICACIONES */}
      <div className="profile-listings-section">
        <div className="listings-header">
          <h2>📦 Mis Publicaciones</h2>
          <button className="btn-new-listing" onClick={() => navigate('/publish')}>
            ➕ Nueva Publicación
          </button>
        </div>

        <div className="listings-filters">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Todas ({listings.length})
          </button>
          <button
            className={`filter-btn ${filter === 'properties' ? 'active' : ''}`}
            onClick={() => setFilter('properties')}
          >
            🏠 Venta
          </button>
          <button
            className={`filter-btn ${filter === 'rentals' ? 'active' : ''}`}
            onClick={() => setFilter('rentals')}
          >
            🏘️ Alquiler
          </button>
          <button
            className={`filter-btn ${filter === 'vehicles' ? 'active' : ''}`}
            onClick={() => setFilter('vehicles')}
          >
            🚗 Vehículos
          </button>
        </div>

        {loading ? (
          <div className="listings-loading">
            <div className="spinner"></div>
            <p>Cargando publicaciones...</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="no-listings">
            <div className="no-listings-icon">📭</div>
            <h3>No tienes publicaciones</h3>
            <p>Crea tu primera publicación para empezar a vender</p>
            <button className="btn-create" onClick={() => navigate('/publish')}>
              Crear Publicación
            </button>
          </div>
        ) : (
          <div className="listings-grid">
            {listings.map((listing) => (
              <div key={listing._id} className="listing-card">
                <div className="listing-card-header">
                  <span className="listing-type-badge">
                    {getListingIcon(listing.listingType)} {getListingTypeName(listing.listingType)}
                  </span>
                  <button
                    className={`availability-toggle ${listing.available ? 'available' : 'unavailable'}`}
                    onClick={() => handleToggleAvailability(
                      listing.listingType,
                      listing._id,
                      listing.available
                    )}
                  >
                    {listing.available ? '✅ Disponible' : '❌ No disponible'}
                  </button>
                </div>

                {listing.images && listing.images[0] && (
                  <img
                    src={`${backendUrl}/${listing.images[0]}`}
                    alt={listing.title}
                    className="listing-image"
                    onClick={() => navigate(getListingRoute(listing))}
                  />
                )}

                <div className="listing-card-body">
                  <h3 className="listing-title">{listing.title}</h3>
                  <p className="listing-price">
                    ${listing.price?.toLocaleString('es-CO')}
                    {listing.listingType === 'rental' && ' /mes'}
                  </p>
                  <p className="listing-location">📍 {listing.location}</p>
                  <p className="listing-date">
                    📅 {new Date(listing.createdAt).toLocaleDateString('es-ES')}
                  </p>
                </div>

                <div className="listing-card-actions">
                  <button
                    className="btn-view"
                    onClick={() => navigate(getListingRoute(listing))}
                  >
                    👁️ Ver
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => handleDeleteListing(listing.listingType, listing._id)}
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TRANSACCIONES */}
      <div className="profile-transactions-section">
        <h2>💼 Transacciones Recientes</h2>
        <button
          className="btn-view-all"
          onClick={() => navigate('/transactions')}
        >
          Ver todas las transacciones →
        </button>
      </div>
    </div>
  );
}
