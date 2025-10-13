import React, { useEffect, useState, useRef } from 'react';
import io from "socket.io-client";
import axios from "axios";

// transaction: objeto de transacción
// token: JWT del usuario
// userId: id del usuario actual
// backendUrl: url del backend

export default function ChatBox({ transaction, token, userId, backendUrl }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [file, setFile] = useState(null);
  const [paid, setPaid] = useState(transaction.paid || false);
  const socketRef = useRef();

  // Detecta si es una transacción de alquiler (renta) por endpoint usado
  // Puedes adaptar esto según tu lógica, aquí solo lo hacemos por el nombre de la propiedad
  const isRentalTransaction =
    transaction.propertyType === "Rental" ||
    transaction.property?.modelName === "RentalProperty" ||
    transaction.operationType === "Renta";

  useEffect(() => {
    socketRef.current = io(backendUrl, {
      query: { token },
      transports: ['websocket'],
    });

    socketRef.current.emit("join-transaction", { transactionId: transaction._id, userId });

    socketRef.current.on("chat:message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    // Carga el historial del chat
    let chatUrl;
    if (isRentalTransaction) {
      chatUrl = `${backendUrl}/api/rental-transactions/${transaction._id}/chat`;
    } else {
      chatUrl = `${backendUrl}/api/transactions/${transaction._id}/chat`;
    }

    axios.get(chatUrl, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setMessages(res.data));

    return () => {
      socketRef.current.disconnect();
    };
  }, [transaction._id, backendUrl, token, userId, isRentalTransaction]);

  const sendMessage = async () => {
    if (file) {
      // Enviar archivo adjunto
      const data = new FormData();
      data.append('file', file);
      data.append('message', input);

      let uploadUrl;
      if (isRentalTransaction) {
        uploadUrl = `${backendUrl}/api/rental-transactions/${transaction._id}/chat/upload`;
      } else {
        uploadUrl = `${backendUrl}/api/transactions/${transaction._id}/chat/upload`;
      }

      await axios.post(uploadUrl, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFile(null);
      setInput("");
    } else if (input.trim()) {
      socketRef.current.emit("chat:message", {
        transactionId: transaction._id,
        sender: userId,
        message: input,
      });
      setInput("");
    }
  };

  // Marcar pagado (solo para renta y si no está pagado)
  const markPaid = async () => {
    try {
      const payUrl = `${backendUrl}/api/rental-transactions/${transaction._id}/pay`;
      await axios.post(payUrl, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPaid(true);
      alert("Pago de renta marcado");
    } catch (e) {
      alert("No se pudo marcar pagado");
    }
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
            {/* Mostrar archivo adjunto si existe */}
            {msg.file && (
              <div>
                {msg.file.mimetype.startsWith('image/')
                  ? <img src={`${backendUrl}${msg.file.url}`} alt={msg.file.originalname} style={{ maxWidth: 150 }} />
                  : <a href={`${backendUrl}${msg.file.url}`} target="_blank" rel="noopener noreferrer">{msg.file.originalname}</a>
                }
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{ marginBottom: 10 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" ? sendMessage() : null}
          style={{ width: "60%" }}
          placeholder="Escribe un mensaje..."
        />
        {/* Botón para adjuntar archivo */}
        <input
          type="file"
          style={{ marginLeft: 10 }}
          onChange={e => setFile(e.target.files[0])}
        />
        <button onClick={sendMessage} style={{ marginLeft: 10 }}>
          {file ? "Enviar archivo" : "Enviar"}
        </button>
      </div>
      {file && (
        <div style={{ marginBottom: 5 }}>
          <small>Archivo seleccionado: {file.name}</small>
        </div>
      )}
      {/* Botón para marcar pagado si es renta y aún no está pagado */}
      {isRentalTransaction && transaction.status === "pending" && !paid && (
        <button
          onClick={markPaid}
          style={{ marginTop: 8, background: "#6C2DC7", color: "#fff", borderRadius: 8, padding: "7px 18px", fontWeight: "bold" }}
        >
          Marcar pago de renta
        </button>
      )}
      {isRentalTransaction && (paid || transaction.status === "paid") && (
        <div style={{ marginTop: 8, color: "#6C2DC7", fontWeight: "bold" }}>
          Pago de renta marcado
        </div>
      )}
    </div>
  );
}