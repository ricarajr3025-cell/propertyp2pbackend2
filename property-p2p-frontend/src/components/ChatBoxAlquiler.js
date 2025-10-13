import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

export default function ChatBoxAlquiler({ property, owner, userId, token, backendUrl, onTransactionCreated }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const socketRef = useRef();

  // Un identificador para el chat (puedes usar property._id + userId + owner._id)
  const chatId = `rentalchat-${property._id}-${userId}-${owner._id}`;

  useEffect(() => {
    socketRef.current = io(backendUrl, {
      query: { token },
      transports: ['websocket'],
    });
    socketRef.current.emit("join-rental-chat", { chatId });

    socketRef.current.on("rental-chat:message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    // Cargar historial del chat
    axios.get(`${backendUrl}/api/rental-chat/${chatId}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setMessages(res.data));

    return () => {
      socketRef.current.disconnect();
    };
  }, [chatId, backendUrl, token]);

  const sendMessage = () => {
    if (input.trim()) {
      socketRef.current.emit("rental-chat:message", {
        chatId,
        sender: userId,
        receiver: owner._id,
        message: input,
      });
      setInput("");
    }
  };

  // Botón para crear transacción
  const realizarTransaccion = async () => {
    try {
      await axios.post(`${backendUrl}/api/rental-transactions/rent/${property._id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Transacción de alquiler creada.');
      if (onTransactionCreated) onTransactionCreated();
    } catch (e) {
      alert('Error al crear la transacción');
    }
  };

  return (
    <div style={{ border: "2px solid #3a3", padding: 10, marginTop: 10, borderRadius: 10 }}>
      <h3>Chat con el rentista</h3>
      <div style={{ maxHeight: 250, overflowY: "auto", marginBottom: 10 }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ textAlign: msg.sender === userId ? "right" : "left" }}>
            <span>
              <strong>{msg.sender === userId ? "Tú" : "Rentista"}:</strong> {msg.message}
            </span>
            <br />
            <small>{msg.timestamp ? new Date(msg.timestamp).toLocaleString() : ""}</small>
          </div>
        ))}
      </div>
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => e.key === "Enter" ? sendMessage() : null}
        style={{ width: "70%" }}
        placeholder="Escribe un mensaje..."
      />
      <button onClick={sendMessage} style={{ marginLeft: 10 }}>Enviar</button>

      <button
        onClick={realizarTransaccion}
        style={{
          marginTop: 16,
          background: "#6C2DC7",
          color: "#fff",
          borderRadius: 8,
          padding: "7px 18px",
          fontWeight: "bold"
        }}
      >
        Realizar transacción
      </button>
    </div>
  );
}
