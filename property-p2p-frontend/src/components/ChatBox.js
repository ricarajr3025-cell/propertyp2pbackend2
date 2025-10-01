import React, { useEffect, useState, useRef } from 'react';
import io from "socket.io-client";
import axios from "axios";

export default function ChatBox({ transaction, token, userId, backendUrl }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const socketRef = useRef();

  useEffect(() => {
    // Conexión a socket.io
    socketRef.current = io(backendUrl, {
      query: { token },
      transports: ['websocket'],
    });

    // Unirse a la sala de la transacción
    socketRef.current.emit("join-transaction", { transactionId: transaction._id, userId });

    // Recibir mensajes en tiempo real
    socketRef.current.on("chat:message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    // Cargar historial inicial
    axios.get(`${backendUrl}/api/transactions/${transaction._id}/chat`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setMessages(res.data));

    return () => {
      socketRef.current.disconnect();
    };
  }, [transaction._id, backendUrl, token]);

  const sendMessage = () => {
    if (!input.trim()) return;
    socketRef.current.emit("chat:message", {
      transactionId: transaction._id,
      sender: userId,
      message: input,
    });
    setInput("");
  };

  return (
    <div style={{ border: "1px solid #ccc", padding: 10, marginTop: 10 }}>
      <h3>Chat de la transacción</h3>
      <div style={{ maxHeight: 250, overflowY: "auto", marginBottom: 10 }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ textAlign: msg.sender === userId ? "right" : "left" }}>
            <span>
              <strong>{msg.sender === userId ? "Tú" : "Otro"}:</strong> {msg.message}
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
        style={{ width: "80%" }}
        placeholder="Escribe un mensaje..."
      />
      <button onClick={sendMessage}>Enviar</button>
    </div>
  );
}
