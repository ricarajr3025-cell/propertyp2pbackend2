import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';

export default function ChatBox({ transaction, token, userId, backendUrl }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (backendUrl) {
      const s = io(backendUrl);
      setSocket(s);
      s.emit('join-transaction', { transactionId: transaction._id, userId });
      s.on('chat:message', msg => {
        setMessages(msgs => [...msgs, msg]);
      });

      // Cargar historial inicial
      axios.get(`${backendUrl}/api/transactions`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        const tx = res.data.find(t => t._id === transaction._id);
        setMessages(tx.chatHistory || []);
      });

      return () => s.disconnect();
    }
  }, [backendUrl, transaction._id, token, userId]);

  const sendMessage = () => {
    socket.emit('chat:message', {
      transactionId: transaction._id,
      message: input,
      sender: userId
    });
    setInput('');
  };

  return (
    <div>
      <h3>Chat privado</h3>
      <div style={{ height: 200, overflowY: 'scroll', border: '1px solid #ccc' }}>
        {messages.map((m, i) => (
          <div key={i}>{m.sender === userId ? 'Yo' : 'Otro'}: {m.message}</div>
        ))}
      </div>
      <input value={input} onChange={e => setInput(e.target.value)} />
      <button onClick={sendMessage}>Enviar</button>
    </div>
  );
}
