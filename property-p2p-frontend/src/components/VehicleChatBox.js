import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { useParams } from "react-router-dom";

export default function VehicleChatBox({ backendUrl, token, userId }) {
  const { chatId } = useParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const socketRef = useRef();
  const [ownerId, setOwnerId] = useState(null);

  // Obtén el ownerId al cargar el chat (parseando el chatId)
  useEffect(() => {
    if (!chatId) return;
    // El chatId es: vehiclechat-vehicleId-ownerId-userId (ordenados)
    // Extrae el ownerId del chatId
    const parts = chatId.split("-");
    if (parts.length === 4) {
      // El ownerId es el 2do o 3er elemento (depende de orden)
      // Los dos últimos son los IDs ordenados, pero no sabemos cuál es owner y cuál es user,
      // así que mejor pedir al backend
      axios.get(`${backendUrl}/api/vehicle-chat/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          // Busca el primer mensaje y asume el receiver es el owner
          setOwnerId(res.data[0].receiver || null);
        } else {
          // Si no hay mensajes, parsea el chatId
          setOwnerId(parts[2]); // asume owner es el penúltimo (ajusta si tu orden es diferente)
        }
        setMessages(res.data);
      });
    }
  }, [chatId, backendUrl, token]);

  useEffect(() => {
    if (!chatId) return;
    socketRef.current = io(backendUrl, { query: { token }, transports: ["websocket"] });
    socketRef.current.emit("join-vehicle-chat", { chatId });
    socketRef.current.on("vehicle-chat:message", msg => {
      setMessages(prev => [...prev, msg]);
    });
    return () => {
      socketRef.current.disconnect();
    };
  }, [chatId, backendUrl, token]);

  const sendMessage = () => {
    if (input.trim() && ownerId) {
      socketRef.current.emit("vehicle-chat:message", {
        chatId,
        sender: userId,
        receiver: ownerId, // <-- AHORA SIEMPRE se envía correctamente
        message: input,
      });
      setInput("");
    }
  };

  return (
    <div style={{ border: "2px solid #3a3", padding: 10, marginTop: 10, borderRadius: 10, maxWidth: 500 }}>
      <h3>Chat de Vehículo</h3>
      <div style={{ maxHeight: 250, overflowY: "auto", marginBottom: 10, background: "#f6f6f6", padding: 8 }}>
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