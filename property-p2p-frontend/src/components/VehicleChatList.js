import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './VehicleChatList.css';

const VehicleChatList = ({ backendUrl, token, userId }) => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'buyer', 'seller'
  const navigate = useNavigate();

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${backendUrl}/api/vehicle-chat`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Ordenar por último mensaje
      const sortedChats = response.data.sort((a, b) => {
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
    return lastMsg.message;
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

  const handleChatClick = (chat) => {
    // Navegar a la página del vehículo con el chat abierto
    navigate(`/vehicle/${chat.vehicle._id}`, { 
      state: { 
        openChat: true, 
        chatId: chat.chatId 
      } 
    });
  };

  const getUnreadCount = (chat) => {
    // Contar mensajes no leídos (esto requeriría implementar un sistema de "leído")
    // Por ahora retornamos 0
    return 0;
  };

  const filteredChats = chats.filter(chat => {
    if (filter === 'buyer') return chat.user?._id === userId;
    if (filter === 'seller') return chat.owner?._id === userId;
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

      {/* Filtros */}
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

      {/* Lista de chats */}
      <div className="chat-list">
        {filteredChats.length === 0 ? (
          <div className="no-chats">
            <div className="no-chats-icon">💬</div>
            <h3>No tienes mensajes</h3>
            <p>Cuando alguien te escriba sobre tus vehículos, aparecerán aquí</p>
          </div>
        ) : (
          filteredChats.map((chat) => {
            const otherUser = getOtherUser(chat);
            const role = getUserRole(chat);
            const unreadCount = getUnreadCount(chat);

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
                    🚗 {chat.vehicle?.title || 'Vehículo'}
                  </div>

                  <div className="chat-item-preview">
                    <p>{getLastMessage(chat)}</p>
                    {unreadCount > 0 && (
                      <span className="unread-badge">{unreadCount}</span>
                    )}
                  </div>
                </div>

                {chat.vehicle?.images && chat.vehicle.images[0] && (
                  <div className="chat-item-thumbnail">
                    <img 
                      src={`${backendUrl}/${chat.vehicle.images[0]}`} 
                      alt={chat.vehicle.title}
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

export default VehicleChatList;