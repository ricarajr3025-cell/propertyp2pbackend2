import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PropertyChat from './PropertyChat';
import './TransactionSection.css';

export default function TransactionSection({ token, backendUrl }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showChat, setShowChat] = useState(false);
  const [chatData, setChatData] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  const userId = localStorage.getItem('userId');

  useEffect(() => {
    loadTransactions();
    loadCurrentUser();
  }, [filter]);

  const loadCurrentUser = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user) {
        setCurrentUser(user);
      } else {
        setCurrentUser({ _id: userId, id: userId });
      }
    } catch (err) {
      setCurrentUser({ _id: userId, id: userId });
    }
  };

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const queryParams = filter !== 'all' ? `?type=${filter}` : '';
      const response = await axios.get(`${backendUrl}/api/transactions${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(response.data);
    } catch (err) {
      console.error('Error al cargar transacciones:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChat = async (transaction) => {
    try {
      const property = transaction.property;
      
      if (!property || !property._id) {
        alert('No se encontró información de la propiedad');
        return;
      }

      const chatEndpoint = transaction.type === 'alquiler' 
        ? 'rental-chat' 
        : 'property-chat';

      // Construir el chatId basado en la transacción
      const chatId = transaction.type === 'alquiler'
        ? `rental_${property._id}_${transaction.buyer._id}_${transaction.seller._id}`
        : `property_${property._id}_${transaction.buyer._id}_${transaction.seller._id}`;

      console.log('Intentando abrir chat desde transacción:', {
        type: transaction.type,
        chatId,
        propertyId: property._id,
        buyerId: transaction.buyer._id,
        sellerId: transaction.seller._id
      });

      // Usar el nuevo endpoint get-or-create
      const response = await axios.post(
        `${backendUrl}/api/${chatEndpoint}/get-or-create`,
        {
          chatId: chatId,
          propertyId: property._id,
          ownerId: transaction.seller._id
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data) {
        console.log('✅ Chat obtenido:', response.data);
        setChatData(response.data);
        setShowChat(true);
      }
    } catch (err) {
      console.error('❌ Error al abrir chat:', err);
      console.error('Detalles:', err.response?.data);
      
      if (err.response?.status === 404) {
        alert('Chat no encontrado. La propiedad no existe.');
      } else if (err.response?.status === 400) {
        alert(err.response.data.error || 'Error al abrir el chat');
      } else {
        alert('Error al abrir el chat. Intenta de nuevo.');
      }
    }
  };

  const handleValidateTransaction = async (transactionId) => {
    try {
      await axios.post(
        `${backendUrl}/api/transactions/${transactionId}/validate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Transacción validada exitosamente');
      loadTransactions();
    } catch (err) {
      console.error('Error al validar:', err);
      alert(err.response?.data?.error || 'Error al validar transacción');
    }
  };

  const handlePayTransaction = async (transactionId) => {
    try {
      await axios.post(
        `${backendUrl}/api/transactions/${transactionId}/pay`,
        {
          paymentMethod: 'bank_transfer',
          transactionId: `PAY-${Date.now()}`,
          receiptUrl: ''
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Pago registrado exitosamente');
      loadTransactions();
    } catch (err) {
      console.error('Error al registrar pago:', err);
      alert(err.response?.data?.error || 'Error al registrar pago');
    }
  };

  const handleReleaseTransaction = async (transactionId) => {
    try {
      await axios.post(
        `${backendUrl}/api/transactions/${transactionId}/release`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Fondos liberados exitosamente');
      loadTransactions();
    } catch (err) {
      console.error('Error al liberar fondos:', err);
      alert(err.response?.data?.error || 'Error al liberar fondos');
    }
  };

  const handleCancelTransaction = async (transactionId) => {
    const reason = prompt('¿Por qué deseas cancelar esta transacción?');
    if (!reason) return;

    try {
      await axios.post(
        `${backendUrl}/api/transactions/${transactionId}/cancel`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Transacción cancelada exitosamente');
      loadTransactions();
    } catch (err) {
      console.error('Error al cancelar:', err);
      alert(err.response?.data?.error || 'Error al cancelar transacción');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending_validation: { text: 'Pendiente Validación', color: '#FFA500', icon: '⏳' },
      pending: { text: 'Pendiente Pago', color: '#2196F3', icon: '💳' },
      paid: { text: 'Pagado', color: '#4CAF50', icon: '✅' },
      in_escrow: { text: 'En Escrow', color: '#9C27B0', icon: '🔒' },
      completed: { text: 'Completado', color: '#4CAF50', icon: '🎉' },
      cancelled: { text: 'Cancelado', color: '#F44336', icon: '❌' },
      appealed: { text: 'Apelado', color: '#FF5722', icon: '⚠️' }
    };
    const badge = badges[status] || { text: status, color: '#999', icon: '❓' };
    return (
      <span className="status-badge" style={{ background: badge.color }}>
        {badge.icon} {badge.text}
      </span>
    );
  };

  const getUserRole = (transaction) => {
    return transaction.seller._id === userId ? 'seller' : 'buyer';
  };

  const filterTransactions = (type) => {
    if (type === 'all') return transactions;
    return transactions.filter(tx => tx.type === type);
  };

  if (showChat && chatData && currentUser) {
    return (
      <PropertyChat
        chatId={chatData.chatId}
        property={chatData.property || chatData.vehicle}
        currentUser={currentUser}
        type={chatData.property ? 'sale' : 'rental'}
        onClose={() => {
          setShowChat(false);
          setChatData(null);
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="transactions-loading">
        <div className="spinner"></div>
        <p>Cargando transacciones...</p>
      </div>
    );
  }

  const ventas = filterTransactions('venta');
  const alquileres = filterTransactions('alquiler');

  return (
    <div className="transactions-container">
      <div className="transactions-header">
        <h1>💼 Mis Transacciones</h1>
        <p className="transactions-subtitle">
          Gestiona tus compras y ventas de forma segura
        </p>
      </div>

      <div className="transactions-filters">
        <button
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          📊 Todas ({transactions.length})
        </button>
        <button
          className={`filter-tab ${filter === 'venta' ? 'active' : ''}`}
          onClick={() => setFilter('venta')}
        >
          🏠 Ventas ({ventas.length})
        </button>
        <button
          className={`filter-tab ${filter === 'alquiler' ? 'active' : ''}`}
          onClick={() => setFilter('alquiler')}
        >
          🏘️ Alquileres ({alquileres.length})
        </button>
      </div>

      {transactions.length === 0 ? (
        <div className="no-transactions">
          <div className="no-transactions-icon">📭</div>
          <h3>No tienes transacciones</h3>
          <p>Cuando inicies una compra o recibas una oferta, aparecerán aquí</p>
          <button 
            className="btn-primary"
            onClick={() => navigate('/marketplace')}
          >
            Explorar Marketplace
          </button>
        </div>
      ) : (
        <div className="transactions-grid">
          {transactions.map((tx) => {
            const role = getUserRole(tx);
            const isSeller = role === 'seller';
            const property = tx.property;

            return (
              <div key={tx._id} className="transaction-card">
                <div className="transaction-header-card">
                  <div className="transaction-property-info">
                    {property?.images && property.images[0] && (
                      <img
                        src={`${backendUrl}/${property.images[0]}`}
                        alt={property.title}
                        className="transaction-property-image"
                        onClick={() => {
                          const route = tx.type === 'alquiler' 
                            ? `/rental-property/${property._id}`
                            : `/property/${property._id}`;
                          navigate(route);
                        }}
                      />
                    )}
                    <div className="transaction-property-details">
                      <h3 className="transaction-property-title">
                        {property?.title || 'Propiedad'}
                      </h3>
                      <p className="transaction-property-type">
                        {tx.type === 'venta' ? '🏠 Venta' : '🏘️ Alquiler'}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(tx.status)}
                </div>

                <div className="transaction-body">
                  <div className="transaction-info-grid">
                    <div className="info-item">
                      <span className="info-label">💰 Precio Oferta</span>
                      <span className="info-value">
                        ${tx.offerPrice?.toLocaleString('es-CO')} {tx.currency}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">👤 Tu Rol</span>
                      <span className="info-value">
                        {isSeller ? '🏷️ Vendedor' : '🛒 Comprador'}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">
                        {isSeller ? '🛒 Comprador' : '🏷️ Vendedor'}
                      </span>
                      <span className="info-value">
                        {isSeller ? tx.buyer?.name || tx.buyer?.email : tx.seller?.name || tx.seller?.email}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">📅 Fecha Creación</span>
                      <span className="info-value">
                        {new Date(tx.createdAt).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                  </div>

                  <div className="transaction-actions">
                    <button
                      className="btn-chat"
                      onClick={() => handleOpenChat(tx)}
                    >
                      💬 Abrir Chat
                    </button>

                    {tx.status === 'pending_validation' && isSeller && (
                      <button
                        className="btn-success"
                        onClick={() => handleValidateTransaction(tx._id)}
                      >
                        ✅ Validar Oferta
                      </button>
                    )}

                    {tx.status === 'pending' && !isSeller && (
                      <button
                        className="btn-primary"
                        onClick={() => handlePayTransaction(tx._id)}
                      >
                        💳 Marcar como Pagado
                      </button>
                    )}

                    {tx.status === 'in_escrow' && !isSeller && (
                      <button
                        className="btn-success"
                        onClick={() => handleReleaseTransaction(tx._id)}
                      >
                        🔓 Liberar Fondos
                      </button>
                    )}

                    {['pending_validation', 'pending'].includes(tx.status) && (
                      <button
                        className="btn-danger"
                        onClick={() => handleCancelTransaction(tx._id)}
                      >
                        ❌ Cancelar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
