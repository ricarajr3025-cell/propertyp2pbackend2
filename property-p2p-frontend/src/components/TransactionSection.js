import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ChatBox from './ChatBox';

export default function TransactionSection({ token, backendUrl }) {
  const [allTransactions, setAllTransactions] = useState([]);
  const [selectedTx, setSelectedTx] = useState(null);

  // Decodificar el ID del usuario desde el token JWT
  const userId = JSON.parse(atob(token.split('.')[1])).id;

  // Cargar TODAS las transacciones (ventas y alquileres) en un solo request si tu backend lo permite,
  // pero en este caso usaremos dos peticiones separadas como tu backend actual.
  useEffect(() => {
    async function fetchTransactions() {
      try {
        // Cargar ventas (type: 'venta') y alquileres (type: 'alquiler')
        const [ventasRes, alquileresRes] = await Promise.all([
          axios.get(`${backendUrl}/api/transactions`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${backendUrl}/api/rental-transactions`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        // El backend debe devolver transacciones con el campo "type"
        // Si no, filtra por endpoint
        const ventas = ventasRes.data.filter(tx => tx.type === 'venta');
        const alquileres = alquileresRes.data.filter(tx => tx.type === 'alquiler');
        setAllTransactions({ ventas, alquileres });
      } catch (err) {
        setAllTransactions({ ventas: [], alquileres: [] });
      }
    }
    fetchTransactions();
  }, [token, selectedTx, backendUrl]);

  // Simulación de pago en testnet (ventas)
  const payTransaction = async (tx) => {
    alert('Simulando pago en testnet Ethereum (USDT ficticio)...');
    try {
      await axios.post(`${backendUrl}/api/transactions/${tx._id}/pay`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Pago simulado realizado. Ahora puedes liberar fondos.');
      setSelectedTx(null); // refresca
    } catch (err) {
      alert('Error al simular pago');
    }
  };

  // Liberar fondos (ventas)
  const releaseFunds = async (tx) => {
    await axios.post(`${backendUrl}/api/transactions/${tx._id}/release`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    alert('Fondos liberados');
    setSelectedTx(null); // refresca
  };

  // Apelar transacción (ventas)
  const appeal = async (tx) => {
    const reason = prompt('Motivo de apelación:');
    await axios.post(`${backendUrl}/api/transactions/${tx._id}/appeal`, { reason }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    alert('Apelación enviada');
    setSelectedTx(null); // refresca
  };

  // Apelar transacción (alquiler)
  const appealRent = async (tx) => {
    const reason = prompt('Motivo de apelación:');
    await axios.post(`${backendUrl}/api/rental-transactions/${tx._id}/appeal`, { reason }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    alert('Apelación enviada');
    setSelectedTx(null); // refresca
  };

  // Si por alguna razón la API no trae el campo "type", separa por endpoint
  const ventas = allTransactions.ventas || [];
  const alquileres = allTransactions.alquileres || [];

  return (
    <div>
      <h2>Mis transacciones de Venta</h2>
      <ul>
        {ventas.map(tx => (
          <li key={tx._id}>
            <span>
              {tx.property?.title || "Propiedad eliminada"} - Estado: {tx.status}
            </span>
            <button onClick={() => setSelectedTx(tx)}>Ver Chat</button>
            {/* Botón de pago SOLO si es comprador y la transacción está pendiente */}
            {tx.buyer?._id === userId && tx.status === 'pending' && !tx.paid &&
              <button onClick={() => payTransaction(tx)}>Realizar Pago</button>
            }
            {/* Liberar fondos SOLO si es comprador, transacción pagada y escrow activo */}
            {tx.buyer?._id === userId && tx.status === 'paid' && tx.escrow &&
              <button onClick={() => releaseFunds(tx)}>Liberar Fondos</button>
            }
            {/* Apelar si la transacción está pendiente */}
            {tx.status === 'pending' &&
              <button onClick={() => appeal(tx)}>Apelar</button>
            }
          </li>
        ))}
      </ul>
      <h2>Mis transacciones de Alquiler</h2>
      <ul>
        {alquileres.map(tx => (
          <li key={tx._id}>
            <span>
              {tx.property?.title || "Propiedad eliminada"} - Estado: {tx.status}
            </span>
            <button onClick={() => setSelectedTx(tx)}>Ver Chat</button>
            {/* Apelar si la transacción está pendiente */}
            {tx.status === 'pending' &&
              <button onClick={() => appealRent(tx)}>Apelar</button>
            }
            {/* El pago de renta y liberación de fondos se maneja en el ChatBox */}
          </li>
        ))}
      </ul>
      {/* Mostrar chat de la transacción seleccionada */}
      {selectedTx && (
        <ChatBox
          transaction={selectedTx}
          token={token}
          userId={userId}
          backendUrl={backendUrl}
        />
      )}
    </div>
  );
}