import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import './VehicleChat.css'; // Reutilizamos los mismos estilos

const PropertyChat = ({ chatId, property, currentUser, onClose, type = 'sale' }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3005';
  
  // Determinar eventos según el tipo (venta o alquiler)
  const chatEvents = {
    join: type === 'rental' ? 'join_rental_property_chat' : 'join_property_chat',
    send: type === 'rental' ? 'send_rental_property_message' : 'send_property_message',
    receive: type === 'rental' ? 'receive_rental_property_message' : 'receive_property_message'
  };

  const apiEndpoint = type === 'rental' ? 'rental-chat' : 'property-chat';

  useEffect(() => {
    const newSocket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    newSocket.on('connect', () => {
      console.log('✅ Conectado a Socket.io');
      setIsConnected(true);
      newSocket.emit(chatEvents.join, chatId);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Desconectado de Socket.io');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Error de conexión:', error);
      setIsConnected(false);
    });

    newSocket.on(chatEvents.receive, (data) => {
      console.log('📩 Mensaje recibido:', data);
      if (data.chatId === chatId) {
        setMessages((prev) => [...prev, data.message]);
      }
    });

    newSocket.on('user_typing', (data) => {
      if (data.chatId === chatId && data.userId !== currentUser._id) {
        setIsTyping(data.isTyping);
      }
    });

    setSocket(newSocket);
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
      const response = await fetch(`${BACKEND_URL}/api/${apiEndpoint}/${chatId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Error al cargar mensajes:', err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('El archivo es demasiado grande. Máximo 10MB');
        return;
      }

      setSelectedFile(file);

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleCancelFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() && !selectedFile) return;
    if (!socket || !isConnected) {
      alert('No estás conectado. Espera un momento...');
      return;
    }

    try {
      setUploading(true);
      const token = localStorage.getItem('token');
      
      const formData = new FormData();
      if (newMessage.trim()) {
        formData.append('message', newMessage.trim());
      }
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      const response = await fetch(`${BACKEND_URL}/api/${apiEndpoint}/${chatId}/message`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        setNewMessage('');
        handleCancelFile();
      } else {
        const error = await response.json();
        alert(error.error || 'Error al enviar mensaje');
      }
    } catch (err) {
      console.error('Error al enviar mensaje:', err);
      alert('Error al enviar mensaje');
    } finally {
      setUploading(false);
    }
  };

  const handleTyping = () => {
    if (socket && isConnected) {
      socket.emit('user_typing', {
        chatId,
        userId: currentUser._id,
        isTyping: true
      });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

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

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (mimetype) => {
    if (mimetype.startsWith('image/')) return '🖼️';
    if (mimetype === 'application/pdf') return '📄';
    if (mimetype.includes('word')) return '📝';
    if (mimetype.includes('excel') || mimetype.includes('spreadsheet')) return '📊';
    return '📎';
  };

  const otherUser = property?.owner?._id === currentUser._id 
    ? property?.user 
    : property?.owner;

  return (
    <div className="vehicle-chat-container">
      <div className="chat-header">
        <button className="back-button" onClick={onClose}>←</button>
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
            <p className="vehicle-title">{property?.title || 'Propiedad'}</p>
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
                    {msg.file && (
                      <div className="message-file">
                        {msg.file.mimetype.startsWith('image/') ? (
                          <img 
                            src={`${BACKEND_URL}/${msg.file.url}`}
                            alt={msg.file.originalname}
                            className="message-image"
                            onClick={() => window.open(`${BACKEND_URL}/${msg.file.url}`, '_blank')}
                          />
                        ) : (
                          <a 
                            href={`${BACKEND_URL}/${msg.file.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="message-document"
                          >
                            <span className="file-icon">{getFileIcon(msg.file.mimetype)}</span>
                            <div className="file-info">
                              <span className="file-name">{msg.file.originalname}</span>
                              <span className="file-size">{formatFileSize(msg.file.size)}</span>
                            </div>
                          </a>
                        )}
                      </div>
                    )}
                    {msg.message && <p>{msg.message}</p>}
                    <span className="message-time">{formatTime(msg.timestamp)}</span>
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

      {selectedFile && (
        <div className="file-preview-container">
          <div className="file-preview">
            {filePreview ? (
              <img src={filePreview} alt="Preview" className="preview-image" />
            ) : (
              <div className="preview-document">
                <span className="file-icon-large">{getFileIcon(selectedFile.type)}</span>
                <span className="preview-filename">{selectedFile.name}</span>
                <span className="preview-filesize">{formatFileSize(selectedFile.size)}</span>
              </div>
            )}
            <button className="cancel-file-btn" onClick={handleCancelFile}>✕</button>
          </div>
        </div>
      )}

      <form className="chat-input-form" onSubmit={handleSendMessage}>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
          style={{ display: 'none' }}
        />
        <button
          type="button"
          className="attach-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || !isConnected}
          aria-label="Adjuntar archivo"
        >
          📎
        </button>

        <input
          type="text"
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            handleTyping();
          }}
          placeholder="Escribe un mensaje..."
          className="chat-input"
          disabled={uploading || !isConnected}
        />
        
        <button 
          type="submit" 
          className="send-button"
          disabled={(!newMessage.trim() && !selectedFile) || !isConnected || uploading}
        >
          {uploading ? '⏳' : 'Enviar'}
        </button>
      </form>
    </div>
  );
};

export default PropertyChat;
