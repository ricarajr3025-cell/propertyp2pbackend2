import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

export default function VehicleChatBox({ vehicle, owner, userId, token, backendUrl }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const socketRef = useRef();

  // Identificador único para el chat de vehículo (ORDENADO!)
  const ids = [userId, owner?._id].sort();
  const chatId = vehicle && owner ? `vehiclechat-${vehicle._id}-${ids[0]}-${ids[1]}` : "";

  useEffect(() => {
    if (!chatId) return;
    socketRef.current = io(backendUrl, {
      query: { token },
      transports: ['websocket'],
    });
    socketRef.current.emit("join-vehicle-chat", { chatId });

    socketRef.current.on("vehicle-chat:message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    // Cargar historial del chat
    axios.get(`${backendUrl}/api/vehicle-chat/${chatId}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setMessages(res.data));

    return () => {
      socketRef.current.disconnect();
    };
  }, [chatId, backendUrl, token]);

  const sendMessage = () => {
    if (input.trim()) {
      socketRef.current.emit("vehicle-chat:message", {
        chatId,
        sender: userId,
        receiver: owner._id,
        message: input,
      });
      setInput("");
      // Opcional: persistir también en la BD (no necesario si el backend ya guarda)
      // axios.post(`${backendUrl}/api/vehicle-chat/${chatId}`, {
      //   message: input,
      //   receiver: owner._id
      // }, {
      //   headers: { Authorization: `Bearer ${token}` }
      // });
    }
  };

  return (
    <div style={{ border: "2px solid #3a3", padding: 10, marginTop: 10, borderRadius: 10 }}>
      <h3>Chat con el vendedor</h3>
      <div style={{ maxHeight: 250, overflowY: "auto", marginBottom: 10 }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ textAlign: msg.sender === userId ? "right" : "left" }}>
            <span>
              <strong>{msg.sender === userId ? "Tú" : "Vendedor"}:</strong> {msg.message}
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
    </div>
  );
}
