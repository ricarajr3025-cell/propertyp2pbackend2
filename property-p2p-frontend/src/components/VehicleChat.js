import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import './VehicleChat.css';

const VehicleChat = ({ chatId, vehicle, currentUser, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Obtener URL del backend desde variable de entorno o usar localhost
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3005';

  useEffect(() => {
    // Conectar Socket.io
    const newSocket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    newSocket.on('connect', () => {
      console.log('✅ Conectado a Socket.io');
      setIsConnected(true);
      // Unirse al chat
      newSocket.emit('join_vehicle_chat', chatId);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Desconectado de Socket.io');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Error de conexión:', error);
      setIsConnected(false);
    });

    // Escuchar nuevos mensajes
    newSocket.on('receive_vehicle_message', (data) => {
      console.log('📩 Mensaje recibido:', data);
      if (data.chatId === chatId) {
        setMessages((prev) => [...prev, data.message]);
      }
    });

    // Escuchar cuando el otro usuario está escribiendo
    newSocket.on('user_typing', (data) => {
      if (data.chatId === chatId && data.userId !== currentUser._id) {
        setIsTyping(data.isTyping);
      }
    });

    setSocket(newSocket);

    // Cargar historial de mensajes
    loadMessages();

    return () => {
      newSocket.disconnect();
    };
  }, [chatId, BACKEND_URL]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/vehicle-chat/${chatId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      } else {
        console.error('Error al cargar mensajes');
      }
    } catch (err) {
      console.error('Error al cargar mensajes:', err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !isConnected) return;

    try {
      const token = localStorage.getItem('token');

      // Enviar por HTTP
      const response = await fetch(`${BACKEND_URL}/api/vehicle-chat/${chatId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: newMessage.trim() })
      });

      if (response.ok) {
        setNewMessage('');
        // El mensaje se actualizará vía Socket.io
      } else {
        const error = await response.json();
        alert(error.error || 'Error al enviar mensaje');
      }
    } catch (err) {
      console.error('Error al enviar mensaje:', err);
      alert('Error al enviar mensaje');
    }
  };

  const handleTyping = () => {
    if (socket && isConnected) {
      socket.emit('user_typing', {
        chatId,
        userId: currentUser._id,
        isTyping: true
      });

      // Cancelar timeout anterior
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Dejar de escribir después de 1 segundo
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('user_typing', {
          chatId,
          userId: currentUser._id,
          isTyping: false
        });
      }, 1000);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      return 'Hoy';
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    }
    
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  // Determinar el otro usuario (vendedor)
  const otherUser = vehicle?.owner?._id === currentUser._id 
    ? vehicle?.user 
    : vehicle?.owner;

  return (
    <div className="vehicle-chat-container">
      <div className="chat-header">
        <button className="back-button" onClick={onClose}>
          ←
        </button>
        <div className="chat-header-info">
          <div className="chat-avatar">
            {otherUser?.avatar ? (
              <img 
                src={`${BACKEND_URL}/${otherUser.avatar}`} 
                alt="Avatar" 
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
          </div>
          <div className="header-text">
            <h3>{otherUser?.name || 'Usuario'}</h3>
            <p className="vehicle-title">{vehicle?.title || 'Vehículo'}</p>
            {!isConnected && <span className="status-offline">● Desconectado</span>}
          </div>
        </div>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="no-messages">
            <p>No hay mensajes aún.</p>
            <p className="no-messages-hint">¡Envía el primer mensaje!</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isSent = msg.sender === currentUser._id || msg.sender._id === currentUser._id;
            const showDate = index === 0 || 
              formatDate(messages[index - 1].timestamp) !== formatDate(msg.timestamp);

            return (
              <React.Fragment key={index}>
                {showDate && (
                  <div className="date-divider">
                    <span>{formatDate(msg.timestamp)}</span>
                  </div>
                )}
                <div className={`message ${isSent ? 'sent' : 'received'}`}>
                  <div className="message-bubble">
                    <p>{msg.message}</p>
                    <span className="message-time">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
        
        {isTyping && (
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            handleTyping();
          }}
          placeholder="Escribe un mensaje..."
          className="chat-input"
          disabled={!isConnected}
        />
        <button 
          type="submit" 
          className="send-button"
          disabled={!newMessage.trim() || !isConnected}
        >
          Enviar
        </button>
      </form>
    </div>
  );
};

export default VehicleChat;
