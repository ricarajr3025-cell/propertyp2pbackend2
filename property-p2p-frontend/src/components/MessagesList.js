import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './VehicleChatList.css';

const MessagesList = ({ backendUrl, token, userId }) => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all'); // all, vehicles, properties, rentals
  const navigate = useNavigate();

  useEffect(() => {
    loadAllChats();
  }, []);

  const loadAllChats = async () => {
    try {
      setLoading(true);
      
      // Cargar chats de vehículos, propiedades y alquileres en paralelo
      const [vehicleChats, propertyChats, rentalChats] = await Promise.all([
        axios.get(`${backendUrl}/api/vehicle-chat`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: [] })),
        
        axios.get(`${backendUrl}/api/property-chat`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: [] })),
        
        axios.get(`${backendUrl}/api/rental-chat`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: [] }))
      ]);

      // Agregar tipo a cada chat
      const vehicleChatsWithType = vehicleChats.data.map(chat => ({ ...chat, chatType: 'vehicle' }));
      const propertyChatsWithType = propertyChats.data.map(chat => ({ ...chat, chatType: 'property' }));
      const rentalChatsWithType = rentalChats.data.map(chat => ({ ...chat, chatType: 'rental' }));

      // Combinar y ordenar todos los chats
      const allChats = [...vehicleChatsWithType, ...propertyChatsWithType, ...rentalChatsWithType];
      
      const sortedChats = allChats.sort((a, b) => {
        const lastMessageA = a.messages[a.messages.length - 1]?.timestamp || a.createdAt;
        const lastMessageB = b.messages[b.messages.length - 1]?.timestamp || b.createdAt;
        return new Date(lastMessageB) - new Date(lastMessageA);
      });

      setChats(sortedChats);
      setLoading(false);
    } catch (err) {
      console.error('Error al cargar chats:', err);
      setLoading(false);
    }
  };

  const getLastMessage = (chat) => {
    if (!chat.messages || chat.messages.length === 0) {
      return 'Sin mensajes';
    }
    const lastMsg = chat.messages[chat.messages.length - 1];
    return lastMsg.message || '📎 Archivo adjunto';
  };

  const getLastMessageTime = (chat) => {
    if (!chat.messages || chat.messages.length === 0) {
      return '';
    }
    const lastMsg = chat.messages[chat.messages.length - 1];
    const date = new Date(lastMsg.timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffMinutes < 1) return 'Ahora';
    if (diffMinutes < 60) return `${diffMinutes}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  const getOtherUser = (chat) => {
    const isSeller = chat.owner?._id === userId;
    return isSeller ? chat.user : chat.owner;
  };

  const getUserRole = (chat) => {
    return chat.owner?._id === userId ? 'seller' : 'buyer';
  };

  const getItemInfo = (chat) => {
    if (chat.chatType === 'vehicle') {
      return {
        icon: '🚗',
        title: chat.vehicle?.title || 'Vehículo',
        images: chat.vehicle?.images,
        id: chat.vehicle?._id,
        route: `/vehicle/${chat.vehicle?._id}`
      };
    } else if (chat.chatType === 'property') {
      return {
        icon: '🏠',
        title: chat.property?.title || 'Propiedad',
        images: chat.property?.images,
        id: chat.property?._id,
        route: `/property/${chat.property?._id}`
      };
    } else if (chat.chatType === 'rental') {
      return {
        icon: '🏘️',
        title: chat.property?.title || 'Alquiler',
        images: chat.property?.images,
        id: chat.property?._id,
        route: `/rental-property/${chat.property?._id}`
      };
    }
    return { icon: '📦', title: 'Item', images: [], id: null, route: '#' };
  };

  const handleChatClick = (chat) => {
    const itemInfo = getItemInfo(chat);
    navigate(itemInfo.route, { 
      state: { 
        openChat: true, 
        chatId: chat.chatId,
        chatType: chat.chatType
      } 
    });
  };

  const filteredChats = chats.filter(chat => {
    // Filtro por rol
    if (filter === 'buyer' && chat.owner?._id === userId) return false;
    if (filter === 'seller' && chat.user?._id === userId) return false;
    
    // Filtro por tipo
    if (typeFilter === 'vehicles' && chat.chatType !== 'vehicle') return false;
    if (typeFilter === 'properties' && chat.chatType !== 'property') return false;
    if (typeFilter === 'rentals' && chat.chatType !== 'rental') return false;
    
    return true;
  });

  if (loading) {
    return (
      <div className="chat-list-container">
        <div className="chat-list-loading">
          <div className="spinner"></div>
          <p>Cargando conversaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-list-container">
      <div className="chat-list-header">
        <h2>💬 Mis Mensajes</h2>
        <p className="chat-count">{filteredChats.length} conversaciones</p>
      </div>

      <div className="chat-filters">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Todos
        </button>
        <button 
          className={`filter-btn ${filter === 'buyer' ? 'active' : ''}`}
          onClick={() => setFilter('buyer')}
        >
          Como Comprador
        </button>
        <button 
          className={`filter-btn ${filter === 'seller' ? 'active' : ''}`}
          onClick={() => setFilter('seller')}
        >
          Como Vendedor
        </button>
      </div>

      <div className="chat-filters">
        <button 
          className={`filter-btn ${typeFilter === 'all' ? 'active' : ''}`}
          onClick={() => setTypeFilter('all')}
        >
          Todo
        </button>
        <button 
          className={`filter-btn ${typeFilter === 'vehicles' ? 'active' : ''}`}
          onClick={() => setTypeFilter('vehicles')}
        >
          🚗 Vehículos
        </button>
        <button 
          className={`filter-btn ${typeFilter === 'properties' ? 'active' : ''}`}
          onClick={() => setTypeFilter('properties')}
        >
          🏠 Venta
        </button>
        <button 
          className={`filter-btn ${typeFilter === 'rentals' ? 'active' : ''}`}
          onClick={() => setTypeFilter('rentals')}
        >
          🏘️ Alquiler
        </button>
      </div>

      <div className="chat-list">
        {filteredChats.length === 0 ? (
          <div className="no-chats">
            <div className="no-chats-icon">💬</div>
            <h3>No tienes mensajes</h3>
            <p>Cuando alguien te escriba, aparecerán aquí</p>
          </div>
        ) : (
          filteredChats.map((chat) => {
            const otherUser = getOtherUser(chat);
            const role = getUserRole(chat);
            const itemInfo = getItemInfo(chat);

            return (
              <div 
                key={chat._id} 
                className="chat-item"
                onClick={() => handleChatClick(chat)}
              >
                <div className="chat-item-avatar">
                  {otherUser?.avatar ? (
                    <img 
                      src={`${backendUrl}/${otherUser.avatar}`} 
                      alt={otherUser.name}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="avatar-placeholder">
                      {otherUser?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  {role === 'seller' && (
                    <span className="role-badge seller">Vendedor</span>
                  )}
                </div>

                <div className="chat-item-content">
                  <div className="chat-item-header">
                    <h3 className="chat-item-name">
                      {otherUser?.name || otherUser?.email || 'Usuario'}
                    </h3>
                    <span className="chat-item-time">
                      {getLastMessageTime(chat)}
                    </span>
                  </div>

                  <div className="chat-item-vehicle">
                    {itemInfo.icon} {itemInfo.title}
                  </div>

                  <div className="chat-item-preview">
                    <p>{getLastMessage(chat)}</p>
                  </div>
                </div>

                {itemInfo.images && itemInfo.images[0] && (
                  <div className="chat-item-thumbnail">
                    <img 
                      src={`${backendUrl}/${itemInfo.images[0]}`} 
                      alt={itemInfo.title}
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MessagesList;
